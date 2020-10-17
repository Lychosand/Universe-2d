var http = require('http');
var fs = require('fs');
var url = require('url');
var WebSocketServer = require('ws').Server;
var Server = require('./data.js');

var ROOT_DIR = 'html';

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

/*---------------------------------Following code handles the communication to the clients----------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------------*/

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
	//console.log('\n============================');
	//console.log("PATHNAME: " + urlObj.pathname);
	//console.log("REQUEST: " + ROOT_DIR + urlObj.pathname);
	//console.log("METHOD: " + request.method);

	var receivedData = '';


	request.on('data', chunk => {
		receivedData += chunk;
	}).on('end', () => {
		//console.log('Received data: ', receivedData);
		//console.log('type: ', typeof receivedData);


		if(request.method == "POST") {
			var dataObj = JSON.parse(receivedData);
			//console.log('Received data object: ', dataObj);
			//console.log('type: ', typeof dataObj);
			//console.log("USER REQUEST: " + dataObj.text);


			var returnObj = {};
			returnObj = dataObj;

			response.writeHead(200, {'Content-Type': MIME_TYPES['json']});
			response.end(JSON.stringify(returnObj));
		}


		if(request.method == "GET") {
			var filePath = ROOT_DIR + urlObj.pathname;
			if(urlObj.pathname === '/') filePath = ROOT_DIR + '/index.html';

			//console.log("GET filepath: " + filePath);

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
}).listen(3001, '192.168.2.66');
//80 internet
//3001 normal port
//Set IP to 0.0.0.0 then use ngrok tunneling service
//Set IP to 127.0.0.1 fir localhost connection
//public 184.144.101.227
//private 192.168.2.66

var wss = new WebSocketServer({server: server});
var clients = []; //our list of clients
var id = 0; //id of clients

wss.on('connection', function(ws) {
	console.log("A client has connected to the socket");

	ws.id = id;
	clients.push(new Server.Client(id, ws, currentWorldState, "Initialize"));
	id++;

	ws.on('close', function close() {
		console.log("A client has been disconnected from the server");
		console.log("Client ID: " + ws.id);

		for(iterator in clients) {
			clients[iterator].removeShip(ws.id);
		}

		for(iterator in currentWorldState.ships) {
			if(currentWorldState.ships[iterator].id == ws.id) {
				console.log("removing ship");
				currentWorldState.ships.splice(iterator, 1);
				currentWorldState.shipPackets.splice(iterator, 1);
			}
		}

		for(iterator in clients) {
			if(clients[iterator].id == ws.id) {
				console.log("removing element");
				clients.splice(iterator, 1);
			}
		}
	});

	ws.on('message', function(msg) {
		let receivedMessage = JSON.parse(msg);

		switch(receivedMessage.header) {
			case "Initialize":
				//console.log(receivedMessage.payload);
				currentWorldState.addShip(receivedMessage.payload, ws.id);

				for(iterator in clients) {
					if(clients[iterator].id == ws.id) {
						clients[iterator].initialize();
						clients[iterator].state = "Update";
						clients[iterator].ready = true;
					} else {
						clients[iterator].addShip(receivedMessage.payload, ws.id);
					}
				}
				break;

			case "Ship":
				currentWorldState.updateShip(receivedMessage.payload);
				break;

			case "Shoot":
				currentWorldState.spawnProjectile(receivedMessage.payload, receivedMessage.timeStamp);
				break;
		}
	});
});

console.log('Server Running at http://192.168.2.66:3001  Recheable at public http://184.144.101.227:3002  CNTL-C to quit');

/*---------------------------------Following code handles the game state on the server side---------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------------*/

var frameRate = 1000/60;
var previousTick = Date.now();
var dt;
var currentWorldState;

function generateWorld() {
	currentWorldState = new Server.World(5000, 5000);
}

function gameLoop() {
	var now = Date.now();

	if(previousTick + frameRate <= now) {
		var delta = (now - previousTick) / 1000;
		previousTick = Date.now();

		currentWorldState.update(delta, clients);

		for(iterator in clients) {
			clients[iterator].update();
		}
	}

	if(Date.now() - previousTick < frameRate - 16) {
		setTimeout(gameLoop);
	} else {
		setImmediate(gameLoop);
	}
}

generateWorld();
gameLoop();

