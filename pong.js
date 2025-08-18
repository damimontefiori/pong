const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

const paddleWidth = 10, paddleHeight = 80;
const ballSize = 10;
let leftY = canvas.height / 2 - paddleHeight / 2;
let rightY = canvas.height / 2 - paddleHeight / 2;
let ballX = canvas.width / 2 - ballSize / 2;
let ballY = canvas.height / 2 - ballSize / 2;
let ballSpeedX = 4, ballSpeedY = 2;
let leftScore = 0, rightScore = 0;

function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawBall(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
}

function drawText(text, x, y) {
    ctx.fillStyle = '#fff';
    ctx.font = '32px Arial';
    ctx.fillText(text, x, y);
}

function resetBall() {
    ballX = canvas.width / 2 - ballSize / 2;
    ballY = canvas.height / 2 - ballSize / 2;
    ballSpeedX *= -1;
    ballSpeedY = 2 * (Math.random() > 0.5 ? 1 : -1);
}

function update() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Top/bottom collision
    if (ballY <= 0 || ballY + ballSize >= canvas.height) ballSpeedY *= -1;

    // Left paddle collision
    if (ballX <= paddleWidth && ballY + ballSize > leftY && ballY < leftY + paddleHeight) {
        ballSpeedX *= -1;
    }
    // Right paddle collision
    if (ballX + ballSize >= canvas.width - paddleWidth && ballY + ballSize > rightY && ballY < rightY + paddleHeight) {
        ballSpeedX *= -1;
    }

    // Score
    if (ballX < 0) {
        rightScore++;
        resetBall();
    }
    if (ballX + ballSize > canvas.width) {
        leftScore++;
        resetBall();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRect(0, leftY, paddleWidth, paddleHeight, '#fff');
    drawRect(canvas.width - paddleWidth, rightY, paddleWidth, paddleHeight, '#fff');
    drawBall(ballX, ballY, ballSize, '#fff');
    drawText(leftScore, canvas.width / 4, 50);
    drawText(rightScore, 3 * canvas.width / 4, 50);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

document.addEventListener('keydown', function(e) {
    // W/S for left paddle
    if (e.key === 'w' && leftY > 0) leftY -= 20;
    if (e.key === 's' && leftY + paddleHeight < canvas.height) leftY += 20;
    // Up/Down for right paddle
    if (e.key === 'ArrowUp' && rightY > 0) rightY -= 20;
    if (e.key === 'ArrowDown' && rightY + paddleHeight < canvas.height) rightY += 20;
});
