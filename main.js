const http = require('http');
const parser = require('./parser.js');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
	var url = require('url');	
	if(!url.parse(req.url).pathname.includes("favicon")){
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/plain');
		res.end(parser.parse('./config.yml').toString());
	}
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});