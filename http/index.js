const Koa = require('koa');
const app = new Koa();
const fs = require('fs.promised');
const serve = require('koa-static');
const path = require("path");
const route = require('koa-route');
const bodyParser = require('koa-bodyparser')
const axios = require('axios')
let child_process = require('child_process')
let port = 3001
 
app.use(bodyParser())

app.use(serve(path.resolve(__dirname)))

const main = async ctx => {
    ctx.response.type = 'html';
    ctx.response.body = await fs.readFile('./index.html');
}
const sendReq = async ({method, url, data, headers}) => {
    console.log(`-----------------------开始请求------------------------`)
    console.log(`method: ${method}`)
    console.log(`url: ${url}`)
    console.log(`req-data: ${JSON.stringify(data)}`)
    console.log(`req-headers: ${JSON.stringify(headers)}`)
    let f=()=>{
        for(let i=0;i<4;i++){
            if(i===0) console.log(`--------------------------结束------------------------`)
            console.log(`------------------------------------------------------`)
        }
    }
    try {
        let { data: d, headers: h } = await axios({method, url, data, headers })
        console.log(`-----------------------响应-----------------------`)
        console.log(`res-headers: ${JSON.stringify(h)}`)
        console.log(`res-data: ${JSON.stringify(d)}`)
        f()
        return {d, h}
    } catch (error) {
        f()
        return { err: 'error' }
    }
}
const send = async ctx => {
    // console.log(ctx.request)
    ctx.response.type = 'text';
    let { hostname: url, method, headers, postData: data, cookie } = ctx.request.body
    if(cookie) headers['Cookie'] = cookie
    let d = await sendReq({method, url, data, headers})
    ctx.response.body = await d;
}

app.use(route.get('/', main));
app.use(route.post('/send', send));

app.listen(port);

child_process.exec(`start http://localhost:${port}`);