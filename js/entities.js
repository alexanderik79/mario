import { random } from './utils.js';
import { SETTINGS } from './config.js';

// const virusTypes = ['cluster', 'chain', 'filamentous', 'corona', 'amoeba'];
const virusTypes = ['cluster', 'corona', 'amoeba'];

export const createStar = (x, y, radius, isPlayer = false) => {
    const tailLengthPercent = SETTINGS.TAIL_LENGTH_PERCENT[isPlayer ? 'player' : 'ai'];
    return {
        x,
        y,
        radius,
        baseRadius: radius,
        pulse: random(0, Math.PI * 2),
        dx: isPlayer ? 0 : random(-1.4, 1.4),
        dy: isPlayer ? 0 : random(-1.4, 1.4),
        color: isPlayer
            ? 'rgba(200, 255, 200, 1)'
            : `hsl(${random(200, 360)}, 80%, 60%)`,
        texture: isPlayer ? 'cell' : 'virus',
        virusType: isPlayer ? null : virusTypes[Math.floor(random(0, virusTypes.length))],
        tailLength: radius * tailLengthPercent / 100,
        tailWidth: isPlayer ? SETTINGS.TAIL_WIDTH * 2 : SETTINGS.TAIL_WIDTH * 1.5,
        tailSegments: Math.floor(radius * tailLengthPercent / 100 * SETTINGS.TAIL_POINTS_PER_PERCENT),
        tailFrameCounter: 0,
        isPlayer,
        tailHistory: [],
        jitter: random(0, Math.PI * 2)
    };
};

export const createParticle = (x, y, color) => ({
    x,
    y,
    dx: random(-4, 4),
    dy: random(-4, 4),
    radius: random(3, 8),
    color: color.replace('60%', '80%'),
    life: SETTINGS.PARTICLE_LIFE * random(0.8, 1.2),
    maxLife: SETTINGS.PARTICLE_LIFE * random(0.8, 1.2)
});

export const createFuel = (x, y) => ({
    x,
    y,
    radius: 5,
    color: 'rgba(255, 255, 100, 0.8)'
});

export const createBackgroundStar = () => ({
    x: random(0, window.innerWidth),
    y: random(0, window.innerHeight),
    radius: random(1, 3),
    alpha: random(0.3, 0.8),
    twinkleSpeed: random(0.02, 0.05)
});