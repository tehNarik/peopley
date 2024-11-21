import mongoose from 'mongoose';

const TestModel = new mongoose.Schema({
    topic: { // тема якій належить тест
        type: String,
        required: true,
        unique: true
    },
    questions: [{
        questionText:{
            type: String,
            unique: true
        },
        questionImageURL:{
            type: String,
            unique: true
        },
        difficulty: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        options: [{
            optionText: {
                type: String,
                required: true,
                trim: true
            },
            isCorrect: {
                type: Boolean,
                default: false
            }
        }],
        type: { // тип питання: звичайне або з’єднання
            type: String,
            enum: ['choice', 'matching', 'fitting'],
            default: 'choice'
        },
        matchingPairs: [{
            questionPart: { // частина питання
                type: String,
                required: function() { return this.type === 'matching'; }
            },
            answerPart: { // відповідна частина відповіді
                type: String,
                required: function() { return this.type === 'matching'; }
            }
        }],
        answer: {
            type: String,
            required: function(){ return this.type === 'fitting'}
        }
    },
    
    ],
    passingScore: {
        type: Number,
        default: 50
    }
    
})
export default mongoose.model('test', TestModel);