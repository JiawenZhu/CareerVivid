import React, { useEffect, useRef } from 'react';

const ParticleBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        // Configuration
        const particleCount = 80; // Reduced slightly for section size
        const connectionDistance = 120; // Increased slighty for better effect
        const colors = ['#4285F4', '#8AB4F8', '#E8EAED', '#BDC1C6'];

        const mouse = { x: -1000, y: -1000 };

        // We need to keep track of canvas position to offset mouse coordinates
        let canvasRect = canvas.getBoundingClientRect();

        class Particle {
            x: number;
            y: number;
            baseX: number;
            baseY: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
            density: number;

            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.baseX = this.x;
                this.baseY = this.y;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 3 + 1;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.density = (Math.random() * 20) + 1;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.rect(this.x, this.y, this.size, this.size);
                ctx.fillStyle = this.color;
                ctx.fill();
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Mouse Physics
                // mouse.x/y are now relative to the canvas
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (connectionDistance - distance) / connectionDistance;
                    const directionX = forceDirectionX * force * this.density;
                    const directionY = forceDirectionY * force * this.density;

                    this.x -= directionX;
                    this.y -= directionY;
                } else {
                    if (this.x !== this.baseX) {
                        const dx = this.x - this.baseX;
                        this.x -= dx / 50;
                    }
                    if (this.y !== this.baseY) {
                        const dy = this.y - this.baseY;
                        this.y -= dy / 50;
                    }
                }
            }
        }

        const init = () => {
            particles = [];

            // Resize canvas to match its visual size (parent container)
            // Using offsetWidth/Height is safer than innerWidth/Height for non-fullscreen canvas
            // We rely on the ResizeObserver or window resize to trigger this.

            // However, inside useEffect, we might get 0 if not rendered.
            // Let's assume the parent set the size or we use getBoundingClientRect()
            const rect = canvas.getBoundingClientRect();
            canvasRect = rect; // Update rect reference

            // Set internal resolution to match display size for sharp rendering
            canvas.width = rect.width;
            canvas.height = rect.height;

            const w = canvas.width;
            const h = canvas.height;

            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(w, h));
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((particle) => {
                particle.update();
                particle.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => init();

        const handleMouseMove = (e: MouseEvent) => {
            // Calculate mouse position relative to the canvas
            mouse.x = e.clientX - canvasRect.left;
            mouse.y = e.clientY - canvasRect.top;
        };

        // Also handle scroll because scrolling changes the canvas position relative to viewport 
        // if the canvas is scrolling (absolute) but mouse event gives viewport coords.
        const handleScroll = () => {
            canvasRect = canvas.getBoundingClientRect();
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll);

        // Initial init might need a small delay if parent isn't fully sized, but usually fine
        init();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
            }}
            className="z-0"
        />
    );
};

export default ParticleBackground;
