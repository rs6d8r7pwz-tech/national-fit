import React, { useEffect, useRef } from 'react';

// Particules tricolores flottantes canvas
function ParticlesCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let W = 0, H = 0;

    const particles = [];
    const COUNT = 55;
    // bleu, rouge, blanc
    const COLORS = ['30,80,220', '220,38,38', '200,215,255', '255,255,255', '60,100,240'];

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function createParticle(fromBottom = false) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        x: Math.random() * W,
        y: fromBottom ? H + 10 : Math.random() * H,
        r: Math.random() * 3.5 + 0.8,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -(Math.random() * 0.5 + 0.08),
        alpha: Math.random() * 0.5 + 0.12,
        color,
        life: Math.random() * 250 + 120,
        age: 0,
      };
    }

    for (let i = 0; i < COUNT; i++) particles.push(createParticle());

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.age++;
        p.x += p.vx;
        p.y += p.vy;

        const progress = p.age / p.life;
        const fade = progress < 0.15 ? progress / 0.15 : progress > 0.70 ? 1 - (progress - 0.70) / 0.30 : 1;
        const alpha = p.alpha * fade;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${alpha.toFixed(3)})`;
        ctx.fill();

        if (p.age >= p.life || p.y < -10) {
          particles[i] = createParticle(true);
        }
      }
      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: -9, pointerEvents: 'none', opacity: 0.85 }}
      aria-hidden="true"
    />
  );
}

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <ParticlesCanvas />

      {/* Orbe 1 -- bleu profond gauche */}
      <div style={{
        position: 'absolute', width: 700, height: 700,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,80,220,0.22) 0%, rgba(30,80,220,0.06) 50%, transparent 70%)',
        top: '-180px', left: '-180px',
        animation: 'orb1 18s ease-in-out infinite',
        willChange: 'transform',
      }} />
      {/* Orbe 2 -- rouge droite */}
      <div style={{
        position: 'absolute', width: 520, height: 520,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(220,38,38,0.18) 0%, rgba(220,38,38,0.05) 50%, transparent 70%)',
        top: '20%', right: '-140px',
        animation: 'orb2 22s ease-in-out infinite',
        willChange: 'transform',
      }} />
      {/* Orbe 3 -- bleu milieu bas */}
      <div style={{
        position: 'absolute', width: 420, height: 420,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 65%)',
        bottom: '5%', left: '5%',
        animation: 'orb3 26s ease-in-out infinite',
        willChange: 'transform',
      }} />
      {/* Orbe 4 -- rouge bas droite */}
      <div style={{
        position: 'absolute', width: 340, height: 340,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(239,68,68,0.14) 0%, transparent 65%)',
        bottom: '30%', right: '0%',
        animation: 'orb4 30s ease-in-out infinite',
        willChange: 'transform',
      }} />
      {/* Orbe 5 -- blanc/bleu pâle centre */}
      <div style={{
        position: 'absolute', width: 300, height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,220,255,0.20) 0%, transparent 65%)',
        top: '45%', left: '30%',
        animation: 'orb5 35s ease-in-out infinite',
        willChange: 'transform',
      }} />

      {/* Bande tricolore animée haut de page */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, #1e3fb0 0%, #1e3fb0 33%, #f0f4ff 33%, #f0f4ff 66%, #dc2626 66%, #dc2626 100%)',
        opacity: 0.9,
      }} />

      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          25%  { transform: translate(90px,  60px) scale(1.12); }
          50%  { transform: translate(30px, 110px) scale(0.94); }
          75%  { transform: translate(-50px, 40px) scale(1.07); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          30%  { transform: translate(-80px,  80px) scale(1.15); }
          60%  { transform: translate( 60px, -50px) scale(0.90); }
          80%  { transform: translate(-25px,  60px) scale(1.08); }
        }
        @keyframes orb3 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%  { transform: translate(100px, -70px) scale(1.14); }
          70%  { transform: translate(-40px,  50px) scale(0.93); }
        }
        @keyframes orb4 {
          0%,100% { transform: translate(0,0) scale(1); }
          35%  { transform: translate(-90px, -60px) scale(1.10); }
          65%  { transform: translate( 50px,  70px) scale(0.92); }
        }
        @keyframes orb5 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%  { transform: translate(70px, -80px) scale(1.18); }
        }
      `}</style>
    </div>
  );
}