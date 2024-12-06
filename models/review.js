import mongoose from 'mongoose';

const ReviewModel = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    mark: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    anonymous: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true // Додає поля createdAt і updatedAt
});

export default mongoose.model('Review', ReviewModel);