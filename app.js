// import http from 'http'
// import fs from 'fs'
// //const fs = require('fs');




// http.createServer(function(request, response){
//     console.log(request.url)
//     console.log(request.headers)
//     response.setHeader("Content-Type", "text/html; charset=utf-8;")
//     if(request.url=='/'){
//         //response.end('<h1>hello</h1>main page')
//         let text = fs.readFileSync('html.dat')
//         response.end(text)
//     }
//     else if(request.url=='/home'){
//         response.end('home page')
//     }
//     else{

//         response.end('Hello my course web page by node!')
//     }
// }).listen(4444);