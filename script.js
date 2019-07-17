var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");
var leftpressed = false;
var rightpressed = false;
var updater = null;

function addListener(id, type, func) {
    document.getElementById(id).addEventListener(type, func);
}

var patterns = [
//    "0000000000000000\n" +
//    "1234123412341234\n" +
//    "4123412341234123\n" + // pattern
//    "3412341234123412\n" +
//    "2341234123412341\n",

    "222222222222222222222222222222\n" +
    "222222322222222222222222222222\n" +
    "222222222333332222222222222222\n" +
    "222222322232322222232222223322\n" +
    "223322322232322222332222232232\n" + // e^{i pi} + 1 = 0
    "232322322322322322232333232232\n" +
    "233222222222223332232222232232\n" +
    "232222222222222322232333232232\n" +
    "223322222222222222232222223322\n" +
    "222222222222222222222222222222\n",

    "41114444444444444444\n" +
    "41414444444444444444\n" +
    "41114444444444444444\n" + // Pavan
    "41444114141441141144\n" +
    "41441414141414141414\n" +
    "41444114414441141414\n",
];

function init() {
    document.addEventListener("keydown", function(e) { onkeydown(e.keyCode); });
    document.addEventListener("keyup", function(e) { onkeyup(e.keyCode); });

    // mobile event listeners for buttons
    addListener("right", "touchstart", function() { onkeydown(keyRight); });
    addListener("right", "touchend", function() { onkeyup(keyRight); });
    addListener("left", "touchstart", function() { onkeydown(keyLeft); });
    addListener("left", "touchend", function() { onkeyup(keyLeft); });

    // desktop event listeners for buttons
    addListener("right", "mousedown", function() { onkeydown(keyRight); });
    addListener("right", "mouseup", function() { onkeyup(keyRight); });
    addListener("left", "mousedown", function() { onkeydown(keyLeft); });
    addListener("left", "mouseup", function() { onkeyup(keyLeft); });

    // place ball and paddle in middle
    drawutils.clear()
    bricks.init();
    paddle.init();
    ball.init();

    // start game engine updater
    updater = setInterval(update, 10);
}

function restart_fn() {
    setTimeout(function() {
        canvas.removeEventListener("click", restart_fn, false);
    }, 100);
    drawutils.clear()
    bricks.init();
    paddle.init();
    ball.init();
    updater = setInterval(update, 10);
};

var keyLeft = 37;
var keyRight = 39;
var keyA = 65;
var keyD = 68;

function onkeydown(key) {
    if (key == keyRight || key == keyD) {
        rightpressed = true;
    } else if (key == keyLeft || key == keyA) {
        leftpressed = true;
    }
}

function onkeyup(key) {
    if (key == keyRight || key == keyD) {
        rightpressed = false;
    } else if (key == keyLeft || key == keyA) {
        leftpressed = false;
    }
}

// color theme for game
var colortheme = {
    paddle: "#6688FF", // blue
    ball: "#FF7733", // orange
    bricks: ["#FFAABB","#FFCCEE","#DD99EE","#BB77BB"] // pink -> purple
}

// functions for drawing shapes on canvas
var drawutils = {
    clear: function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    },

    rectangle: function(x, y, width, height, color) {
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    },

    circle: function(x, y, radius, color) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2*Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    },

    text: function(x, y, str) {
        ctx.font = "30px Arial";
        ctx.fillStyle = "#000000";
        ctx.fillText(str, x, y);
    }
}

// ball that moves around
var ball = {
    radius: 20,
    color: colortheme.ball,
    init: function() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 150;
        this.dx = 1;
        this.dy = -2;
        this.bl = this.x - this.radius; // left most point bbox
        this.br = this.x + this.radius; // right most point bbox
        this.bt = this.y - this.radius; // top most point bbox
        this.bb = this.y + this.radius; // bottom most point bbox
    },
    draw: function() {
        drawutils.circle(this.x, this.y, this.radius, this.color);
    },
    update: function() {
        if (this.br > canvas.width) { // bounce off right wall
            this.dx = -Math.abs(this.dx);
            this.x = canvas.width - this.radius;
        }
        if (this.bl < 0) { //bounce off left wall
            this.dx = Math.abs(this.dx);
            this.x = this.radius;
        }

        if (this.bt < 0) { // bounce off top wall
            this.dy = Math.abs(this.dy);
            this.y = this.radius;
        }

        // ensure y velocity doesn't stagnate
        if (0.0 < this.dy && this.dy < 0.1) {
            this.dy = 0.5;
        }
        if (-0.1 < this.dy && this.dy <= 0.0) {
            this.dy = -0.5;
        }

        // move ball
        this.x += this.dx;
        this.y += this.dy;

        // update bounding box
        this.bl = this.x - this.radius;
        this.br = this.x + this.radius;
        this.bt = this.y - this.radius;
        this.bb = this.y + this.radius;
    },
    touching_box: function(x, y, width, height) {
        // if ball touches another rectangle return angle normal to collision

        // if ball too far from box, return null
        if (this.bl>x+width || this.br<x || this.bb<y || this.bt>y+height) {
            return null;
        }

        // for determining closest corner
        neartop = true;
        nearleft = true;
        // check if touching top or bottom : return [angle, newx, newy]
        if (this.x >= x) {
            if (this.x <= x+width) {
                if (this.y > y + height/2) { // touching bottom
                    return [-Math.PI/2, this.x, y+height+this.radius];
                } else { // touching top
                    return [Math.PI/2, this.x, y-this.radius];
                }
            } else {
                nearleft = false;
            }
        }

        // check if touching left or right
        if (this.y >= y) {
            if (this.y <= y+height) {
                if (this.x > x + width/2) { // touching right
                    return [0, x+width+this.radius, this.y];
                } else { // touching left
                    return [Math.PI, x-this.radius, this.y];
                }
            } else {
                neartop = false;
            }
        }

        // check if distance to nearest corner less than radius
        if (neartop) {
            if (nearleft) {
                deltax = x - this.x;
                deltay = y - this.y;
                //console.log("topleft:");
            } else {
                deltax = x+width - this.x;
                deltay = y - this.y;
                //console.log("topright:");
            }
        } else {
            if (nearleft) {
                deltax = x - this.x
                deltay = y+height - this.y;
                //console.log("botleft:");
            } else {
                deltax = x+width - this.x;
                deltay = y+height - this.y;
                //console.log("botright:");
            }
        }

        // check distance
        dist = Math.sqrt(deltax*deltax + deltay*deltay);
        if (dist > ball.radius) {
            return null;
        } else { // calculate angle
            angle = Math.atan2(deltay, -deltax);
            // round to nearest multiple of pi/6
            //angle = Math.floor(6*angle/Math.PI + 0.5)*Math.PI/6;
            newx = (deltax + this.x) + this.radius*Math.cos(angle);
            newy = (deltay + this.y) - this.radius*Math.sin(angle);
            return [angle, newx, newy];
        }
    }
}

// paddle the user controls
var paddle = {
    width: 150,
    height: 30,
    color: colortheme.paddle,
    init: function() {
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 10;
        this.dx = 5;
    },
    draw: function() {
        drawutils.rectangle(this.x,this.y,this.width,this.height,this.color);
    },
    update: function() {
        // move paddle
        if (paddle.x + paddle.width < canvas.width && rightpressed) {
            paddle.x += paddle.dx;
        }

        if (paddle.x > 0 && leftpressed) {
            paddle.x -= paddle.dx;
        }
    }
}

// brick pattern
var bricks = {
    num_left : 1,
    init: function() {
        //pattern = "0000000000000000\n" +
        //          "1234123412341234\n" +
        //          "4123412341234123\n" +
        //          "3412341234123412\n" +
        //          "2341234123412341\n";
        var rand = Math.floor(Math.random()*patterns.length);
        var pattern = patterns[rand]
        pattern = pattern.trim().split("\n");
        this.cols = pattern[0].length;
        this.rows = pattern.length;
        this.width = canvas.width / this.cols; // 800/16 = 50
        this.height = canvas.height / this.rows / 2 // 450/10 = 45
        this.bricks = [];
        this.num_left = 0;
        for (i=0; i<pattern.length; ++i) {
            var brickrow = [];
            pattern_i = pattern[i];
            for (j=0; j<pattern_i.length; ++j) {
                var b = pattern_i.charCodeAt(j) - 48;
                brickrow.push(b);
                if (b > 0) {
                    this.num_left += 1;
                }
            }
            this.bricks.push(brickrow);
        }
    },
    draw: function() {
        var y = 0;
        for (i=0; i<this.bricks.length; ++i) {
            var x = 0;
            var row = this.bricks[i];
            for (j=0; j<row.length; ++j) {
                var b = row[j];
                if (b > 0) {
                    var c = colortheme.bricks[b-1];
                    drawutils.rectangle(x, y, this.width, this.height, c);
                }
                x += this.width;
            }
            y += this.height;
        }
    },
    check_collisions: function(ball) {
        // determine which 4 bricks closest to ball
        var min_i = Math.floor(ball.bt/this.height);
        var max_i = Math.ceil(ball.bb/this.height);
        var min_j = Math.floor(ball.bl/this.width);
        var max_j = Math.ceil(ball.br/this.width);
        if (min_i < 0) {
            min_i = 0;
        }
        if (max_i > this.rows) {
            max_i = this.rows;
        }
        if (min_j < 0) {
            min_j = 0;
        }
        if (max_j > this.cols) {
            max_j = this.cols;
        }

        var y = min_i * this.height;
        var x0 = min_j * this.width;
        var newx = ball.x;
        var newy = ball.y;
        var newdx = ball.dx;
        var newdy = ball.dy;
        for (i=min_i; i<max_i; ++i) {
            var x = x0;
            var row = this.bricks[i];
            for (j=min_j; j<max_j; ++j) {
                var b = row[j];
                if (b > 0) {
                    // check if ball intersects this brick
                    var angle = ball.touching_box(x,y,this.width,this.height);
                    if (angle != null) { // bounce ball off this brick
                        var c = Math.cos(2*angle[0]);
                        var s = Math.sin(2*angle[0]);
                        // update trajectory
                        newdx = -c*ball.dx + s*ball.dy;
                        newdy =  s*ball.dx + c*ball.dy;
                        // track where ball should go after all collisions
                        newx = angle[1];
                        newy = angle[2];
                        // destroy this brick
                        row[j] = 0;
                        this.num_left -= 1;
                    }
                }
                x += this.width;
            }
            y += this.height;
        }

        // update position, velocity, and bbox
        ball.x = newx;
        ball.y = newy;
        ball.dx = newdx;
        ball.dy = newdy;
        ball.bl = ball.x - ball.radius;
        ball.br = ball.x + ball.radius;
        ball.bt = ball.y - ball.radius;
        ball.bb = ball.y + ball.radius;
    }
}

// redraw, check collisions, and update ball/paddle positions
function update() {
    drawutils.clear();
    bricks.draw()
    paddle.draw()
    ball.draw();

    // handle if the ball touches the paddle
    // find reflection matrix R(t) to reflect along axis [cos(t), sin(t)]
    // Rotate = [cos(t) -sin(t)]       Reflect = [1  0]
    //          [sin(t)  cos(t)]                 [0 -1]
    //
    // R(t) [cos(t) -sin(t)] = [cos(t)  sin(t)]
    //      [sin(t)  cos(t)]   [sin(t) -cos(t)]
    //
    // R(t) = [cos(t) -sin(t)] [1  0] [cos(t)  sin(t)] = Rotate Reflect Rotate*
    //        [sin(t)  cos(t)] [0 -1] [-sin(t) cos(t)]
    //      = [cos(2t)  sin(2t)]
    //        [sin(2t) -cos(2t)]
    var angle = ball.touching_box(paddle.x,paddle.y,paddle.width,paddle.height);
    if (angle != null) { // bounce ball off paddle
        // HAX0RS: bias angle to aim upward to not piss of player
        angle[0] = Math.PI/2 + (angle[0]-Math.PI/2) / 2;

        // new trajectory is negative(reflect(oldtrajectory))
        // note that dy is negative of what it would be in cartesian
        var c = Math.cos(2*angle[0]);
        var s = Math.sin(2*angle[0]);
        var olddx = ball.dx;
        // update trajectory
        ball.dx = -c*olddx + s*ball.dy;
        ball.dy =  s*olddx + c*ball.dy;
        // update position and bbox
        ball.x = angle[1];
        ball.y = angle[2] - 1; // little bit cheating
        ball.bl = ball.x - ball.radius;
        ball.br = ball.x + ball.radius;
        ball.bt = ball.y - ball.radius;
        ball.bb = ball.y + ball.radius;

        // if paddle moving then speed up or slow down ball
        if (leftpressed) {
            ball.dx -= 1;
        }
        if (rightpressed) {
            ball.dx += 1;
        }
    }

    // win game
    if (bricks.num_left == 0) {
        ball.dx = 0;
        ball.dy = 0;
        paddle.dx = 0;
        canvas.addEventListener("click", restart_fn);
        drawutils.text(20, canvas.height/2+40, "You Win");
        drawutils.text(20, canvas.height/2+100, "click window to play again");
        clearInterval(updater);
    }

    // bounce ball and update bricks
    bricks.check_collisions(ball);

    // game over
    if (ball.y + ball.radius > canvas.height) {
        ball.dx = 0;
        ball.dy = 0;
        paddle.dx = 0;
        canvas.addEventListener("click", restart_fn);
        drawutils.text(20, canvas.height/2+40, "Game Over");
        drawutils.text(20, canvas.height/2+100, "click window to play again");
        clearInterval(updater);
    }

    paddle.update();
    ball.update();
}

