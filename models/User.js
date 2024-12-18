import mongoose from 'mongoose';

const UserModel = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        min: 3,
        max: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: ''
    },
    lessonsBalance: {
        type: Number,
        default: 0
    },
    avatarURL: String,
}, {
    timestamps: true,
},
);

export default mongoose.model('user', UserModel);