
import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  trail: { x: number; y: number; alpha: number }[];
}

interface TracerAnimationProps {
  isEnabled: boolean;
}

const TracerAnimation: React.FC<TracerAnimationProps> = ({ isEnabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  
  const colors = ['#2563eb', '#4f46e5', '#8b5cf6', '#7c3aed', '#6366f1'];

  // Initialize particles
  const initParticles = (canvas: HTMLCanvasElement) => {
    const particles: Particle[] = [];
    const particleCount = Math.min(Math.floor(window.innerWidth / 30), 30); // Adjust based on screen size

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5, // Slower speed
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        trail: []
      });
    }
    
    particlesRef.current = particles;
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particlesRef.current.forEach(particle => {
      // Draw trails
      particle.trail.forEach((point, index) => {
        const alpha = point.alpha;
        ctx.beginPath();
        ctx.arc(point.x, point.y, particle.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.fill();
      });
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
    });
  };

  const updateParticles = (canvas: HTMLCanvasElement) => {
    particlesRef.current.forEach(particle => {
      // Add current position to trail
      particle.trail.unshift({ 
        x: particle.x, 
        y: particle.y, 
        alpha: 0.5 
      });
      
      // Limit trail length
      if (particle.trail.length > 10) {
        particle.trail.pop();
      }
      
      // Update trail alphas
      particle.trail.forEach((point, index) => {
        point.alpha = 0.5 * (1 - index / 10);
      });
      
      // Move particle
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Bounce off edges
      if (particle.x < 0 || particle.x > canvas.width) {
        particle.vx *= -1;
      }
      
      if (particle.y < 0 || particle.y > canvas.height) {
        particle.vy *= -1;
      }
    });
  };

  const animate = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    updateParticles(canvas);
    drawParticles(ctx, canvas);
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Setup and resize handler
  useEffect(() => {
    if (!isEnabled || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas);
    };
    
    handleResize();
    
    window.addEventListener('resize', handleResize);
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

export default TracerAnimation;
