import React, { useRef } from 'react';
import GameCanvas from './GameCanvas';
import MobileGameControls from './MobileGameControls';

const BrutalSnake: React.FC = () => {
    const state = useRef({
        snake: [{ x: 10, y: 10 }],
        food: { x: 15, y: 15 },
        dir: { x: 1, y: 0 },
        nextDir: { x: 1, y: 0 },
        gridSize: 20,
        gameSpeed: 5,
        lastUpdate: 0,
        score: 0,
        gameOver: false,
        colors: {
            bg: '#e0e7ff', // Indigo 50
            snake: '#4338ca', // Indigo 700
            food: '#ef4444', // Red 500
            shadow: '#000000'
        }
    });

    const initGame = (cols: number, rows: number) => {
        state.current.snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
        state.current.dir = { x: 1, y: 0 };
        state.current.nextDir = { x: 1, y: 0 };
        state.current.score = 0;
        state.current.gameOver = false;
        placeFood(cols, rows);
    };

    const placeFood = (cols: number, rows: number) => {
        state.current.food = {
            x: Math.floor(Math.random() * cols),
            y: Math.floor(Math.random() * rows)
        };
    };

    const update = (width: number, height: number) => {
        const now = Date.now();
        if (now - state.current.lastUpdate < (1000 / state.current.gameSpeed)) return;
        state.current.lastUpdate = now;

        if (state.current.gameOver) return;

        const cols = Math.floor(width / state.current.gridSize);
        const rows = Math.floor(height / state.current.gridSize);

        // Update Direction
        state.current.dir = state.current.nextDir;

        // Move Head
        const head = { ...state.current.snake[0] };
        head.x += state.current.dir.x;
        head.y += state.current.dir.y;

        // Wrap around (Brutalist infinite canvas?)
        // Or Wall Death? Let's do Wall Death for "Brutal" difficulty.
        if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
            state.current.gameOver = true;
            return;
        }

        // Self Hit
        if (state.current.snake.some(s => s.x === head.x && s.y === head.y)) {
            state.current.gameOver = true;
            return;
        }

        state.current.snake.unshift(head);

        // Eat Food
        if (head.x === state.current.food.x && head.y === state.current.food.y) {
            state.current.score += 10;
            state.current.gameSpeed = Math.min(20, 5 + Math.floor(state.current.score / 50));
            placeFood(cols, rows);
        } else {
            state.current.snake.pop();
        }
    };

    const draw = (ctx: CanvasRenderingContext2D, frameCount: number, width: number, height: number) => {
        const gs = state.current.gridSize;
        const cols = Math.floor(width / gs);
        const rows = Math.floor(height / gs);

        if (state.current.snake.length === 1 && frameCount < 10) initGame(cols, rows);

        // Background
        ctx.fillStyle = state.current.colors.bg;
        ctx.fillRect(0, 0, width, height);

        // Grid (Subtle)
        ctx.strokeStyle = state.current.colors.shadow; // Black
        ctx.lineWidth = 2; // Thick lines for brutalism
        ctx.beginPath();
        // Just draw a border around play area
        ctx.strokeRect(0, 0, width, height);

        // Draw Shadow Offset
        const shadowOffset = 4;

        // Food
        const fx = state.current.food.x * gs;
        const fy = state.current.food.y * gs;
        ctx.fillStyle = state.current.colors.shadow;
        ctx.fillRect(fx + shadowOffset, fy + shadowOffset, gs - 2, gs - 2);
        ctx.fillStyle = state.current.colors.food;
        ctx.fillRect(fx, fy, gs - 2, gs - 2);
        ctx.strokeRect(fx, fy, gs - 2, gs - 2);

        // Snake
        state.current.snake.forEach((s, i) => {
            const sx = s.x * gs;
            const sy = s.y * gs;

            // Connected shadow? No, blocky is fine for Snake
            ctx.fillStyle = state.current.colors.shadow;
            ctx.fillRect(sx + shadowOffset, sy + shadowOffset, gs - 1, gs - 1);

            ctx.fillStyle = i === 0 ? '#312e81' : state.current.colors.snake; // Darker head
            ctx.fillRect(sx, sy, gs - 1, gs - 1);
            ctx.strokeRect(sx, sy, gs - 1, gs - 1);
        });

        // Score
        ctx.fillStyle = 'black';
        ctx.font = '900 40px "Public Sans", sans-serif';
        ctx.fillText(`SCORE: ${state.current.score}`, 20, 50);

        if (state.current.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, height / 2 - 50, width, 100);

            ctx.fillStyle = '#ff4d4d'; // Red text
            ctx.textAlign = 'center';
            ctx.font = '900 50px "Public Sans", sans-serif';
            ctx.fillText("GAME OVER", width / 2, height / 2 + 15);
            ctx.font = '20px "Public Sans", sans-serif';
            ctx.fillStyle = 'white';
            ctx.fillText("PRESS R TO RESTART", width / 2, height / 2 + 40);
            ctx.textAlign = 'left';
        }
    };

    const handleInteract = (type: string, e: any) => {
        if (type === 'keydown') {
            const key = (e as KeyboardEvent).key;
            const dir = state.current.dir;

            if ((key === 'ArrowUp' || key === 'w') && dir.y === 0) state.current.nextDir = { x: 0, y: -1 };
            if ((key === 'ArrowDown' || key === 's') && dir.y === 0) state.current.nextDir = { x: 0, y: 1 };
            if ((key === 'ArrowLeft' || key === 'a') && dir.x === 0) state.current.nextDir = { x: -1, y: 0 };
            if ((key === 'ArrowRight' || key === 'd') && dir.x === 0) state.current.nextDir = { x: 1, y: 0 };

            if (key === 'r' && state.current.gameOver) {
                // How to get dims here? Hack: we reset on next frame draw check or force visual reset
                // We can just reset vars and next draw handles it.
                // We need grid size though. 
                // Let's assume standard density or previous cols/rows.
                state.current.snake = [{ x: 10, y: 10 }]; // Temp reset to trigger initGame logic in draw?
                // Better: direct reset if we knew dims.
                // Let's just set gameOver = false and let next update loop handle logic
                state.current.gameOver = false;
                state.current.score = 0;
                state.current.snake = []; // Will trigger init
            }
        }
    };

    return (
        <div className="absolute inset-0 z-0 bg-[#e0e7ff]">
            <GameCanvas draw={draw} update={update} onInteract={handleInteract} />
        </div>
    );
};

export default BrutalSnake;
