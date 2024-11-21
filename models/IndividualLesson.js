import mongoose from 'mongoose';

const IndividualLessonModel = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  startHourNumber: { type: Number, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'tutor', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }
});

export default mongoose.model('IndividualLesson', IndividualLessonModel);
