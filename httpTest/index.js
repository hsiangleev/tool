var http = require('http');
var https = require('https');
var querystring = require('querystring');
var fs = require('fs');
var url = require('url');
var child_process = require('child_process');

var options = {};

var num=1;
var arr=[0];
var f=function(i,postData,protocol) {
    return new Promise((resolve,reject)=>{
        var d=Date.now();
        var reqFn=protocol==="http"?http.request:https.request;
        const req = reqFn(options, (res) => {
            // console.log(`状态码: ${res.statusCode}`);
            // console.log(`响应头: ${}`);
            var body="";
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                body+=chunk;
                // console.log(`响应主体: ${chunk}`);
            });
            res.on('end', () => {
                console.log('响应完成：'+i);
                arr.splice(i,1,Date.now()-d);
                resolve({body: body, headers: JSON.stringify(res.headers)});
            });
        });
        
        req.on('error', (e) => {
            console.error(`请求遇到问题: ${e.message}`);
            reject(e.message);
        });
        // 将数据写入请求主体。
        req.write(postData);
        req.end();
    })
}

// 路由
var app=function(pathname,params,req,res) {
    if(pathname==="/send"){
        var protocol=params.protocol;
        options = {
            hostname: params.hostname,
            port: params.port,
            // path: '/Account/LoginService',
            path: params.path,
            method: params.method,
            headers: {
                Cookie: params.cookie
            }
        };
        if(protocol.method==="post")  options.headers['Content-Type']='application/x-www-form-urlencoded';
        var postData = querystring.stringify(JSON.parse(params.postData));
        num=Number(params.num);
        arr=[...Array(num)].map((v,i)=>i);

        console.log("----------------- 开始 ------------------");
        Promise.all([...Array(num)].map((v,i)=>f(i,postData,protocol))).then((data)=>{
            var togg=arr.reduce((acc,v)=>{
                return acc+v;
            },0)
            // res.write(arr);
            console.log("----------------- 结束 ------------------");
            res.end(JSON.stringify({code: 0,data,time:arr,average: Math.floor(togg/arr.length)}));
        }).catch(function(reason){
            res.end(JSON.stringify({code: -1, msg: reason}))
        })
    }else{
        // 从文件系统中读取请求的文件内容
        let s=process.argv[1].split("\\");
        s.pop();
        s=s.join("\\\\")+"\\\\"+pathname.substr(1);
        fs.readFile(s, function (err, data) {
            if (err) {
                console.log(err);
                res.writeHead(404, {'Content-Type': 'text/html'});
            }else{             
                res.writeHead(200, {'Content-Type': 'text/html'});    
                // 响应文件内容
                res.write(data.toString());        
            }
            res.end();
        });
    }
}


// 创建服务器
http.createServer( function (req, res) {  
    // 解析请求，包括文件名
    var pathname = url.parse(req.url).pathname;
    pathname=pathname==="/"?"/index.html":pathname;
    
    if(req.method==="GET"){
        let params = url.parse(req.url, true).query;
        app(pathname,params,req,res);
    }
    if(req.method==="POST"){
        let params="";
        req.on('data', function (chunk) {
            params += chunk;
        });
        req.on('end', function(){    
            params = querystring.parse(params);
            res.writeHead(200, {'Content-Type': 'text/html; charset=utf8'});
            app(pathname,params,req,res);
        });
    }
}).listen(3000);

// 自动打开浏览器
child_process.exec('start http://localhost:3000');

console.log("启动浏览器，打开 http://localhost:3000");


