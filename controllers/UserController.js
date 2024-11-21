import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import TestResultModel from '../models/TestResult.js';
import TestModel from '../models/Test.js';
import TutorModel from '../models/Tutor.js'
import bcrypt from 'bcryptjs';

// Реєстрація
export const register = async (req, res) => {
    try {
        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const doc = new UserModel({
            email: req.body.email,
            fullName: req.body.fullName,
            avatarURL: req.body.avatarURL,
            passwordHash: hash,
        });

        const user = await doc.save();

        // Встановлюємо ID користувача у кукі
        res.cookie('userId', user._id.toString(), {
            httpOnly: true, // Кукі доступні тільки серверу
            secure: true,   // Використовувати тільки при HTTPS
            maxAge: 1 * 24 * 60 * 60 * 1000 // Кукі зберігаються 30 днів
        });

        const { passwordHash, ...userData } = user._doc;

        res.json({
            ...userData,
            userId: user._id
        });

    } catch (err) {
        console.log(err.message);
        res.status(500).json({
            message: "Не вдалося зареєструватися"
        });
    }
};

// Авторизація (login)
export const login = async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({
                message: 'Користувач не знайдений',
            });
        }

        const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash);
        if (!isValidPass) {
            return res.status(400).json({
                message: 'Неправильний логін або пароль'
            });
        }

        // Встановлюємо ID користувача у кукі при авторизації
        res.cookie('userId', user._id.toString(), {
            httpOnly: true, // Кукі доступні тільки серверу
            secure: true,   // Використовувати тільки при HTTPS
            maxAge: 30 * 24 * 60 * 60 * 1000 // Кукі зберігаються 30 днів
        });

        const { passwordHash, ...userData } = user._doc;

        res.json({
            ...userData,
            userId: user._id
        });

    } catch (err) {
        console.log(err.message);
        res.status(500).json({
            message: "Не вдалося ввійти"
        });
    }
};

// Отримати інформацію про себе
export const getMe = async (req, res) => {
    try {
        const userId = req.cookies['userId'];    
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "Користувач не знайдений"
            });
        }
        
        const { passwordHash, ...userData } = user._doc;

        // Отримання результатів тестів для поточного користувача
        const allTestResults = await TestResultModel.find({ user: userId });
        const totalTestsCount = await TestModel.countDocuments();
        // Обчислення суми оцінок та загальної кількості тестів
        const totalScore = allTestResults.reduce((acc, result) => acc + result.score, 0);
        const totalTests = allTestResults.length;


        // Обчислення середнього відсотка
        const averagePercentage = totalTests > 0 ? (totalScore / totalTests) : 0;
        const completedPercentage = totalTests / totalTestsCount * 100;

        res.render('userProfile', {
            ...userData,
            averagePercentage: averagePercentage.toFixed(2), // Передача середнього відсотка
            completedPercentage
        });

    } catch (err) {
        console.log(err.message);
        res.status(500).json({
            message: "Не вдалося отримати інформацію"
        });
    }
};

export const changeName =  async (req, res) =>{
        try {
            const userId = req.cookies['userId'];
            const { newName } = req.body;
            await UserModel.findByIdAndUpdate(userId, { fullName: newName });
            res.json({ message: 'Ім\'я оновлено' });
        } catch (error) {
            res.status(500).json({ message: 'Не вдалося оновити ім\'я' });
        }
    };
export const changePassword = async (req, res) => {
    try {
        const userId = req.cookies['userId'];
        const { currentPassword, newPassword } = req.body;

        // Знаходимо користувача
        const user = await UserModel.findById(userId);

        // Перевіряємо поточний пароль
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Неправильний поточний пароль' });
        }

        // Хешуємо новий пароль
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Оновлюємо пароль
        await UserModel.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });

        res.json({ message: 'Пароль оновлено' });
    } catch (error) {
        res.status(500).json({ message: 'Не вдалося оновити пароль' });
    }
}
export const addTutor = async (req, res) => {
    try {
        // Отримуємо дані з тіла запиту
        const {
            fullName,
            email,
            teleteg,
            passwordHash,
            phoneNumber,
            videoDescriptionURL,
            experienceYears,
            shortDescription,
            longDescription
        } = req.body;

        // Створюємо нового вчителя за допомогою моделі
        const tutor = new TutorModel({
            fullName,
            email,
            teleteg,
            passwordHash,
            phoneNumber,
            videoDescriptionURL,
            experienceYears,
            shortDescription,
            longDescription
        });

        // Зберігаємо вчителя у базі даних
        await tutor.save();

        // Повертаємо відповідь про успішне збереження
        res.status(201).json({
            message: 'Tutor added successfully',
            tutor
        });
    } catch (error) {
        // Якщо виникає помилка, відправляємо відповідь з помилкою
        console.error(error);
        res.status(500).json({
            message: 'Failed to add tutor',
            error: error.message
        });
    }
}
export const registerTutor = async (req, res) => {
    try {
        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const doc = new TutorModel({
            fullName: req.body.fullName,
            email: req.body.email,
            teleteg: req.body.teleteg, // Телеграм-нік вчителя
            passwordHash: hash, // Захешований пароль
            phoneNumber: req.body.phoneNumber, // Номер телефону
            videoDescriptionURL: req.body.videoDescriptionURL, // Посилання на YouTube відео
            experienceYears: req.body.experienceYears, // Досвід у роках
            shortDescription: req.body.shortDescription, // Короткий опис вчителя
            longDescription: req.body.longDescription, // Детальний опис вчителя
            zoomMeetingURL: req.body.zoomMeetingURL
        });
        

        const user = await doc.save();

        // Встановлюємо ID користувача у кукі
        res.cookie('userId', user._id.toString(), {
            httpOnly: true, // Кукі доступні тільки серверу
            secure: true,   // Використовувати тільки при HTTPS
            maxAge: 1 * 24 * 60 * 60 * 1000 // Кукі зберігаються 30 днів
        });

        const { passwordHash, ...userData } = user._doc;

        res.json({
            ...userData,
            userId: user._id
        });

    } catch (err) {
        console.log(err.message);
        res.status(500).json({
            message: "Не вдалося зареєструватися"
        });
    }
};