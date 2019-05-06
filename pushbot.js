var c = document.querySelector("canvas");

c.width = 400;
c.height = 400;

var ctx = c.getContext("2d");

function sin(angle) {
    return Math.sin(angle * Math.PI / 180);
}

function cos(angle) {
    return Math.cos(angle * Math.PI / 180);
}

function f(x) {
    if (x < 0) return -1;
    if (x > 0) return 1;
    return 0;
}

Array.min = function(array) {
    return Math.min.apply(Math, array);
};

let keys = {};
onkeydown = onkeyup = function(e){
    e = e || window.event;
    keys[e.key] = (e.type == "keydown");
}

function drawRotatedRect(x, y, width, height, degrees = 0) {
    ctx.save();
    ctx.beginPath();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(degrees * Math.PI / 180);
    ctx.rect(-width / 2, -height / 2, width, height);
    ctx.fill();
    ctx.restore();
}

function intersect(pt1, pt2) {
    var x1 = pt1[0][0];
    var y1 = pt1[0][1];
    var x2 = pt1[1][0];
    var y2 = pt1[1][1];
    var x3 = pt2[0][0];
    var y3 = pt2[0][1];
    var x4 = pt2[1][0];
    var y4 = pt2[1][1];
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return false;
    }
    var denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    if (denominator === 0) {
        return false;
    }
    var ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    var ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return false;
    }
    var x = x1 + ua * (x2 - x1);
    var y = y1 + ua * (y2 - y1);
    return [x, y];
}

class Bot {
    constructor(x, y, r, field, network) {
        this._x = x;
        this._y = y;
        this._r = r;
        this._field = field;
        this._network = network;
        this._fitness = 0;
        this._turn = 0;
    }

    get x() { return this._x; }
    get y() { return this._y; }
    get r() { return this._r; }
    get network() { return this._network; }
    get fitness() { return this._fitness; }
    set fitness(value) { this._fitness = value; }
    get lines() {
        var ptA = [this._x + cos(this._r + 45) * 10 * Math.SQRT2, this.y + sin(this._r + 45) * 10 * Math.SQRT2];
        var ptB = [this._x + cos(this._r + 135) * 10 * Math.SQRT2, this.y + sin(this._r + 135) * 10 * Math.SQRT2];
        var ptC = [this._x + cos(this._r + 225) * 10 * Math.SQRT2, this.y + sin(this._r + 225) * 10 * Math.SQRT2];
        var ptD = [this._x + cos(this._r + 315) * 10 * Math.SQRT2, this.y + sin(this._r + 315) * 10 * Math.SQRT2];
        return [
            [ptA, ptB],
            [ptB, ptC],
            [ptC, ptD],
            [ptD, ptA]
        ];
    }
    get see() {
        var fieldLines = this._field.lines;
        var eye1Line = [[this._x, this._y], [this._x + cos(this._r) * 400, this._y + sin(this._r) * 400]];
        var eye2Line = [[this._x, this._y], [this._x + cos(this._r + 60) * 400, this._y + sin(this._r + 60) * 400]];
        var eye3Line = [[this._x, this._y], [this._x + cos(this._r - 60) * 400, this._y + sin(this._r- 60) * 400]];
        var eye1Intersections = [];
        var eye2Intersections = [];
        var eye3Intersections = [];
        for (var i = 0; i < fieldLines.length; i++) {
            if (intersect(fieldLines[i], eye1Line) !== false) {
                eye1Intersections.push(intersect(fieldLines[i], eye1Line));
            }
            if (intersect(fieldLines[i], eye2Line) !== false) {
                eye2Intersections.push(intersect(fieldLines[i], eye2Line));
            }
            if (intersect(fieldLines[i], eye3Line) !== false) {
                eye3Intersections.push(intersect(fieldLines[i], eye3Line));
            }
        }
        var eye1Distance = Array.min(eye1Intersections.map(x => Math.sqrt((x[0] - this._x) ** 2 + (x[1] - this._y) ** 2)));
        var eye2Distance = Array.min(eye2Intersections.map(x => Math.sqrt((x[0] - this._x) ** 2 + (x[1] - this._y) ** 2)));
        var eye3Distance = Array.min(eye3Intersections.map(x => Math.sqrt((x[0] - this._x) ** 2 + (x[1] - this._y) ** 2)));
        return [eye1Distance, eye2Distance, eye3Distance];
    }

    setCoords(x, y, r) {
        this._x = x;
        this._y = y;
        this._r = r;
        this._turn = 0;
    }

    collision() {
        var fieldLines = this._field.lines;
        var botLines = this.lines;
        for (var i = 0; i < fieldLines.length; i++) {
            for (var j = 0; j < botLines.length; j++) {
                if (intersect(fieldLines[i], botLines[j]) !== false) return true;
            }
        }
        return false;
    }

    rotate(angle) {
        this._turn += f(angle);
        this._r += angle;
        if (this._r < 0) this._r += 360;
        if (this._r >= 360) this._r -= 360;
        if (this.collision()) {
            this._fitness = 0;
            this._r -= angle;
            if (this._r < 0) this._r += 360;
            if (this._r >= 360) this._r -= 360;
        }
    }

    move(step) {
        this._x += cos(this._r) * step;
        this._y += sin(this._r) * step;       
        if (this.collision()) {
            this._fitness = 0;
            this._x -= cos(this._r) * step;
            if (this.collision()) {
                this._x += cos(this._r) * step;
                this._y -= sin(this._r) * step;
                if (this.collision()) {
                    this._x -= cos(this._r) * step;
                }
            }
        }
    }

    rebound() {
        for (var i = 0; i < 10; i++) {
            this.move(-1.5);
        }
        for (var i = 0; i < 120; i++) {
            this.rotate(2);
        }
    }

    think() {
        this._network.createInputLayer(this.see);
        this._network.runNetwork();
        if (this._network.outputs[0] > 0) this.move(1.5);
        if (this._network.outputs[1] > 0) this.rotate(-2);
        if (this._network.outputs[2] > 0) this.rotate(2);
    }

    render() {
        ctx.fillStyle = "blue";
        drawRotatedRect(this._x - 10, this._y - 10, 20, 20, this._r);
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.arc(this._x + cos(this._r) * this.see[0], this.y + sin(this._r) * this.see[0], 5, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this._x + cos(this._r + 60) * this.see[1], this.y + sin(this._r + 60) * this.see[1], 5, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this._x + cos(this._r - 60) * this.see[2], this.y + sin(this._r - 60) * this.see[2], 5, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.moveTo(this._x, this._y);
        ctx.lineTo(this._x + cos(this._r) * 10, this.y + sin(this._r) * 10);
        ctx.stroke();
    }
}

class Field {
    constructor(terrain, width) {
        this._terrain = terrain;
        this._width = width;
    }

    get terrain() { return this._terrain; }
    get lines() {
        var lineArray = [];
        for (var i = 0; i < this._terrain.length; i++) {
            var x = i % this._width;
            var y = (i - x) / this._width;
            if (this._terrain[i] == 1) {
                var ptA = [x * 20, y * 20];
                var ptB = [x * 20 + 20, y * 20];
                var ptC = [x * 20 + 20, y * 20 + 20];
                var ptD = [x * 20, y * 20 + 20];
                lineArray.push([ptA, ptB]);
                lineArray.push([ptB, ptC]);
                lineArray.push([ptC, ptD]);
                lineArray.push([ptD, ptA]);
            }
        }
        return lineArray;
    }

    render() {
        var fieldLines = this.lines;
        ctx.fillStyle = "black";
        for (var i = 0; i < this._terrain.length; i++) {
            var x = i % this._width;
            var y = (i - x) / this._width;
            if (this._terrain[i] == 1) drawRotatedRect(x * 20, y * 20, 20, 20);
        }
    }
}

var field = new Field([
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,
    1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
], 20);

var network = new Network([3, 4, 3]);
//               0,60,-60
network.addNode([1, 0, 0], 1, 50); // Approaching wall
network.addNode([0, -1, 1], 1, 0); // Left is best option
network.addNode([0, 1, -1], 1, 0); // Right is best option
network.addNode([-1, 0, 0], 1, 30); // About to crash
network.addNode([0, 0, 0, -1], 2, 1); // Move foreward
network.addNode([1, 1, 0, 2], 2, -1); // Turn left
network.addNode([1, 0, 1, -1], 2, -1); // Turn right

var bot = new Bot(200, 200, 270, field, network);

var i = 0;
function loop() {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, c.width, c.height);
    field.render();
    bot.render();
    if (keys['a']) bot.rotate(-2);
    if (keys['d']) bot.rotate(2);
    if (keys['w']) bot.move(1.5);
    if (keys['s']) bot.move(-1.5);
    bot.think();
    document.getElementById("fitness").innerHTML = i.toString() + " " + bot.fitness.toString() + " " + Math.floor(bot.see[0]) + " " + Math.floor(bot.see[1]) + " " + Math.floor(bot.see[2]);
    i++;
}
loop();