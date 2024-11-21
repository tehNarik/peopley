import mongoose from 'mongoose';

const ZoomURL = new mongoose.Schema({
  URL: {type: String}
});

export default mongoose.model('ZoomURL', ZoomURL);