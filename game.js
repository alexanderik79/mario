const canvas = document.getElementById('gameCanvas');
if (!canvas) console.error('gameCanvas not found');
const ctx = canvas?.getContext('2d');
if (!ctx) console.error('ctx not initialized');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORLD_SIZE = 5000;

const minimap = document.getElementById('minimap');
if (!minimap) console.error('minimap not found');
const minimapCtx = minimap?.getContext('2d');
if (!minimapCtx) console.error('minimapCtx not initialized');

const music = document.getElementById('backgroundMusic');
const musicToggle = document.getElementById('musicToggle');
const modalWelcome = document.getElementById('modalWelcome');
const modalGameOver = document.getElementById('modalGameOver');
const modalWin = document.getElementById('modalWin');
const startGameButton = document.getElementById('startGame');
if (!startGameButton) console.error('startGameButton not found');

let stars = [];
let player = null;
let particles = [];
let backgroundStars = [];
let fuelItems = [];
let score = 0;
let level = 1;
let fuel = 0;
const MAX_FUEL = 100;
let gameRunning = false;
const NUM_AI = 40;
const NUM_FUEL = 20;

const SETTINGS = {
    PLAYER_ACCELERATION: 0.3,
    BOOST_ACCELERATION: 0.6,
    FRICTION: 0.85,
    TAIL_SEGMENTS: 20, // Ещё больше сегментов для плавности
    TAIL_SPEED: 0.03,
    TAIL_WIDTH: 18,
    TAIL_LENGTH_PERCENT: { player: 900, ai: 900 }, // Длина хвоста в % от радиуса
    PARTICLE_LIFE: 50,
    PARTICLE_COUNT: 25,
    PULSE_SPEED: 0.05,
    BACKGROUND_STARS: 100,
    VISION_RANGE: 300,
    CHASE_SPEED: 0.05,
    FUEL_SPAWN_CHANCE: 0.02,
    FUEL_VALUE: 10,
    BOOST_COST: 2
};

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Shift: false
};

document.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});
document.addEventListener('keyup', e => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

let isMusicPlaying = true;
if (music) {
    // music.play().catch(e => console.error('Music play error:', e));
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

const showModal = (modalId) => {
    [modalWelcome, modalGameOver, modalWin].forEach(modal => {
        if (modal) modal.classList.add('hidden');
    });
    if (modalId) {
        const targetModal = document.getElementById(modalId);
        if (targetModal) targetModal.classList.remove('hidden');
    }
};

const random = (min, max) => Math.random() * (max - min) + min;

const createStar = (x, y, radius, isPlayer = false) => ({
    x,
    y,
    radius,
    baseRadius: radius,
    pulse: random(0, Math.PI * 2),
    dx: isPlayer ? 0 : random(-1.4, 1.4),
    dy: isPlayer ? 0 : random(-1.4, 1.4),
    color: isPlayer ? 'white' : `hsl(${random(0, 360)}, 100%, 70%)`,
    tailLength: radius * SETTINGS.TAIL_LENGTH_PERCENT[isPlayer ? 'player' : 'ai'] / 100,
    tailWidth: isPlayer ? SETTINGS.TAIL_WIDTH * 2 : SETTINGS.TAIL_WIDTH * 1.5,
    isPlayer,
    tailHistory: []
});

const createParticle = (x, y, color) => ({
    x,
    y,
    dx: random(-4, 4),
    dy: random(-4, 4),
    radius: random(3, 8),
    color: color.replace('70%', '90%'),
    life: SETTINGS.PARTICLE_LIFE * random(0.8, 1.2),
    maxLife: SETTINGS.PARTICLE_LIFE * random(0.8, 1.2)
});

const createFuel = (x, y) => ({
    x,
    y,
    radius: 5,
    color: 'yellow'
});

const createBackgroundStar = () => ({
    x: random(0, WIDTH),
    y: random(0, HEIGHT),
    radius: random(1, 3),
    alpha: random(0.3, 0.8),
    twinkleSpeed: random(0.02, 0.05)
});

const initBackground = () => {
    backgroundStars = [];
    for (let i = 0; i < SETTINGS.BACKGROUND_STARS; i++) {
        backgroundStars.push(createBackgroundStar());
    }
};

const spawnAI = () => {
    const r = random(4, 28);
    const x = random(r, WORLD_SIZE - r);
    const y = random(r, WORLD_SIZE - r);
    stars.push(createStar(x, y, r));
};

const spawnFuel = () => {
    const x = random(0, WORLD_SIZE);
    const y = random(0, WORLD_SIZE);
    fuelItems.push(createFuel(x, y));
};

const resetGame = () => {
    stars = [];
    particles = [];
    fuelItems = [];
    score = 0;
    level = 1;
    fuel = 0;
    player = createStar(WORLD_SIZE / 2, WORLD_SIZE / 2, 12, true);
    stars.push(player);
    initBackground();
    for (let i = 0; i < NUM_AI; i++) spawnAI();
    for (let i = 0; i < NUM_FUEL; i++) spawnFuel();
    gameRunning = true;
};

startGameButton?.addEventListener('click', () => {
    console.log('Start button clicked');
    showModal(null);
    gameRunning = true;
    resetGame();
    gameLoop();
});

const moveStars = () => {
    stars.forEach(star => {
        if (star.isPlayer) {
            const acceleration = keys.Shift && fuel >= SETTINGS.BOOST_COST ? SETTINGS.BOOST_ACCELERATION : SETTINGS.PLAYER_ACCELERATION;
            if (keys.ArrowLeft) star.dx -= acceleration;
            if (keys.ArrowRight) star.dx += acceleration;
            if (keys.ArrowUp) star.dy -= acceleration;
            if (keys.ArrowDown) star.dy += acceleration;
            star.dx *= SETTINGS.FRICTION;
            star.dy *= SETTINGS.FRICTION;
            star.x += star.dx;
            star.y += star.dy;
            star.x = Math.max(star.radius, Math.min(WORLD_SIZE - star.radius, star.x));
            star.y = Math.max(star.radius, Math.min(WORLD_SIZE - star.radius, star.y));
            if (keys.Shift && fuel >= SETTINGS.BOOST_COST) {
                fuel -= SETTINGS.BOOST_COST;
                if (fuel < 0) fuel = 0;
            }
        } else {
            let target = null;
            let fleeFrom = null;
            let minChaseDist = SETTINGS.VISION_RANGE;
            let minFleeDist = SETTINGS.VISION_RANGE;

            stars.forEach(other => {
                if (other === star) return;
                const dx = other.x - star.x;
                const dy = other.y - star.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (other.radius < star.radius && dist < minChaseDist) {
                    minChaseDist = dist;
                    target = other;
                }
                if (other.radius > star.radius && dist < minFleeDist) {
                    minFleeDist = dist;
                    fleeFrom = other;
                }
            });

            if (target) {
                const dx = target.x - star.x;
                const dy = target.y - star.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    star.dx += (dx / dist) * SETTINGS.CHASE_SPEED;
                    star.dy += (dy / dist) * SETTINGS.CHASE_SPEED;
                }
            } else if (fleeFrom) {
                const dx = star.x - fleeFrom.x;
                const dy = star.y - fleeFrom.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    star.dx += (dx / dist) * SETTINGS.CHASE_SPEED;
                    star.dy += (dy / dist) * SETTINGS.CHASE_SPEED;
                }
            }

            const speed = Math.sqrt(star.dx * star.dx + star.dy * star.dy);
            const maxSpeed = 1.4;
            if (speed > maxSpeed) {
                star.dx = (star.dx / speed) * maxSpeed;
                star.dy = (star.dy / speed) * maxSpeed;
            }

            star.x += star.dx;
            star.y += star.dy;
            if (star.x < star.radius || star.x > WORLD_SIZE - star.radius) star.dx *= -1;
            if (star.y < star.radius || star.y > WORLD_SIZE - star.radius) star.dy *= -1;
        }

        star.tailHistory.push({ x: star.x, y: star.y });
        if (star.tailHistory.length > SETTINGS.TAIL_SEGMENTS) {
            star.tailHistory.shift();
        }
    });

    if (Math.random() < SETTINGS.FUEL_SPAWN_CHANCE) {
        spawnFuel();
    }
};

const drawTails = (star, offsetX, offsetY) => {
    if (star.tailHistory.length < 2) return;

    ctx.beginPath();
    const gradient = ctx.createLinearGradient(
        star.x - offsetX,
        star.y - offsetY,
        star.tailHistory[0].x - offsetX,
        star.tailHistory[0].y - offsetY
    );
    gradient.addColorStop(0, star.isPlayer ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 200, 100, 0.9)');
    gradient.addColorStop(0.5, star.isPlayer ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 200, 100, 0.5)');
    gradient.addColorStop(1, star.isPlayer ? 'rgba(255, 255, 255, 0)' : 'rgba(255, 200, 100, 0)');
    ctx.strokeStyle = gradient;
    ctx.shadowBlur = star.isPlayer ? 25 : 20;
    ctx.shadowColor = star.isPlayer ? 'white' : 'yellow';

    // Сглаживание хвоста с помощью кривой Безье
    ctx.moveTo(star.x - offsetX, star.y - offsetY);
    for (let i = 1; i < star.tailHistory.length - 1; i += 2) {
        const p0 = star.tailHistory[i - 1] || star.tailHistory[0];
        const p1 = star.tailHistory[i];
        const p2 = star.tailHistory[i + 1] || p1;
        const t = i / star.tailHistory.length;
        const cx = (p0.x + p1.x + p2.x) / 3;
        const cy = (p0.y + p1.y + p2.y) / 3;
        ctx.lineWidth = star.tailWidth * (1 - t) * (Math.sqrt(star.dx * star.dx + star.dy * star.dy) / 2 + 0.5);
        ctx.quadraticCurveTo(
            p1.x - offsetX,
            p1.y - offsetY,
            cx - offsetX,
            cy - offsetY
        );
    }
    if (star.tailHistory.length >= 2) {
        const last = star.tailHistory[star.tailHistory.length - 1];
        ctx.lineTo(last.x - offsetX, last.y - offsetY);
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
};

const drawStars = () => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const offsetX = player.x - WIDTH / 2;
    const offsetY = player.y - HEIGHT / 2;

    backgroundStars.forEach(star => {
        star.alpha = 0.5 + 0.4 * Math.sin(Date.now() * star.twinkleSpeed);
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    stars.forEach(star => {
        star.pulse += SETTINGS.PULSE_SPEED;
        star.radius = star.baseRadius * (1 + 0.15 * Math.sin(star.pulse));
        drawTails(star, offsetX, offsetY);

        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
            star.x - offsetX,
            star.y - offsetY,
            0,
            star.x - offsetX,
            star.y - offsetY,
            star.radius
        );
        gradient.addColorStop(0, star.isPlayer ? 'rgba(255, 255, 255, 1)' : star.color);
        gradient.addColorStop(1, star.isPlayer ? 'rgba(255, 255, 255, 0.3)' : star.color.replace('70%', '30%'));
        ctx.fillStyle = gradient;
        ctx.shadowBlur = star.isPlayer ? 20 : 15;
        ctx.shadowColor = star.color;
        const angle = Math.atan2(star.dy, star.dx);
        try {
            ctx.ellipse(
                star.x - offsetX,
                star.y - offsetY,
                star.isPlayer ? star.radius * 1.5 : star.radius,
                star.radius * 0.7,
                angle,
                0,
                Math.PI * 2
            );
        } catch (e) {
            console.error('Ellipse error:', e);
            ctx.arc(star.x - offsetX, star.y - offsetY, star.radius, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    fuelItems.forEach(fuel => {
        ctx.beginPath();
        ctx.fillStyle = fuel.color;
        ctx.arc(fuel.x - offsetX, fuel.y - offsetY, fuel.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = p.color.replace('90%', `${90 * (p.life / p.maxLife)}%`);
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.arc(p.x - offsetX, p.y - offsetY, p.radius, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) particles.splice(particles.indexOf(p), 1);
    });
    ctx.globalAlpha = 1;

    updateUI();
    drawMinimap();
};

const checkCollisions = () => {
    for (let i = stars.length - 1; i >= 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
            const a = stars[i];
            const b = stars[j];
            if (!a || !b) continue;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < a.radius + b.radius) {
                const [bigger, smaller] = a.radius > b.radius ? [a, b] : [b, a];
                if (bigger === smaller) continue;

                if (smaller.isPlayer) {
                    endGame();
                    return;
                }

                for (let k = 0; k < SETTINGS.PARTICLE_COUNT; k++) {
                    particles.push(createParticle(smaller.x, smaller.y, smaller.color));
                }

                bigger.radius += smaller.radius * 0.1;
                bigger.baseRadius = bigger.radius;
                bigger.tailLength = bigger.radius * SETTINGS.TAIL_LENGTH_PERCENT[bigger.isPlayer ? 'player' : 'ai'] / 100;
                if (bigger.isPlayer) {
                    score++;
                    if (score % 5 === 0) level++;
                }
                stars.splice(stars.indexOf(smaller), 1);
                spawnAI();
            }
        }
    }

    for (let i = fuelItems.length - 1; i >= 0; i--) {
        const fuelItem = fuelItems[i];
        const dx = player.x - fuelItem.x;
        const dy = player.y - fuelItem.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.radius + fuelItem.radius) {
            fuel = Math.min(MAX_FUEL, fuel + SETTINGS.FUEL_VALUE);
            fuelItems.splice(i, 1);
            spawnFuel();
        }
    }

    if (player && stars.every(star => star === player || star.radius <= player.radius)) {
        winGame();
    }
};

const drawMinimap = () => {
    minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    minimapCtx.fillRect(0, 0, minimap.width, minimap.height);
    minimapCtx.strokeStyle = 'white';
    minimapCtx.strokeRect(0, 0, minimap.width, minimap.height);

    const scale = minimap.width / WORLD_SIZE;
    stars.forEach(s => {
        minimapCtx.fillStyle = s.isPlayer ? 'white' : 'gray';
        minimapCtx.beginPath();
        minimapCtx.arc(s.x * scale, s.y * scale, 3, 0, Math.PI * 2);
        minimapCtx.fill();
    });
};

const updateUI = () => {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('level').textContent = `Level: ${level}`;
    document.getElementById('fuel') ? document.getElementById('fuel').textContent = `Fuel: ${Math.floor(fuel)}/${MAX_FUEL}` : null;
};

const endGame = () => {
    gameRunning = false;
    showModal('modalGameOver');
};

const winGame = () => {
    gameRunning = false;
    showModal('modalWin');
};

const restartGame = () => {
    showModal('modalWelcome');
    gameRunning = false;
};

const gameLoop = () => {
    if (!gameRunning) return;
    moveStars();
    checkCollisions();
    drawStars();
    requestAnimationFrame(gameLoop);
};

showModal('modalWelcome');