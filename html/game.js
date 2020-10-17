var Game = {};

Game.keyW = false;
Game.keyA = false;
Game.keyS = false;
Game.keyD = false;

Game.mouseX = 0;
Game.mouseY = 0;

//Circle class
(function() {
	function Circle(centerX, centerY, radius) {
		this.x = centerX;
		this.y = centerY;
		this.radius = radius;
	}

	//Updates position of the circle
	Circle.prototype.set = function(centerX, centerY) {
		this.x = centerX;
		this.y = centerY;
	}

	//Helper function to return distance between two circle centers
	Circle.prototype.getDistance = function(dx, dy) {
		return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
	}

	//Checks to see if two circles overlap
	Circle.prototype.overlaps = function(c) {
		let dx = c.x - this.x;
		let dy = c.y - this.y;
		let distance = this.getDistance(dx, dy);

		if(distance <= c.radius + this.radius) {
			return true;
		}else {
			return false;
		}

	}

	Game.Circle = Circle;
})();

//Rectangle Class
(function() {
	function Rect(left, top, width, height) {
		this.left = left || 0;
		this.top = top || 0;
		this.width = width || 0;
		this.height = height || 0;
		this.right = this.left + this.width;
		this.bottom = this.top + this.height;
		this.rotation = null;
		this.topRight = {x: this.right, y: this.top};
		this.topLeft = {x: this.left, y: this.top};
		this.bottomRight = {x: this.right, y: this.bottom};
		this.bottomLeft = {x: this.left, y: this.bottom}
		this.gunLeft = {x: this.left + 10, y: this.top};
		this.gunRight = {x: this.right - 10, y: this.top}
	}

	//Function updates calling rectangles position
	Rect.prototype.set = function(left, top, rotation) {
		this.left = left;
		this.top = top;
		this.right = (this.left + this.width);
		this.bottom = (this.top + this.height);

		if(rotation != null) {
			this.rotation = rotation;
			this.setCorners();
		}
	}

	//Finds position of corners after rotation.  Needed for SAT collision checking
	Rect.prototype.calculateCorners = function(coords, flag) {
		let x, y;

		switch(flag) {
			case "Top Left":
				x = this.left;
				y = this.top;
				break;

			case "Top Right":
				x = this.right;
				y = this.top;
				break;

			case "Bottom Left":
				x = this.left;
				y = this.bottom;
				break;

			case "Bottom Right":
				x = this.right;
				y = this.bottom;
				break;

			case "Gun Left":
				x = this.left + 10;
				y = this.top;
				break;

			case "Gun Right":
				x = this.right - 10;
				y = this.top;
				break;

			default:
				console.log("Error calculating corners");
				break;
		}

		let centerX = this.left + this.width/2;
		let centerY = this.top + this.height/2;

		//Rotation is around centerX
		let translateX = x - centerX;
		let translateY = y - centerY;

		let newCoordX = (translateX * Math.cos(this.rotation) - translateY * Math.sin(this.rotation));
		let newCoordY = (translateX * Math.sin(this.rotation) + translateY * Math.cos(this.rotation));

		x = newCoordX + centerX;
		y = newCoordY + centerY;

		coords.x = x;
		coords.y = y;
	}

	//Updates to all 4 corners.
	Rect.prototype.setCorners = function() {
		if(this.rotation) {
			this.calculateCorners(this.topLeft, "Top Left");
			this.calculateCorners(this.topRight, "Top Right");
			this.calculateCorners(this.bottomLeft, "Bottom Left");
			this.calculateCorners(this.bottomRight, "Bottom Right");
			this.calculateCorners(this.gunLeft, "Gun Left");
			this.calculateCorners(this.gunRight, "Gun Right")
		}
	}

	//Helper function for SAT, returns dot product
	Rect.prototype.dotProd = function(x0, y0, x1, y1) {
		return (x0 * x1 + y0 * y1);
	}
	//Helper function for SAT algorithm, returns projected x position on axis
	Rect.prototype.projectedX = function(position, axis, divisor) {
		return ((position.x * axis.x + position.y * axis.y)/divisor) * axis.x;
	}

	//Helper function for SAT algorithm, returns projected y position on axis
	Rect.prototype.projectedY = function(position, axis, divisor) {
		return ((position.x * axis.x + position.y * axis.y)/divisor) * axis.y;
	}

	//Algorithm to solve collisions of rotated rectangles
	Rect.prototype.rectangleCollisionSAT = function(r) {
		//Calculate the projected axes for both rectangles
		let rectA = this;
		let rectB = r;

		let coordsA = [rectA.topLeft, rectA.topRight, rectA.bottomRight, rectA.bottomLeft];
		let coordsB = [rectB.topLeft, rectB.topRight, rectB.bottomRight, rectB.bottomLeft];

		let axis1 = {x: rectA.topRight.x - rectA.topLeft.x, y: rectA.topRight.y - rectA.topLeft.y}
		let axis2 = {x: rectA.topRight.x - rectA.bottomRight.x, y: rectA.topRight.y - rectA.bottomRight.y}
		let axis3 = {x: rectB.topLeft.x - rectB.bottomLeft.x, y: rectB.topLeft.y - rectB.bottomLeft.y}
		let axis4 = {x: rectB.topLeft.x - rectB.topRight.x, y: rectB.topLeft.y - rectB.topRight.y}

		let axes = [axis1, axis2, axis3, axis4];
		let counter = 0;

		//Outer loop handles each axis
		for(iterator in axes) {
			let minA, maxA;
			let minB, maxB;

			//Inner loop handles rectangle corners
			for(i in coordsA) {
				//Calculate projected x and y values on the specific axis for both rectangles
				let projAX = this.projectedX(coordsA[i], axes[iterator], (Math.pow(axes[iterator].x, 2) + Math.pow(axes[iterator].y, 2)));
				let projAY = this.projectedY(coordsA[i], axes[iterator], (Math.pow(axes[iterator].x, 2) + Math.pow(axes[iterator].y, 2)));
				let projBX = this.projectedX(coordsB[i], axes[iterator], (Math.pow(axes[iterator].x, 2) + Math.pow(axes[iterator].y, 2)));
				let projBY = this.projectedY(coordsB[i], axes[iterator], (Math.pow(axes[iterator].x, 2) + Math.pow(axes[iterator].y, 2)));

				//Calculate scalar values of the A and B vector
				let dotProdA = this.dotProd(projAX, projAY, axes[iterator].x, axes[iterator].y);
				let dotProdB = this.dotProd(projBX, projBY, axes[iterator].x, axes[iterator].y);

				//Setting max and min scalars
				if(i == 0) {
					minA = dotProdA;
					maxA = dotProdA;
					minB = dotProdB;
					maxB = dotProdB;
				}else {
					if(dotProdA <= minA)
						minA = dotProdA;
					if(dotProdA >= maxA)
						maxA = dotProdA;
					if(dotProdB <= minB)
						minB = dotProdB;
					if(dotProdB >= maxB)
						maxB = dotProdB;
				}
			}

			//Specific axis has collision
			if(minB <= maxA && maxB >= minA)
				counter++;
		}

		//When all axes have collisions then the two rectangles overlap
		if(counter == 4) {
			return true;
		} else {
			return false;
		}
	}

	//Function checks if calling rectangle is within rectangle r
	Rect.prototype.within = function(r) {
		return(r.left <= this.left &&
			r.right >= this.right &&
			r.top <= this.top &&
			r.bottom >= this.bottom);
	}

	//Function checks if calling rectangle overlaps with rectangle r
	Rect.prototype.overlaps = function(r) {
		return(!(this.top >= r.bottom ||
				this.bottom <= r.top ||
				this.left >= r.right ||
				this.right <= r.left));
	}

	Game.Rect = Rect;
})();

//Camera
(function() {
	var AXIS = {NONE: "none", BOTH: "both"};

	function Camera(xView, yView, canvasWidth, canvasHeight, worldWidth, worldHeight) {
		this.xView = xView || 0;
		this.yView = yView || 0;
		this.xDeadZone = 0;
		this.yDeadZone = 0;
		this.wView = canvasWidth;
		this.hView = canvasHeight;
		this.followed = null;
		this.axis = AXIS.BOTH;
		this.viewPort = new Game.Rect(this.xView, this.yView, this.wView, this.hView);
		this.world = new Game.Rect(0, 0, worldWidth, worldHeight);
		this.scaleXValue = 0;
		this.scaleYValue = 0;
	}

	Camera.prototype.resize = function(newWidth, newHeight) {
		this.wView = newWidth;
		this.hView = newHeight;
		this.xDeadZone = newWidth/2;
		this.yDeadZone = newHeight/2;
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
					this.xView = this.followed.x - (this.wView - this.xDeadZone) + this.scaleXValue;
				else if(this.followed.x - this.xDeadZone < this.xView)
					this.xView = this.followed.x - this.xDeadZone + this.scaleXValue;

				if(this.followed.y - this.yView + this.yDeadZone > this.hView)
					this.yView = this.followed.y - (this.hView - this.yDeadZone) + this.scaleYValue;
				else if(this.followed.y - this.yDeadZone < this.yView)
					this.yView = this.followed.y - this.yDeadZone + this.scaleYValue;
			}
		}

		this.viewPort.set(this.xView, this.yView, null);

		if(!this.viewPort.within(this.world)) {
			if(this.viewPort.left < this.world.left)
        		this.xView = this.world.left + this.scaleXValue;
        	if(this.viewPort.top < this.world.top) 
          		this.yView = this.world.top + this.scaleYValue;
        	if(this.viewPort.right > this.world.right)
          		this.xView = this.world.right - this.wView + this.scaleXValue;
        	if(this.viewPort.bottom > this.world.bottom)
          		this.yView = this.world.bottom - this.hView + this.scaleYValue;

          	this.viewPort.set(this.xView, this.yView, null);
		}		
	}

	Game.Camera = Camera;
})();

/*-----------------------------------------------------------------Game World Housekeeping--------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------------------------------------------------*/

//Game World class
(function() {
	function World(width, height, backgroundSource, firstLayerSource, secondLayerSource, stars, planets, ships) {
		this.worldWidth = width;
		this.worldHeight = height;
		this.background = new Image();
		this.background.src = backgroundSource;
		this.firstLayer = new Image();
		this.firstLayer.src = firstLayerSource;
		this.secondLayer = new Image();
		this.secondLayer.src = secondLayerSource;
		this.gui = new Image();
		this.gui.src = "Assets/GUI/gui.png";
		this.minimap = new Image();
		this.minimap.src = "Assets/GUI/mapsprite.png";
		this.sweep = new Image();
		this.sweep.src = "Assets/GUI/sweepsprite.png";
		this.minimapsX = 0;
		this.minimapsY = 0;
		this.miniMapX = 1103;
		this.miniMapY = 535;
		this.xFrame = 0;
		this.ticks = 0;
		this.miniMapSeconds = 0;
		this.setPlay = false;
		this.stars = [];
		this.planets = [];
		this.ships = [];
		this.populate(stars, planets, ships);
	}

	//Handles initally populating the world from data sent from server
	World.prototype.populate = function(stars, planets, ships) {
		//Fill Stars
		for(iterator in stars) {
			let currentStar = stars[iterator];

			this.stars.push(new Game.Star(currentStar.x, currentStar.y, currentStar.sX, currentStar.sY,
				currentStar.starTextureSource, currentStar.glowTextureSource, currentStar.color));
		}

		//Fill Planets
		for(iterator in planets) {
			let currentPlanet = planets[iterator];

			this.planets.push(new Game.Planet(currentPlanet.x, currentPlanet.y, currentPlanet.sX, currentPlanet.sY,
				currentPlanet.rotation, currentPlanet.planetTextureSource, currentPlanet.shaderTextureSource, currentPlanet.glowTextureSource,
				currentPlanet.velocityX, currentPlanet.velocityY));
		}

		//Fill Ships
		for(iterator in ships) {
			let currentShip = ships[iterator];

			this.ships.push(new Game.EnemyShip(currentShip.x, currentShip.y, currentShip.rotation, currentShip.id));
		}
	}

	//Updates stars from server
	World.prototype.updateStars = function(stars, time) {
		let millis = (Date.now() - time);

		//console.log('Milliseconds elapsed after star packet: ' + millis);

		for(star in this.stars) {
			this.stars[star].sX = stars[star].sX;
			this.stars[star].sY = stars[star].sY;
			this.stars[star].x = stars[star].x;
			this.stars[star].y = stars[star].y;
		}
	}

	//Updates planets from the server
	World.prototype.updatePlanets = function(planets, time) {
		let millis = (Date.now() - time);

		//console.log('Milliseconds elapsed after planet packet: ' + millis);

		for(planet in this.planets) {
			this.planets[planet].x = planets[planet].x;
			this.planets[planet].y = planets[planet].y;
			this.planets[planet].sX = planets[planet].sX;
			this.planets[planet].sY = planets[planet].sY;
			this.planets[planet].rotation = planets[planet].rotation;
			this.planets[planet].velocityX = planets[planet].velocityX;
			this.planets[planet].velocityY = planets[planet].velocityY;
			this.planets[planet].planetBox.set(this.planets[planet].x - this.planets[planet].radius, this.planets[planet].y - this.planets[planet].radius, null);
		}
	}

	//Updates ships from the server
	World.prototype.updateShips = function(ships, time, playerShip) {
		let millis = (Date.now() - time);

		//console.log('Milliseconds elapsed after ship packet: ' + millis);

		for(ship in this.ships) {
			if(playerShip.id == ships[ship].id) {
				playerShip.x = ships[ship].x;
				playerShip.y = ships[ship].y;
				playerShip.velX = ships[ship].velX;
				playerShip.velY = ships[ship].velY;
				playerShip.centerX = playerShip.x + playerShip.width/2;
				playerShip.centerY = playerShip.y + playerShip.height/2;
				playerShip.rotation = ships[ship].rotation;
				playerShip.serverBullets = ships[ship].bullets;
				playerShip.hp = ships[ship].hp;
				playerShip.dt = ships[ship].dt;
			}else  {
				this.ships[ship].x = ships[ship].x;
				this.ships[ship].y = ships[ship].y;
				this.ships[ship].velX = ships[ship].velX;
				this.ships[ship].velY = ships[ship].velY;
				this.ships[ship].centerX = this.ships[ship].x + this.ships[ship].width/2;
				this.ships[ship].centerY = this.ships[ship].y + this.ships[ship].height/2;
				this.ships[ship].rotation = ships[ship].rotation;
				this.ships[ship].hp = ships[ship].hp;
			}

		}
	}

	World.prototype.updateDamage = function (id, timeStamp) {
		console.log("Time to receive damage: " + (Date.now() - timeStamp));
		for (ship in this.ships) {
			if(this.ships[ship].id == id)
				this.ships[ship].takeDamage(timeStamp);
		}
	}

	//Adds a new ship when a player connects
	World.prototype.addShip = function(newShip) {
		console.log(newShip);
		this.ships.push(new Game.EnemyShip(newShip.x, newShip.y, newShip.rotation, newShip.id));
	}

	//Removes a disconnecting player's ship
	World.prototype.removeShip = function(id) {
		for(iterator in this.ships){
			console.log("SHIP ID: " + this.ships[iterator].id + " VS ID: " + id);
			if(this.ships[iterator].id == id) {
				console.log("Ship found at index: " + iterator);
				this.ships.splice(iterator, 1);
			}
		}
	}

	World.prototype.drawMinimap = function(ctxGUI, viewPortX, viewPortY, canvasWidth, canvasHeight, playerShip, id) {
		ctxGUI.clearRect(0, 0, canvasWidth, canvasHeight);

		//Draw our two animations for the minimap.  Size of the map itself is 188*188
		ctxGUI.drawImage(this.minimap, 188 * this.xFrame, 0, this.minimap.width, this.minimap.height, 
			this.miniMapX, this.miniMapY, this.minimap.width, this.minimap.height);

		if(this.setPlay == true) {
			ctxGUI.drawImage(this.sweep, 188 * this.xFrame, 0, this.minimap.width, this.minimap.height, 
				this.miniMapX, this.miniMapY, this.minimap.width, this.minimap.height);
		}


		//Calculating ratios to translate to the 188*188 minimap
		let widthRatio = canvasWidth / this.worldWidth;
		let heightRatio = canvasHeight / this.worldHeight;

		let playerXRatio = (playerShip.x / this.worldWidth) * 186;
		let playerYRatio = (playerShip.y / this.worldHeight) * 186;

		let viewPortXRatio = (viewPortX / this.worldWidth) * 186;
		let viewPortYRatio = (viewPortY / this.worldHeight) * 186;

		let mapWidth = widthRatio * 186;
		let mapHeight = heightRatio * 186;

		//Draws the minimap viewport
		ctxGUI.beginPath();
		ctxGUI.lineWidth = "2";
		ctxGUI.strokeStyle = "red";
		ctxGUI.rect(this.miniMapX + viewPortXRatio - 1, this.miniMapY + viewPortYRatio - 1, mapWidth, mapHeight);
		ctxGUI.stroke();
	
		//Draws current positions of stars
		for(star in this.stars) {
			let starXRatio = ((this.stars[star].x + this.stars[star].radius) / this.worldWidth) * 186;
			let starYRatio = ((this.stars[star].y + this.stars[star].radius) / this.worldWidth) * 186;

			ctxGUI.fillStyle = "#FFFFFF";
			ctxGUI.fillRect(this.miniMapX + starXRatio - 3, this.miniMapY + starYRatio - 3, 6, 6);
		}

		//Draws current position of enemy ships on the minimap. skips over the current player's ship
		for(ship in this.ships) {
			if(this.ships[ship].id != id) {
				let enemyShipXRatio = ((this.ships[ship].x + this.ships[ship].width/2) / this.worldWidth) * 186;
				let enemyShipYRatio = ((this.ships[ship].y + this.ships[ship].height/2) / this.worldWidth) * 186;

				ctxGUI.fillStyle = "red";
				ctxGUI.fillRect(this.miniMapX + enemyShipXRatio - 2, this.miniMapY + enemyShipYRatio - 2, 4, 4)
			}
		}

		//Draws the player position on the minimap
		ctxGUI.fillStyle = "blue";
		ctxGUI.fillRect(this.miniMapX + playerXRatio - 2, this.miniMapY + playerYRatio - 2, 4, 4);

		//Draws the GUI HUD around the game space
		ctxGUI.drawImage(this.gui, 0, 0);
	}

	//Updating minimap sprites
	World.prototype.update = function(dt, id) {
		for(enemy in this.ships) {
			this.ships[enemy].Update(dt, this.enemyShips);
		}


		this.ticks += dt;

		while(this.ticks >= 13) {
			this.ticks -= 13;
			this.xFrame++;

			if(this.xFrame > 59) {
				this.xFrame = 0;
				this.miniMapSeconds++;
				if(this.miniMapSeconds == 3)
					this.setPlay = true;
				else if(this.miniMapSeconds == 4) {
					this.miniMapSeconds = 0;
					this.setPlay = false;
				}
			}
		}
	}

	//Handles drawing of background and calling draw function on elements within the world
	World.prototype.draw = function(ctx, viewPort, viewPortX, viewPortY, canvasWidth, canvasHeight, playerCamera, id, playerShip, ctxGUI, gui) {
		//Parallax for background images
		ctx.drawImage(this.background, viewPortX/8, viewPortY/8, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight);
		ctx.drawImage(this.firstLayer, viewPortX/6, viewPortY/6, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight);
		ctx.drawImage(this.secondLayer, viewPortX/4, viewPortY/4, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight);

		for(star in this.stars) {
			this.stars[star].draw(ctx, viewPort, viewPortX, viewPortY);
		}

		for(planet in this.planets) {
			this.planets[planet].draw(ctx, viewPort, viewPortX, viewPortY, playerShip);
		}

		for(ship in this.ships) {
			this.ships[ship].draw(ctx, viewPort, viewPortX, viewPortY, id);
		}

		this.drawMinimap(ctxGUI, viewPortX, viewPortY, gui.width, gui.height, playerShip, id);
	}

	Game.World = World;
})();

/*----------------------------------------------------------------Player ELements-----------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------------------------------------------------*/

//EnemyShip
(function() {
	function EnemyShip(x, y, rotation, id) {
		this.x = x;
		this.y = y;
		this.width = 42;
		this.height = 48;
		this.centerX = this.x + this.width/2;
		this.centerY = this.y + this.height/2
		this.rotation = rotation;
		this.velX = 0;
		this.velY = 0;
		this.id = id;
		this.shipTexture = new Image();
		this.shipTexture.src = "Assets/Ships/default_1.png";
		this.hp = 100;
		this.healthBar = new Game.Rect(this.x - 30, this.y - 20, 60, 10);
		this.healthColor = "green";
		this.healthBarFirstLayer = new Image();
		this.healthBarFirstLayer.src = "Assets/Ships/healthBarFirstLayer.png";
		this.healthBarSecondLayer = new Image();
		this.healthBarSecondLayer.src = "Assets/Ships/healthBarSecondLayer.png";
		this.enemyHitBox = new Game.Rect(this.x + this.width/2, this.y + this.height/2, this.width, this.height);
		this.circularDetection = new Game.Circle(this.x, this.y, this.height);
		this.hit = false;
	}

	//Draw the healthbar of the current player (x0, y0): top left, (x1, y1) bottom right
	EnemyShip.prototype.drawHealthBar = function (ctx, x0, y0, x1, y1, r) {
		ctx.drawImage(this.healthBarSecondLayer, x0 - 2, y0 - 2);

		var w = x1 - x0;
		var h = y1 - y0;
		if (r > w/2) r = w/2;
		if (r > h/2) r = h/2;
		ctx.beginPath();
		ctx.moveTo(x1 - r, y0);
		ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
		ctx.lineTo(x1, y1-r);
		ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
		ctx.lineTo(x0 + r, y1);
		ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
		ctx.lineTo(x0, y0 + r);
		ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
		ctx.closePath();
		ctx.fillStyle = this.healthColor;
		ctx.fill();

		ctx.drawImage(this.healthBarFirstLayer, x0 - 2, y0 - 2);
	}

	//Helper function to update the healthbar color and width when damage is taken
	EnemyShip.prototype.healthBarUpdate = function() {
		let r = this.hp<50 ? 255 : Math.floor(255-(this.hp*2-100)*255/100);
		let g = this.hp>50 ? 255 : Math.floor((this.hp*2)*255/100);
		this.healthBar.width = 60 * (this.hp/100);
		this.healthColor = 'rgb('+r+','+g+',0)';
	}

	EnemyShip.prototype.takeDamage = function(timeStamp) {
		console.log(Date.now() - timeStamp);
		this.hp -= 5;
		this.healthBarUpdate();
	}

	EnemyShip.prototype.Update = function(dt) {
		this.enemyHitBox.set(this.x, this.y, this.rotation);
		this.healthBar.set(this.centerX, this.centerY - this.height - 10, null);
		this.circularDetection.set(this.centerX, this.centerY);
		this.healthBarUpdate();
	}

	//Main draw call on the enemy ship
	EnemyShip.prototype.draw = function(ctx, viewPort, viewPortX, viewPortY, id) {

		if(id != this.id) {
			let x = this.centerX - viewPortX;
			let y = this.centerY - viewPortY;

			ctx.setTransform(1, 0, 0, 1, x, y)
	    	ctx.rotate(this.rotation);
	    	ctx.fillStyle = 'blue';
	    	ctx.fillRect(-(this.enemyHitBox.width/2), -(this.enemyHitBox.height/2), this.enemyHitBox.width, this.enemyHitBox.height);
			ctx.drawImage(this.shipTexture, -(this.width/2), -(this.height/2));
			ctx.setTransform(1, 0, 0, 1, 0, 0);

			ctx.fillStyle = 'red';
			let temp = this.enemyHitBox;
			ctx.fillRect(temp.topLeft.x - 3 - viewPortX, temp.topLeft.y - 3 - viewPortY, 6, 6);
			ctx.fillRect(temp.topRight.x - 3 - viewPortX, temp.topRight.y - 3 - viewPortY, 6, 6)
			ctx.fillRect(temp.bottomLeft.x - 3 - viewPortX, temp.bottomLeft.y - 3 - viewPortY, 6, 6)
			ctx.fillRect(temp.bottomRight.x - 3 - viewPortX, temp.bottomRight.y - 3 - viewPortY, 6, 6)

			ctx.strokeStyle = 'green';
			let circ = this.circularDetection;
			ctx.beginPath();
			ctx.arc(circ.x - viewPortX, circ.y - viewPortY, circ.radius, 0, 2 * Math.PI);
			ctx.stroke();

			this.drawHealthBar(ctx, x - 30, this.healthBar.top - playerCamera.yView, 
				x - 30 + this.healthBar.width, this.healthBar.bottom - playerCamera.yView, 5);		

		}

	}

	Game.EnemyShip = EnemyShip;
})();

//Player Ship
(function() {
	function Ship(newX, newY, canvasWidth, canvasHeight, worldWidth, worldHeight) {
		this.x = newX;
		this.y = newY;
		this.width = 42;
		this.height = 48;
		this.centerX = this.x + this.width/2;
		this.centerY = this.y + this.height/2;
		this.velX = 0;
		this.velY = 0;
		this.rotation = 0;
		this.id = null;
		this.hp = 100;
		this.healthBar = new Game.Rect(this.x - 30, this.y - 20, 60, 10);
		this.healthColor = "green";
		this.healthBarFirstLayer = new Image();
		this.healthBarFirstLayer.src = "Assets/Ships/healthBarFirstLayer.png";
		this.healthBarSecondLayer = new Image();
		this.healthBarSecondLayer.src = "Assets/Ships/healthBarSecondLayer.png";
		this.shipTexture = new Image();
		this.shipTexture.src = "Assets/Ships/ship_1_spritesheet.png";
		this.shipBox = new Game.Rect(this.x, this.y, this.width, this.height);
		this.sX = 0;
		this.sY = 0;
		this.circularDetection = new Game.Circle(this.centerX, this.centerY, this.height);
		this.ticks = 0;
		this.dt = 0;
		this.bullets = [];
		this.serverBullets = [];
		this.state = {keyW: false, keyA: false, keyS: false, keyD: false, shooting: false};
	}

	//Helper function to update the healthbar color and width when damage is taken
	Ship.prototype.healthBarUpdate = function() {
		let r = this.hp<50 ? 255 : Math.floor(255-(this.hp*2-100)*255/100);
		let g = this.hp>50 ? 255 : Math.floor((this.hp*2)*255/100);
		this.healthBar.width = 60 * (this.hp/100);
		this.healthColor = 'rgb('+r+','+g+',0)';
	}

	//Draw the healthbar of the current player
	Ship.prototype.drawHealthBar = function (ctx, x0, y0, x1, y1, r) {
		ctx.drawImage(this.healthBarSecondLayer, x0 - 2, y0 - 2);

		var w = x1 - x0;
		var h = y1 - y0;
		if (r > w/2) r = w/2;
		if (r > h/2) r = h/2;
		ctx.beginPath();
		ctx.moveTo(x1 - r, y0);
		ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
		ctx.lineTo(x1, y1-r);
		ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
		ctx.lineTo(x0 + r, y1);
		ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
		ctx.lineTo(x0, y0 + r);
		ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
		ctx.closePath();
		ctx.fillStyle = this.healthColor;
		ctx.fill();

		ctx.drawImage(this.healthBarFirstLayer, x0 - 2, y0 - 2);
	}

	Ship.prototype.takeDamage = function() {
		this.hp -= 5;
		this.healthBarUpdate();
	}

	Ship.prototype.generateProjectile = function(direction) {
		switch(direction) {
			case "Left":
				x = this.shipBox.gunLeft.x + 10;
				y = this.shipBox.gunLeft.y;
				break;
			case "Right":
				x = this.shipBox.gunRight.x - 10;
				y = this.shipBox.gunRight.y;
				break;
		}

		this.bullets.push(new Game.Projectile(this.id, this));
	}

	Ship.prototype.shootingHandler = function() {
		//Ship spritesheet animation
		if(this.state.shooting) {
			this.ticks += this.dt;
			if(this.ticks >= 0.2) {
				this.ticks -= 0.2;

				console.log("new bullet");

				if(this.sX == 0) {
					playerShip.generateProjectile("Left");
				}else if(this.sX == 336) {
					playerShip.generateProjectile("Right");
				}
				
				this.sX += this.width;

				if(this.sX >= 630)
					this.sX = 0;
			}
		} else {
			//finish gun animation
			if(this.sX == 0) {
				this.sX = 0;
			}else if(this.sX == 336) {
				this.sX = 336;
			}else {
				this.ticks += dt;

				if(this.ticks >= 0.2) {
					this.ticks -= 0.2;

					this.sX += this.width;

					if(this.sX >= 630)
						this.sX = 0;
				}
			}
		}
	}

	Ship.prototype.update = function(dt, worldWidth, worldHeight, playerCamera, enemyShips) {
		this.shootingHandler();

		if(this.hp <= 0)
			this.hp = 100;

		//for(enemy in enemyShips) {
		//	if(this.id != enemyShips[enemy].id) {
		//		this.shipBox.rectangleCollisionSAT(enemyShips[enemy].enemyHitBox);
		//	}
		//}
		
		let x = this.centerX - playerCamera.xView;
		let y = this.centerY - playerCamera.yView;

		this.rotation = Math.atan2(Game.mouseY - y, Game.mouseX - x) + Math.PI/2
	
		this.healthBarUpdate();

		for(bullet in this.bullets) {
			if(!this.bullets[bullet].alive){
				this.bullets.splice(bullet, 1)
				console.log("Dead");
			}
			else{
				this.bullets[bullet].update(this.dt, enemyShips);
			}
		}

		//Set ship hitbox and update rotation corners
		this.shipBox.set(this.x, this.y, this.rotation);
		this.healthBar.set(this.centerX, this.centerY - this.height - 10, null);
		this.circularDetection.set(this.centerX, this.centerY);
	}

	Ship.prototype.drawHitbox = function(ctx, playerCamera, x, y) {
		ctx.setTransform(1, 0, 0, 1, x, y)
		ctx.rotate(this.rotation);
		ctx.fillStyle = 'blue';
		ctx.fillRect(-(this.shipBox.width/2), -(this.shipBox.height/2), this.shipBox.width, this.shipBox.height);
		ctx.setTransform(1, 0, 0, 1, 0, 0);


		ctx.fillStyle = 'red';
		let temp = this.shipBox;
		ctx.fillRect(temp.topLeft.x - 3 - playerCamera.xView, temp.topLeft.y - 3 - playerCamera.yView, 6, 6);
		ctx.fillRect(temp.topRight.x - 3 - playerCamera.xView, temp.topRight.y - 3 - playerCamera.yView, 6, 6)
		ctx.fillRect(temp.bottomLeft.x - 3 - playerCamera.xView, temp.bottomLeft.y - 3 - playerCamera.yView, 6, 6)
		ctx.fillRect(temp.bottomRight.x - 3 - playerCamera.xView, temp.bottomRight.y - 3 - playerCamera.yView, 6, 6)

		ctx.strokeStyle = 'green';
		let circ = this.circularDetection;
		ctx.beginPath();
		ctx.arc(circ.x - playerCamera.xView, circ.y - playerCamera.yView, circ.radius, 0, 2 * Math.PI);
		ctx.stroke();
	}

	Ship.prototype.draw = function(ctx, playerCamera, scaleX, scaleY) {
		let x = this.centerX - playerCamera.xView;
		let y = this.centerY - playerCamera.yView;

		for(bullet in this.bullets) {
			if(this.bullets[bullet].alive)
				this.bullets[bullet].draw(ctx, playerCamera);
		}

		//Set rotation towards the user's cursor
		ctx.setTransform(1, 0, 0, 1, x, y)
		ctx.rotate(this.rotation);

		ctx.scale(scaleX, scaleY);
		ctx.drawImage(this.shipTexture, this.sX, this.sY, this.width, this.height, -(this.width/2), -(this.height/2), this.width, this.height);
		ctx.setTransform(1, 0, 0, 1, 0, 0);

		this.drawHealthBar(ctx, x - 30, this.healthBar.top - playerCamera.yView, 
			x - 30 + this.healthBar.width, this.healthBar.bottom - playerCamera.yView, 5);		


		//Draws hitboxes for testing
		this.drawHitbox(ctx, playerCamera, x, y);
	}


	Game.Ship = Ship;
})();

(function() {
	function Projectile(id, playerShip) {
		this.projectileTexture = new Image();
		this.projectileTexture.src = "Assets/Ships/projectile_1.png";
		this.rotation = playerShip.rotation;
		this.alive = true;
		this.width = 2;
		this.height = 12;
		this.velX = playerShip.velX + 300 * Math.cos(this.rotation - Math.PI/2);
		this.velY = playerShip.velY + 300 * Math.sin(this.rotation - Math.PI/2);
		this.x = playerShip.centerX;
		this.y = playerShip.centerY;
		this.ticks = 0;
		this.id = id;
		this.projectileHitBox = new Game.Rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
		this.circularDetection = new Game.Circle(this.x, this.y, this.height);
	}

	Projectile.prototype.update = function(dt, ships) {
		this.x += this.velX * dt;
		this.y += this.velY * dt;

		this.ticks += dt;

		if(this.ticks >= 4)
			this.alive = false;

		for(ship in ships) {
			if(this.id != ships[ship].id) {
				if(this.circularDetection.overlaps(ships[ship].circularDetection)) {
					if(this.projectileHitBox.rectangleCollisionSAT(ships[ship].enemyHitBox)) {
						this.alive = false;
					}
				}
			}
		}

		this.projectileHitBox.set(this.x - this.width/2, this.y - this.height/2, this.rotation);
		this.circularDetection.set(this.x, this.y)
	}

	Projectile.prototype.drawHitbox = function(ctx, playerCamera, x ,y) {
		ctx.setTransform(1, 0, 0, 1, x, y)
		ctx.fillStyle = 'blue';
		ctx.rotate(this.rotation);
		ctx.fillRect(-(this.width/2), -(this.height/2), this.width, this.height);
		ctx.setTransform(1, 0, 0, 1, 0, 0);	

		ctx.strokeStyle = 'green';
		let circ = this.circularDetection;
		ctx.beginPath();
		ctx.arc(circ.x - playerCamera.xView, circ.y - playerCamera.yView, circ.radius, 0, 2 * Math.PI);
		ctx.stroke();
	}

	Projectile.prototype.draw = function(ctx, playerCamera) {
		let x = this.x - playerCamera.xView;
		let y = this.y - playerCamera.yView;

		ctx.setTransform(1, 0, 0, 1, x, y)
		ctx.rotate(this.rotation);
		ctx.drawImage(this.projectileTexture, -(this.width/2), -(this.height/2));
		ctx.setTransform(1, 0, 0, 1, 0, 0);	

		this.drawHitbox(ctx, playerCamera, x, y);
	}

	Game.Projectile = Projectile;
})();

/*---------------------------------------------------------------World Elements-------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------------------------------------------------*/

//Class for planet
(function () {
	function Planet(x, y, sX, sY, rotation, planetTextureSource, shaderTextureSource, glowTextureSource, velX, velY) {
		this.x = x;
		this.y = y;
		this.sX = sX;
		this.sY = sY;
		this.textureWidth = 64;
		this.textureHeight = 32;
		this.velocityX = velX;
		this.velocityY = velY;
		this.mass = 100;
		this.radius = this.textureHeight / 2;
		this.planetTexture = new Image();
		this.planetTexture.src = planetTextureSource;
		this.shaderTexture = new Image();
		this.shaderTexture.src = shaderTextureSource;
		this.glowTexture = new Image();
		this.glowTexture.src = glowTextureSource;
		this.textureOffset = 7;
		this.rotation = rotation;
		this.planetBox = new Game.Rect(this.x - this.radius, this.y - this.radius, this.textureHeight, this.textureHeight);
	}

	//Main draw call for the planet object
	Planet.prototype.draw = function(ctx, viewPort, viewPortX, viewPortY, playerShip) {

		//Only call the planet draws if they are within the viewport of the player
		if(this.planetBox.overlaps(viewPort)) {
			ctx.save();
		    ctx.beginPath();
		    ctx.arc(this.x - viewPortX, this.y - viewPortY, this.radius, 0, Math.PI * 2, true);
		    ctx.closePath();
		    ctx.clip();

		    //Draws planet texture
			ctx.drawImage(this.planetTexture, this.sX, this.sY, this.textureHeight, this.textureHeight, 
				(this.x - this.radius) - viewPortX, (this.y - this.radius) - viewPortY, this.textureHeight, this.textureHeight);
			
			//Draw a second image to mimic seemless animation.  Reduce x, y coordinates in world space to do so
			if(this.sX >= this.textureWidth/2) {
				ctx.drawImage(this.planetTexture, 0, this.sY, this.textureHeight, this.textureHeight, 
					(this.x - this.radius) + (this.textureWidth - this.sX) - viewPortX, (this.y - this.radius) - viewPortY, 
					this.textureHeight, this.textureHeight);
			}
	   
			ctx.beginPath();
		    ctx.arc(0 - viewPortX, 0 - viewPortY, this.textureHeight/2, 0, Math.PI * 2, true);
		    ctx.clip();
		    ctx.closePath();
		    ctx.restore();

		    //Planet shader overlay.  Accounts for angle towards it's star
		    ctx.save();
			ctx.translate((this.x) - viewPortX, (this.y) - viewPortY);
    		ctx.rotate(this.rotation);
    		ctx.translate(-(this.x) + viewPortX, -(this.y) + viewPortY);
			ctx.drawImage(this.shaderTexture, this.x - this.textureOffset - viewPortX - this.radius, this.y - this.textureOffset - viewPortY - this.radius,
				this.shaderTexture.width, this.shaderTexture.height);
			ctx.restore();

			//Glow overlay
			ctx.drawImage(this.glowTexture, this.x - this.textureOffset - viewPortX - this.radius, this.y - this.textureOffset - viewPortY - this.radius,
				this.shaderTexture.width, this.shaderTexture.height);
		}
	}

	Game.Planet = Planet;
})();

//Star class
(function () {
	function Star(x, y, sX, sY, starTextureSource, glowTextureSource, color) {
		this.x = x;
		this.y = y;
		this.sX = sX;
		this.sY = sY;
		this.textureWidth = 256;
		this.textureHeight = 128;
		this.mass = 1000;
		this.scale = 2;
		this.radius = this.textureHeight/2;
		this.color = color
		this.starTexture = new Image();
		this.starTexture.src = starTextureSource;
		this.glowTexture = new Image();
		this.glowTexture.src = glowTextureSource;
		this.textureOffset = 53;
		this.starBox = new Game.Rect(this.x - this.radius, this.y - this.radius, this.textureHeight, this.textureHeight);
	}

	Star.prototype.update = function(dt) {
		//Update the clip for the source texture of the star
		this.sX += 0.25;
		if(this.sX > this.textureWidth)
			this.sX = 0;
	}

	//Main draw call for star element
	Star.prototype.draw = function(ctx, viewPort, viewPortX, viewPortY) {
		//Only call the star draws if they are within the viewport of the player
		if(this.starBox.overlaps(viewPort)) {

			//Draw circle in which in which to show a star
			ctx.save();
		    ctx.beginPath();
		    ctx.arc(this.x - viewPortX, this.y - viewPortY, this.radius, 0, Math.PI * 2, true);
		    ctx.closePath();
		    ctx.clip();
			
		    //Draws star texture
			ctx.drawImage(this.starTexture, this.sX, this.sY, this.textureHeight, this.textureHeight, 
				(this.x - this.radius) - viewPortX, (this.y - this.radius) - viewPortY, this.textureHeight, this.textureHeight);
			
			//Draw a second image to mimic seemless animation.  Reduce x, y coordinates in world space to do so
			if(this.sX >= this.textureWidth/2) {
				ctx.drawImage(this.starTexture, 0, this.sY, this.textureHeight, this.textureHeight, 
					(this.x - this.radius) + (this.textureWidth - this.sX) - viewPortX, (this.y - this.radius) - viewPortY, 
					this.textureHeight, this.textureHeight);
			}
	   
			ctx.beginPath();
		    ctx.arc(0 - viewPortX, 0 - viewPortY, this.textureHeight/2, 0, Math.PI * 2, true);
		    ctx.clip();
		    ctx.closePath();
		    ctx.restore();
			
			//Glow overlay
			ctx.drawImage(this.glowTexture, this.starBox.left - this.textureOffset/this.scale - viewPortX, this.starBox.top - this.textureOffset/this.scale - viewPortY,
				this.glowTexture.width, this.glowTexture.height);
		}
	}

	Game.Star = Star;
})();