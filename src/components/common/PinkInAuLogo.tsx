import React from 'react';

interface PinkInAuLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  textColor?: string;
}

export const PinkInAuLogo: React.FC<PinkInAuLogoProps> = ({
  size = 32,
  className = '',
  showText = false,
  textColor = 'text-stone-900',
}) => {
  return (
    <div className={`inline-flex items-center space-x-2.5 ${className}`}>
      <svg
        viewBox="0 0 1000 1000"
        style={{ width: size, height: size }}
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* i Dot (Yellow) */}
        <circle cx="438" cy="70" r="42" fill="#F5CD43" />

        {/* Left Yellow Vertical Bar (K stem) */}
        <rect x="112" y="2" width="68" height="640" fill="#F5CD43" />

        {/* Yellow Diagonal Strokes (K limbs) */}
        <path d="M 180 410 L 372 190 L 472 190 L 250 435 L 472 642 L 372 642 L 180 430 Z" fill="#F5CD43" />
        
        {/* Yellow Center Stem */}
        <rect x="404" y="190" width="68" height="452" fill="#F5CD43" />

        {/* Pink Combined P & U Outline Path */}
        <path
          d="M 472 224 L 720 224 C 846 224 940 318 940 444 C 940 570 846 664 720 664 L 688 664 L 688 720 C 688 846 612 948 500 948 C 388 948 360 846 360 720 L 360 642"
          stroke="#FF4DA6"
          strokeWidth="68"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <span className={`text-base font-bold tracking-tight ${textColor}`}>
          PinkInAu
        </span>
      )}
    </div>
  );
};
