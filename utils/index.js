// export {default as checkAuth} from './checkAuth.js'
// export {default as handleValidationErrors} from './handlevalidationErrors.js'
const checkAuth = require('./checkAuth.js');
const handleValidationErrors = require('./handlevalidationErrors.js');

module.exports = {
  checkAuth,
  handleValidationErrors,
};
