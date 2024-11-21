import express from 'express';
import mongoose from 'mongoose';
import {registerValidator, loginValidator} from './validations.js';
import {handleValidationErrors, checkAuth} from './utils/index.js'
import authenticateToken from './middleware/authenticateToken.js'
import cookieParser from 'cookie-parser'
import TutorModel from './models/Tutor.js'; 
import UserModel from './models/User.js'
import IndividualLessonModel from './models/IndividualLesson.js'; // імпорт моделі уроку
import TestModel from './models/Test.js'; // імпорт моделі уроку

import multer from 'multer'
//import {register, login, getMe} from './controllers/UserController.js'

import {UserController, LessonController, TestController} from './controllers/index.js'
import jwt from 'jsonwebtoken';

//mongodb+srv://2016mishasimonenko:ZAc39Wt7pMIgXE35@cluster0.ixuqn.mongodb.net/course?retryWrites=true&w=majority&appName=Cluster0
import dotenv from 'dotenv';
dotenv.config();


mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('DB ok'))
    .catch(err => console.log('DB connection error:', err));

// mongoose.connect('mongodb+srv://2016mishasimonenko:ZAc39Wt7pMIgXE35@cluster0.ixuqn.mongodb.net/course?retryWrites=true&w=majority&appName=Cluster0')
// .then(()=> console.log('DB ok'))
// .catch((err)=> console.log('DB error', err));


const app = express()
app.set('view engine', 'ejs');
app.set('views', './views');

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, 'uploads')
    },
    filename: (_, file, cb) => {
        cb(null, file.originalname)
    }
})
const upload = multer({storage})


app.use(express.json())
app.use(express.static('public')); 
app.use(cookieParser());

app.use('/uploads', express.static('uploads'))

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
    res.json({
        url: `/uploads/${req.file.originalname}`,
    })
})

app.post('/auth/login', loginValidator,  handleValidationErrors, UserController.login);
app.post('/auth/register', registerValidator, handleValidationErrors, UserController.register);
app.get('/auth/me', checkAuth, UserController.getMe)


app.post('/lesson', LessonController.create)

app.post('/test', TestController.create)
app.post('/test/add', TestController.addQuestion)

app.post('/test/pass', TestController.pass)
app.delete('/resetProgress',  TestController.reset)
app.get('/lesson/:numberLesson', LessonController.getOne);
//app.get('/lessons',  LessonController.getAll);

app.get('/lessons',  LessonController.getAll);
app.get('/profile',  UserController.getMe);
app.post('/auth/logout', (req, res) => {
    // Видалення куки userId
    res.clearCookie('userId');
    // Додаткові дії (якщо потрібно)
    res.status(200).json({ message: 'Ви вийшли з профілю' });
});
app.post('/profile/changeName', UserController.changeName);
app.post('/profile/changePassword', UserController.changePassword);
app.get('/buy/lessons', (req, res) => {
    res.render('individualLessonMarket'); 
})
app.get('/myLessons', async (req, res) => {
    const userId = req.cookies['userId']; // Отримуємо ID користувача з cookies

    try {
        const user = await UserModel.findById(userId).exec();
        // Шукаємо всі уроки, які належать цьому учню
        const lessons = await IndividualLessonModel.find({ student: userId })
            .populate('teacher', 'fullName zoomMeetingURL') // Популяція поля викладача, щоб отримати його ім'я
            .exec();
        // Рендеримо сторінку myLessons та передаємо дані про уроки
        res.render('myLessons', { lessons, lessonsBalance: user.lessonsBalance });
    } catch (err) {
        console.error('Помилка при отриманні уроків:', err);
        res.status(500).send('Не вдалося отримати уроки');
    }
});


import axios from 'axios';

// // Контролер для призначення уроку і створення Zoom зустрічі
// app.post('/scheduleLesson', async (req, res) => {
//     const userId = req.cookies['userId'];
//     const tutorId = req.body.tutorId; // ID вчителя
//     const dayNumber = req.body.dayNumber; // Номер дня
//     const startHourNumber = req.body.startHourNumber; // Година початку уроку

//     try {
//         // Створюємо Zoom зустріч
//         const zoomMeetingUrl = await createZoomMeeting(userId);

//         // Зберігаємо урок і посилання на Zoom в базу даних
//         const newLesson = new IndividualLessonModel({
//             dayNumber,
//             startHourNumber,
//             teacher: tutorId,
//             student: userId,
//             zoomMeetingUrl, // Зберігаємо посилання на Zoom зустріч
//         });

//         await newLesson.save();

//         res.status(200).json({ message: 'Урок призначено, Zoom зустріч створена', zoomMeetingUrl });
//     } catch (err) {
//         console.error('Error scheduling lesson:', err);
//         res.status(500).send('Не вдалося призначити урок');
//     }
// });


app.delete('/question', async(req, res) => {
    try {
        const { topic, questionText } = req.body;
        console.log("topic is " + topic + " text is " + questionText)
        // Знаходимо тест за його темою та видаляємо питання з потрібним текстом
        const updatedTest = await TestModel.findOneAndUpdate(
          { topic }, // Знаходимо тест за темою
          { $pull: { questions: { questionText } } }, // Видаляємо питання з потрібним текстом
          { new: true } // Повертаємо оновлений документ після видалення
        );
    
        if (!updatedTest) {
          return res.status(404).json({ message: 'Тест або питання не знайдено' });
        }
    
        res.json({ message: 'Питання успішно видалено', test: updatedTest });
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Не вдалося видалити питання з тесту' });
      }
  })


app.post('/addTutor', UserController.registerTutor);
app.get('/tutors', async (req, res) => {
    try {
        const tutors = await TutorModel.find(); // Отримати всіх викладачів з бази даних
        res.json(tutors); // Відправити список викладачів у відповідь
    } catch (error) {
        console.error('Error fetching tutors:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.get('/tutors/:id', async (req, res) => {
    try {
        const tutor = await TutorModel.findById(req.params.id);
        if (!tutor) {
            return res.status(404).send('Викладач не знайдений');
        }
        const teacherId = req.params.id; // ID викладача з URL
        const userId = req.cookies['userId'];
        const user = await UserModel.findById(userId).exec();
        // Отримуємо заняття вчителя
        const lessons = await IndividualLessonModel.find({ teacher: req.params.id });

        // Формуємо розклад у зручному для нас вигляді
        const schedule = [[], [], [], [], [], [], []]; // Для 7 днів
        lessons.forEach(lesson => {
            const { dayNumber, startHourNumber } = lesson;
            schedule[dayNumber].push(startHourNumber);
        });

        res.render('tutor', { tutor, schedule, teacherId, userId, lessonsBalance: user.lessonsBalance });
    } catch (error) {
        res.status(500).send('Помилка сервера');
    }
});

app.post('/lessons', async (req, res) => {
    try {
        const { dayNumber, startHourNumber, teacherId, studentId, description } = req.body;
        const teacher = await TutorModel.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: 'Репетитора не знайдено' });
        }
        // Створюємо новий урок
        const lesson = new IndividualLessonModel({
            dayNumber,
            startHourNumber,
            teacher: teacherId,
            student: studentId || null,
        });
        
        // Зберігаємо урок у базу даних
        await lesson.save();
        // Якщо опис не пустий, оновлюємо користувача
        if (description) {
            await UserModel.findByIdAndUpdate(studentId, { description: description });
        }
        res.status(201).json({ message: 'Урок успішно створено', lesson });
    } catch (error) {
        res.status(500).json({ message: 'Помилка при створенні уроку', error });
    }
});



const PORT = process.env.PORT || 4445;
app.listen(PORT, (err)=>{
    if(err){
        return console.log(err);
    }
    console.log('Server OK');
})