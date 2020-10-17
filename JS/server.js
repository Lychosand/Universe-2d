var http = require('http');
var fs = require('fs');
var url = require('url');
var WebSocketServer = require('ws').Server;
var gameData = require('./html/data.js');
var starNames = require('./starNames.json');

var ROOT_DIR = 'html';

var FPS = 60 //We need to run the game loop server side, every 16.66666 ms to achieve 60 fps

var MIME_TYPES = {
    'css': 'text/css',
    'gif': 'image/gif',
    'htm': 'text/html',
    'html': 'text/html',
    'ico': 'image/x-icon',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'js': 'text/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'txt': 'text/plain'
};

var stars = gameData.generateStars(starNames);


//Helper function to retrieve correct MIME_TYPES for the client
var get_mime = (filename) => {
    var ext, type;
    for (ext in MIME_TYPES) {
        type = MIME_TYPES[ext];
        if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
            return type;
        }
    }
    return MIME_TYPES['txt'];
};

var server = http.createServer((request, response) => {
	var urlObj = url.parse(request.url, true, false);
	console.log('\n============================');
    console.log("PATHNAME: " + urlObj.pathname);
    console.log("REQUEST: " + ROOT_DIR + urlObj.pathname);
    console.log("METHOD: " + request.method);

    var receivedData = '';


    request.on('data', chunk => {
    	receivedData += chunk;
    }).on('end', () => {
    	console.log('Received data: ', receivedData);
    	console.log('type: ', typeof receivedData);


    	if(request.method == "POST") {
    		var dataObj = JSON.parse(receivedData);
    		console.log('Received data object: ', dataObj);
    		console.log('type: ', typeof dataObj);
    		console.log("USER REQUEST: " + dataObj.text);


    		var returnObj = {};
    		returnObj = dataObj;

    		response.writeHead(200, {'Content-Type': MIME_TYPES['json']});
    		response.end(JSON.stringify(returnObj));
    	}


    	if(request.method == "GET") {
    		var filePath = ROOT_DIR + urlObj.pathname;
    		if(urlObj.pathname === '/') filePath = ROOT_DIR + '/final.html';

    		console.log("GET filepath: " + filePath);

    		fs.readFile(filePath, (err, data) => {
    			if(err) {
    				console.log('ERROR: ' + JSON.stringify(err));
    				response.writeHead(404);
    				response.end(JSON.stringify(err));
    				return;
    			}

    			response.writeHead(200, {'Content-Type': get_mime(filePath)});
    			response.end(data);
    		});
    	}
    });
}).listen(3000, '127.0.0.1');
//Set IP to 0.0.0.0 then use ngrok tunneling service

var wss = new WebSocketServer({server: server});

wss.on('connection', function(ws) {
	console.log("A client has connected to the socket");

	ws.on('close', function close() {
		console.log("A client has been disconnected from the server");
	});

	ws.on('message', function(msg) {
		//var newMsg = JSON.parse(msg);

		console.log("A client is trying to communicate with the server");
		console.log("Client sent data: ", msg);


		wss.clients.forEach(function(client) {
			client.send(JSON.stringify(stars));
		});
	});
});

console.log('Server Running at http://127.0.0.1:3000  CNTL-C to quit');

