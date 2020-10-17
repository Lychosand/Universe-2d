console.log("Universe Sim");

/*----------------------------------------------------------------------First Pass------------------------------------------------------------------------------*/
(function() {
	var c = document.getElementById("myCanvas");
	c.width = window.innerWidth;
	c.height = window.innerHeight;

	var ctx = c.getContext('2d');
	var width = c.width - 10;
	var height = c.height - 20;

	var worldWidth = 10000;
	var worldHeight = 10000;

	var stars = [];
	var ships = [];
	var particles = [];
	var num_particles = 15;
	var num_stars = 1;
	var masses = [];

	populateStars();
	populateShips();
	populateParticles();

	var zoomLevel = 1;
	var lastUpdate = Date.now();
	var lastRender = 0;
/*----------------------------------------------------------------------Drawing Functions----------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------------------------------------------*/
	function draw()
	{
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = "#292A34";
		ctx.fillRect(0, 0, width, height);
		zoomLevel = 1;
		
		for(current in stars) {
			stars[current].draw(ctx, 0, 0);
		}

		for(current in ships) {
			ships[current].draw(ctx, 0, 0);
		}

		for(current in particles) {
			particles[current].draw(ctx, 0, 0);
		}
	}

	function achieveOrbit(dt) {
		for(current in particles) {
			var particle = particles[current];
			var d = (particle.centerX - particle.target.centerX) * (particle.centerX - particle.target.centerX) + (particle.centerY - particle.target.centerY) * (particle.centerY - particle.target.centerY);
			var theta = Math.atan2(particle.target.centerY - particle.centerY, particle.target.centerX - particle.centerX);

			var k = 1 * particle.target.mass * particle.mass / d;

			particle.velocityX += ((0.0001 * Math.cos(theta)) / particle.mass) * dt;
			particle.velocityY += ((0.0001 * Math.sin(theta)) / particle.mass) * dt;

			//particle.centerX += particle.velocityX * dt;
			//particle.centerY += particle.velocityY * dt;
		}

		for(current in ships) {
			var ship = ships[current];
			var d = (ship.centerX - ship.target.centerX) * (ship.centerX - ship.target.centerX) + (ship.centerY - ship.target.centerY) * (ship.centerY - ship.target.centerY);
			var theta = Math.atan2(ship.target.centerY - ship.centerY, ship.target.centerX - ship.centerX);

			var k = 1 * ship.target.mass * ship.mass / d;

			ship.velocityX += ((0.0001 * Math.cos(theta)) / ship.mass) * dt;
			ship.velocityY += ((0.0001 * Math.sin(theta)) / ship.mass) * dt;

			//ship.centerX += ship.velocityX * dt;
			//ship.centerY += ship.velocityY * dt;
		}
	}

	//Function to simulation gravitational acceleration between objects with mass
	function updateMassAcceleration() {
		for(var i in masses) {
			let ax = 0;
			let ay = 0;

			const massI = masses[i];

			for(var j in masses) {
				if(i != j) {

					const massJ = masses[j];

					var dx = massJ.centerX - massI.centerX;
					var dy = massJ.centerY - massI.centerY;

					var dsqr = dx * dx + dy * dy;

					if(dsqr == 0)
						dsqr = 1;

					f = (10.0, massJ.mass) / (dsqr * Math.sqrt(dsqr + 200));

					if(typeof(massI.currentForce) !== "undefined") {
						masses[i].currentForce = f;
						masses[i].distance = parseInt(Math.sqrt((dx * dx) + (dy * dy)));
					}


					if(!massI.largestForce && massI.largestForce < f) {
						console.log("Swapped!");
						masses[i].largestForce = f;

						if(massJ.name) {
							masses[i].target = masses[j];
						}
					}

					ax += dx * f;
					ay += dy * f;
				}

				//massI.accelerationX = ax;
				//massI.accelerationY = ay;
			}
		}
	}

	function update(dt)
	{
		for(current in ships) {
			ships[current].update(dt, worldWidth, worldHeight);
			ships[current].playerCamera.update();
		}

		for (current in particles) {
			particles[current].update(dt, width, height);
		}

		updateMassAcceleration();

		achieveOrbit(dt);
	}

/*-------------------------------------------------------------------Pre Population Functions-------------------------------------------------------------------*/
	function populateStars() {
		for(var i = 0; i < num_stars; i++) {
			var newX = Math.floor(Math.random() * c.width);
			var newY = Math.floor(Math.random() * c.height);
			//var newStar = new Game.Star(newX, newY, 30, 3000);
			var newStar = new Game.Star(c.width/2, c.height/2, 30, 3000);
			stars.push(newStar);
			masses.push(newStar);
		}
	}

	function populateShips() {
		for(var i = 0; i < 1; i++) {
			var newX = Math.floor(Math.random() * c.width);
			var newY = Math.floor(Math.random() * c.height);
			var newCamera = new Game.Camera(0, 0, width, height, worldWidth, worldHeight, 0);
			var newShip = new Game.Ship(newX, newY, 10, newCamera);
			newShip.playerCamera.follow(newShip, 0, 0);
			ships.push(newShip);
			masses.push(newShip);
		}
	}

	function populateParticles() {
		for(var i = 0; i < num_particles; i++) {
			var newX = Math.floor(Math.random() * c.width);
			var newY = Math.floor(Math.random() * c.height);
			var newParticle = new Game.Particle(newX, newY, 10);
			particles.push(newParticle);
			masses.push(newParticle);
		}
	}
/*-------------------------------------------------------------------Main Game Loop------------------------------------------------------------------------------*/
	function loop(timestamp)
	{
		var progress = timestamp - lastRender;

		var now = Date.now();
		var dt = now - lastUpdate;
		lastUpdate = now;
		update(dt);
		draw();

		window.requestAnimationFrame(loop);
	}

	Game.play = function() {
		window.requestAnimationFrame(loop);
	}
})();

window.onload = function() {
	Game.play();
}