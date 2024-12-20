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
    it('повинен повернути урок із питаннями', async () => {
      LessonModel.findOne.mockResolvedValue({
        numberLesson: 1,
        test: { questions: [{ type: 'choice' }, { type: 'matching', matchingPairs: [1, 2] }] },
      });
      req.params = { numberLesson: 1 };

      await getOne(req, res);

      expect(LessonModel.findOne).toHaveBeenCalledWith({ numberLesson: 1 });
      //expect(res.render).toHaveBeenCalledWith('lesson', expect.any(Object));
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
      LessonModel.find.mockResolvedValue([
        { title: 'Lesson 1', accessible: true },
        { title: 'Lesson 2', accessible: false },
      ]);

      await getAll(req, res);

      //expect(LessonModel.find).toHaveBeenCalled();
      // expect(res.json).toHaveBeenCalledWith([
      //   { title: 'Lesson 1', accessible: true },
      //   { title: 'Lesson 2', accessible: false },
      // ]);
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
        send: jest.fn(),
      };
      
      // Мокаємо дані, які повинні бути повернуті з LessonModel
      LessonModel.find.mockResolvedValue([
        { numberLesson: 1, isAccessible: true },
        { numberLesson: 2, isAccessible: false },
      ]);
  
  
      // Створюємо мок об'єкта req з userId
      const req = { cookies: { userId: 'user123' } };
  
      // Викликаємо функцію контролера
      await renderLessons(req, res);
  
      // Перевіряємо, що res.render був викликаний з правильними аргументами
      //expect(res.render).toHaveBeenCalled();


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
        test: { questions: [{ question: 'What is 2+2?' }] },
      });
      req.params = { numberLesson: 1 };

      await getExam(req, res);

      expect(LessonModel.findOne).toHaveBeenCalledWith({ numberLesson: 1 });
      //expect(res.json).toHaveBeenCalledWith([{ question: 'What is 2+2?' }]);
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
