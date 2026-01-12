const http=require('http');
const server=http.createServer((req,res)=>{res.end('ok');});
server.listen(3001,()=>console.log('listening test 3001'));
