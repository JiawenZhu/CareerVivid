import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const InteractiveParticleTitle: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let canvasRect = canvas.getBoundingClientRect();

        const mouse = { x: -1000, y: -1000, radius: 80 }; // Radius of interaction

        // Text Configuration
        const lines = ["CareerVivid", "Academic/Business", "Partner"];
        const fontSize = 60;
        const lineHeight = 70;
        const font = `900 ${fontSize}px Inter, sans-serif`; // Heavy font for better particles

        class Particle {
            x: number;
            y: number;
            baseX: number;
            baseY: number;
            size: number;
            color: string;
            density: number;

            constructor(x: number, y: number, color: string) {
                this.x = x;
                this.y = y;
                this.baseX = x;
                this.baseY = y;
                this.size = 2;
                this.color = color;
                this.density = (Math.random() * 30) + 1;
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }

            update() {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const maxDistance = mouse.radius;
                const force = (maxDistance - distance) / maxDistance;
                const directionX = forceDirectionX * force * this.density;
                const directionY = forceDirectionY * force * this.density;

                if (distance < mouse.radius) {
                    // Repel
                    this.x -= directionX * 3; // Multiplier for stronger effect
                    this.y -= directionY * 3;
                } else {
                    // Return to base (Spring effect)
                    if (this.x !== this.baseX) {
                        const dx = this.x - this.baseX;
                        this.x -= dx / 10; // Ease factor
                    }
                    if (this.y !== this.baseY) {
                        const dy = this.y - this.baseY;
                        this.y -= dy / 10;
                    }
                }
            }
        }

        const init = () => {
            particles = [];

            // 1. Resize Canvas
            // We use the container dimensions.
            const containerWidth = container.offsetWidth;

            // Calculate responsive font size (Very Big)
            let currentFontSize = 100; // Base size for desktop
            if (containerWidth < 768) {
                currentFontSize = 50; // Mobile
            } else if (containerWidth < 1024) {
                currentFontSize = 80; // Tablet
            } else {
                currentFontSize = 130; // Large Desktop
            }

            const currentLineHeight = currentFontSize * 1.1;
            const height = currentLineHeight * 3 + 100; // 3 lines + padding

            // Update container height style to match canvas need
            container.style.height = `${height}px`;

            // Handle high DPI
            const dpr = window.devicePixelRatio || 1;
            canvas.width = containerWidth * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${containerWidth}px`;
            canvas.style.height = `${height}px`;

            ctx.scale(dpr, dpr);
            canvasRect = canvas.getBoundingClientRect();

            // 2. Draw Text to Canvas
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Use Inter font with heavy weight
            ctx.font = `900 ${currentFontSize}px Inter, sans-serif`;

            const centerX = containerWidth / 2;
            const startY = (height - (currentLineHeight * 2)) / 2; // Center the block of 3 lines

            const primaryColor = theme === 'dark' ? 'white' : '#111827';
            const highlightColor = '#2563EB'; // blue-600

            // Draw lines
            ctx.fillStyle = primaryColor;
            ctx.fillText(lines[0], centerX, startY);

            ctx.fillStyle = highlightColor;
            ctx.fillText(lines[1], centerX, startY + currentLineHeight);

            ctx.fillStyle = primaryColor;
            ctx.fillText(lines[2], centerX, startY + (currentLineHeight * 2));

            // 3. Scan Pixel Data
            const textCoordinates = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Clear to prepare for particles
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const gap = dpr === 1 ? 5 : 10; // Adjust gap based on scale to maintain performance

            for (let y = 0; y < canvas.height; y += gap) {
                for (let x = 0; x < canvas.width; x += gap) {
                    const index = (y * canvas.width + x) * 4;
                    const alpha = textCoordinates.data[index + 3];

                    if (alpha > 128) {
                        const r = textCoordinates.data[index];
                        const g = textCoordinates.data[index + 1];
                        const b = textCoordinates.data[index + 2];
                        const color = `rgb(${r},${g},${b})`;

                        particles.push(new Particle(x / dpr, y / dpr, color));
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
            particles.forEach((particle) => {
                particle.update();
                particle.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => init();
        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX - canvasRect.left;
            mouse.y = e.clientY - canvasRect.top;
        };
        const handleScroll = () => {
            canvasRect = canvas.getBoundingClientRect();
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll);

        init();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme]);

    return (
        <div ref={containerRef} className="w-full relative flex justify-center items-center">
            <canvas ref={canvasRef} className="z-20" /> {/* Higher Z-index to trigger mouse events */}
        </div>
    );
};

export default InteractiveParticleTitle;
