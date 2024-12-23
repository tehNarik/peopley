const LessonModel = require('../models/Lesson.js');
const TestModel = require('../models/Test.js');
const TestResultModel = require('../models/TestResult.js');



const getCourseStatistics = async (req, res) => {
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




const create = async (req, res)=>{
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
const getOne = async (req, res) => {
  try {
    const lessonNum = req.params.numberLesson;
    if (!lessonNum) {
      return res.status(404).json({ message: 'Урок не знайдено' });
    }
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
    //console.log(matchingQuestions)
    // Відображаємо сторінку уроку з EJS
    res.render('lesson', { lesson, matchingQuestions });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Не вдалося завантажити урок" });
  }
};

const getAll = async (req, res) => {
  try {
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
    console.log('Lessons:', lessons); // Перевірте, чи дані коректні

    res.status(200).render('course', { lessons: lessonsWithAccess });
    console.log('res.render called');
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

const renderLessons = async (req, res) => {
  try {
    const userId = req.cookies['userId'];
    if (!userId) {
      return res.status(401).json({ message: 'Немає доступу' });
    }

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
        const previousLessonNumber = lesson.numberLesson - 1;
        const previousTestResult = testResults.find(result => result.topic === `Тема ${previousLessonNumber}`);

        if (previousTestResult && previousTestResult.score >= 50) {
          lesson.isAccessible = true;
        } else {
          lesson.isAccessible = false;
        }
      }
    });

    res.status(200).render('lessons', { lessons });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


const getExam = async (req, res) => {
  try {

const difficulty2 = await TestModel.aggregate([
  { 
      $match: { 
          "questions.difficulty": 2, // Складність 2
          "questions.type": "choice",
          "topic": { 
              $in: ["Відсотки й відношення", "Функції", "Цілі раціональні вирази", "Простір", "Чотирикутники", "Трикутник"]
          }
      } 
  },
  
  { $unwind: "$questions" }, // Розгортаємо масив питань
  { 
      $facet: {
          відсотки: [
              { $match: { "questions.type": "choice",
                "topic": "Відсотки й відношення", } },
              { $sample: { size: 1 } }
          ],
          функції: [
              { $match: { "questions.type": "choice",
                "topic": "Функції" } },
              { $sample: { size: 1 } }
          ],
          ціліРаціональні: [
              { $match: { "questions.type": "choice",
                "topic": "Цілі раціональні вирази" } },
              { $sample: { size: 1 } }
          ],
          чотирикутникиАбоТрикутники: [
              { 
                  $match: { "questions.type": "choice",
                
                      $or: [
                          { "topic": "Чотирикутники" },
                          { "topic": "Трикутник" }
                      ]
                  } 
              },
              { $sample: { size: 1 } }
          ],
          простір: [
              { $match: { "questions.type": "choice",
                "topic": "Простір" } },
              { $sample: { size: 1 } }
          ]
      }
  },
  { 
      $project: {
          questions: {
              $concatArrays: [
                  "$відсотки",
                  "$функції",
                  "$ціліРаціональні",
                  "$чотирикутникиАбоТрикутники",
                  "$простір"
              ]
          }
      }
  }
]);







const difficulty3 = await TestModel.aggregate([
  { 
      $match: { 
          "questions.difficulty": 3, // Складність 3
          "questions.type": "choice",
          "topic": { 
            $in: ["Ірраціональні вирази", "Ірраціональні рівняння й нерівності", "Логарифмічні й показникові рівняння", "Логарифмічні й показникові нерівності", "Логарифми", "Трикутник", "Чотирикутники", "Системи рівнянь і нерівностей", "Простір", "Прогресії", "Тригонометрія", "Тригонометричні рівняння"]
          }
      } 
  },
  
  { $unwind: "$questions" }, // Розгортаємо масив питань
  { 
      $facet: {
          ірраціональніВиразиРівнянняНерівності: [
              { $match: { "questions.type": "choice",
                
                $or: [
                  { "topic": "Ірраціональні вирази" },
                  { "topic": "Ірраціональні рівняння й нерівності" }
              ]
               } },
              { $sample: { size: 1 } }
          ],
          логарифмічніВиразиРівнянняНерівності: [
              { $match: { "questions.type": "choice",
                $or: [
                { "topic": "Логарифми" },
                { "topic": "Логарифмічні й показникові рівняння" },
                { "topic": "Логарифмічні й показникові нерівності"}
            ] } },
              { $sample: { size: 1 } }
          ],
          чотирикутникиАбоТрикутники: [
              { 
                  $match: { "questions.type": "choice",
                
                      $or: [
                          { "topic": "Чотирикутники" },
                          { "topic": "Трикутник" }
                      ]
                  } 
              },
              { $sample: { size: 1 } }
          ],
          системиРівняньІНерівностей: [
              { $match: { "questions.type": "choice",
                "topic": "Системи рівнянь і нерівностей" } },
              { $sample: { size: 1 } }
          ],
          стереометрія: [
            { $match: { "questions.type": "choice",
                "topic": "Простір" } },
            { $sample: { size: 1 } }
          ],
          прогресії: [
            { $match: { "questions.type": "choice",
                "topic": "Прогресії" } },
            { $sample: { size: 1 } }
          ],
          тригонометріяАбоРівняння: [
            { 
                $match: { "questions.type": "choice",
                
                    $or: [
                        { "topic": "Тригонометрія" },
                        { "topic": "Тригонометричні рівняння" }
                    ]
                } 
            },
            { $sample: { size: 1 } }
        ]
      }
  },
  { 
      $project: {
          questions: {
              $concatArrays: [
                  "$ірраціональніВиразиРівнянняНерівності",
                  "$логарифмічніВиразиРівнянняНерівності",
                  "$чотирикутникиАбоТрикутники",
                  "$системиРівняньІНерівностей",
                  "$стереометрія",
                  "$прогресії",
                  "$тригонометріяАбоРівняння"
              ]
          }
      }
  }
]);



const teoricQuestion = await TestModel.aggregate([
  { 
      $match: { 
        "questions.type": "choice",
          "topic": { 
              $in: ["Теорія"]
          }
      } 
  },
  
  { $unwind: "$questions" }, // Розгортаємо масив питань
  { 
      $facet: {
          теорія: [
              { $match: { "topic": "Теорія" } },
              { $sample: { size: 1 } }
          ]
      }
  },
  { 
      $project: {
          questions: {
              $concatArrays: [
                  "$теорія"
              ]
          }
      }
  }
]);





const difficulty4 = await TestModel.aggregate([
  { 
      $match: { 
          "questions.difficulty": 2, // Складність 2
          "questions.type": "choice",
          "topic": { 
              $in: ["Цілі раціональні вирази", "Трикутник", "Чотирикутники"]
          }
      }
  },
  
  { $unwind: "$questions" }, // Розгортаємо масив питань
  { 
      $facet: {
          ціліРаціональніВирази: [
              { $match: { "questions.type": "choice",
                "topic": "Цілі раціональні вирази" } },
              { $sample: { size: 1 } }
          ],
          трикутникЧотирикутники: [
              { $match: { "questions.type": "choice",
                $or: [
                { "topic": "Чотирикутники" },
                { "topic": "Трикутник" }
            ] } },
              { $sample: { size: 1 } }
          ]
      }
  },
  { 
      $project: {
          questions: {
              $concatArrays: [
                  "$ціліРаціональніВирази",
                  "$трикутникЧотирикутники"
              ]
          }
      }
  }
]);






const matchingTasks = await TestModel.aggregate([
  { $unwind: "$questions" }, // Розгортаємо масив питань
  {
    $facet: {
      функції: [
        { 
          $match: { 
            "questions.difficulty": 4, 
            "questions.type": "matching", 
            topic: "Функції" 
          } 
        },
        { $sample: { size: 1 } } // 1 питання з теми "Функції"
      ],
      логарифмиІрраціональніЦілі: [
        { 
          $match: { 
            "questions.difficulty": 4, 
            "questions.type": "matching", 
            topic: { $in: ["Логарифми", "Ірраціональні вирази", "Цілі раціональні вирази", "Інші вирази"] } 
          } 
        },
        { $sample: { size: 1 } } // 1 питання з теми "Логарифми", "Ірраціональні вирази" або "Цілі раціональні вирази"
      ],
      трикутникиЧотирикутники: [
        { 
          $match: { 
            "questions.type": "matching", 
            "questions.difficulty": 4, 

              $or: [
                  { "topic": "Трикутник" },
                  { "topic": "Чотирикутники" },
                  { "topic": "Рівнобедрений трикутник" }
              ]
          } 
        },
        { $sample: { size: 1 } } // 1 питання зі складністю 4 з теми "Трикутники" або "Чотирикутники"
      ]
    }
  },
  { 
    $project: { 
      questions: { 
        $concatArrays: [
          "$функції", 
          "$логарифмиІрраціональніЦілі", 
          "$трикутникиЧотирикутники"
        ] 
      } 
    } 
  }
]);




const fittingTasks = await TestModel.aggregate([
  { $unwind: "$questions" }, // Розгортаємо масив питань
  {
    $facet: {
      похіднаАбоПервісна: [
        { 
          $match: { 
            "questions.type": "fitting", 
            topic: { $in: ["Похідна", "Первісна"] } 
          } 
        },
        { $sample: { size: 1 } } // 1 питання з теми "Похідна" або "Первісна"
      ],
      комбінаторикаЙмовірність: [
        { 
          $match: { 
            "questions.type": "fitting", 
            topic: "Комбінаторика й теорія ймовірності" 
          } 
        },
        { $sample: { size: 1 } } // 1 питання з теми "Комбінаторика й теорія ймовірності"
      ],
      стереометрія: [
        { 
          $match: { 
            "questions.type": "fitting", 
            topic: { $in: ["Піраміда", "Призма", "Циліндр", "Конус"] } 
          }
        },
        { $sample: { size: 1 } } // 1 питання з теми "Стереометрія"
      ],
      параметр: [
        { 
          $match: { 
            "questions.type": "fitting", 
            topic: "Параметри" 
          } 
        },
        { $sample: { size: 1 } } // 1 питання з теми "Параметр"
      ]
    }
  },
  { 
    $project: { 
      questions: { 
        $concatArrays: [
          "$похіднаАбоПервісна", 
          "$комбінаторикаЙмовірність", 
          "$стереометрія", 
          "$параметр"
        ] 
      } 
    } 
  }
]);



// Перевіряємо, чи всі запити повернули дані
if (!difficulty2 || !difficulty3 || !teoricQuestion || !difficulty4 || !matchingTasks) {
  return res.status(500).json({ message: 'Не вдалося отримати питання' });
}

const questionsArray = [];
//console.log(difficulty2[0].questions[0].questions)
difficulty2[0].questions.forEach(q => {
  questionsArray.push(q.questions);
});

difficulty3[0].questions.forEach(q => {
  questionsArray.push(q.questions);
});
teoricQuestion[0].questions.forEach(q => {
  questionsArray.push(q.questions);
});
difficulty4[0].questions.forEach(q => {
  questionsArray.push(q.questions);
});


const matchingQuestions = [];


matchingTasks[0].questions.forEach(task => {
  const matchingQuestion = {
    ...task.questions, // копіюємо всі поля питання
    matchingPairs: [...task.questions.matchingPairs].sort(() => Math.random() - 0.5) // копіюємо і перемішуємо matchingPairs
  };
  matchingQuestions.push(matchingQuestion);

  questionsArray.push({...task.questions});
 
});
//console.log(questionsArray[15])
fittingTasks[0].questions.forEach(q => {
  questionsArray.push(q.questions);
});

    res.status(200).render('exam', {questionsArray, matchingQuestions});
    //res.json(matchingQuestions);
    //res.status(200).render('exam', {difficulty2, difficulty3, teoricQuestion, difficulty4, matchingTasks, fittingTasks});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Не вдалося отримати питання' });
  
  }
}

module.exports = {
  getCourseStatistics, 
  create,
  getOne,
  getAll,
  renderLessons,
  getExam
};