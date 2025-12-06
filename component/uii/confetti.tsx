import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
  duration?: number;
  onComplete?: () => void;
}

export const Confetti: React.FC<ConfettiProps> = ({ duration = 3000, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      rotation: number;
      rotationSpeed: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = -10;
        this.size = Math.random() * 8 + 4;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 + 2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }

    // Initialize
    for (let i = 0; i < 150; i++) {
      particles.push(new Particle());
    }

    let animationId: number;
    let startTime = Date.now();

    const animate = () => {
      if (Date.now() - startTime > duration) {
        if (onComplete) onComplete();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        p.update();
        p.draw();
        
        // Reset if off screen (only if duration not near end)
        if (p.y > canvas.height && Date.now() - startTime < duration - 1000) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [duration, onComplete]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[100]"
    />
  );
};

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  update: () => void;
  draw: () => void;
}