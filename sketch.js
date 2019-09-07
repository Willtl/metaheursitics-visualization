// Canvas setup
var cols = 225;
var rows = 225;
var rectWidth;
var rectHeight;
var optionsLoaded = false;

// Objective value of each position in the grid
var colors;
var colorStatus;

// Increamented every frame
var iteration;

// Current Position [x, y]
var currentPosition;
var previousPosition;
var currentValue;
var globalBestValue;

// Simulated Annealing
var temperature;

// Tabu Search
var tabuSize = 500;
var tabuList;

// Optimization method being called in the drawing
var drawingMethod = "SA";

function setup() {
	addOptions();
	createCanvas(0.9 * windowHeight, 0.9 * windowHeight);
	rectWidth = width / cols;
	rectHeight = height / cols;

	colors = makeMatrix(cols, rows);

	var highestColor = -1;
	var lowestColor = -1;
	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < cols; j++) {
			var x = i * rectWidth;
			var y = j * rectHeight;
			colors[i][j] = ackleysFunction(x, y);
			if (lowestColor == -1 || colors[i][j] < lowestColor) {
				lowestColor = colors[i][j];
			}
			if (highestColor == -1 || colors[i][j] > highestColor) {
				highestColor = colors[i][j];
			}
		}
	}

	// Increase color difference
	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < cols; j++) {
			colors[i][j] = map(colors[i][j], lowestColor, highestColor, 0, 255);
		}
	}

	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < cols; j++) {
			var x = i * rectWidth;
			var y = j * rectHeight;
			fill(colors[i][j]);
			rect(x, y, rectWidth, rectHeight);
		}
	}

	// Color status stores the current color for a particular position
	colorStatus = makeMatrix(cols, rows);
	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < cols; j++) {
			colorStatus[i][j] = -1;
		}
	}

	currentPosition = getRandomPosition();
	previousPosition = currentPosition;
	currentValue = colors[currentPosition[0]][currentPosition[1]];
	globalBestValue = currentValue;
	iteration = 0;
	temperature = 50;
}

function addOptions() {
	if (!optionsLoaded) {
		var rrhcButton = createButton("RR Hill Climbing");
		var saButton = createButton("Simulated Annealing");
		var ilssButton = createButton("Iterated Local Search");
		var tsButton = createButton("Tabu Search");

		rrhcButton.style("margin", "10px");
		saButton.style("margin", "10px");
		ilssButton.style("margin", "10px");
		tsButton.style("margin", "10px");

		rrhcButton.mousePressed(function () {
			drawingMethod = "RRHC";
			setup();
		});
		saButton.mousePressed(function () {
			drawingMethod = "SA";
			setup();
		});
		ilssButton.mousePressed(function () {
			drawingMethod = "ILS";
			setup();
		});
		tsButton.mousePressed(function () {
			drawingMethod = "TS";
			setup();
		});
		optionsLoaded = true;
	}
}

function draw() {
	if (drawingMethod == "RRHC") {
		randomRestaringHillClimbing();
	} else if (drawingMethod == "SA") {
		simulatedAnnealing();
	} else if (drawingMethod == "ILS") {
		iteratedLocalSearch();
	} else {
		tabuSearch();
	}
	iteration++;
}

function makeMatrix(_cols, _rows) {
	var arr = new Array(_cols);
	for (var i = 0; i < arr.length; i++) {
		arr[i] = new Array(_rows);
	}
	return arr;
}

// -10 <= x, y <= 10
function boothFunction(_x, _y) {
	var x = map(_x, 0, width, -10, 10);
	var y = map(_y, 0, height, -10, 10);
	return pow(x + 2 * y - 7, 2) + pow(2 * x + y - 5, 2);
}

function ackleysFunction(_x, _y) {
	var x = map(_x, 0, width, -5, 5);
	var y = map(_y, 0, height, -5, 5);
	return -20 * exp(-0.2 * sqrt(0.5 * (pow(x, 2) + pow(y, 2)))) - exp(0.5 * (cos(2 * PI * x) + cos(2 * PI * y))) + exp(1) + 20;
}

function getRandomPosition() {
	return [int(random(cols)), int(random(rows))];
}

function getBestNeighbor() {
	var bestValue = -1;
	var bestPosition = [];

	var x = currentPosition[0];
	var y = currentPosition[1];

	for (var i = x - 1; i < x + 2; i++) {
		for (var j = y - 1; j < y + 2; j++) {
			if (!(i == x && j == y) && i >= 0 && i <= cols - 1 && j >= 0 && j <= rows - 1) {
				var value = colors[i][j];
				// console.log(i, j, value)
				if (value < bestValue || bestValue == -1) {
					bestValue = value;
					bestPosition = [i, j];
				}

				var rectX = i * rectWidth;
				var rectY = j * rectWidth;
				fill(255, 0, 0);
				rect(rectX, rectY, rectWidth, rectHeight);
			}
		}
	}
	return bestPosition;
}

function getAllNeighbors() {
	var listNeighbors = []
	var x = currentPosition[0];
	var y = currentPosition[1];
	for (var i = x - 1; i < x + 2; i++) {
		for (var j = y - 1; j < y + 2; j++) {
			if (!(i == x && j == y) && i >= 0 && i <= cols - 1 && j >= 0 && j <= rows - 1)
				listNeighbors.push([i, j]);
		}
	}
	return listNeighbors;
}

function randomRestaringHillClimbing() {
	// Draw new position
	var newPosition = getBestNeighbor();
	var newPositionValue = colors[newPosition[0]][newPosition[1]];
	if (newPositionValue < currentValue) {
		currentPosition = newPosition;
		currentValue = newPositionValue;
	} else {
		// Fill local with blue
		var x = currentPosition[0] * rectWidth;
		var y = currentPosition[1] * rectWidth;
		fill(colors[currentPosition[0]][currentPosition[1]]);
		rect(x, y, rectWidth, rectHeight);
		currentPosition = getRandomPosition();
		currentValue = colors[currentPosition[0]][currentPosition[1]];
	}

	var x = currentPosition[0] * rectWidth;
	var y = currentPosition[1] * rectWidth;
	fill(0, 255, 0);
	rect(x, y, rectWidth, rectHeight);
}

function simulatedAnnealing() {
	var neighbors = getAllNeighbors();
	neighbors = shuffle(neighbors);
	currentValue = colors[currentPosition[0]][currentPosition[1]];

	// Check each neighbor if it is better than global best
	var globalNeighbor;
	for (var i = 0; i < neighbors.length; i++) {
		neighborValue = colors[neighbors[i][0]][neighbors[i][1]];
		if (neighborValue < globalBestValue) {
			globalNeighbor = neighbors[i];
			globalBestValue = neighborValue;
		}
	}

	if (globalNeighbor != undefined) {
		previousPosition = currentPosition;
		currentPosition = globalNeighbor;
		currentValue = colors[globalNeighbor[0]][globalNeighbor[1]];;
	} else {
		for (var i = 0; i < neighbors.length; i++) {
			neighborValue = colors[neighbors[i][0]][neighbors[i][1]];

			// Probability of accepting move 
			var prob = exp((currentValue - neighborValue) / temperature);
			if (random(1) < prob && !(previousPosition[0] == neighbors[i][0] && previousPosition[1] == neighbors[i][1])) {
				previousPosition = currentPosition;
				currentPosition = neighbors[i];
				currentValue = neighborValue;

				if (currentValue < globalBestValue) {
					globalBestValue = currentValue;
				}
				break;
			}
		}
	}

	var x = currentPosition[0] * rectWidth;
	var y = currentPosition[1] * rectWidth;
	fill(0, 255, 0);
	rect(x, y, rectWidth, rectHeight);

	if (random(1) < 0.01)
		temperature--;
	console.log(temperature);
}

function iteratedLocalSearch() {
	// Draw new position
	var newPosition = getBestNeighbor();
	var newPositionValue = colors[newPosition[0]][newPosition[1]];
	if (newPositionValue < currentValue) {
		currentPosition = newPosition;
		currentValue = newPositionValue;
	} else {
		// Fill local with blue
		var x = currentPosition[0] * rectWidth;
		var y = currentPosition[1] * rectWidth;
		fill(colors[currentPosition[0]][currentPosition[1]]);
		rect(x, y, rectWidth, rectHeight);
		currentPosition = perturbate(currentPosition);
		currentValue = colors[currentPosition[0]][currentPosition[1]];
	}

	if (currentValue < globalBestValue) {
		globalBestValue = currentValue;
		console.log(currentValue, minute() + ":" + second());
	}


	var x = currentPosition[0] * rectWidth;
	var y = currentPosition[1] * rectWidth;
	fill(0, 255, 0);
	rect(x, y, rectWidth, rectHeight);
}

function perturbate(location) {
	if (random(1) < 0.5) {
		location[0] = int(random(cols));
	} else {
		location[1] = int(random(rows));
	}
	return location;
}

function initializeTabu() {
	tabuList = makeMatrix(cols, rows);
	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < cols; j++) {
			tabuList[i][j] = 0;
		}
	}
}

function tabuSearch() {
	if (tabuList == null)
		initializeTabu()

	newPosition = getBestTabuMove();
	if (newPosition == null) {
		console.log("Move == null");
		noLoop();
	}
	// Increase Tabu 
	currentPosition = newPosition;
	currentValue = getPositionValue(newPosition);

	var status = colorStatus[currentPosition[0]][currentPosition[1]];
	if (status == -1 || status == 0) {
		var x = currentPosition[0] * rectWidth;
		var y = currentPosition[1] * rectWidth;
		fill(0, 255, 0);
		rect(x, y, rectWidth, rectHeight);
		colorStatus[currentPosition[0]][currentPosition[1]] = 1;
	} else {
		var x = currentPosition[0] * rectWidth;
		var y = currentPosition[1] * rectWidth;
		fill(0, 0, 255);
		rect(x, y, rectWidth, rectHeight);
		colorStatus[currentPosition[0]][currentPosition[1]] = 0;
	}
	tabuList[newPosition[0]][newPosition[1]] += tabuSize;
}

function getBestTabuMove() {
	var neighbors = getAllNeighbors();
	neighbors = shuffle(neighbors);

	// Find all non-tabu moves
	var nonTabuMoves = []
	for (var i = 0; i < neighbors.length; i++) {
		var neighborTabuSize = tabuList[neighbors[i][0]][neighbors[i][1]];
		if (neighborTabuSize < iteration)
			nonTabuMoves.push(neighbors[i]);
	}

	nonTabuMoves.sort(function (a, b) {
		return getPositionValue(a) - getPositionValue(b);
	});

	// Randomly pick between the best two non-tabu moves to avoid cycles and increase exploration
	if (nonTabuMoves.length > 1) {
		var rand = random(1);
		if (rand < 0.5)
			return nonTabuMoves[0];
		else
			return nonTabuMoves[1];
	} else if (nonTabuMoves.length == 1) {
		return nonTabuMoves[0];
	} else {
		var x = currentPosition[0];
		var y = currentPosition[1];
		var rand = random(1);
		if (rand < 0.25) {
			for (var i = x; i < cols; i++) {
				var eastPosition = [i, y];
				var neighborTabuSize = tabuList[eastPosition[0]][eastPosition[1]];
				if (neighborTabuSize <= iteration)
					return eastPosition;
			}
		} else if (rand < 0.5) {
			for (var i = x; i > 0; i--) {
				var westPosition = [i, y];
				var neighborTabuSize = tabuList[westPosition[0]][westPosition[1]];
				if (neighborTabuSize <= iteration)
					return westPosition;
			}
		} else if (rand < 0.75) {
			for (var i = y; i < rows; i++) {
				var northPosition = [x, i];
				var neighborTabuSize = tabuList[northPosition[0]][northPosition[1]];
				if (neighborTabuSize <= iteration)
					return northPosition;
			}
		} else {
			for (var i = y; i > 0; i--) {
				var southPosition = [x, i];
				var neighborTabuSize = tabuList[southPosition[0]][southPosition[1]];
				if (neighborTabuSize <= iteration)
					return southPosition;
			}
		}
		// var rand = floor(random(0, neighbors.length));
		// return neighbors[rand];
	}
}

function getPositionValue(position) {
	return colors[position[0]][position[1]];
}