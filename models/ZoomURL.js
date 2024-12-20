const mongoose = require('mongoose');

const ZoomURL = new mongoose.Schema({
  URL: {type: String}
});

//export default mongoose.model('ZoomURL', ZoomURL);
module.exports = mongoose.model('ZoomURL', ZoomURL);