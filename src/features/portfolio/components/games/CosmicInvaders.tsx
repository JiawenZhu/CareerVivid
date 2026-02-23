import React, { useRef, useEffect } from 'react';
import GameCanvas from './GameCanvas';
import MobileGameControls from './MobileGameControls';

const CosmicInvaders: React.FC = () => {
    // Game State Refs
    const state = useRef({
        playerX: 0,
        bullets: [] as { x: number, y: number }[],
        enemies: [] as { x: number, y: number, alive: boolean }[],
        enemyDirection: 1,
        score: 0,
        gameOver: false,
        lastShot: 0
    });

    const initGame = (width: number, height: number) => {
        state.current.playerX = width / 2;
        state.current.enemies = [];
        // Create 3 rows of 8 enemies
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                state.current.enemies.push({
                    x: 50 + col * 60,
                    y: 50 + row * 50,
                    alive: true
                });
            }
        }
    };

    const update = (width: number, height: number) => {
        if (state.current.gameOver) return;

        // Move Bullets
        state.current.bullets.forEach(b => b.y -= 5);
        state.current.bullets = state.current.bullets.filter(b => b.y > 0);

        // Move Enemies
        let hitWall = false;
        state.current.enemies.forEach(e => {
            if (!e.alive) return;
            e.x += 2 * state.current.enemyDirection;
            if (e.x > width - 40 || e.x < 10) hitWall = true;
        });

        if (hitWall) {
            state.current.enemyDirection *= -1;
            state.current.enemies.forEach(e => e.y += 20);
        }

        // Collision Detection
        state.current.bullets.forEach((b, bIdx) => {
            state.current.enemies.forEach((e, eIdx) => {
                if (!e.alive) return;
                // Simple box collision
                if (b.x > e.x && b.x < e.x + 30 && b.y > e.y && b.y < e.y + 30) {
                    e.alive = false;
                    state.current.bullets.splice(bIdx, 1);
                    state.current.score += 100;
                }
            });
        });

        // Loop check?
        if (state.current.enemies.every(e => !e.alive)) {
            // Respawn
            initGame(width, height);
        }
    };

    const draw = (ctx: CanvasRenderingContext2D, frameCount: number, width: number, height: number) => {
        // Clear background (or maybe transparent?)
        // Let's make it semi-transparent black space
        ctx.fillStyle = '#0f172a'; // Slate 900
        ctx.fillRect(0, 0, width, height);

        // Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 20; i++) {
            ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
        }

        if (frameCount === 1) initGame(width, height);

        // Draw Player (Triangle)
        ctx.fillStyle = '#00f0ff'; // Cyan
        ctx.beginPath();
        ctx.moveTo(state.current.playerX, height - 30);
        ctx.lineTo(state.current.playerX - 15, height - 10);
        ctx.lineTo(state.current.playerX + 15, height - 10);
        ctx.fill();

        // Draw Bullets
        ctx.fillStyle = '#ff0055'; // Pink/Red
        state.current.bullets.forEach(b => {
            ctx.fillRect(b.x - 2, b.y, 4, 10);
        });

        // Draw Enemies
        ctx.fillStyle = '#00ff66'; // Green
        state.current.enemies.forEach(e => {
            if (e.alive) {
                ctx.fillRect(e.x, e.y, 30, 30);
                // Eyes
                ctx.fillStyle = 'black';
                ctx.fillRect(e.x + 5, e.y + 8, 5, 5);
                ctx.fillRect(e.x + 20, e.y + 8, 5, 5);
                ctx.fillStyle = '#00ff66';
            }
        });

        // Draw Score
        ctx.fillStyle = 'white';
        ctx.font = '20px "Courier New", monospace';
        ctx.fillText(`SCORE: ${state.current.score}`, 20, 30);

        ctx.fillStyle = 'white';
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText("USE ARROW KEYS & SPACE", width / 2, height - 50);
        ctx.textAlign = 'left';
    };

    const handleInput = (key: string) => {
        if (key === 'ArrowLeft') state.current.playerX -= 15;
        if (key === 'ArrowRight') state.current.playerX += 15;
        if (key === ' ') {
            const now = Date.now();
            if (now - state.current.lastShot > 300) {
                state.current.bullets.push({ x: state.current.playerX, y: window.innerHeight - 40 });
                state.current.lastShot = now;
            }
        }
    };

    const handleInteract = (type: string, e: any) => {
        if (type === 'keydown') {
            handleInput((e as KeyboardEvent).key);
        }
        if (type === 'click') {
            handleInput(' ');
        }
    };

    return (
        <div className="absolute inset-0 z-0">
            <GameCanvas draw={draw} update={update} onInteract={handleInteract} />
            {/* Mobile Controls */}
            <div className="md:hidden block">
                <MobileGameControls onInput={handleInput} showAction={true} />
            </div>
        </div>
    );
};

export default CosmicInvaders;
