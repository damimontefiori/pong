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

// Penalty mode variables
let penaltyMode = false;
let penaltyRound = 0;
let penaltyTurn = 'left'; // 'left' or 'right'
let penaltyShotsLeft = 3;
let penaltyShotsRight = 3;
let penaltyGoalsLeft = 0;
let penaltyGoalsRight = 0;
let penaltyShootingPhase = false; // true when ball is in motion during penalty
let penaltyMessage = '';
let penaltyMessageTimer = 0;

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
    resetPenaltyMode();
    resetBall();
}

function resetPenaltyMode() {
    penaltyMode = false;
    penaltyRound = 0;
    penaltyTurn = 'left';
    penaltyShotsLeft = 3;
    penaltyShotsRight = 3;
    penaltyGoalsLeft = 0;
    penaltyGoalsRight = 0;
    penaltyShootingPhase = false;
    penaltyMessage = '';
    penaltyMessageTimer = 0;
}

function initPenaltyMode() {
    penaltyMode = true;
    penaltyMessage = '¡Modo Penaltis activado!';
    penaltyMessageTimer = 120; // Show message for 2 seconds at 60fps
    penaltyTurn = 'left';
    penaltyShotsLeft = 3;
    penaltyShotsRight = 3;
    penaltyGoalsLeft = 0;
    penaltyGoalsRight = 0;
    penaltyShootingPhase = false;
    
    // Position ball for penalty shot
    resetPenaltyBall();
}

function resetPenaltyBall() {
    if (penaltyTurn === 'left') {
        ballX = paddleWidth + 20;
        ballY = leftY + paddleHeight / 2 - ballSize / 2;
    } else {
        ballX = canvas.width - paddleWidth - 20 - ballSize;
        ballY = rightY + paddleHeight / 2 - ballSize / 2;
    }
    ballSpeedX = 0;
    ballSpeedY = 0;
}

function shootPenalty() {
    if (penaltyShootingPhase) return; // Already shooting
    
    penaltyShootingPhase = true;
    
    if (penaltyTurn === 'left') {
        // Shot from left paddle position toward right
        ballSpeedX = 6;
        ballSpeedY = (ballY + ballSize/2 - (leftY + paddleHeight/2)) * 0.1;
    } else {
        // Shot from right paddle position toward left
        ballSpeedX = -6;
        ballSpeedY = (ballY + ballSize/2 - (rightY + paddleHeight/2)) * 0.1;
    }
}

function updatePenalties() {
    if (penaltyMessageTimer > 0) {
        penaltyMessageTimer--;
        return;
    }
    
    if (penaltyShootingPhase) {
        // Ball is in motion during penalty shot
        ballX += ballSpeedX;
        ballY += ballSpeedY;
        
        // Top/bottom collision
        if (ballY <= 0 || ballY + ballSize >= canvas.height) ballSpeedY *= -1;
        
        // Check for goal or save
        if (penaltyTurn === 'left') {
            // Shooting toward right paddle
            if (ballX + ballSize >= canvas.width - paddleWidth) {
                if (ballY + ballSize > rightY && ballY < rightY + paddleHeight) {
                    // Saved by right paddle
                    penaltyMessage = 'Atajada del Jugador Derecho!';
                } else {
                    // Goal!
                    penaltyGoalsLeft++;
                    penaltyMessage = 'Gol del Jugador Izquierdo!';
                }
                penaltyMessageTimer = 60;
                penaltyShotsLeft--;
                endPenaltyShot();
            }
        } else {
            // Shooting toward left paddle
            if (ballX <= paddleWidth) {
                if (ballY + ballSize > leftY && ballY < leftY + paddleHeight) {
                    // Saved by left paddle
                    penaltyMessage = 'Atajada del Jugador Izquierdo!';
                } else {
                    // Goal!
                    penaltyGoalsRight++;
                    penaltyMessage = 'Gol del Jugador Derecho!';
                }
                penaltyMessageTimer = 60;
                penaltyShotsRight--;
                endPenaltyShot();
            }
        }
        
        // Ball went off sides (miss)
        if (ballX < -ballSize || ballX > canvas.width + ballSize) {
            penaltyMessage = 'Tiro fallado!';
            penaltyMessageTimer = 60;
            if (penaltyTurn === 'left') {
                penaltyShotsLeft--;
            } else {
                penaltyShotsRight--;
            }
            endPenaltyShot();
        }
    }
}

function endPenaltyShot() {
    penaltyShootingPhase = false;
    
    // Check if round is complete
    if (penaltyShotsLeft <= 0 && penaltyShotsRight <= 0) {
        checkPenaltyWinner();
    } else {
        // Switch turns
        penaltyTurn = penaltyTurn === 'left' ? 'right' : 'left';
        // Small delay before next shot
        setTimeout(() => {
            if (penaltyMode && !gameEnded) {
                resetPenaltyBall();
            }
        }, 1000);
    }
}

function checkPenaltyWinner() {
    if (penaltyGoalsLeft > penaltyGoalsRight) {
        gameEnded = true;
        winner = 'Jugador Izquierdo (Penaltis)';
        createConfetti();
    } else if (penaltyGoalsRight > penaltyGoalsLeft) {
        gameEnded = true;
        winner = 'Jugador Derecho (Penaltis)';
        createConfetti();
    } else {
        // Tie, start sudden death
        penaltyShotsLeft = 1;
        penaltyShotsRight = 1;
        penaltyTurn = 'left';
        penaltyMessage = '¡Muerte súbita!';
        penaltyMessageTimer = 60;
        setTimeout(() => {
            if (penaltyMode && !gameEnded) {
                resetPenaltyBall();
            }
        }, 1000);
    }
}

function update() {
    if (gameEnded) {
        updateConfetti();
        return;
    }
    
    if (penaltyMode) {
        updatePenalties();
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
        checkWinCondition();
    }
    if (ballX + ballSize > canvas.width) {
        leftScore++;
        checkWinCondition();
    }
}

function checkWinCondition() {
    // Check for penalty mode condition
    if (leftScore + rightScore > 20 && !penaltyMode) {
        // Check if no one has won yet
        if (!(leftScore >= WINNING_SCORE && leftScore - rightScore >= 2) && 
            !(rightScore >= WINNING_SCORE && rightScore - leftScore >= 2)) {
            initPenaltyMode();
            return;
        }
    }
    
    // Regular win conditions
    if (rightScore >= WINNING_SCORE && rightScore - leftScore >= 2) {
        gameEnded = true;
        winner = 'Jugador Derecho';
        createConfetti();
    } else if (leftScore >= WINNING_SCORE && leftScore - rightScore >= 2) {
        gameEnded = true;
        winner = 'Jugador Izquierdo';
        createConfetti();
    } else {
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
    
    if (penaltyMode && !gameEnded) {
        drawPenaltyMode();
    }
    
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

function drawPenaltyMode() {
    // Draw penalty scores
    ctx.fillStyle = '#ffff00';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PENALTIS', canvas.width / 2, 30);
    
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText(`Izq: ${penaltyGoalsLeft}/${3 - penaltyShotsLeft}`, canvas.width / 4, 80);
    ctx.fillText(`Der: ${penaltyGoalsRight}/${3 - penaltyShotsRight}`, 3 * canvas.width / 4, 80);
    
    // Show current turn
    if (!penaltyShootingPhase && penaltyMessageTimer <= 0) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '18px Arial';
        const turnText = penaltyTurn === 'left' ? 'Turno: Jugador Izquierdo' : 'Turno: Jugador Derecho';
        ctx.fillText(turnText, canvas.width / 2, canvas.height - 40);
        
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText('Presiona ESPACIO para disparar', canvas.width / 2, canvas.height - 20);
    }
    
    // Show penalty message
    if (penaltyMessage && penaltyMessageTimer > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
        
        ctx.fillStyle = '#ffff00';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(penaltyMessage, canvas.width / 2, canvas.height / 2);
    }
    
    ctx.textAlign = 'left'; // Reset text alignment
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

document.addEventListener('keydown', function(e) {
    // Restart game
    if (e.key === 'r' || e.key === 'R') {
        restartGame();
        return;
    }
    
    // Spacebar for penalty shots
    if (e.key === ' ' && penaltyMode && !penaltyShootingPhase && penaltyMessageTimer <= 0 && !gameEnded) {
        shootPenalty();
        return;
    }
    
    // Don't allow paddle movement if game ended (but allow in penalty mode)
    if (gameEnded) return;
    
    // W/S for left paddle
    if (e.key === 'w' && leftY > 0) leftY -= 20;
    if (e.key === 's' && leftY + paddleHeight < canvas.height) leftY += 20;
    // Up/Down for right paddle
    if (e.key === 'ArrowUp' && rightY > 0) rightY -= 20;
    if (e.key === 'ArrowDown' && rightY + paddleHeight < canvas.height) rightY += 20;
});
