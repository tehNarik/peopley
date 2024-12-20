//import jwt from 'jsonwebtoken';
const jwt = require('jsonwebtoken');
module.exports = (req, res, next)  =>{

    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
    //const token = req.headers.authorization?.split(' ')[1];
    //console.log(token)
    
    if(token){
        try{
            const decoded = jwt.verify(token, 'secret 123')
            req.userId = decoded._id;
            console.log('Decoded User ID:', req.userId);

            next()
        }catch(err){
            console.log(err)
            return res.status(403).json({
                message: 'Доступ відсутній 2'
            })
        }
    }else{
        return res.status(403).json({
            message: 'Доступ відсутнійй'
        })
    }
    //res.send(token)
    //next()
}