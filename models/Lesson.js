//import mongoose from 'mongoose';
//import TestModel from './Test.js'
const mongoose = require('mongoose');

const LessonModel = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    videoURL: {
        type: String,
        required: true
    },
    numberLesson: {
        type: Number,
        required: true,
        unique: true
    },
    // isOpen: {
    //     type: Boolean,
    //     default: false
    // },
    test: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'test', // Це вказує на модель тесту
        required: false // Тест може бути опціональним для уроку
    },
})

//export default mongoose.model('Lesson', LessonModel);
module.exports = mongoose.model('Lesson', LessonModel);
