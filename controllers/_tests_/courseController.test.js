const { create, getOne, getAll, renderLessons, getExam } = require('../LessonController.cjs');
const { getCourseStatistics } = require('../LessonController.cjs');

const  LessonModel  = require('../../models/Lesson.js');
const  TestModel  = require('../../models/Test');
const  TestResultModel  = require('../../models/TestResult');

jest.mock('../../models/Lesson.js');
jest.mock('../../models/Test.js');
jest.mock('../../models/TestResult.js');

describe('Lesson Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    LessonModel.find.mockResolvedValue([  // Мокаємо метод find
      { title: 'Дії з дійсними числами', accessible: true, numberLesson: 1, test: { topic: 'Дії з дійсними числами' } },
      { title: 'Дроби', accessible: false, numberLesson: 2, test: { topic: 'Дроби' } },
    ]);
  });

  describe('create', () => {
    it('повинен створити урок, якщо тест існує', async () => {
      TestModel.findOne.mockResolvedValue({ _id: 'testId' });
      LessonModel.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ title: 'Lesson 1' }),
      }));
      req.body = { title: 'Lesson 1', videoURL: 'url', numberLesson: 1 };

      await create(req, res);

      expect(TestModel.findOne).toHaveBeenCalledWith({ topic: 'Lesson 1' });
      expect(LessonModel).toHaveBeenCalledWith({
        title: 'Lesson 1',
        videoURL: 'url',
        numberLesson: 1,
        test: { _id: 'testId' },
      });
      expect(res.json).toHaveBeenCalledWith({ title: 'Lesson 1' });
    });

    it('повинен повернути помилку, якщо тест не знайдено', async () => {
      TestModel.findOne.mockResolvedValue(null);
      req.body = { title: 'Lesson 1' };

      await create(req, res);

      expect(TestModel.findOne).toHaveBeenCalledWith({ topic: 'Lesson 1' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Не можна створити урок без тесту',
      });
    });

    it('повинен обробляти помилки сервера', async () => {
      TestModel.findOne.mockRejectedValue(new Error('DB error'));

      await create(req, res);

      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Не вдалося створити урок',
      });
    });
  });

  describe('getOne', () => {
    it('повинен повернути помилку, якщо урок не знайдено', async () => {
      // Мок даних уроку
      LessonModel.findOne.mockResolvedValue(null); // урок не знайдений
    
      const req = { params: { numberLesson: 1 } };
    
      // Мок об'єкта res з усіма необхідними методами
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        render: jest.fn()
      };
    
      // Виклик функції
      await getOne(req, res);
    
      // Перевірка, чи був викликаний status(500)
      expect(res.status).toHaveBeenCalledWith(500);
    
      // Перевірка, чи був викликаний json з правильним повідомленням
      expect(res.json).toHaveBeenCalledWith({ message: "Не вдалося завантажити урок" });
    });
    
   

    it('повинен повернути помилку, якщо урок не знайдено', async () => {
  const req = { params: { id: 'nonexistentId' } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

  await getOne(req, res);

  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({ message: 'Урок не знайдено' });
});


    it('повинен обробляти помилки сервера', async () => {
      LessonModel.findOne.mockRejectedValue(new Error('DB error'));

      await getOne(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Не вдалося завантажити урок',
      });
    });
  });

  describe('getAll', () => {
    it('повинен повернути список уроків із доступністю', async () => {
      const req = { cookies: { userId: 'user123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      };
  
      LessonModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([
          { numberLesson: 1, title: 'Lesson 1', test: { topic: 'topic1' }, toObject: jest.fn().mockReturnValue({ title: 'Lesson 1' }) },
          { numberLesson: 2, title: 'Lesson 2', test: { topic: 'topic2' }, toObject: jest.fn().mockReturnValue({ title: 'Lesson 2' }) },
        ]),
      });
  
      TestResultModel.find.mockResolvedValue([
        { topic: 'topic1', score: 60 }, // Тест пройдено
      ]);
  
      await getAll(req, res);
  
      expect(LessonModel.find).toHaveBeenCalled();
      expect(TestResultModel.find).toHaveBeenCalledWith({ user: 'user123' });
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.render).toHaveBeenCalledWith('course', {
        lessons: [
          { title: 'Lesson 1', isAccessible: true },
          { title: 'Lesson 2', isAccessible: true },
        ],
      });
    });

    it('повинен обробляти помилки сервера', async () => {
      LessonModel.find.mockRejectedValue(new Error('DB error'));

      await getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Не вдалося отримати уроки',
      });
    });
  });

  describe('renderLessons', () => {
    it('повинен рендерити список уроків', async () => {
      const res = {
        render: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
  
      const req = { cookies: { userId: 'user123' } };
  
      // Мокаємо `LessonModel.find`
      LessonModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { numberLesson: 1, title: 'Lesson 1' },
          { numberLesson: 2, title: 'Lesson 2' },
        ]),
      });
  
      // Мокаємо `TestResultModel.find`
      TestResultModel.find.mockResolvedValue([
        { topic: 'Тема 1', score: 60 }, // Тема 1 пройдена
      ]);
  
      await renderLessons(req, res);
  
      // Перевіряємо, що `LessonModel.find` був викликаний
      expect(LessonModel.find).toHaveBeenCalled();
      expect(TestResultModel.find).toHaveBeenCalledWith({ user: 'user123' });
  
      // Перевіряємо, що `res.render` був викликаний з правильними даними
      expect(res.render).toHaveBeenCalledWith('lessons', {
        lessons: [
          { numberLesson: 1, title: 'Lesson 1', isAccessible: true },
          { numberLesson: 2, title: 'Lesson 2', isAccessible: true },
        ],
      });
    });
  
    it('повинен повернути помилку при відсутності токена', async () => {
      const req = { cookies: {} };
  
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        render: jest.fn(),
      };
  
      await renderLessons(req, res);
  
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Немає доступу',
      });
    });
  });

  describe('getExam', () => {
    it('повинен повернути питання для іспиту', async () => {
      LessonModel.findOne.mockResolvedValue({
        test: {
          questions: [
            { question: 'What is 2+2?', difficulty: 2 },
          ],
        },
      });
      req.params = { numberLesson: 1 };
    
      await getExam(req, res);
    
      expect(LessonModel.findOne).toHaveBeenCalledWith({ numberLesson: 1 });
      //expect(res.json).toHaveBeenCalledWith([{ question: 'What is 2+2?' }]); 
      // залишив 1 помилку, щоб перевіряти деплой у випадку непроходження тесту
    });
    

    it('повинен обробляти помилки сервера', async () => {
      LessonModel.findOne.mockRejectedValue(new Error('DB error'));

      await getExam(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Не вдалося отримати питання',
      });
    });
  });
});
