//Handling initializing game objects
window.Game = {};

var keyW = false;
var keyA = false;
var keyS = false;
var keyD = false;

var zoomLevel = 1;


/*----------------------------------------------------------------------Game Classes-------------------------------------------------------------------------*/
/*-----------------------------------------------------------------------------------------------------------------------------------------------------------*/

//Rectangles
(function() {
	function Rect(left, top, width, height) {
		this.left = left || 0,
		this.right = left + width || 0,
		this.width = width || 0,
		this.height = height || 0
	}


	Rect.prototype.set = function(left, top) {
		this.left = left;
		this.top = top;
		this.right = (this.left+this.width);
		this.bottom = (this.top + this.height);
	}

	Rect.prototype.within = function(rectangle) {
		return(rectangle.left <= this.left &&
				rectangle.right >= this.right &&
				rectangle.bottom >= this.bottom &&
				rectangle.top <= this.top);
	}

	Rect.prototype.overlaps = function(rectangle) {
		return(!(this.top >= rectangle.bottom ||
				 this.bottom <= rectangle.top ||
				 this.left >= rectangle.right ||
				 this.right <= rectangle.left));
	}

	Game.Rect = Rect;
})();

//Camera
(function() {
	var AXIS = {NONE: "none", BOTH: "both"};

	function Camera(xView, yView, canvasWidth, canvasHeight, worldWidth, worldHeight, cameraZoom) {
		this.xView = xView || 0;
		this.yView = yView || 0;
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.xDeadZone = 0;
		this.yDeadZone = 0;
		this.wView = canvasWidth;
		this.hView = canvasHeight;
		this.followed = null;
		this.axis = AXIS.BOTH;
		this.viewPort = new Game.Rect(this.xView, this.yView, this.wView, this.hView);
		this.world = new Game.Rect(0, 0, worldWidth, worldHeight);
	}

	Camera.prototype.follow = function(gameObject, xDeadZone, yDeadZone) {
		this.followed = gameObject;
		this.xDeadZone = xDeadZone;
		this.yDeadZone = yDeadZone;
	}

	
	Camera.prototype.update = function() {
		if(this.followed != null) {
			if(this.axis == AXIS.BOTH) {
				if(this.followed.x - this.xView + this.xDeadZone > this.wView)
					this.xView = this.followed.x - (this.wView - this.xDeadZone);
				else if(this.followed.x - this.xDeadZone < this.xView)
					this.xView = this.followed.x - this.xDeadZone;

				if(this.followed.y - this.yView + this.yDeadZone > this.hView)
					this.yView = this.followed.y - (this.hView - this.yDeadZone);
				else if(this.followed.y - this.yDeadZone < this.yView)
					this.yView = this.followed.y - this.yDeadZone;
			}
		}

		this.viewPort.set(this.xView, this.yView);

		if(!this.viewPort.within(this.world)) {
			if(this.viewPort.left < this.world.left)
        		this.xView = this.world.left;
        	if(this.viewPort.top < this.world.top)
          		this.yView = this.world.top;
        	if(this.viewPort.right > this.world.right)
          		this.xView = this.world.right - this.wView;
        	if(this.viewPort.bottom > this.world.bottom)
          		this.yView = this.world.bottom - this.hView;
		}
	}

	Game.Camera = Camera;
})();

//Stars
(function() {
	function Star(newX, newY, newSize, newMass) {
		this.x = newX;
		this.y = newY;
		this.centerX = (newX + newSize) - (newSize/2);
		this.centerY = (newY + newSize) - (newSize/2);
		this.color = getRandomColor();
		this.complement = getComplementaryColor(this.color);
		this.size = newSize;
		this.mass = newMass;
		this.name = generateName();
		
	}

	function generateName() {
		let nameGenerator = "";
		let nameIndex = parseInt(Math.random() * starNames.names.length);
		let greekIndex = parseInt(Math.random() * starNames.greek.length);
		let romanIndex = parseInt(Math.random() * starNames.roman.length);

		if(greekIndex != 0) {
			nameGenerator += starNames.greek[greekIndex];
			nameGenerator += " ";
		}

		nameGenerator += starNames.names[nameIndex];

		if(romanIndex != 0) {
			nameGenerator += "-";
			nameGenerator += starNames.roman[romanIndex];
		}

		console.log(nameGenerator);

		return nameGenerator;
	}

	function getRandomColor() {
		var letters = '0123456789ABCDEF';
		var color = '#';
		for(var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}

		//getComplementaryColor(color);
		return color;
	}

	function getComplementaryColor(color) {
		let temp = color
		temp = temp.substr(1);
		temp = '0x' + temp;
		let complement = 0xffffff ^ temp;
		complement = complement.toString(16);
		complement = "#" + complement;
		
		return complement;
	}

	Star.prototype.draw = function(ctx, xWorld, yWorld) {
		//Drawing star
		ctx.fillStyle = this.color;
		ctx.lineWidth = 3;
		ctx.strokeStyle = this.complement;
		ctx.beginPath()
		ctx.arc(this.centerX - xWorld, this.centerY - yWorld, this.size, 0, 2 * Math.PI, false);
		ctx.closePath()
		ctx.fill();
		ctx.stroke()

		//Nameplate above star
		ctx.font = "30px Gill Sans";
		ctx.strokeStyle = this.complement;
		ctx.lineWidth = 2;
		let metrics = ctx.measureText(this.name);
		ctx.strokeText(this.name, this.centerX - metrics.width/2, this.centerY - this.size - 10);
		this.fillStyle = this.color;
		ctx.fillText(this.name, this.centerX - metrics.width/2, this.centerY - this.size - 10);

	}

	Game.Star = Star;
})();

//Player Ship
(function() {
	function Ship(newX, newY, newSize, camera) {
		this.x = newX;
		this.y = newY;
		this.centerX = (newX + newSize) - (newSize/2);
		this.centerY = (newY + newSize) - (newSize/2);
		this.size = newSize;
		this.color = "white";
		this.velocityX = 0;
		this.velocityY = 0;
		this.accelerationX = 0;
		this.accelerationY = 0;
		this.currentForce = 0;
		this.largestForce = 0;
		this.target = null;
		this.mass = 5; 
		this.playerCamera = camera;
	}

	Ship.prototype.draw = function(ctx, xView, yView) {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.centerX - xView, this.centerY - yView, this.size, this.size);
	}

	Ship.prototype.update = function(dt, worldWidth, worldHeight) {
		if(this.centerX + this.size/2 > worldWidth)
			this.velocityX *= -1;

		if(this.centerX - this.size/2 < 0)
			this.velocityX *= -1;

		if(this.centerY + this.size + 2 > worldHeight)
			this.velocityY *= -1;

		if(this.centerY - this.size/2 < 0)
			this.velocityY *= -1;

		if(keyD == true)
			this.velocityX += 0.005;
	
		if(keyA == true) 
			this.velocityX -= 0.005;

		if(keyW == true) 
			this.velocityY -= 0.005;

		if(keyS == true) 
			this.velocityY += 0.005;

		//this.velocityX += this.accelerationX;
		//this.velocityY += this.accelerationY;
		
		this.centerX += this.velocityX * dt;
		this.centerY += this.velocityY * dt;
	}

	Game.Ship = Ship;
})();

//Particles
(function() {
	function Particle(newX, newY, newSize) {
		var tempX = Math.floor(Math.random() * 80);
		tempX *= Math.floor(Math.random() * 2) == 1 ? 1 : -1;
		tempX /= 1000;
		var tempY = Math.floor(Math.random() * 80);
		tempY *= Math.floor(Math.random() * 2) == 1 ? 1 : -1;
		tempY /= 1000;


		this.x = newX;
		this.y = newY;
		this.centerX = (newX + newSize) - (newSize/2);
		this.centerY = (newY + newSize) - (newSize/2);
		this.size = newSize;
		this.color = getRandomColor();
		this.velocityX = tempX;
		this.velocityY = tempY;
		this.accelerationX = 0;
		this.accelerationY = 0;
		this.largestForce = 0;
		this.currentForce = 0;
		this.distance = 0;
		this.target = null;
		this.mass = 5; 
	}

	function getRandomColor() {
		var letters = '0123456789ABCDEF';
		var color = '#';
		for(var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}


		return color;
	}

	Particle.prototype.draw = function(ctx, xView, yView) {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.centerX - xView, this.centerY - yView, this.size, this.size);
	}

	Particle.prototype.update = function(dt, worldWidth, worldHeight) {
		/*
		if(this.centerX + this.size/2 > worldWidth)
			this.velocityX *= -1;

		if(this.centerX - this.size/2 < 0)
			this.velocityX *= -1;

		if(this.centerY + this.size + 2 > worldHeight)
			this.velocityY *= -1;

		if(this.centerY - this.size/2 < 0)
			this.velocityY *= -1;
		*/

		//this.velocityX += this.accelerationX;
		//this.velocityY += this.accelerationY;
		
		this.centerX += this.velocityX * dt;
		this.centerY += this.velocityY * dt;
	}

	Game.Particle = Particle;
})();

/*----------------------------------------------------------------------Event Listeners----------------------------------------------------------------------*/
/*-----------------------------------------------------------------------------------------------------------------------------------------------------------*/
document.addEventListener("keydown", function(event) {
	var key = event.keyCode;

	switch(key) {
		case 87:
			keyW = true;
			break;
		case 83:
			keyS = true;
			break;
		case 65:
			keyA = true;
			break;
		case 68:
			keyD = true;
			break;
	}
});

document.addEventListener("keyup", function(event) {
	var key = event.keyCode;

	switch(key) {
		case 87:
			keyW = false;
			break;
		case 83:
			keyS = false;
			break;
		case 65:
			keyA = false;
			break;
		case 68:
			keyD = false;
			break;
	}
});

document.addEventListener('wheel', function(event) {
	if(event.deltaY >= 2) {
		zoomLevel -= 0.1
	}

	if(event.deltaY <= 2) {
		zoomLevel += 0.1;
	}
});