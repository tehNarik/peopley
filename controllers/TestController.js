import TestModel from '../models/Test.js';
import TestResultModel from '../models/TestResult.js'
import LessonModel from '../models/Lesson.js'

export const create = async (req, res)=>{
    try{
        const { topic, questions, passingScore } = req.body;

        if (!topic || !Array.isArray(questions)) {
            return res.status(400).json({ message: 'Invalid input data' });
        }

        const existingTest = await TestModel.findOne({ topic });
        if (existingTest) {
            return res.status(400).json({ message: 'Test with this topic already exists' });
        }

        const doc = new TestModel({
            topic,
            questions: questions.map(q => ({
                questionText: q.questionText,
                questionImageURL: q.questionImageURL,
                options: q.options.map(opt => ({
                    optionText: opt.optionText,
                    isCorrect: opt.isCorrect
                }))
            })),
            passingScore: passingScore || 50 
        });

        const test = await doc.save();
        res.json(test);
    }catch(err){
        console.log(err.message)
        res.status(500).json({
            message: "Не вдалося створити тест"
        })
    }
}

export const addQuestion = async (req, res) => {
    try {
        const { topic, questionText, questionImageURL, options, difficulty, type, matchingPairs, answer } = req.body;

        // Перевірка наявності полів
        if (!topic) {
            return res.status(400).json({ message: "Потрібні поля: topic." });
        }

        if (type === 'choice' && !questionText && !questionImageURL) {
            return res.status(400).json({ message: "Для choice потрібні questionText або questionImageURL." });
        }

        if (type === 'matching' && !matchingPairs) {
            return res.status(400).json({ message: "Для matching потрібні matchingPairs." });
        }

        // Шукаємо тест за темою
        const test = await TestModel.findOne({ topic });
        if (!test) {
            return res.status(404).json({ message: "Не вдалося знайти тест за заданою темою." });
        }

        // Перевірка наявності дубліката для текстового питання
        const questionExists = test.questions.some(el => el.questionText === questionText);
        if (questionExists) {
            return res.status(400).json({ message: "Питання з таким текстом вже існує у цьому тесті." });
        }

        // Створення нового питання
        let newQuestion = {
            questionText,
            type,
            difficulty,
            answer,
            options: [],
            matchingPairs: []
        };

        newQuestion.questionText = questionText;
        newQuestion.questionImageURL = questionImageURL;

        if (type === 'choice' || !type) {
            newQuestion.options = options.map(opt => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect || false
            }));
        } else if (type === 'matching') {
            newQuestion.matchingPairs = matchingPairs.map(pair => ({
                questionPart: pair.questionPart,
                answerPart: pair.answerPart
            }));
        } else if( type === 'fitting') {
            newQuestion.answer = answer;
        }
        // Додавання нового питання до тесту
        test.questions.push(newQuestion);
        const updatedTest = await test.save();

        res.json(updatedTest);
    } catch (err) {
        console.error(err); // Логування помилки на сервері
        res.status(500).json({ message: "Не вдалося додати питання до тесту." });
    }
};
export const pass = async (req, res) => {
    try {
        const { topic, answers } = req.body;

        // Знайти тест за темою
        const test = await TestModel.findOne({ topic });
        if (!test) {
            return res.status(404).json({ message: 'Тест не знайдено' });
        }

        // Перевірка правильності відповідей
        let _score = 0;
        let totalQuestions = 0;

        const feedback = test.questions.map((question, index) => {
            let result = { isCorrect: false, correctAnswer: null, userAnswer: null };

            if (question.type === 'choice') {
                totalQuestions++;
                const userAnswer = answers[`question${index}`]?.text; // Текст відповіді користувача
                const correctOption = question.options.find(option => option.isCorrect);
                //console.log('user answer is ' + userAnswer);
                result.userAnswer = userAnswer;
                if (correctOption) {
                    result.correctAnswer = correctOption.optionText;
                }

                if (userAnswer && userAnswer === correctOption?.optionText) {
                    result.isCorrect = true;
                    _score++;
                } else {
                    result.userAnswer = userAnswer;
                }
            } else if (question.type === 'matching') {


                //console.log(JSON.stringify(answers));
                const userAnswers = [];
                const correctAnswers = [];
                let matchingScore = 0;

                question.matchingPairs.forEach((pair, i) => {
                    if(pair.questionPart!="") totalQuestions++;

                    const userSelectedAnswer = answers[`question${index} questionPart${i}`];
                    userAnswers.push(userSelectedAnswer);
                    correctAnswers.push(pair.answerPart);
                    if (userSelectedAnswer && String(userSelectedAnswer['index']) === String(pair.answerPart)) {
                        matchingScore++;
                    }
                });

                result.correctAnswer = correctAnswers;
                result.userAnswer = userAnswers;
                result.isCorrect = matchingScore === question.matchingPairs.length;
                _score += matchingScore;
            } else if (question.type === 'fitting') {
                totalQuestions += 2;

                const userAnswer = answers[`question${index}`];
                const correctAnswer = question.answer;

                result.correctAnswer = correctAnswer;
                result.userAnswer = userAnswer;

                if (
                    userAnswer &&
                    String(userAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()
                ) {
                    result.isCorrect = true;
                    _score += 2;
                }
            }

            return result;
        });
        const score = Math.round((_score * 100) / totalQuestions);
        const userId = req.cookies['userId'];
        let result;
        if (userId) {
            const existingResult = await TestResultModel.findOne({ topic, user: userId });
            const previousScore = existingResult?.score || null;

            if (!previousScore || previousScore < score) {
                result = await TestResultModel.findOneAndUpdate(
                    { topic, user: userId },
                    { score },
                    { new: true, upsert: true }
                );
            } else {
                result = { score };
            }
        } else {
            result = { score };
        }
        //console.log(JSON.stringify(feedback))
        res.json({
            result,
            feedback, // Повертаємо об'єкт з деталями по кожному питанню
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Не вдалося обробити тест' });
    }
};


export const reset = async (req, res) => {
    try {
        const userId = req.cookies['userId'];
        const user = userId;
        const result = await TestResultModel.deleteMany({ user: user });
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Не вдалося скинути результати",
        });
    }
}
