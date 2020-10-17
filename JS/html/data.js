Game = {};
//Stars
(function() {
	function Star(newX, newY, newSize, newMass, starNames) {
		this.x = newX;
		this.y = newY;
		this.centerX = (newX + newSize) - (newSize/2);
		this.centerY = (newY + newSize) - (newSize/2);
		this.color = getRandomColor();
		this.complement = getComplementaryColor(this.color);
		this.size = newSize;
		this.mass = newMass;
		this.name = generateName(starNames);
		
	}

	function generateName(starNames) {
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

function generateStars(starNames) {
	var newStars = [];

	for(var i = 0; i < 1; i++) {
		//var newX = Math.floor(Math.random() * c.width);
		//var newY = Math.floor(Math.random() * c.height);
		//var newStar = new Game.Star(newX, newY, 30, 3000);
		var newStar = new Game.Star(700, 700, 30, 3000, starNames);
		newStars.push(newStar);
	}

	return newStars;
}

module.exports.generateStars = generateStars;