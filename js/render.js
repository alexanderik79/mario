import { SETTINGS, WORLD_SIZE, MAX_FUEL } from './config.js';
import { getGameState, keys } from './game.js';

const canvas = document.getElementById('gameCanvas');
if (!canvas) console.error('gameCanvas not found');
const ctx = canvas?.getContext('2d');
if (!ctx) console.error('ctx not initialized');

const updateCanvasSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};
updateCanvasSize();
window.addEventListener('resize', updateCanvasSize);

const WIDTH = () => canvas.width;
const HEIGHT = () => canvas.height;

const minimap = document.getElementById('minimap');
if (!minimap) console.error('minimap not found');
const minimapCtx = minimap?.getContext('2d');
if (!minimapCtx) console.error('minimapCtx not initialized');

let backgroundStars = [];

export const initBackground = () => {
    backgroundStars = [];
    for (let i = 0; i < SETTINGS.BACKGROUND_STARS; i++) {
        backgroundStars.push({
            x: Math.random() * WIDTH(),
            y: Math.random() * HEIGHT(),
            radius: Math.random() * (3 - 1) + 1,
            alpha: Math.random() * (0.8 - 0.3) + 0.3,
            twinkleSpeed: Math.random() * (0.05 - 0.02) + 0.02
        });
    }
};

export const drawTails = (star, offsetX, offsetY) => {
    if (star.tailHistory.length < 2) {
        console.log('Tail history too short:', star.tailHistory.length, star.isPlayer ? 'Player' : 'AI');
        return;
    }

    const speed = Math.sqrt(star.dx * star.dx + star.dy * star.dy);
    const speedFactor = Math.min(speed / 2 + 1, 2);
    const time = Date.now() * SETTINGS.TAIL_WAVE_SPEED;

    if (star.isPlayer) {
        const tailCount = SETTINGS.TAIL_COUNT;
        for (let t = 0; t < tailCount; t++) {
            const angleOffset = ((t - (tailCount - 1) / 2) / tailCount) * Math.PI * 0.3;
            const lengthVariation = 1 + (t % 2) * 0.1;
            ctx.beginPath();
            let gradient = ctx.createLinearGradient(
                star.x - offsetX,
                star.y - offsetY,
                star.tailHistory[0].x - offsetX,
                star.tailHistory[0].y - offsetY
            );
            const hue = 160 + t * 10;
            gradient.addColorStop(0, `hsla(${hue}, 80%, 80%, 0.9)`);
            gradient.addColorStop(0.5, `hsla(${hue}, 80%, 80%, 0.5)`);
            gradient.addColorStop(1, `hsla(${hue}, 80%, 80%, 0)`);
            ctx.strokeStyle = gradient;
            ctx.shadowBlur = 15 * speedFactor;
            ctx.shadowColor = `hsla(${hue}, 80%, 80%, 0.6)`;

            ctx.moveTo(star.x - offsetX, star.y - offsetY);
            for (let i = 1; i < star.tailHistory.length; i++) {
                const p = star.tailHistory[i];
                const tFraction = i / star.tailHistory.length;
                const wave = Math.sin(tFraction * star.tailHistory.length * SETTINGS.TAIL_WAVE_FREQUENCY + time + t) * SETTINGS.TAIL_WAVE_AMPLITUDE * (1 - tFraction);
                const x = p.x - offsetX + Math.cos(angleOffset + Math.PI / 2) * wave;
                const y = p.y - offsetY + Math.sin(angleOffset + Math.PI / 2) * wave;
                ctx.lineWidth = star.tailWidth * (1 - tFraction) * speedFactor * lengthVariation * 0.8;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        if (keys.Shift && getGameState().fuel >= SETTINGS.BOOST_COST) {
            for (let t = 0; t < tailCount; t++) {
                const angleOffset = ((t - (tailCount - 1) / 2) / tailCount) * Math.PI * 0.3;
                const lengthVariation = 1 + (t % 2) * 0.1;
                ctx.beginPath();
                let gradient = ctx.createLinearGradient(
                    star.x - offsetX,
                    star.y - offsetY,
                    star.tailHistory[0].x - offsetX,
                    star.tailHistory[0].y - offsetY
                );
                const hue = 160 + t * 5;
                gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 1)`);
                gradient.addColorStop(0.5, `hsla(${hue}, 100%, 70%, 0.6)`);
                gradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);
                ctx.strokeStyle = gradient;
                ctx.shadowBlur = 20 * speedFactor;
                ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.7)`;

                ctx.moveTo(star.x - offsetX, star.y - offsetY);
                for (let i = 1; i < star.tailHistory.length; i++) {
                    const p = star.tailHistory[i];
                    const tFraction = i / star.tailHistory.length;
                    const wave = Math.sin(tFraction * star.tailHistory.length * SETTINGS.TAIL_WAVE_FREQUENCY + time + t) * SETTINGS.TAIL_WAVE_AMPLITUDE * (1 - tFraction) * 1.2;
                    const x = p.x - offsetX + Math.cos(angleOffset + Math.PI / 2) * wave;
                    const y = p.y - offsetY + Math.sin(angleOffset + Math.PI / 2) * wave;
                    ctx.lineWidth = star.tailWidth * (1 - tFraction) * speedFactor * lengthVariation * 0.6;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        }
    } else {
        ctx.beginPath();
        let gradient = ctx.createLinearGradient(
            star.x - offsetX,
            star.y - offsetY,
            star.tailHistory[0].x - offsetX,
            star.tailHistory[0].y - offsetY
        );
        gradient.addColorStop(0, star.color.replace('60%', '70%'));
        gradient.addColorStop(0.5, star.color.replace('60%', '40%'));
        gradient.addColorStop(1, star.color.replace('60%', '0%'));
        ctx.strokeStyle = gradient;
        ctx.shadowBlur = 10 * speedFactor;
        ctx.shadowColor = star.color.replace('60%', '40%');

        ctx.moveTo(star.x - offsetX, star.y - offsetY);
        for (let i = 1; i < star.tailHistory.length; i++) {
            const p = star.tailHistory[i];
            const tFraction = i / star.tailHistory.length;
            const wave = Math.sin(tFraction * star.tailHistory.length * SETTINGS.TAIL_WAVE_FREQUENCY + time) * SETTINGS.TAIL_WAVE_AMPLITUDE * 0.5 * (1 - tFraction);
            const x = p.x - offsetX + wave;
            const y = p.y - offsetY;
            ctx.lineWidth = star.tailWidth * (1 - tFraction) * speedFactor * 0.8;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    ctx.shadowBlur = 0;
};

export const drawStars = () => {
    const { stars, player, particles, fuelItems, score, level, fuel } = getGameState();
    ctx.clearRect(0, 0, WIDTH(), HEIGHT());
    const offsetX = player.x - WIDTH() / 2;
    const offsetY = player.y - HEIGHT() / 2;

    backgroundStars.forEach(star => {
        star.alpha = 0.5 + 0.4 * Math.sin(Date.now() * star.twinkleSpeed);
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    stars.forEach(star => {
        star.pulse += SETTINGS.PULSE_SPEED;
        star.jitter += 0.1;
        star.radius = star.baseRadius * (1 + 0.2 * Math.sin(star.pulse));
        const jitterX = Math.sin(star.jitter) * star.radius * 0.1;
        const jitterY = Math.cos(star.jitter) * star.radius * 0.1;
        drawTails(star, offsetX, offsetY);

        ctx.save();
        ctx.translate(star.x - offsetX + jitterX, star.y - offsetY + jitterY);

        if (star.isPlayer) {
            ctx.beginPath();
            const points = 8;
            const irregularity = 0.2;
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const r = star.radius * (1 + Math.sin(angle * 3 + star.pulse) * irregularity);
                const x = r * Math.cos(angle);
                const y = r * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();

            const gradient = ctx.createRadialGradient(
                0,
                0,
                0,
                0,
                0,
                star.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(200, 255, 200, 0.6)');
            gradient.addColorStop(1, 'rgba(200, 255, 200, 0.3)');
            ctx.fillStyle = gradient;
            ctx.shadowBlur = 25;
            ctx.shadowColor = 'rgba(200, 255, 200, 0.7)';
            ctx.fill();
        } else {
            if (star.virusType === 'cluster') {
                const sphereCount = Math.floor(Math.random() * 3) + 5;
                for (let i = 0; i < sphereCount; i++) {
                    ctx.beginPath();
                    const angle = (i / sphereCount) * Math.PI * 2 + star.pulse * 0.1;
                    const r = star.radius * 0.4 * (1 + Math.sin(star.jitter + i) * 0.1);
                    const x = Math.cos(angle) * star.radius * 0.6;
                    const y = Math.sin(angle) * star.radius * 0.6;
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
                    gradient.addColorStop(0, star.color.replace('60%', '80%'));
                    gradient.addColorStop(0.5, star.color);
                    gradient.addColorStop(1, star.color.replace('60%', '40%'));
                    ctx.fillStyle = gradient;
                    ctx.fill();
                }
                ctx.shadowBlur = 20;
                ctx.shadowColor = star.color.replace('60%', '50%');
            } else {
                ctx.beginPath();
                let points, irregularity, spikes = false;
                switch (star.virusType) {
                    case 'corona':
                        points = 16;
                        irregularity = 0.2;
                        spikes = true;
                        break;
                    case 'amoeba':
                        points = 10;
                        irregularity = 0.5;
                        break;
                }

                for (let i = 0; i < points; i++) {
                    const angle = (i / points) * Math.PI * 2;
                    const r = star.radius * (1 + Math.sin(angle * (star.virusType === 'amoeba' ? 5 : 3) + star.pulse) * irregularity);
                    const x = r * Math.cos(angle);
                    const y = r * Math.sin(angle);
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();

                const gradient = ctx.createRadialGradient(
                    0,
                    0,
                    0,
                    0,
                    0,
                    star.radius
                );
                if (star.virusType === 'amoeba') {
                    gradient.addColorStop(0, star.color.replace('60%', '70%'));
                    gradient.addColorStop(0.5, star.color);
                    gradient.addColorStop(1, star.color.replace('60%', '40%'));
                } else {
                    gradient.addColorStop(0, star.color.replace('60%', '80%'));
                    gradient.addColorStop(0.5, star.color);
                    gradient.addColorStop(1, star.color.replace('60%', '40%'));
                }
                ctx.fillStyle = gradient;
                ctx.shadowBlur = 20;
                ctx.shadowColor = star.color.replace('60%', '50%');
                ctx.fill();

                if (spikes) {
                    ctx.beginPath();
                    const spikeCount = 16;
                    for (let i = 0; i < spikeCount; i++) {
                        const angle = (i / spikeCount) * Math.PI * 2;
                        const r = star.radius * 1.2;
                        const x = r * Math.cos(angle);
                        const y = r * Math.sin(angle);
                        ctx.moveTo(0, 0);
                        ctx.lineTo(x, y);
                    }
                    ctx.strokeStyle = star.color.replace('60%', '70%');
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                if (star.virusType === 'amoeba') {
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        const r = star.radius * 0.3;
                        const x = (Math.random() - 0.5) * star.radius * 0.8;
                        const y = (Math.random() - 0.5) * star.radius * 0.8;
                        ctx.arc(x, y, r, 0, Math.PI * 2);
                        ctx.fillStyle = star.color.replace('60%', '90%');
                        ctx.globalAlpha = 0.5;
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                }
            }
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    });

    fuelItems.forEach(fuel => {
        ctx.beginPath();
        ctx.fillStyle = fuel.color;
        ctx.arc(fuel.x - offsetX, fuel.y - offsetY, fuel.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = p.color.replace('80%', `${80 * (p.life / p.maxLife)}%`);
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.arc(p.x - offsetX, p.y - offsetY, p.radius, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) particles.splice(particles.indexOf(p), 1);
    });
    ctx.globalAlpha = 1;

    updateUI(score, level, fuel);
    drawMinimap(stars);
};

export const drawMinimap = (stars) => {
    if (!minimapCtx) {
        console.error('minimapCtx is not initialized!');
        return;
    }

    console.log('Drawing minimap, stars count:', stars.length);
    minimapCtx.clearRect(0, 0, minimap.width, minimap.height);
    minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    minimapCtx.fillRect(0, 0, minimap.width, minimap.height);
    minimapCtx.strokeStyle = 'white';
    minimapCtx.strokeRect(0, 0, minimap.width, minimap.height);

    const gameState = getGameState();
    const player = gameState?.player;
    const scale = minimap.width / WORLD_SIZE;
    let playerFound = false;

    console.log('Minimap size:', minimap.width, minimap.height);
    console.log('World size:', WORLD_SIZE);
    console.log('Scale:', scale);
    console.log('Game state:', gameState);
    console.log('Player object:', player);

    if (!gameState) {
        console.error('Game state is undefined or null!');
        return;
    }

    if (player && typeof player.x === 'number' && typeof player.y === 'number' && !isNaN(player.x) && !isNaN(player.y)) {
        const x = player.x * scale;
        const y = player.y * scale;
        console.log('Player on minimap attempt:', x, y, 'Radius:', 5);
        if (x >= 0 && x <= minimap.width && y >= 0 && y <= minimap.height) {
            minimapCtx.fillStyle = 'white';
            minimapCtx.beginPath();
            minimapCtx.arc(x, y, 5, 0, Math.PI * 2);
            minimapCtx.fill();
            console.log('Player drawn on minimap at:', x, y);
            playerFound = true;
        } else {
            console.error('Player out of minimap bounds:', x, y);
        }
    } else {
        console.error('Player object invalid:', player);
        if (player) {
            console.error('Player x:', player.x, 'y:', player.y);
        }
    }

    stars.forEach(s => {
        if (!s.isPlayer) {
            minimapCtx.fillStyle = 'gray';
            minimapCtx.beginPath();
            const x = s.x * scale;
            const y = s.y * scale;
            if (x >= 0 && x <= minimap.width && y >= 0 && y <= minimap.height) {
                minimapCtx.arc(x, y, 3, 0, Math.PI * 2);
                minimapCtx.fill();
            }
        }
    });

    if (!playerFound) {
        console.error('Player not drawn on minimap!');
    }
};

export const updateUI = (score, level, fuel) => {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('level').textContent = `Level: ${level}`;
    document.getElementById('fuel') ? document.getElementById('fuel').textContent = `Fuel: ${Math.floor(fuel)}/${MAX_FUEL}` : null;
};