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
        let questionIndex = 0;


test.questions.forEach((question, index) => {
    if (question.type === 'choice') {
        totalQuestions++;
        const selectedOptionIndex = answers[`question${index}`];
        if (selectedOptionIndex !== undefined) {
            const selectedOption = question.options[selectedOptionIndex];
            if (selectedOption && selectedOption.isCorrect) {
                _score += 1;
            }
        }
    } else if (question.type === 'matching') {
        // Загальна кількість питань для matching – це кількість пар
        //totalQuestions += question.matchingPairs.length;
    
        // Перевірка вибраних відповідей користувача для matching питань
        question.matchingPairs.forEach((pair, i) => {
            if(pair.questionPart != ""){
                totalQuestions++;
            }
            // Створюємо ключ для доступу до відповіді користувача
            const userSelectedAnswerKey = `question${index} questionPart${i}`;
            const userSelectedAnswer = answers[userSelectedAnswerKey];

            // Перевіряємо, чи вибрана відповідь користувача співпадає з правильною відповіддю
            if (userSelectedAnswer && String(userSelectedAnswer) === String(pair.answerPart)) {
                _score += 1; // Нарахування балів за правильну відповідь
            }
        });
        
        questionIndex++; // Переходимо до наступного питання для формування унікальних ключів
    }else if (question.type === 'fitting') {
        totalQuestions += 2;
        const userAnswer = answers[`question${index}`];
        if (userAnswer && String(userAnswer).trim().toLowerCase() === String(question.answer).trim().toLowerCase()) {
            _score += 2; // Нарахувати 2 бали за правильну відповідь
        }
    }

    
});
        console.log(1)
        const score = (_score * 100) / totalQuestions;
        console.log(score)
        // Оновити або створити результат тесту
        const userId = req.cookies['userId'];
        // if (!userId) {
        //     return res.status(400).json({ message: 'Користувач не аутентифікований' });
        // }
        // const result = await TestResultModel.findOneAndUpdate(
        //     { topic, user: userId },
        //     { score },
        //     { new: true, upsert: true }
        // );
        let result;
        if (userId) {
            //return res.status(400).json({ message: 'Користувач не аутентифікований' });
            const existingResult = await TestResultModel.findOne({ topic, user: userId });
            let previousScore = null; 
            if (existingResult) {
                previousScore = existingResult.score;
            }
            if(!previousScore || previousScore<score){
                result = await TestResultModel.findOneAndUpdate(
                    { topic, user: userId },
                    { score },
                    { new: true, upsert: true }
        )}else{ 
        result = {score};}
    } else {
            result = {score}
        }
        
        res.json({
            result,
            correctAnswers: test.questions.map((question, index) => {
                if (question.type === 'choice') {
                    return question.options.findIndex(opt => opt.isCorrect); // Індекс правильної відповіді
                } else if (question.type === 'matching') {
                    return question.matchingPairs.map(pair => pair.answerPart); // Правильні відповіді для matching
                } else if (question.type === 'fitting') {
                    return question.answer; // Правильна відповідь для fitting
                }
            })
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
