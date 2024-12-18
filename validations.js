import { body } from 'express-validator';

export const loginValidator = [
    body('email').isEmail(),
    body('password', 'Пароль має бути від 6 до 30 символів і містити велику літеру, маленьку літеру та цифру')
        .isLength({ min: 6, max: 30 })
        .matches(/[a-z]/) // Мала літера
        .matches(/[A-Z]/) // Велика літера
        .matches(/\d/),    // Цифра
];

export const registerValidator = [
    body('email').isEmail(),
    body('password', 'Пароль має бути від 6 до 30 символів і містити велику літеру, маленьку літеру та цифру')
        .isLength({ min: 6, max: 30 })
        .matches(/[a-z]/) // Мала літера
        .matches(/[A-Z]/) // Велика літера
        .matches(/\d/),    // Цифра
    body('fullName', 'Нікнейм має бути від 4 до 50 символів')
        .isLength({ min: 4, max: 50 }),
    body('avatarUrl').optional().isURL(),
];

/*export const postCreateValidation = [
    body('title').isLength({min: 3}).isString(),
    body('text').isLength({min: 10}).isString()
];*/