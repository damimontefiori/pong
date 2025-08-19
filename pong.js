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
let gameEnded = false;
let winner = '';
const WINNING_SCORE = 5;

// Player names
let leftPlayerName = '';
let rightPlayerName = '';
const GREEK_GODS = [
    'Zeus', 'Hera', 'Poseidón', 'Atenea', 'Apolo', 'Artemisa', 
    'Afrodita', 'Ares', 'Hefesto', 'Deméter', 'Dioniso', 'Hermes',
    'Hades', 'Perséfone', 'Hestia', 'Hécate', 'Helios', 'Selene'
];

// Confetti system
let confetti = [];
const confettiColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'];

function createConfetti() {
    confetti = [];
    for (let i = 0; i < 100; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: -10,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 3 + 2,
            color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            size: Math.random() * 4 + 2,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        });
    }
}

function updateConfetti() {
    for (let i = confetti.length - 1; i >= 0; i--) {
        const particle = confetti[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;
        particle.vy += 0.1; // gravity
        
        // Remove particles that fall off screen
        if (particle.y > canvas.height + 10) {
            confetti.splice(i, 1);
        }
    }
}

function drawConfetti() {
    for (const particle of confetti) {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation * Math.PI / 180);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
        ctx.restore();
    }
}

function getRandomGreekGod() {
    return GREEK_GODS[Math.floor(Math.random() * GREEK_GODS.length)];
}

function initializePlayerNames() {
    const leftInput = document.getElementById('leftPlayerName');
    const rightInput = document.getElementById('rightPlayerName');
    
    leftPlayerName = leftInput && leftInput.value.trim() !== '' ? leftInput.value.trim() : getRandomGreekGod();
    rightPlayerName = rightInput && rightInput.value.trim() !== '' ? rightInput.value.trim() : getRandomGreekGod();
    
    // Ensure different names
    if (leftPlayerName === rightPlayerName) {
        rightPlayerName = getRandomGreekGod();
        // Try again if still the same
        let attempts = 0;
        while (leftPlayerName === rightPlayerName && attempts < 10) {
            rightPlayerName = getRandomGreekGod();
            attempts++;
        }
    }
}

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

function restartGame() {
    leftScore = 0;
    rightScore = 0;
    gameEnded = false;
    winner = '';
    confetti = [];
    initializePlayerNames();
    resetBall();
}

function update() {
    if (gameEnded) {
        updateConfetti();
        return;
    }
    
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
        if (rightScore >= WINNING_SCORE && rightScore - leftScore >= 2) {
            gameEnded = true;
            winner = rightPlayerName;
            createConfetti();
        } else {
            resetBall();
        }
    }
    if (ballX + ballSize > canvas.width) {
        leftScore++;
        if (leftScore >= WINNING_SCORE && leftScore - rightScore >= 2) {
            gameEnded = true;
            winner = leftPlayerName;
            createConfetti();
        } else {
            resetBall();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRect(0, leftY, paddleWidth, paddleHeight, '#fff');
    drawRect(canvas.width - paddleWidth, rightY, paddleWidth, paddleHeight, '#fff');
    drawBall(ballX, ballY, ballSize, '#fff');
    
    // Draw scores with player names
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(leftPlayerName + ': ' + leftScore, canvas.width / 4, 30);
    ctx.fillText(rightPlayerName + ': ' + rightScore, 3 * canvas.width / 4, 30);
    
    if (gameEnded) {
        drawConfetti();
        
        // Winner message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffff00';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('¡' + winner + ' Gana!', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText('Presiona R para reiniciar', canvas.width / 2, canvas.height / 2 + 30);
        
        ctx.textAlign = 'left'; // Reset text alignment
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

// Initialize player names when the page loads
initializePlayerNames();

document.addEventListener('keydown', function(e) {
    // Restart game
    if (e.key === 'r' || e.key === 'R') {
        restartGame();
        return;
    }
    
    // Don't allow paddle movement if game ended
    if (gameEnded) return;
    
    // W/S for left paddle
    if (e.key === 'w' && leftY > 0) leftY -= 20;
    if (e.key === 's' && leftY + paddleHeight < canvas.height) leftY += 20;
    // Up/Down for right paddle
    if (e.key === 'ArrowUp' && rightY > 0) rightY -= 20;
    if (e.key === 'ArrowDown' && rightY + paddleHeight < canvas.height) rightY += 20;
});
