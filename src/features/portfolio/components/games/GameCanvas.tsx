import React, { useRef, useEffect, useState } from 'react';

interface GameCanvasProps {
    draw: (ctx: CanvasRenderingContext2D, frameCount: number, width: number, height: number) => void;
    update?: (width: number, height: number) => void;
    onInteract?: (type: 'click' | 'keydown' | 'move' | 'start' | 'end', event: any) => void;
    className?: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ draw, update, onInteract, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const frameCountRef = useRef<number>(0);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const resize = () => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
                setDimensions({ width: canvas.width, height: canvas.height });
            }
        }
    };

    useEffect(() => {
        window.addEventListener('resize', resize);
        resize();

        return () => window.removeEventListener('resize', resize);
    }, []);

    const animate = () => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                frameCountRef.current++;
                if (update) update(canvas.width, canvas.height);
                draw(ctx, frameCountRef.current, canvas.width, canvas.height);
            }
        }
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [draw, update]);

    // Basic interaction handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (onInteract) onInteract('keydown', e);
        };

        // We might want to only listen if the user has "focused" the game?
        // For now, let's attach to window but maybe check if game is active or simple background.
        // User requested playable games.

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onInteract]);

    const handleTouch = (e: React.TouchEvent) => {
        if (!onInteract) return;
        const touch = e.touches[0];
        if (!touch && e.type !== 'touchend') return;

        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        // For touchend, we might not have touch[0], but handled logic usually only needs end type
        const x = touch ? touch.clientX - rect.left : 0;
        const y = touch ? touch.clientY - rect.top : 0;

        if (e.type === 'touchstart') onInteract('start', { x, y, originalEvent: e });
        if (e.type === 'touchmove') onInteract('move', { x, y, originalEvent: e });
        if (e.type === 'touchend') onInteract('end', { originalEvent: e });
    };

    const handleMouse = (e: React.MouseEvent) => {
        if (!onInteract) return;
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (e.type === 'mousedown') onInteract('start', { x, y, originalEvent: e });
        // Only trigger move if mouse is down (optional, but good for game handling usually)
        if (e.type === 'mousemove' && e.buttons === 1) onInteract('move', { x, y, originalEvent: e });
        if (e.type === 'mouseup') onInteract('end', { originalEvent: e });
    };

    return (
        <canvas
            ref={canvasRef}
            className={className}
            onClick={(e) => onInteract && onInteract('click', e)}
            onTouchStart={handleTouch}
            onTouchMove={handleTouch}
            onTouchEnd={handleTouch}
            onMouseDown={handleMouse}
            onMouseMove={handleMouse}
            onMouseUp={handleMouse}
            onMouseLeave={(e) => onInteract && onInteract('end', e)}
            style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
        />
    );
};

export default GameCanvas;
