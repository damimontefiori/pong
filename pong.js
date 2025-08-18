// Configuración del canvas y contexto de renderizado
const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Constantes del juego - dimensiones de elementos
const paddleWidth = 10, paddleHeight = 80;  // Ancho y alto de las paletas
const ballSize = 10;  // Tamaño de la pelota

// Variables de posición de las paletas (centradas verticalmente)
let leftY = canvas.height / 2 - paddleHeight / 2;   // Posición Y de la paleta izquierda
let rightY = canvas.height / 2 - paddleHeight / 2;  // Posición Y de la paleta derecha

// Variables de posición y velocidad de la pelota
let ballX = canvas.width / 2 - ballSize / 2;   // Posición X de la pelota (centrada)
let ballY = canvas.height / 2 - ballSize / 2;  // Posición Y de la pelota (centrada)
let ballSpeedX = 4, ballSpeedY = 2;  // Velocidad de la pelota en X e Y

// Variables del estado del juego
let leftScore = 0, rightScore = 0;  // Puntuaciones de ambos jugadores
let gameEnded = false;  // Estado del juego (terminado o en progreso)
let winner = '';  // Ganador del juego
const WINNING_SCORE = 5;  // Puntuación necesaria para ganar

// Sistema de confeti para la celebración de victoria
let confetti = [];  // Array que almacena las partículas de confeti
const confettiColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'];

/**
 * Crea partículas de confeti para la animación de victoria
 * Genera 100 partículas con propiedades aleatorias de posición, velocidad, color y rotación
 */
function createConfetti() {
    confetti = [];
    for (let i = 0; i < 100; i++) {
        confetti.push({
            x: Math.random() * canvas.width,  // Posición X aleatoria en todo el ancho del canvas
            y: -10,  // Inicia arriba del canvas
            vx: (Math.random() - 0.5) * 4,  // Velocidad horizontal aleatoria
            vy: Math.random() * 3 + 2,  // Velocidad vertical hacia abajo
            color: confettiColors[Math.floor(Math.random() * confettiColors.length)],  // Color aleatorio
            size: Math.random() * 4 + 2,  // Tamaño aleatorio entre 2 y 6
            rotation: Math.random() * 360,  // Rotación inicial aleatoria
            rotationSpeed: (Math.random() - 0.5) * 10  // Velocidad de rotación aleatoria
        });
    }
}

/**
 * Actualiza la física de las partículas de confeti
 * Aplica movimiento, rotación y gravedad a cada partícula
 * Elimina partículas que han salido de la pantalla
 */
function updateConfetti() {
    for (let i = confetti.length - 1; i >= 0; i--) {
        const particle = confetti[i];
        particle.x += particle.vx;  // Actualiza posición horizontal
        particle.y += particle.vy;  // Actualiza posición vertical
        particle.rotation += particle.rotationSpeed;  // Actualiza rotación
        particle.vy += 0.1; // Aplica gravedad
        
        // Elimina partículas que han caído fuera de la pantalla
        if (particle.y > canvas.height + 10) {
            confetti.splice(i, 1);
        }
    }
}

/**
 * Dibuja todas las partículas de confeti en pantalla
 * Aplica transformaciones de posición y rotación a cada partícula
 */
function drawConfetti() {
    for (const particle of confetti) {
        ctx.save();  // Guarda el estado actual del contexto
        ctx.translate(particle.x, particle.y);  // Traslada al centro de la partícula
        ctx.rotate(particle.rotation * Math.PI / 180);  // Aplica rotación
        ctx.fillStyle = particle.color;  // Establece el color de la partícula
        ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);  // Dibuja la partícula centrada
        ctx.restore();  // Restaura el estado anterior del contexto
    }
}

/**
 * Función utilitaria para dibujar rectángulos
 * @param {number} x - Posición X del rectángulo
 * @param {number} y - Posición Y del rectángulo
 * @param {number} w - Ancho del rectángulo
 * @param {number} h - Alto del rectángulo
 * @param {string} color - Color del rectángulo en formato CSS
 */
function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

/**
 * Función utilitaria para dibujar la pelota (cuadrada)
 * @param {number} x - Posición X de la pelota
 * @param {number} y - Posición Y de la pelota
 * @param {number} size - Tamaño de la pelota
 * @param {string} color - Color de la pelota en formato CSS
 */
function drawBall(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
}

/**
 * Función utilitaria para dibujar texto en pantalla
 * @param {string} text - Texto a mostrar
 * @param {number} x - Posición X del texto
 * @param {number} y - Posición Y del texto
 */
function drawText(text, x, y) {
    ctx.fillStyle = '#fff';
    ctx.font = '32px Arial';
    ctx.fillText(text, x, y);
}

/**
 * Reinicia la pelota al centro del campo después de un punto
 * Invierte la dirección horizontal y randomiza la dirección vertical
 */
function resetBall() {
    ballX = canvas.width / 2 - ballSize / 2;  // Centra la pelota horizontalmente
    ballY = canvas.height / 2 - ballSize / 2;  // Centra la pelota verticalmente
    ballSpeedX *= -1;  // Invierte la dirección horizontal para el próximo saque
    ballSpeedY = 2 * (Math.random() > 0.5 ? 1 : -1);  // Dirección vertical aleatoria
}

/**
 * Reinicia completamente el juego al estado inicial
 * Resetea puntuaciones, estado del juego y limpia efectos visuales
 */
function restartGame() {
    leftScore = 0;      // Resetea puntuación del jugador izquierdo
    rightScore = 0;     // Resetea puntuación del jugador derecho
    gameEnded = false;  // Reanuda el juego
    winner = '';        // Limpia el ganador
    confetti = [];      // Limpia las partículas de confeti
    resetBall();        // Reinicia la pelota
}

/**
 * Función principal que actualiza la lógica del juego en cada frame
 * Maneja movimiento de la pelota, colisiones, puntuación y condiciones de victoria
 */
function update() {
    // Si el juego ha terminado, solo actualiza el confeti
    if (gameEnded) {
        updateConfetti();
        return;
    }
    
    // Actualiza la posición de la pelota según su velocidad
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Detecta colisiones con los bordes superior e inferior
    if (ballY <= 0 || ballY + ballSize >= canvas.height) ballSpeedY *= -1;

    // Detecta colisión con la paleta izquierda
    if (ballX <= paddleWidth && ballY + ballSize > leftY && ballY < leftY + paddleHeight) {
        ballSpeedX *= -1;  // Invierte dirección horizontal
    }
    // Detecta colisión con la paleta derecha
    if (ballX + ballSize >= canvas.width - paddleWidth && ballY + ballSize > rightY && ballY < rightY + paddleHeight) {
        ballSpeedX *= -1;  // Invierte dirección horizontal
    }

    // Lógica de puntuación - pelota sale por el lado izquierdo
    if (ballX < 0) {
        rightScore++;  // Punto para el jugador derecho
        if (rightScore >= WINNING_SCORE) {
            gameEnded = true;
            winner = 'Jugador Derecho';
            createConfetti();  // Crea animación de victoria
        } else {
            resetBall();  // Continúa el juego
        }
    }
    // Lógica de puntuación - pelota sale por el lado derecho
    if (ballX + ballSize > canvas.width) {
        leftScore++;  // Punto para el jugador izquierdo
        if (leftScore >= WINNING_SCORE) {
            gameEnded = true;
            winner = 'Jugador Izquierdo';
            createConfetti();  // Crea animación de victoria
        } else {
            resetBall();  // Continúa el juego
        }
    }
}

/**
 * Función de renderizado que dibuja todos los elementos del juego
 * Maneja la visualización del campo, paletas, pelota, puntuación y pantalla de victoria
 */
function draw() {
    // Limpia el canvas para el siguiente frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibuja las paletas de ambos jugadores
    drawRect(0, leftY, paddleWidth, paddleHeight, '#fff');  // Paleta izquierda
    drawRect(canvas.width - paddleWidth, rightY, paddleWidth, paddleHeight, '#fff');  // Paleta derecha
    
    // Dibuja la pelota
    drawBall(ballX, ballY, ballSize, '#fff');
    
    // Dibuja las puntuaciones en sus respectivas posiciones
    drawText(leftScore, canvas.width / 4, 50);      // Puntuación del jugador izquierdo
    drawText(rightScore, 3 * canvas.width / 4, 50); // Puntuación del jugador derecho
    
    // Si el juego ha terminado, muestra la pantalla de victoria
    if (gameEnded) {
        drawConfetti();  // Dibuja la animación de confeti
        
        // Dibuja un overlay semi-transparente sobre el juego
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Muestra el mensaje de victoria
        ctx.fillStyle = '#ffff00';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('¡' + winner + ' Gana!', canvas.width / 2, canvas.height / 2 - 30);
        
        // Muestra las instrucciones para reiniciar
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText('Presiona R para reiniciar', canvas.width / 2, canvas.height / 2 + 30);
        
        ctx.textAlign = 'left'; // Restaura la alineación del texto por defecto
    }
}

/**
 * Bucle principal del juego que se ejecuta continuamente
 * Actualiza la lógica del juego y renderiza los gráficos en cada frame
 */
function gameLoop() {
    update();  // Actualiza la lógica del juego
    draw();    // Renderiza los gráficos
    requestAnimationFrame(gameLoop);  // Programa el siguiente frame
}

// Inicia el bucle del juego
gameLoop();

/**
 * Manejo de eventos de teclado para controlar las paletas y reiniciar el juego
 * Controles:
 * - W/S: Paleta izquierda arriba/abajo
 * - Flechas arriba/abajo: Paleta derecha arriba/abajo  
 * - R: Reiniciar juego
 */
document.addEventListener('keydown', function(e) {
    // Reiniciar juego con la tecla R
    if (e.key === 'r' || e.key === 'R') {
        restartGame();
        return;
    }
    
    // No permitir movimiento de paletas si el juego ha terminado
    if (gameEnded) return;
    
    // Controles para la paleta izquierda (W/S)
    if (e.key === 'w' && leftY > 0) leftY -= 20;  // Mover arriba
    if (e.key === 's' && leftY + paddleHeight < canvas.height) leftY += 20;  // Mover abajo
    
    // Controles para la paleta derecha (flechas arriba/abajo)
    if (e.key === 'ArrowUp' && rightY > 0) rightY -= 20;  // Mover arriba
    if (e.key === 'ArrowDown' && rightY + paddleHeight < canvas.height) rightY += 20;  // Mover abajo
});
