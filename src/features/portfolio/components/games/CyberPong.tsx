import React, { useRef } from 'react';
import GameCanvas from './GameCanvas';
import MobileGameControls from './MobileGameControls';

const CyberPong: React.FC = () => {
    const state = useRef({
        ballX: 300,
        ballY: 300,
        ballSpeedX: 4,
        ballSpeedY: 4,
        paddle1Y: 250,
        paddle2Y: 250,
        score1: 0,
        score2: 0,
        aiSpeed: 3
    });

    const update = (width: number, height: number) => {
        const s = state.current;

        // Ball movement
        s.ballX += s.ballSpeedX;
        s.ballY += s.ballSpeedY;

        // Wall collisions (Top/Bottom)
        if (s.ballY <= 0 || s.ballY >= height) {
            s.ballSpeedY *= -1;
        }

        // Paddle collisions
        // Paddle dimensions: 20x100
        // Left Paddle (Player)
        if (s.ballX <= 30 && s.ballY >= s.paddle1Y && s.ballY <= s.paddle1Y + 100) {
            s.ballSpeedX *= -1.05; // Speed up
            s.ballX = 30; // Prevent sticking
        }

        // Right Paddle (AI)
        if (s.ballX >= width - 30 && s.ballY >= s.paddle2Y && s.ballY <= s.paddle2Y + 100) {
            s.ballSpeedX *= -1.05;
            s.ballX = width - 30;
        }

        // Scoring
        if (s.ballX < 0) {
            s.score2++;
            resetBall(width, height);
        } else if (s.ballX > width) {
            s.score1++;
            resetBall(width, height);
        }

        // AI Movement (Simple tracking)
        const paddleCenter = s.paddle2Y + 50;
        if (paddleCenter < s.ballY - 35) {
            s.paddle2Y += s.aiSpeed;
        } else if (paddleCenter > s.ballY + 35) {
            s.paddle2Y -= s.aiSpeed;
        }

        // Auto-play Player for background vibe (if no interaction?)
        // Let's make it interactive: Mouse/Touch follows Y
        // But for now, maybe drift to center if no input?
    };

    const resetBall = (width: number, height: number) => {
        state.current.ballX = width / 2;
        state.current.ballY = height / 2;
        state.current.ballSpeedX = 4 * (Math.random() > 0.5 ? 1 : -1);
        state.current.ballSpeedY = 4 * (Math.random() > 0.5 ? 1 : -1);
    };

    const draw = (ctx: CanvasRenderingContext2D, frameCount: number, width: number, height: number) => {
        // Neo Brutalism Background
        ctx.fillStyle = '#fdf5e6'; // Old Lace / Off White
        ctx.fillRect(0, 0, width, height);

        // Grid pattern
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < width; i += 50) {
            ctx.moveTo(i, 0); ctx.lineTo(i, height);
        }
        for (let i = 0; i < height; i += 50) {
            ctx.moveTo(0, i); ctx.lineTo(width, i);
        }
        ctx.globalAlpha = 0.1;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Net
        ctx.beginPath();
        ctx.setLineDash([20, 15]);
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.setLineDash([]);

        // Paddles (Black, Sharp Shadows)
        // Player (Left) - Red
        ctx.fillStyle = '#000'; // Shadow
        ctx.fillRect(10 + 4, state.current.paddle1Y + 4, 20, 100);
        ctx.fillStyle = '#ff4d4d'; // Red
        ctx.fillRect(10, state.current.paddle1Y, 20, 100);
        ctx.lineWidth = 3;
        ctx.strokeRect(10, state.current.paddle1Y, 20, 100);

        // AI (Right) - Blue
        ctx.fillStyle = '#000'; // Shadow
        ctx.fillRect(width - 30 + 4, state.current.paddle2Y + 4, 20, 100);
        ctx.fillStyle = '#4d79ff'; // Blue
        ctx.fillRect(width - 30, state.current.paddle2Y, 20, 100);
        ctx.strokeRect(width - 30, state.current.paddle2Y, 20, 100);

        // Ball (Yellow square for brutalism, maybe?)
        ctx.fillStyle = '#000';
        ctx.fillRect(state.current.ballX + 4, state.current.ballY + 4, 20, 20);
        ctx.fillStyle = '#ffe600'; // Yellow
        ctx.fillRect(state.current.ballX, state.current.ballY, 20, 20);
        ctx.strokeRect(state.current.ballX, state.current.ballY, 20, 20);

        // Scores
        ctx.fillStyle = 'black';
        ctx.font = '800 60px "Archivo Black", sans-serif';
        ctx.fillText(state.current.score1.toString(), width / 4, 100);
        ctx.fillText(state.current.score2.toString(), width * 3 / 4, 100);
    };

    const handleInteract = (type: string, e: any) => {
        // Keyboard controls
        if (type === 'keydown') {
            const key = (e as KeyboardEvent).key;
            if (key === 'ArrowUp' || key === 'w') state.current.paddle1Y -= 20;
            if (key === 'ArrowDown' || key === 's') state.current.paddle1Y += 20;
        }

        // Touch/Mouse Drag controls
        const paddleHeight = 100;

        if (type === 'start') {
            // Hit test left paddle area (generous 100px width)
            if (e.x < 100) {
                // Store dragging state directly on ref to avoid re-renders or complex state types in this simple usage
                (state.current as any).isDragging = true;
                (state.current as any).dragOffsetY = e.y - state.current.paddle1Y;
            }
        }

        if (type === 'move' && (state.current as any).isDragging) {
            state.current.paddle1Y = e.y - (state.current as any).dragOffsetY;
        }

        if (type === 'end') {
            (state.current as any).isDragging = false;
        }
    };

    // Add mouse/touch listener for better UX
    // We can just add global listener here since it's a full screen(ish) bg
    // But better to use the canvas events if possible. 
    // Let's accept that for MVP keyboard is main control, or we add mouse move to GameCanvas later.

    return (
        <div className="absolute inset-0 z-0">
            <GameCanvas draw={draw} update={update} onInteract={handleInteract} />
        </div>
    );
};

export default CyberPong;
