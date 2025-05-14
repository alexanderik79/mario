import { showModal } from './utils.js';
import { initInput, resetGame, moveStars, checkCollisions, getGameState, setGameRunning } from './game.js';
import { drawStars, initBackground } from './render.js';

const startGameButton = document.getElementById('startGame');
if (!startGameButton) console.error('startGameButton not found');

const music = document.getElementById('backgroundMusic');
const musicToggle = document.getElementById('musicToggle');

let isMusicPlaying = true;
if (music) {
    musicToggle?.addEventListener('click', () => {
        if (isMusicPlaying) {
            music.pause();
            musicToggle.textContent = 'Unmute';
        } else {
            music.play().catch(e => console.error('Music play error:', e));
            musicToggle.textContent = 'Mute';
        }
        isMusicPlaying = !isMusicPlaying;
    });
}

const endGame = () => {
    setGameRunning(false);
    showModal('modalGameOver');
};

const winGame = () => {
    setGameRunning(false);
    showModal('modalWin');
};

const gameLoop = () => {
    const { gameRunning } = getGameState();
    if (!gameRunning) return;
    moveStars();
    checkCollisions(endGame, winGame);
    drawStars();
    requestAnimationFrame(gameLoop);
};

initInput();
startGameButton?.addEventListener('click', () => {
    console.log('Start button clicked');
    showModal(null);
    resetGame(initBackground);
    gameLoop();
});

showModal('modalWelcome');