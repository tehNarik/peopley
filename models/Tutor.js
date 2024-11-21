import mongoose from 'mongoose';

const TutorModel = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    teleteg:{
        type: String, 
        required: true,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        minLength: 10
    },
    videoDescriptionURL: {
        type: String, 
        required: false, // посилання на YouTube є необов'язковим
        validate: {
            validator: function(v) {
                // Перевірка чи є це валідним YouTube посиланням
                return /^(https?\:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/.test(v);
            },
            message: props => `${props.value} is not a valid YouTube link!`
        }
    },
    zoomMeetingURL: {  // Додаємо нове поле для Zoom зустрічі
        type: String,
        default: ''
    },
    experienceYears: {
        type: Number,
        required: true, // поле обов'язкове
        min: 0, // досвід не може бути від'ємним
        max: 50, // максимальний досвід
        // вираз дозволяє як цілі числа, так і дробові
    },
    shortDescription: {
        type: String,
        maxLength: 300
    },
    longDescription: {
        type: String,
        maxLength: 1000
    }
    }, {
    timestamps: true,
},
);

export default mongoose.model('tutor', TutorModel);