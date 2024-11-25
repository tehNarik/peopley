import LessonModel from '../models/Lesson.js';
import TestModel from '../models/Test.js';
import TestResultModel from '../models/TestResult.js';
import cookieParser from 'cookie-parser'
import ffmpeg from 'fluent-ffmpeg';


function convertEmbedURLToWatchURL(embedURL) {
  const regex = /https:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]+)/;
  const match = embedURL.match(regex);

  if (match) {
      const videoId = match[1];
      return `https://www.youtube.com/watch?v=${videoId}`;
  } else {
      throw new Error("Invalid YouTube embed URL");
  }
}
const getVideoDuration = (videoURL) => {
  videoURL = convertEmbedURLToWatchURL(videoURL);
  return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoURL, (err, metadata) => {
          if (err) reject(err);
          else resolve(metadata.format.duration); // тривалість у секундах
      });
  });
};

export const getCourseStatistics = async (req, res) => {
  try {
      const lessonCount = await LessonModel.countDocuments();

      const totalQuestions = await TestModel.aggregate([
        {
          $project: {
            questionsCount: { $size: "$questions" } // Додаємо кількість елементів у полі "questions"
          }
        },
        {
          $group: {
            _id: null,
            totalQuestions: { $sum: "$questionsCount" } // Сумуємо всі довжини
          }
        }
      ]);
      
      const testCount = totalQuestions.length ? totalQuestions[0].totalQuestions : 0;
      res.render('index', {
          lessonCount,
          testCount
      });
  } catch (error) {
      console.error(error);
      res.status(500).send("Помилка при отриманні статистики курсу");
  }
};




export const create = async (req, res)=>{
    try{
        const test = await TestModel.findOne({
            topic: req.body.title
        })
        if(!test){
            return res.status(400).json({
                message: "Не можна створити урок без тесту"
            })
        }
        const doc = new LessonModel({
            title: req.body.title,
            videoURL: req.body.videoURL,
            numberLesson: req.body.numberLesson,
            test: test
        })
        
        const lesson = await doc.save();
        res.json(lesson);
    }catch(err){
        console.log(err.message)
        res.status(501).json({
            message: "Не вдалося створити урок"
        })
    }
}
export const getOne = async (req, res) => {
  try {
    const lessonNum = req.params.numberLesson;
    const lesson = await LessonModel.findOne({ numberLesson: lessonNum }).populate('test');
    if (!lesson) {
      return res.status(404).json({ message: 'Урок не знайдено' });
    }

    // Ініціалізуємо масиви для зберігання звичайних і matching питань
    const normalQuestions = [];
    const matchingQuestions = [];

    // Розподіляємо питання на звичайні та matching
    lesson.test.questions.forEach((question) => {
      if (question.type === 'choice') {
        normalQuestions.push(question);
      } else if (question.type === 'matching') {
        // Копіюємо питання та перемішуємо його matchingPairs
        const matchingQuestion = {
          ...question.toObject(), // копіюємо всі поля питання
          matchingPairs: [...question.matchingPairs].sort(() => Math.random() - 0.5) // копіюємо і перемішуємо matchingPairs
        };
        matchingQuestions.push(matchingQuestion);
      }
    });

    // Відображаємо сторінку уроку з EJS
    res.render('lesson', { lesson, matchingQuestions });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Не вдалося завантажити урок" });
  }
};

export const getAll = async (req, res) => {
  try {
    //const userId = req.user.id; // ID користувача
    // Використовуйте userId для отримання результатів тестів з бази даних
    /*const testResults = await TestResultModel.find({ user: userId });

    const passedLessons = testResults.reduce((acc, result) => {
      acc[result.topic] = result.score >= 50;
      return acc;
    }, {});*/
    const userId = req.cookies['userId'];
    const lessons = await LessonModel.find().populate('test');
    lessons.sort((a, b) => a.numberLesson - b.numberLesson);
    const testResults = await TestResultModel.find({ user: userId });
    const passedLessons = testResults.reduce((acc, result) => {
      acc[result.topic] = result.score >= 50;
      return acc;
    }, {});

    const lessonsWithAccess = lessons.map((lesson, index) => {
      const previousLessonAccessible =  (lessons[index - 1] && passedLessons[lessons[index - 1].test.topic]);
      const isAccessible = previousLessonAccessible || lesson.numberLesson === 1;
      return {
        ...lesson.toObject(),
        isAccessible
      };
    });
    res.status(200).render('course', { lessons: lessonsWithAccess });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Не вдалося отримати уроки" });
  }
};

  
// Функція для перевірки токену та отримання користувача
const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, 'secret 123', (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

export const renderLessons = async (req, res) => {
  try {
    // Отримуємо токен з заголовка запиту
    const token = req.headers.authorization?.split(' ')[1]; // `Bearer <token>`

    if (!token) {
      return res.status(401).send('No token provided');
    }

    // Перевіряємо токен і отримуємо інформацію про користувача
    const decoded = await verifyToken(token);
    const userId = decoded.userId; // або іншій ідентифікатор користувача з токену

    // Отримуємо всі уроки
    const lessons = await LessonModel.find().sort({ numberLesson: 1 }).lean();

    // Отримуємо всі результати тестів цього користувача
    const testResults = await TestResultModel.find({ user: userId });

    // Робимо уроки доступними або недоступними в залежності від результатів тестів
    lessons.forEach((lesson, index) => {
      if (index === 0) {
        // Перший урок завжди доступний
        lesson.isAccessible = true;
      } else {
        // Для решти уроків перевіряємо результат попереднього уроку
        const previousLessonNumber = lesson.numberLesson - 1;
        const previousTestResult = testResults.find(result => result.topic === `Тема ${previousLessonNumber}`);

        if (previousTestResult && previousTestResult.score >= 50) {
          // Якщо попередній урок пройдено на 50% і більше, робимо поточний урок доступним
          lesson.isAccessible = true;
        } else {
          // Інакше урок недоступний
          lesson.isAccessible = false;
        }
      }
    });

    res.status(200).render('lessons', { lessons });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};
