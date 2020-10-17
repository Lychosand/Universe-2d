var Server = {};

var colorList = ["orange", "yellow", "blue", "red", "green", "white"];

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

	Server.Circle = Circle;
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

	Server.Rect = Rect;
})();


//Game World.  This top level object will contain the total state of the world.
//A copy will be made on the server side that will receive updated values
(function() {
	function World(width, height, clients) {
		this.worldWidth  	   = width;
		this.worldHeight       = height;
		this.backgroundSource  = "Assets/Background/background.png";
		this.firstLayerSource  = "Assets/Background/2nd_layer.png";
		this.secondLayerSource = "Assets/Background/3rd_layer.png";
		this.stars = [];
		this.starPackets = [];
		this.planets = [];
		this.planetPackets = [];
		this.ships = [];
		this.shipPackets = [];
		this.populate();
		this.clients = clients;
	}

	//Handles initally populating the world
	World.prototype.populate = function() {
		//Fill Stars
		for(var i = 0; i < 4; ++i) {
			let newX, newY;
			
			switch(i) {
				case 0:
					newX = this.worldWidth/4;
					newY = this.worldHeight/4;
					break;
				case 1:
					newX = this.worldWidth/2 + this.worldWidth/4;
					newY = this.worldHeight/4;
					break;
				case 2:
					newX = this.worldWidth/4;
					newY = this.worldHeight/2 + this.worldHeight/4;
					break;
				case 3:
					newX = this.worldWidth/2 + this.worldWidth/4;
					newY = this.worldHeight/2 + this.worldHeight/4;
					break;
			}
			
			let newStar = 
			{
				x: newX,
				y: newY
			}

			this.starPackets.push(newStar);
			this.stars.push(new Server.Star(newX, newY));
		}

		//Fill planets
		let incrementStar = 0;
		//20
		for(var i = 1; i < 21; i++) {
			let targetStar = this.stars[incrementStar];
			let xMax = targetStar.x + 700;
			let xMin = targetStar.x - 700;
			let yMax = targetStar.y + 700;
			let yMin = targetStar.y - 700;

			let randX = this.randomInt(xMin, xMax);
			let randY = this.randomInt(yMin, yMax);

			if(randX > targetStar.x - 150 && randX < targetStar.x + 150 && randY > targetStar.y - 150 && randY < targetStar.y + 150){
				i--;
			} else {
				if(i % 5 == 0)
					incrementStar++;

				let newPlanet = 
				{
					x: randX,
					y: randY,
				}

				this.planetPackets.push(newPlanet);
				this.planets.push(new Server.Planet(randX, randY, "Assets/Planets/default_planet.png", targetStar));			
			}			
		}
	}

	//Function returns random in between range
	World.prototype.randomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	World.prototype.spawnProjectile = function(id, timeStamp) {
		//console.log(Date.now() - timeStamp);
		for(ship in this.ships) {
			if(this.ships[ship].id == id) {
				this.ships[ship].generateProjectile(this.ships[ship]);
			}
		}
	}

	World.prototype.sendDamage = function(id) {
		for(client in this.clients) {
			this.clients[client].flagDamage(id);
		}
	}

	World.prototype.addShip = function(ship, id) {
		let newShip = {};
		newShip.id = id;
		newShip.x = ship.x;
		newShip.y = ship.y;
		newShip.rotation = ship.rotation;
		newShip.velX = ship.velX;
		newShip.velY = ship.velY;
		this.shipPackets.push(newShip);
		this.ships.push(new Server.Ship(ship.x, ship.y, ship.rotation, id));
	}

	World.prototype.updateShip = function(playerShip) {
		for(ship in this.ships) {
			if(this.ships[ship].id == playerShip.id) {
				this.ships[ship].rotation = playerShip.rotation;
				this.ships[ship].state = playerShip.state;
				this.ships[ship].sX = playerShip.sX;
			} 
		}
	}

	//Updates all of the elements within our world
	World.prototype.update = function(dt, clients) {
		this.clients = clients;

		for(star in this.stars) {
			this.stars[star].update(dt, this.starPackets[star]);
		}

		for(planet in this.planets) {
			this.planets[planet].update(dt, this.planetPackets[planet]);
		}

		for(ship in this.ships) {
			this.ships[ship].update(dt, this.shipPackets[ship], this.worldWidth, this.worldHeight, this.ships, this);
		}
	}

	Server.World = World;
})();

//Stores data on the ships within the server
(function() {
	function Ship(x, y, rotation, id) {
		this.x = x;
		this.y = y;
		this.width = 42;
		this.height = 48;
		this.sx = 0;
		this.centerX = this.x + this.width/2;
		this.centerY = this.y + this.height/2;
		this.velX = 0;
		this.velY = 0;
		this.accelX = 0;
		this.accelY = 0;
		this.rotation = 0;
		this.id = id;
		this.hp = 100;
		this.attackSpeedAccumulator = 0;
		this.bullets = [];
		this.state = {keyW: false, keyA: false, keyS: false, keyD: false, shooting: false};
		this.shipBox = new Server.Rect(this.x, this.y, this.width, this.height);
		this.circularDetection = new Server.Circle(this.centerX, this.centerY, this.height);
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

		this.bullets.push(new Server.Projectile(this.id, this));
	}

	Ship.prototype.shootingHandler = function(dt) {
		//Ship spritesheet animation
		if(this.state.shooting) {
			this.ticks += dt;

			if(this.ticks >= 0.2) {
				this.ticks -= 0.2;

				console.log("New bullet");

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

	Ship.prototype.update = function(dt, packet, worldWidth, worldHeight, enemyShips, world) {

		//Incrementing the speed of the player
		if(this.state.keyD == true && this.accelX < 300){
			this.accelX += 5;		}
	
		if(this.state.keyA == true && this.accelX > -300) 
			this.accelX -= 5;

		if(this.state.keyW == true && this.accelY > -300) 
			this.accelY -= 5;

		if(this.state.keyS == true && this.accelY < 300) 
			this.accelY += 5;
		
		if(this.state.keyA == false && this.state.keyD == false)
			this.velX *= 0.98;

		if(this.state.keyW == false && this.state.keyS == false)
			this.velY *= 0.98;

		if(this.centerX + this.width/2 > worldWidth){
			this.x = worldWidth - this.width;
			this.state.keyD = false; 
			this.velX *= -0.7;
		}

		if(this.centerX - this.width/2 < 0){
			this.x = 0;
			this.state.keyA = false;
			this.velX *= -0.7;
		}

		if(this.centerY + this.height/2 > worldHeight){
			this.y = worldHeight - this.height;
			this.state.keyS = false;
			this.velY *= -0.7;
		}

		if(this.centerY - this.height/2 < 0){
			this.y = 0;
			this.state.keyW = false;
			this.velY *= -0.7;
		}

		this.velX = this.accelX * dt;
		this.velY = this.accelY * dt;
		this.x += this.velX;
		this.y += this.velY;
		this.centerX = this.x + this.width/2;
		this.centerY = this.y + this.height/2;

		for(bullet in this.bullets) {
			if(!this.bullets[bullet].alive){
				this.bullets.splice(bullet, 1);
				console.log("dead");
			}
			else
				this.bullets[bullet].update(dt, enemyShips, world)
		}

		this.shipBox.set(this.x, this.y, this.rotation);
		this.circularDetection.set(this.centerX, this.centerY);

		packet.x = this.x;
		packet.y = this.y;
		packet.velX = this.velX;
		packet.velY = this.velY;
		packet.rotation = this.rotation;
		packet.bullets = this.bullets;
		packet.hp = this.hp;
		packet.dt = dt;
	}

	Server.Ship = Ship;
})();

//
(function() {
	function Projectile(id, playerShip) { //centerX, centerY, angle, velX, velY, id) {
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
		this.projectileHitBox = new Server.Rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
		this.circularDetection = new Server.Circle(this.x, this.y, this.height);
	}

	Projectile.prototype.update = function(dt, ships, world) {
		this.ticks += dt;

		//Lifespan of the bullet
		if(this.ticks >= 2) {
			this.alive = false;
		}

		//Collision detection to see if projectile hits one of the enemy ships
		//Check first if detection circles overlap to save on computation
		for(ship in ships) {
			if(this.id != ships[ship].id) {
				if(this.circularDetection.overlaps(ships[ship].circularDetection)) {
					if(this.projectileHitBox.rectangleCollisionSAT(ships[ship].shipBox)) {
						//console.log("collisions detected");
						world.sendDamage(ships[ship].id);
						ships[ship].hp -= 5;
						this.alive = false;
					}
				}
			}
		}

		this.x += this.velX * dt;
		this.y += this.velY * dt;
		this.projectileHitBox.set(this.x - this.width/2, this.y - this.height/2, this.rotation);
		this.circularDetection.set(this.x, this.y)
	}

	Server.Projectile = Projectile;
})();


//Class for planet
(function () {
	function Planet(x, y, texture, star) {
		this.x = x;
		this.y = y;
		this.initX = x;
		this.initY = y;
		this.sX = Math.floor(Math.random() * 517);
		this.sY = 0;
		this.velocityX = 0;
		this.velocityY = 0;
		this.accelerationX = 0;
		this.accelerationY = 0;
		this.textureWidth = 64;
		this.textureHeight = 32;
		this.mass = 100;
		this.radius = this.textureHeight / 2;
		this.planetTextureSource = texture;
		this.shaderTextureSource = "Assets/Planets/grayscale.png";
		this.glowTextureSource = "Assets/Glows/blue_glow.png";
		this.textureOffset = 7;
		this.rotation = 0;
		this.targetStar = star;
		this.planetBox = new Server.Rect(this.x - this.radius, this.y - this.radius, this.textureHeight, this.textureHeight);
		this.magnitude = Math.sqrt(Math.abs(Math.pow(this.targetStar.x - this.x, 2) + Math.pow(this.targetStar.y - this.y, 2)));
		this.visViva();
	}

	//v^2 = GM (2/magnitude - 1/a): where a is the semi-major axis of the orbit
	//When a = magnitude, orbit will be circular
	//Calculates appropriate velocities to maintain an orbit.  Randomized elliptical path
	Planet.prototype.visViva = function() {
		let angle = Math.atan2((this.targetStar.y) - (this.y), (this.targetStar.x) - (this.x)) + Math.PI/2;

		//Set eccentricity within a range. Lower bounds ensures planet does not intersect the star
		let max = this.magnitude + (this.magnitude / 100 + 1) * 50;
		let min = (this.magnitude / 100 + 1) * 50;

		let randomSemiMajor = Math.floor(Math.random() * (max - min + 1) + min);

		if(randomSemiMajor == 0) {
			this.visViva();
			return;
		}

		//Vis-visa equation
		let velocity = Math.sqrt((0.01 * this.targetStar.mass * this.mass) * (2/this.magnitude - 1/(randomSemiMajor)));
		
		//Find appropriate x and y velocities
		let vx = velocity * Math.cos(angle);
		let vy = velocity * Math.sin(angle);

		this.velocityX = vx;
		this.velocityY = vy;
	}

	Planet.prototype.achieveOrbit = function(dt) {
		let dx = this.targetStar.x - this.x;
		let dy = this.targetStar.y - this.y;

		let magnitude = Math.sqrt(Math.abs(dx * dx + dy * dy));

		this.magnitude = magnitude;

		let normalX = dx / magnitude;
		let normalY = dy / magnitude;

		f = (0.01 * this.targetStar.mass * this.mass * magnitude) / Math.pow(magnitude, 3);

		let accelX = normalX * f;
		let accelY = normalY * f;
		
		this.velocityX += accelX * (dt * 100);
		this.velocityY += accelY * (dt * 100);
	}

	Planet.prototype.update = function(dt, packet) {
		//Updates the shader to rotate towards nearest light source
		this.achieveOrbit(dt);

		this.rotation = Math.atan2((this.targetStar.y) - (this.y), (this.targetStar.x) - (this.x)) + Math.PI/2;
		
		this.x += this.velocityX * (dt * 100);
		this.y += this.velocityY * (dt * 100);

		//Clipping the source image for the planet texture
		this.sX += 0.25;
		if(this.sX > this.textureWidth)
			this.sX = 0;

		this.planetBox.set(this.x - this.radius, this.y - this.radius);

		packet.x = this.x;
		packet.y = this.y;
		packet.sX = this.sX;
		packet.sY = this.sY;
		packet.velocityX = this.velocityX;
		packet.velocityY = this.velocityY;
		packet.rotation = this.rotation;
	}

	Server.Planet = Planet;
})();

(function () {
	function Star(x, y) {
		this.x = x;
		this.y = y;
		this.sX = 0;
		this.sY = 0;
		this.textureWidth = 256;
		this.textureHeight = 128;
		this.mass = 1000;
		this.scale = 2;
		this.radius = this.textureHeight/2;
		this.color = colorList[Math.floor(Math.random() * colorList.length)]
		this.starTextureSource = "Assets/Stars/" + this.color + "_" + (Math.floor(Math.random() * 2) + 2) + ".jpg";
		this.glowTextureSource = "Assets/Glows/" + this.color + "_glow.png";
		this.textureOffset = 53;
		this.starBox = new Server.Rect(this.x - this.radius, this.y - this.radius, this.textureHeight/2, this.textureHeight/2);
	}

	Star.prototype.update = function(dt, packet) {
		//Update the clip for the source texture of the star
		this.sX += 0.25;
		if(this.sX > this.textureWidth)
			this.sX = 0;

		packet.x = this.x;
		packet.y = this.y;
		packet.sX = this.sX;
		packet.sY = this.sY;
	}

	Server.Star = Star;
})();

(function() {
	function Client(id, websocket, world, state) {
		this.id = id;
		this.header = null;
		this.ws = websocket;
		this.world = world;
		this.state = state;
		this.ready = false;
	}

	//First message to initialize the client world
	Client.prototype.initialize = function() {
		let initialMessage = {};
		initialMessage.id = this.id;
		initialMessage.state = "Initialize";
		initialMessage.ready = this.ready;
		initialMessage.world = this.world;
		//Skip Sending client data
		initialMessage.world.clients = null;
		this.ws.send(JSON.stringify(initialMessage));
	}

	Client.prototype.flagDamage = function(id) {
		let damageMessage = {};
		//console.log("flagDamage");
		//damageMessage.id = id;
		damageMessage.state = "DamageTaken";
		damageMessage.payload = id;
		damageMessage.timeStamp = Date.now();
		this.ws.send(JSON.stringify(damageMessage));
	}

	Client.prototype.addShip = function(ship, id) {
		let shipMessage = {};
		console.log("ADD SHIP CALLED");
		ship.id = id;
		shipMessage.state = "AddShip"
		shipMessage.payload = ship;
		this.ws.send(JSON.stringify(shipMessage));
	}

	Client.prototype.removeShip = function(id) {
		let removeMessage = {};
		removeMessage.state = "RemoveShip";
		removeMessage.payload = id;
		this.ws.send(JSON.stringify(removeMessage));
	}

	//Function to update the client world
	Client.prototype.update = function() {
		if(this.state == "Update") {	
			if(this.ready == true) {
				let temp = {};
				temp.state = "Stars";
				temp.payload = this.world.starPackets;
				temp.time = Date.now();
				this.ws.send(JSON.stringify(temp));
				temp.state = "Planets";
				temp.payload = this.world.planetPackets;
				temp.time = Date.now();
				this.ws.send(JSON.stringify(temp));
				temp.state = "Ships";
				temp.payload = this.world.shipPackets;
				temp.time = Date.now();
				this.ws.send(JSON.stringify(temp));
			}
		}
	}

	Server.Client = Client;
})();

module.exports = Server;