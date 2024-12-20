const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('Authorization Header:', authHeader);
    console.log('Extracted Token:', token);
  
    if (token == null) return res.sendStatus(401); // Якщо токен відсутній
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        console.error('JWT Verification Error:', err.message);
        return res.sendStatus(403); // Якщо токен невалідний
      }
  
      req.user = user; // Зберігаємо інформацію про користувача в req
      next();
    });
  };
  


