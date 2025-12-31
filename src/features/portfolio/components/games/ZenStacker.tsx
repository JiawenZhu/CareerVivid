import React, { useRef } from 'react';
import GameCanvas from './GameCanvas';
import MobileGameControls from './MobileGameControls';

const ZenStacker: React.FC = () => {
    const state = useRef({
        blocks: [] as { x: number, y: number, width: number, color: string }[],
        currentBlock: { x: 0, width: 200, speed: 5, direction: 1 },
        level: 0,
        gameOver: false,
        score: 0,
        heightOffset: 0,
        colors: ['#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81']
    });

    const BLOCK_HEIGHT = 40;

    const initGame = (width: number, height: number) => {
        state.current.blocks = [];
        state.current.level = 0;
        state.current.score = 0;
        state.current.gameOver = false;
        state.current.heightOffset = 0;

        // Base block
        state.current.blocks.push({
            x: width / 2 - 100,
            y: height - BLOCK_HEIGHT,
            width: 200,
            color: state.current.colors[0]
        });

        spawnNextBlock(width, height);
    };

    const spawnNextBlock = (width: number, height: number) => {
        const prevBlock = state.current.blocks[state.current.blocks.length - 1];
        state.current.currentBlock = {
            x: 0,
            width: prevBlock.width,
            speed: 5 + state.current.level * 0.5,
            direction: 1
        };
        state.current.level++;
    };

    const update = (width: number, height: number) => {
        if (state.current.gameOver) return;

        const curr = state.current.currentBlock;
        curr.x += curr.speed * curr.direction;

        // Bounce
        if (curr.x <= 0 || curr.x + curr.width >= width) {
            curr.direction *= -1;
        }
    };

    const draw = (ctx: CanvasRenderingContext2D, frameCount: number, width: number, height: number) => {
        if (state.current.blocks.length === 0) initGame(width, height);

        // Zen Background (Gradient)
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#eef2ff');
        gradient.addColorStop(1, '#c7d2fe');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Calculate visual offset to keep stack centered vertically as it grows
        const targetOffset = Math.max(0, (state.current.level * BLOCK_HEIGHT) - (height / 2));
        state.current.heightOffset += (targetOffset - state.current.heightOffset) * 0.1; // Smooth camera

        ctx.save();
        ctx.translate(0, state.current.heightOffset);

        // Draw Stacked Blocks
        state.current.blocks.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.width, BLOCK_HEIGHT);
            ctx.strokeStyle = 'white';
            ctx.strokeRect(b.x, b.y, b.width, BLOCK_HEIGHT);
        });

        // Draw Current Moving Block
        if (!state.current.gameOver) {
            const curr = state.current.currentBlock;
            const y = height - ((state.current.level + 1) * BLOCK_HEIGHT);
            const colorIdx = state.current.level % state.current.colors.length;

            ctx.fillStyle = state.current.colors[colorIdx];
            ctx.fillRect(curr.x, y, curr.width, BLOCK_HEIGHT);
            ctx.strokeRect(curr.x, y, curr.width, BLOCK_HEIGHT);
        }

        ctx.restore();

        // Score
        ctx.fillStyle = '#1e1b4b';
        ctx.font = 'bold 40px "Inter", sans-serif';
        ctx.fillText(`${state.current.score}`, width / 2 - 20, 100);

        if (state.current.gameOver) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fillRect(0, height / 2 - 60, width, 120);

            ctx.fillStyle = '#4338ca';
            ctx.textAlign = 'center';
            ctx.font = 'bold 40px "Inter", sans-serif';
            ctx.fillText("Game Over", width / 2, height / 2);
            ctx.font = '20px "Inter", sans-serif';
            ctx.fillText("Tap to Restart", width / 2, height / 2 + 40);
            ctx.textAlign = 'left';
        }
    };

    const handleInteract = (type: string, e: any) => {
        if (type === 'click' || (type === 'keydown' && e.key === ' ')) {
            if (state.current.gameOver) {
                // Determine width/height? We need them.
                // Hack: init with 0 and let draw fix it or assumes canvas is sized.
                // Let's pass 0,0 and rely on `draw` init logic which uses actual dims
                state.current.blocks = []; // Trigger init
                return;
            }

            // Place Block
            const prev = state.current.blocks[state.current.blocks.length - 1];
            const curr = state.current.currentBlock;
            const y = window.innerHeight - ((state.current.level + 1) * BLOCK_HEIGHT); // Approx logic, ideally passed in

            // Logic check overlaps
            const overlapX = Math.max(prev.x, curr.x);
            const overlapRight = Math.min(prev.x + prev.width, curr.x + curr.width);
            const overlapWidth = overlapRight - overlapX;

            if (overlapWidth <= 0) {
                state.current.gameOver = true;
            } else {
                state.current.score++;

                // Add new block
                state.current.blocks.push({
                    x: overlapX,
                    y: state.current.blocks[0].y - (state.current.level * BLOCK_HEIGHT), // Stack up
                    width: overlapWidth,
                    color: state.current.colors[state.current.level % state.current.colors.length]
                });

                // Spawn next
                // Need width of canvas.
                // Using window.innerWidth as heavy proxy.
                spawnNextBlock(window.innerWidth, window.innerHeight);
            }
        }
    };

    return (
        <div className="absolute inset-0 z-0">
            <GameCanvas draw={draw} update={update} onInteract={handleInteract} />
        </div>
    );
};

export default ZenStacker;
