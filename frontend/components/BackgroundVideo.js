import { useEffect, useRef } from 'react';
import styles from './BackgroundVideo.module.css';

export default function BackgroundVideo() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Bolinhas azuis com brilho intenso e movimento fluido
    const particles = Array.from({ length: 75 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 4 + 1.5,
      dx: (Math.random() - 0.5) * 0.7,
      dy: (Math.random() - 0.5) * 0.7,
      alpha: Math.random() * 0.7 + 0.3,
      // Tons de Azul Elétrico Neon
      color: Math.random() > 0.3 ? '59, 130, 246' : (Math.random() > 0.5 ? '96, 165, 250' : '37, 99, 235')
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.shadowBlur = 24; // Efeito de brilho azul intenso
        ctx.shadowColor = `rgba(${p.color}, 0.95)`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={styles.videoContainer} aria-hidden="true">
      {/* Vídeo MP4 em loop */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/video/bg-poster.png"
        className={styles.bgVideo}
      >
        <source src="/video/bg-particles.mp4" type="video/mp4" />
      </video>

      {/* Camada de bolinhas azuis com brilho intenso */}
      <canvas ref={canvasRef} className={styles.bgCanvas} />

      {/* Overlay com iluminação ambiente de fundo */}
      <div className={styles.overlayGradient} />
    </div>
  );
}
