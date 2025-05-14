import { SETTINGS, WORLD_SIZE, NUM_AI, NUM_FUEL, MAX_FUEL } from './config.js';
import { createStar, createParticle, createFuel } from './entities.js';

let stars = [];
let player = null;
let particles = [];
let fuelItems = [];
let score = 0;
let level = 1;
let fuel = 0;
let gameRunning = false;

export const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Shift: false
};

export const initInput = () => {
    document.addEventListener('keydown', e => {
        if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    });
    document.addEventListener('keyup', e => {
        if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    });
};

export const resetGame = (initBackground) => {
    stars = [];
    particles = [];
    fuelItems = [];
    score = 0;
    level = 1;
    fuel = 0;
    player = createStar(WORLD_SIZE / 2, WORLD_SIZE / 2, 12, true);
    stars.push(player);
    console.log('Player created:', player); // Отладка
    console.log('Stars after reset:', stars.length, 'Player in stars:', stars.includes(player));
    initBackground();
    for (let i = 0; i < NUM_AI; i++) spawnAI();
    for (let i = 0; i < NUM_FUEL; i++) spawnFuel();
    gameRunning = true;
};

const spawnAI = () => {
    const r = Math.random() * (28 - 4) + 4;
    const x = Math.random() * (WORLD_SIZE - 2 * r) + r;
    const y = Math.random() * (WORLD_SIZE - 2 * r) + r;
    stars.push(createStar(x, y, r));
};

const spawnFuel = () => {
    const x = Math.random() * WORLD_SIZE;
    const y = Math.random() * WORLD_SIZE;
    fuelItems.push(createFuel(x, y));
};

export const moveStars = () => {
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

        star.tailFrameCounter = (star.tailFrameCounter || 0) + 1;
        if (star.tailFrameCounter >= SETTINGS.TAIL_UPDATE_INTERVAL) {
            star.tailHistory.push({ x: star.x, y: star.y });
            if (star.tailHistory.length > star.tailSegments) {
                star.tailHistory.shift();
            }
            star.tailFrameCounter = 0;
        }
    });

    if (Math.random() < SETTINGS.FUEL_SPAWN_CHANCE) {
        spawnFuel();
    }
};

export const checkCollisions = (endGame, winGame) => {
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
                bigger.tailSegments = Math.floor(bigger.radius * SETTINGS.TAIL_LENGTH_PERCENT[bigger.isPlayer ? 'player' : 'ai'] / 100 * SETTINGS.TAIL_POINTS_PER_PERCENT);
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

export const getGameState = () => {
    console.log('getGameState: Player exists:', !!player, 'Stars count:', stars.length); // Отладка
    return {
        stars,
        player,
        particles,
        fuelItems,
        score,
        level,
        fuel,
        gameRunning
    };
};

export const setGameRunning = (value) => {
    gameRunning = value;
};