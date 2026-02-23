import React, { useEffect, useRef } from 'react';

const Starfield: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const stars = Array.from({ length: 200 }).map(() => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2,
            opacity: Math.random(),
            speed: Math.random() * 0.05
        }));

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            stars.forEach(star => {
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();

                // Twinkle effect
                star.opacity += star.speed;
                if (star.opacity > 1 || star.opacity < 0) {
                    star.speed = -star.speed;
                }
            });

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            // Re-distribute stars on resize
            stars.forEach(star => {
                star.x = Math.random() * width;
                star.y = Math.random() * height;
            });
        };

        window.addEventListener('resize', handleResize);
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        };

    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};

export default Starfield;
