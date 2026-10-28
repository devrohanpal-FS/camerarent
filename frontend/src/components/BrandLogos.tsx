import React from 'react';

export function SonyLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/logo/sony.png"
      alt="Sony"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

export function CanonLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/logo/canon.png"
      alt="Canon"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

export function DjiLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/logo/dji.png"
      alt="DJI"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

export function AputureLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/logo/aputure.png"
      alt="Aputure"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

export function NanluxLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/logo/nanlux.png"
      alt="Nanlux"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

export function GoProLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/logo/gopro.png"
      alt="GoPro"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

export function RedCinemaLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/logo/red.png"
      alt="RED Cinema"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

export function BlackmagicLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/logo/blackmagic.png"
      alt="Blackmagic Design"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

export function ZeissLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/logo/zeiss.png"
      alt="ZEISS"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

export function SennheiserLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/logo/sennheiser.png"
      alt="Sennheiser"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

export function AmazonLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 38" className={className} xmlns="http://www.w3.org/2000/svg">
      <text
        x="65"
        y="23"
        fill="#0F172A"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="25"
        fontWeight="900"
        textAnchor="middle"
      >
        amazon
      </text>
      <path d="M28 29 Q65 38 102 28" fill="none" stroke="#FF9900" strokeWidth="3.5" strokeLinecap="round" />
      <polygon points="100,25 106,28 99,32" fill="#FF9900" />
    </svg>
  );
}

export function ZohoLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 38" className={className} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(8, 7)">
        <rect x="0" y="2" width="14" height="20" rx="3" fill="#E11D48" />
        <rect x="16" y="0" width="14" height="20" rx="3" fill="#10B981" />
        <rect x="32" y="2" width="14" height="20" rx="3" fill="#2563EB" />
        <rect x="48" y="0" width="14" height="20" rx="3" fill="#F59E0B" />
      </g>
      <text
        x="104"
        y="25"
        fill="#0F172A"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="20"
        fontWeight="900"
        letterSpacing="1"
        textAnchor="middle"
      >
        ZOHO
      </text>
    </svg>
  );
}

export function MarutiSuzukiLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 175 36" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M8 26 L16 8 L24 20 L32 8 L40 26" fill="none" stroke="#1D4ED8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 10 L30 24" fill="none" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
      <text
        x="110"
        y="23"
        fill="#1E293B"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14"
        fontWeight="900"
        letterSpacing="0.5"
        textAnchor="middle"
      >
        MARUTI SUZUKI
      </text>
    </svg>
  );
}

export function PrimeVideoLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 38" className={className} xmlns="http://www.w3.org/2000/svg">
      <text
        x="70"
        y="22"
        fill="#00A8E1"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="21"
        fontWeight="900"
        textAnchor="middle"
      >
        prime video
      </text>
      <path d="M35 28 Q70 36 105 27" fill="none" stroke="#00A8E1" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function ZomatoLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 36" className={className} xmlns="http://www.w3.org/2000/svg">
      <text
        x="65"
        y="26"
        fill="#E23744"
        fontFamily="Arial Black, sans-serif"
        fontSize="28"
        fontWeight="900"
        fontStyle="italic"
        textAnchor="middle"
      >
        zomato
      </text>
    </svg>
  );
}

export function LenskartLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 145 36" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="8" fill="none" stroke="#000042" strokeWidth="3" />
      <circle cx="38" cy="18" r="8" fill="none" stroke="#000042" strokeWidth="3" />
      <line x1="26" y1="18" x2="30" y2="18" stroke="#000042" strokeWidth="3" />
      <text
        x="96"
        y="24"
        fill="#000042"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="19"
        fontWeight="900"
        textAnchor="middle"
      >
        lenskart
      </text>
    </svg>
  );
}

export function ZeptoLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 36" className={className} xmlns="http://www.w3.org/2000/svg">
      <text
        x="60"
        y="26"
        fill="#6D28D9"
        fontFamily="Arial Black, sans-serif"
        fontSize="26"
        fontWeight="900"
        textAnchor="middle"
      >
        zepto
      </text>
      <circle cx="100" cy="10" r="4" fill="#F97316" />
    </svg>
  );
}

export function CodingNinjasLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 165 36" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="7" width="22" height="22" rx="6" fill="#EA580C" />
      <line x1="10" y1="18" x2="24" y2="18" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <text
        x="98"
        y="23"
        fill="#0F172A"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14"
        fontWeight="900"
        letterSpacing="0.5"
        textAnchor="middle"
      >
        CODING NINJAS
      </text>
    </svg>
  );
}

export function BombayShavingLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 155 36" className={className} xmlns="http://www.w3.org/2000/svg">
      <text
        x="77"
        y="16"
        fill="#1E293B"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="12"
        fontWeight="900"
        letterSpacing="1.5"
        textAnchor="middle"
      >
        BOMBAY SHAVING
      </text>
      <text
        x="77"
        y="29"
        fill="#0284C7"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="11"
        fontWeight="900"
        letterSpacing="2.5"
        textAnchor="middle"
      >
        COMPANY
      </text>
    </svg>
  );
}

export function GrowsterLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 36" className={className} xmlns="http://www.w3.org/2000/svg">
      <text
        x="65"
        y="24"
        fill="#0F172A"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="21"
        fontWeight="900"
        letterSpacing="0.5"
        textAnchor="middle"
      >
        Growster<tspan fill="#7C3AED">.</tspan>
      </text>
    </svg>
  );
}
