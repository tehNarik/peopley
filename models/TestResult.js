//import mongoose from 'mongoose';
const mongoose = require('mongoose');
const TestResultModel = new mongoose.Schema({
    topic: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
})
//export default mongoose.model('testResult', TestResultModel)
module.exports = mongoose.model('testResult', TestResultModel);