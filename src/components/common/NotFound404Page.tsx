import React from 'react';
import { PinkInAuLogo } from './PinkInAuLogo.tsx';

interface NotFound404PageProps {
  onGoHome?: () => void;
}

export const NotFound404Page: React.FC<NotFound404PageProps> = ({ onGoHome }) => {
  const handleHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div 
      className="h-screen w-screen flex flex-col justify-between items-center relative overflow-hidden bg-stone-950 font-sans text-white select-none"
      style={{
        backgroundImage: `url('/cosmos.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Minimal Dark Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'rgba(8, 4, 15, 0.45)',
        }}
      />

      {/* Top spacer */}
      <div className="w-full h-16 relative z-10" />

      {/* Static Minimal Pink 404 */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center">
        <div 
          className="text-[7rem] sm:text-[10rem] md:text-[13rem] font-black leading-none tracking-tight select-none text-rose-400"
          style={{
            color: '#fb7185',
          }}
        >
          404
        </div>
      </main>

      {/* Neat PinkInAu Bottom Signature */}
      <footer className="relative z-10 pb-10 flex items-center justify-center">
        <button
          onClick={handleHome}
          className="inline-flex items-center space-x-2 text-rose-300/85 hover:text-white transition-colors duration-200 cursor-pointer group"
          title="PinkInAu"
        >
          <PinkInAuLogo className="w-4 h-4 opacity-85 group-hover:opacity-100 transition-opacity" />
          <span className="text-xs font-semibold tracking-[0.3em] uppercase">
            PinkInAu
          </span>
        </button>
      </footer>
    </div>
  );
};
