var ws = new WebSocket('ws://' + window.document.location.host);


//import tmp from "data.js";

ws.onmessage = function(message) {
	var newMsg = JSON.parse(message.data);
	console.log("Server has tried sending us a message");
	console.log("Message data: ", newMsg);
}

function sendMessage() {
	ws.send("I need stars");
}

function loop(timestamp)
{
	//sendMessage();

	window.requestAnimationFrame(loop);
}


window.onload = function() {
	window.requestAnimationFrame(loop);
}

document.addEventListener("keydown", function(event) {
	var key = event.keyCode;

	switch(key) {
		case 87:
			sendMessage();
			//keyW = true;
			break;
		case 83:
			//keyS = true;
			break;
		case 65:
			//keyA = true;
			break;
		case 68:
			//keyD = true;
			break;
	}
});