import React, { useRef } from 'react';

interface HolographicCardProps {
  children: React.ReactNode;
  highlighted?: boolean;
  className?: string;
}

const C = {
  g: { 800: '#2D5016', 700: '#3D6B22', 50: '#F4F8EF' },
  t: { 900: '#0F0F0F' },
  b: '#E5E5E5',
}

export default function HolographicCard({ children, highlighted = false, className = '' }: HolographicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 12;
    const rotateY = (centerX - x) / 12;

    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);
    card.style.setProperty('--bg-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--bg-y', `${(y / rect.height) * 100}%`);
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    card.style.setProperty('--x', '50%');
    card.style.setProperty('--y', '50%');
    card.style.setProperty('--bg-x', '50%');
    card.style.setProperty('--bg-y', '50%');
  };

  return (
    <>
      <style>{`
        .holo-card {
          --x: 50%;
          --y: 50%;
          --bg-x: 50%;
          --bg-y: 50%;
          position: relative;
          border-radius: 1.25rem;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          transform-style: preserve-3d;
          will-change: transform;
        }

        .holo-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            600px circle at var(--bg-x) var(--bg-y),
            rgba(255,255,255,0.06),
            transparent 40%
          );
          z-index: 1;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .holo-card:hover::before {
          opacity: 1;
        }

        .holo-card.highlighted::before {
          background: radial-gradient(
            600px circle at var(--bg-x) var(--bg-y),
            rgba(255,255,255,0.12),
            transparent 40%
          );
        }

        .holo-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 1.25rem;
          padding: 1.5px;
          background: radial-gradient(
            400px circle at var(--bg-x) var(--bg-y),
            rgba(255,255,255,0.15),
            transparent 40%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 2;
        }

        .holo-card .holo-inner {
          position: relative;
          z-index: 0;
          height: 100%;
        }
      `}</style>
      <div
        ref={cardRef}
        className={`holo-card ${highlighted ? 'highlighted' : ''} ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          backgroundColor: highlighted ? C.g[800] : '#fff',
          border: highlighted ? 'none' : `1.5px solid ${C.b}`,
          boxShadow: highlighted
            ? '0 8px 32px rgba(45,80,22,0.2)'
            : '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div className="holo-inner">
          {children}
        </div>
      </div>
    </>
  );
}
