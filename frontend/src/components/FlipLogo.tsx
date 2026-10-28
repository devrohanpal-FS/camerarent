import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

interface FlipLogoProps {
  className?: string;
  cardClassName?: string;
}

export default function FlipLogo({ className = '', cardClassName = '' }: FlipLogoProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIsFlipped(prev => !prev);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFlipped]);

  const handleMouseEnter = () => {
    setIsFlipped(prev => !prev);
  };

  return (
    <Link
      to="/"
      onMouseEnter={handleMouseEnter}
      className={`group block shrink-0 select-none cursor-pointer flip-logo-perspective ${className}`}
      title="CameraRent & Mount Everest Media"
      aria-label="CameraRent Home"
    >
      <div
        className={`flip-logo-card ${
          cardClassName || 'w-[160px] xs:w-[190px] sm:w-[220px] md:w-[240px] h-9 sm:h-11 md:h-12'
        } ${isFlipped ? 'is-flipped' : ''}`}
      >
        <div className="flip-logo-face justify-start items-center">
          <img
            src="/images/logo/camerarent-color-trimmed.png"
            alt="CameraRent Logo"
            className="h-8 sm:h-9 md:h-10 w-auto max-w-full object-contain object-left transition-transform duration-300 group-hover:scale-[1.02]"
            loading="eager"
          />
        </div>

        <div className="flip-logo-face flip-logo-face-back justify-start items-center">
          <img
            src="/images/logo/mounteverest-color-trimmed.png"
            alt="Mount Everest Media Logo"
            className="h-8 sm:h-9 md:h-10 w-auto max-w-full object-contain object-left transition-transform duration-300 group-hover:scale-[1.02]"
            loading="eager"
          />
        </div>
      </div>
    </Link>
  );
}
