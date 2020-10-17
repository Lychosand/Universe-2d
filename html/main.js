console.log("Running Universe Sim");

var ws = new WebSocket('ws://' + window.document.location.host);
var worldState;

//Game Canvas
var c = document.getElementById("myCanvas");
c.width = 1280;
c.height = 720;
c.style.left = window.innerWidth/2 - c.width/2;
c.style.top = window.innerHeight/2 - c.height/2;

var ctx = c.getContext('2d');


//GUI Canvas
var gui = document.getElementById("guiCanvas");
gui.width = 1312;
gui.height = 745;
gui.style.left = window.innerWidth/2 - gui.width/2;
gui.style.top = window.innerHeight/2 - gui.height/2 - 8;

var ctxGUI = gui.getContext('2d');

console.log(c.width, c.height);

var worldWidth = 5000;
var worldHeight = 5000;

//Initializing the ship and camera elements
var playerShip = new Game.Ship(200, 200, c.width, c.height, worldWidth, worldHeight);
var	playerCamera = new Game.Camera(0, 0, c.width, c.height, worldWidth, worldHeight);
playerCamera.follow(playerShip, c.width/2, c.height/2);

var scaleX = 1;
var scaleY = 1;


var message = {
	header: null,
	payload: null
}

var client = {
	id: null,
	state: null,
	ready: null
}

//Function to serialize all world data sent from the server
function initializeWorld(world) {
	worldState = new Game.World(worldWidth, worldHeight, world.backgroundSource, world.firstLayerSource, world.secondLayerSource, world.stars, world.planets, world.ships);
	client.ready = true;
}

//Function initializes data on current client
function initializeClient(id, state, ready) {
	client.id = id;
	client.state = state;
	client.ready = ready;
	playerShip.id = id;
}

//Function handler for receiving messages.  Handles updating values sent from the server
ws.onmessage = function(message) {
	var incomingMessage = JSON.parse(message.data);

	switch(incomingMessage.state) {
		case "Initialize":
			console.log("Initialize the world");
			initializeClient(incomingMessage.id, incomingMessage.state, incomingMessage.ready);
			initializeWorld(incomingMessage.world);
			break;

		case "Stars":
			worldState.updateStars(incomingMessage.payload, incomingMessage.time);
			break;

		case "Planets":
			worldState.updatePlanets(incomingMessage.payload, incomingMessage.time);
			break;

		case "Ships":
			worldState.updateShips(incomingMessage.payload, incomingMessage.time, playerShip);
			break;

		case "AddShip":
			console.log("ADDING SHIP");
			worldState.addShip(incomingMessage.payload);
			break;

		case "RemoveShip":
			console.log("Removing Ship")
			worldState.removeShip(incomingMessage.payload);
			break;

		case "DamageTaken":
			console.log("Ship just got hit");
			worldState.updateDamage(incomingMessage.payload, incomingMessage.timeStamp);
			break;

		default:
			console.log("defaulting");
			break;
	}
};

function shoot(header, id) {
	//playerShip.shootingHandler();
	message.header = header;
	message.payload = id;
	message.timeStamp = Date.now();
	ws.send(JSON.stringify(message));
}

//Function to send messages to the server
function sendMessage(header, ship) {
	let payload = {};
	payload.rotation = ship.rotation;
	payload.spawnBullet = ship.spawnBullet;
	payload.id = ship.id;
	payload.state = ship.state;
	payload.x = ship.x;
	payload.y = ship.y;
	payload.sX = ship.sX;
	message.header = header;
	message.payload = payload;
	ws.send(JSON.stringify(message));
}

//Once websocket has been established, client must update the server with it's new client ship
ws.addEventListener('open', function(event) {
	console.log("Server connection established");
	sendMessage("Initialize", playerShip);
});


(function() {
	var lastRender = 0;
	var lastUpdate = Date.now();

	var fps = 60;
	var fpsInterval = 1000 / fps;

	lag = 0;

	function update(dt) {
		worldState.update(dt);
		playerShip.update(dt, worldWidth, worldHeight, playerCamera, worldState.ships);
		playerCamera.update();
	}

	function draw() {
		//ctx.scale(scaleX, scaleY);
		worldState.draw(ctx, playerCamera.viewPort, playerCamera.xView, playerCamera.yView, c.width, c.height, playerCamera, client.id, playerShip, ctxGUI, gui);
		playerShip.draw(ctx, playerCamera, scaleX, scaleY);
	}

/*-------------------------------------------------------------------Main Game Loop------------------------------------------------------------------------------*/
	
	function loop(timestamp)
	{

		window.requestAnimationFrame(loop);


		var progress = timestamp - lastRender;

		var now = Date.now();
		dt = now - lastUpdate;

		//console.log(elapsed);

		if(client.ready == true) {
			update(dt);
			draw();
			sendMessage("Ship", playerShip);
		}

		lastUpdate = now;
	}

	Game.play = function() {
		window.requestAnimationFrame(loop);
	}
})();

window.onload = function() {
	Game.play();
}

/*----------------------------------------------------------------------Event Listeners----------------------------------------------------------------------*/
/*-----------------------------------------------------------------------------------------------------------------------------------------------------------*/
//Pressing keys
document.addEventListener("keydown", function(event) {
	var key = event.keyCode;

	switch(key) {
		case 87:
			playerShip.state.keyW = true;
			break;
		case 83:
			playerShip.state.keyS = true;
			break;
		case 65:
			playerShip.state.keyA = true;
			break;
		case 68:
			playerShip.state.keyD = true;
			break;
	}
});

//Releasing keys
document.addEventListener("keyup", function(event) {
	var key = event.keyCode;

	switch(key) {
		case 87:
			playerShip.state.keyW = false;
			break;
		case 83:
			playerShip.state.keyS = false;
			break;
		case 65:
			playerShip.state.keyA = false;
			break;
		case 68:
			playerShip.state.keyD = false;
			break;
	}
});

//Event listener for shootin
document.addEventListener("mousedown", function(event) {
	playerShip.state.shooting = true;
	shoot("Shoot", playerShip.id);
});

document.addEventListener("mouseup", function(event) {
	playerShip.state.shooting = false;
	playerShip.spawnBullet = false;
});

document.addEventListener("wheel", function(event) {
	let dy = event.deltaY;

	if(dy > 0) {
		console.log("scroll down");
		scaleX -= 0.05;
		scaleY -= 0.05;
		//playerCamera.scaleXValue += c.width * scaleX;

	}

	if(dy < 0) {
		console.log("scroll up");
		scaleX += 0.05;
		scaleY += 0.05;
		//playerCamera.scaleYValue += c.height * scaleY;
	}
});

//Log player's mouse position
document.addEventListener("mousemove", function(event) {
	Game.mouseX = event.clientX - (window.innerWidth/2 - c.width/2);
	Game.mouseY = event.clientY - (window.innerHeight/2 - c.height/2);
});