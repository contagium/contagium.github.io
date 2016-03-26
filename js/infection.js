// The logic behind the magic. It is very unoptimized as it is a work in progress and there is a lot of experimentation.

function colorBasedOnState(tile) {
    var normalizedValue = Math.floor(tile.density * 255);
    var intensity = (normalizedValue).toString(16);
    if (intensity.length < 2) {
        intensity = '0' + intensity;
    }
    if (tile.infected) {
        return '#00' + intensity + '00';
    } else {
        return '#' + intensity + '0000';
    }
}

var game = {};
game.infection = {
    // Used to determine how likely the infection is to spreading.
    contagionMultiplier: 0.6,
    // How much of the infected population survives per tick.
    survivalMultiplier: 0.8,
    // The minimum population density required for a tile to continue active
    minimumPopulationDensity: 0.1,
    minimumInitialPopulationDensity: 0.6,
    maximumInitialPopulationDensity: 0.8
};

function getRandomBetween(minimum, maximum) {
    var delta = maximum - minimum;
    return minimum + delta * Math.random();
}

function getMousePosition(canvas, event) {
    var rectangle = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rectangle.left,
        y: event.clientY - rectangle.top
    };
}

function translateToTilePosition(canvas, position, tilesPerRow) {
    var tileWidth = canvas.width / tilesPerRow;
    var tileHeight = canvas.height / tilesPerRow;
    return {
        x: Math.floor(position.x / tileWidth),
        y: Math.floor(position.y / tileHeight)
    };
}

function resize() {
    var canvas = document.getElementById('canvas');
    var clientWidth = Math.max(document.documentElement.clientWidth, document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth);
    var clientHeight = Math.max(document.documentElement.clientHeight, document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight);
    var side = Math.min(clientWidth, clientHeight);
    side = 20 * Math.floor(side / 20);
    canvas.width = canvas.height = side;
    canvas.style.position = 'absolute';
    canvas.style.marginTop = Math.round((clientHeight - side) / 2) + 'px';
    canvas.style.left = (clientWidth - side) / 2 + 'px';
}

function setUp() {
    game.running = false;
    game.map = {};
    game.map.tiles = [];

    resize();

    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    var tilesPerRow = game.tilesPerRow = 20;
    var side = canvas.width;
    context.fillRect(0, 0, side, side);
    var squareSide = side / tilesPerRow;
    for (var y = 0; y <= side - squareSide; y += squareSide) {
        var tileRow = [];
        for (var x = 0; x <= side - squareSide; x += squareSide) {
            var tile = {
                'density': getRandomBetween(game.infection.minimumInitialPopulationDensity, game.infection.maximumInitialPopulationDensity),
                'infected': false
            };

            tileRow.push(tile);
        }
        game.map.tiles.push(tileRow);
    }
    game.canvas = canvas;
    game.updateCanvas();

    canvas.addEventListener('click', function (event) {
        if (!game.running) {
            var mousePosition = getMousePosition(canvas, event);
            var tilePosition = translateToTilePosition(canvas, mousePosition, tilesPerRow);
            game.map.tiles[tilePosition.y][tilePosition.x].infected = true;
            game.running = true;
        }
    }, false);
}

game.renderTick = function () {
    var tilesInfectedOnTick = [];
    for (var y = 0; y < game.tilesPerRow; y++) {
        for (var x = 0; x < game.tilesPerRow; x++) {
            var tile = game.map.tiles[y][x];
            if (tile.infected && tile.density !== 0) {
                var neighbors = [[x - 1, y], [x, y - 1], [x, y + 1], [x + 1, y]];
                for (var i = 0; i < neighbors.length; i++) {
                    var neighbor = neighbors[i];
                    if (0 <= neighbor[0] && neighbor[0] < game.tilesPerRow) {
                        if (0 <= neighbor[1] && neighbor[1] < game.tilesPerRow) {
                            var adjacentTile = game.map.tiles[neighbor[1]][neighbor[0]];
                            if (!adjacentTile.infected) {
                                if (Math.random() < game.infection.contagionMultiplier * tile.density) {
                                    tilesInfectedOnTick.push(adjacentTile);
                                }
                            }
                        }
                    }
                }
                if (tile.density < game.infection.minimumPopulationDensity) {
                    tile.density = 0;
                } else {
                    tile.density *= game.infection.survivalMultiplier;
                }
            }
        }
    }
    for (var j = 0; j < tilesInfectedOnTick.length; j++) {
        tilesInfectedOnTick[j].infected = true;
    }
};

game.updateCanvas = function () {
    var squareSide = game.canvas.width / game.tilesPerRow;
    var context = game.canvas.getContext('2d');
    for (var y = 0; y < game.tilesPerRow; y++) {
        for (var x = 0; x < game.tilesPerRow; x++) {
            context.fillStyle = colorBasedOnState(game.map.tiles[y][x]);
            context.fillRect(x * squareSide, y * squareSide, squareSide, squareSide);
        }
    }
};

(function () {
    setUp();
    var tickLength = 200; // 200 milliseconds.
    game.lastTickTimeFrame = window.performance.now();
    function main(timeFrame) {
        window.requestAnimationFrame(main); // A DOMHighResTimeStamp will be provided to the callback
        if (game.running) {
            if (game.lastTickTimeFrame + tickLength < timeFrame) {
                game.renderTick();
                game.updateCanvas();
                game.lastTickTimeFrame = timeFrame;
            }
        }
    }

    main();
})();
