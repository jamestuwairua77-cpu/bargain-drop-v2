import React from 'react';

// Custom Bargain Drop Logo with high-contrast Black, Red, White & Electric Yellow
export function BargainDropLogo({
  size = 'md',
  showText = true,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}) {
  const sizeMap = {
    sm: { box: 'w-8 h-8', svg: 30, text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10', svg: 38, text: 'text-base', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12', svg: 46, text: 'text-xl', sub: 'text-xs' },
    xl: { box: 'w-16 h-16', svg: 60, text: 'text-2xl', sub: 'text-sm' },
  };

  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Standout Geometric Badge: Crisp White Outer Rim, Vivid Red Frame, Black Core */}
      <div
        className={`relative ${s.box} flex items-center justify-center bg-black rounded-xl border-2 border-white shadow-[0_0_15px_rgba(255,26,60,0.35)] group-hover:border-yellow-400 group-hover:shadow-[0_0_20px_rgba(255,214,0,0.5)] transition-all duration-300`}
      >
        <svg
          width={s.svg * 0.72}
          height={s.svg * 0.72}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Inner Red Geometric Shield Line */}
          <polygon
            points="20,2 38,10 38,28 20,38 2,28 2,10"
            stroke="#ff1a3c"
            strokeWidth="2.5"
            fill="#0a0a0f"
          />

          {/* Monogram "B" in Crisp Pure White */}
          <path
            d="M9 10H19.5C22.5 10 24.8 11.8 24.8 14.2C24.8 16 23.3 17.5 21.2 18L21.2 18.6C23.8 19.1 25.8 20.8 25.8 23C25.8 25.8 23 28 19.5 28H9V10Z"
            fill="#ffffff"
          />
          {/* Internal cutouts for B */}
          <path
            d="M13.5 13.5H18.5C19.8 13.5 21 14.1 21 15C21 15.9 19.8 16.5 18.5 16.5H13.5V13.5ZM13.5 21.5H18.8C20.2 21.5 21.5 22.2 21.5 23.2C21.5 24.2 20.2 24.8 18.8 24.8H13.5V21.5Z"
            fill="#0a0a0f"
          />

          {/* Downward Drop Lightning Bolt Arrow in Electric Yellow + Red Edge */}
          <path
            d="M22 6L33 17H27.5L29.5 26L19 18.5H23.5L22 6Z"
            fill="#ffd600"
            stroke="#ff1a3c"
            strokeWidth="1.2"
          />

          {/* Spark star accent in White */}
          <circle cx="20" cy="33" r="1.8" fill="#ffffff" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-white ${s.text} font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]`}>
              BARGAIN
            </span>
            <span className={`font-black tracking-tight text-red-500 ${s.text} font-mono drop-shadow-[0_0_10px_rgba(255,26,60,0.6)]`}>
              DROP
            </span>
            <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#ffd600] inline-block animate-pulse"></span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`font-bold tracking-wider uppercase text-neutral-300 ${s.sub}`}>
              OFFICIAL DROP STORE
            </span>
            <span className="text-white/40 text-[9px] font-black">·</span>
            <span className="text-yellow-400 font-extrabold text-[9px] tracking-wider px-1.5 py-0.2 rounded bg-yellow-400/10 border border-yellow-400/30">
              ⚡ VIP PREVIEW
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Standout Search Scope Icon (White Outline, Red Crosshair, Glowing Yellow Focal Point)
export function IconSearch({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7.5" stroke="#ffffff" strokeWidth="2.2" />
      {/* Red crosshair guides */}
      <line x1="11" y1="5.5" x2="11" y2="8" stroke="#ff1a3c" strokeWidth="2" strokeLinecap="round" />
      <line x1="11" y1="14" x2="11" y2="16.5" stroke="#ff1a3c" strokeWidth="2" strokeLinecap="round" />
      <line x1="5.5" y1="11" x2="8" y2="11" stroke="#ff1a3c" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="11" x2="16.5" y2="11" stroke="#ff1a3c" strokeWidth="2" strokeLinecap="round" />
      {/* Electric Yellow Center Target */}
      <circle cx="11" cy="11" r="2.2" fill="#ffd600" />
      {/* Handle with Red accent */}
      <path d="M16.5 16.5L22 22" stroke="#ff1a3c" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Standout Shopping Bag Icon (White Body Frame, Red Notch, Yellow Handle Accent)
export function IconCart({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.5 7.5H19.5L18 21.5H6L4.5 7.5Z"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M9 7.5V5.5C9 3.8 10.3 2.5 12 2.5C13.7 2.5 15 3.8 15 5.5V7.5"
        stroke="#ffd600"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="12" cy="13.5" r="2" fill="#ff1a3c" stroke="#ffffff" strokeWidth="0.8" />
    </svg>
  );
}

// Standout Faceted Drop Heart Icon (White Outline, Vivid Red Fill, Yellow Shine Spark)
export function IconHeart({
  className = 'w-4 h-4',
  filled = false,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? '#ff1a3c' : 'none'} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {filled ? (
        <circle cx="8" cy="8" r="1.5" fill="#ffd600" />
      ) : (
        <circle cx="12" cy="11" r="1.5" fill="#ffd600" />
      )}
    </svg>
  );
}

// Standout Electric Yellow Star Icon (Yellow Core, Crisp White Outline)
export function IconStar({
  className = 'w-3.5 h-3.5',
  filled = true,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? '#ffd600' : 'none'} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        stroke={filled ? '#ffffff' : '#71717a'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {filled && <circle cx="12" cy="11.5" r="1.8" fill="#ffffff" />}
    </svg>
  );
}

// Standout Tactical Shield (White Perimeter, Red Chevron, Yellow Star)
export function IconShield({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L3 6.5V12C3 17.8 7 21.5 12 22C17 21.5 21 17.8 21 12V6.5L12 2Z"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="#0f0f14"
      />
      <path
        d="M8.5 12L11 14.5L16 9.5"
        stroke="#ff1a3c"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="5" r="1.5" fill="#ffd600" />
    </svg>
  );
}

// Standout Express Delivery Truck (White Chassis, Red Cab, Yellow Speed Fire)
export function IconTruck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* White Cargo Box */}
      <rect x="2" y="5" width="12" height="11" rx="1.5" stroke="#ffffff" strokeWidth="2" fill="#0f0f14" />
      {/* Red Racing Cab */}
      <path d="M14 9H18.5L22 12.5V16H14V9Z" stroke="#ffffff" strokeWidth="2" fill="#ff1a3c" strokeLinejoin="round" />
      {/* Wheels with Yellow Hubs */}
      <circle cx="6" cy="18" r="2.5" stroke="#ffffff" strokeWidth="2" fill="#ffd600" />
      <circle cx="17.5" cy="18" r="2.5" stroke="#ffffff" strokeWidth="2" fill="#ffd600" />
      {/* Speed lines in Yellow */}
      <line x1="0.5" y1="8" x2="2" y2="8" stroke="#ffd600" strokeWidth="2" strokeLinecap="round" />
      <line x1="0" y1="12" x2="2" y2="12" stroke="#ffd600" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Standout 30-Day Returns Arc (White Contour, Red Return Arrow, Yellow Pivot)
export function IconReturns({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12C21 16.97 16.97 21 12 21C8.5 21 5.5 19 4 16"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M3 7V12H8"
        stroke="#ff1a3c"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" fill="#ffd600" stroke="#ffffff" strokeWidth="1" />
    </svg>
  );
}

// Standout Price Drop Tag (White Outline, Red Body, Yellow Slash)
export function IconTag({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20.59 13.41L13.42 20.58C12.63 21.36 11.37 21.36 10.59 20.58L2.5 12.5V2.5H12.5L20.59 10.59C21.37 11.37 21.37 12.63 20.59 13.41Z"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="#ff1a3c"
      />
      <circle cx="7" cy="7" r="2" fill="#ffd600" />
      <line x1="11" y1="11" x2="16" y2="16" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// Standout Equalizer Filter (White Rails, Red Bars, Yellow Pins)
export function IconFilter({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="3" y1="6" x2="21" y2="6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="6" r="3" fill="#ffd600" stroke="#ff1a3c" strokeWidth="2" />

      <line x1="3" y1="12" x2="21" y2="12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="12" r="3" fill="#ffd600" stroke="#ff1a3c" strokeWidth="2" />

      <line x1="3" y1="18" x2="21" y2="18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="18" r="3" fill="#ffd600" stroke="#ff1a3c" strokeWidth="2" />
    </svg>
  );
}

// Standout Cyber Quick View Eye (White Sclera, Red Iris, Yellow Core)
export function IconEye({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="4.2" stroke="#ff1a3c" strokeWidth="2.2" fill="#0f0f14" />
      <circle cx="12" cy="12" r="2" fill="#ffd600" />
    </svg>
  );
}

// Standout Close Cross in Target Circle
export function IconClose({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9.5" stroke="#ffffff" strokeWidth="2" fill="#ff1a3c" />
      <path
        d="M8.5 8.5L15.5 15.5M15.5 8.5L8.5 15.5"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Standout Downward Drop Price Arrow (Red Shaft, White Wing Chevron, Yellow Dot)
export function IconDropArrow({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3V17M12 17L6 11M12 17L18 11"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="20.5" r="2" fill="#ffd600" />
    </svg>
  );
}

// Standout Electric Lightning Zap (Electric Yellow with White Stroke)
export function IconZap({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#ffd600" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Standout Checkmark with Yellow Beacon
export function IconCheck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.5 12.5L9.5 17.5L19.5 6.5"
        stroke="#ffd600"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Standout External Link Arrow
export function IconExternal({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 13V19C18 20.1 17.1 21 16 21H5C3.9 21 3 20.1 3 19V8C3 6.9 3.9 6 5 6H11"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 3H21V9M10 14L21 3"
        stroke="#ffd600"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Standout VIP User Profile Icon
export function IconUser({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7" r="4.5" stroke="#ffffff" strokeWidth="2.2" fill="#ff1a3c" />
      <path
        d="M4 21C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 21"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7" r="1.5" fill="#ffd600" />
    </svg>
  );
}

// Standout Digital Wallet Icon
export function IconWallet({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" stroke="#ffffff" strokeWidth="2.2" fill="#0f0f14" />
      <path d="M16 12H21.5V16H16C14.9 16 14 15.1 14 14C14 12.9 14.9 12 16 12Z" stroke="#ffffff" strokeWidth="2" fill="#ff1a3c" />
      <circle cx="17.5" cy="14" r="1.5" fill="#ffd600" />
    </svg>
  );
}

// Standout Orders Box Icon
export function IconPackage({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ffffff" strokeWidth="2" fill="#ff1a3c" strokeLinejoin="round" />
      <path d="M2 17L12 22L22 17" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
      <path d="M2 12L12 17L22 12" stroke="#ffd600" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// Standout Category Glyphs for the 14 CJ categories with White, Red & Yellow accents
export function CategoryGlyph({
  category,
  className = 'w-4 h-4',
}: {
  category: string;
  className?: string;
}) {
  const norm = category.toLowerCase();

  if (norm.includes('women')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <polygon points="12,2 21,20 3,20" stroke="#ffffff" strokeWidth="2.2" fill="#ff1a3c" />
        <circle cx="12" cy="14" r="2.5" fill="#ffd600" />
      </svg>
    );
  }
  if (norm.includes('men')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="#ffffff" strokeWidth="2.2" fill="#0f0f14" />
        <path d="M12 4V20" stroke="#ff1a3c" strokeWidth="2.5" />
        <circle cx="12" cy="10" r="2" fill="#ffd600" />
      </svg>
    );
  }
  if (norm.includes('pet')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="14" rx="5" ry="4" stroke="#ffffff" strokeWidth="2" fill="#ff1a3c" />
        <circle cx="7" cy="8" r="2" fill="#ffd600" stroke="#ffffff" strokeWidth="1" />
        <circle cx="17" cy="8" r="2" fill="#ffd600" stroke="#ffffff" strokeWidth="1" />
        <circle cx="12" cy="6" r="2" fill="#ffffff" />
      </svg>
    );
  }
  if (norm.includes('furniture') || norm.includes('home')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M3 10L12 2.5L21 10V21H3V10Z" stroke="#ffffff" strokeWidth="2.2" fill="#0f0f14" />
        <rect x="9" y="13" width="6" height="8" stroke="#ff1a3c" strokeWidth="2" fill="#ffd600" />
      </svg>
    );
  }
  if (norm.includes('health') || norm.includes('beauty')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#ffffff" strokeWidth="2.2" fill="#ff1a3c" />
        <path d="M12 6V18M6 12H18" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2" fill="#ffd600" />
      </svg>
    );
  }
  if (norm.includes('jewelry') || norm.includes('watch')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <polygon points="6,3 18,3 22,9 12,21 2,9" stroke="#ffffff" strokeWidth="2.2" fill="#0f0f14" />
        <polygon points="6,3 18,3 22,9 12,21 2,9" stroke="#ff1a3c" strokeWidth="1" />
        <circle cx="12" cy="11" r="3" fill="#ffd600" stroke="#ffffff" strokeWidth="1" />
      </svg>
    );
  }
  if (norm.includes('bag') || norm.includes('shoe')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="7" width="16" height="14" rx="2" stroke="#ffffff" strokeWidth="2.2" fill="#ff1a3c" />
        <path d="M8 7V4C8 2.8 9.2 2 12 2C14.8 2 16 2.8 16 4V7" stroke="#ffd600" strokeWidth="2.5" />
      </svg>
    );
  }
  if (norm.includes('sport') || norm.includes('outdoor')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#ffffff" strokeWidth="2.2" fill="#ff1a3c" />
        <path d="M12 3C8 6 8 18 12 21M12 3C16 6 16 18 12 21" stroke="#ffffff" strokeWidth="2" />
        <circle cx="12" cy="12" r="2.5" fill="#ffd600" />
      </svg>
    );
  }
  if (norm.includes('electronic') || norm.includes('phone') || norm.includes('computer')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="14" rx="2" stroke="#ffffff" strokeWidth="2.2" fill="#0f0f14" />
        <line x1="7" y1="21" x2="17" y2="21" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="21" stroke="#ff1a3c" strokeWidth="2.5" />
        <circle cx="12" cy="10" r="2.5" fill="#ffd600" />
      </svg>
    );
  }
  if (norm.includes('automobile') || norm.includes('motorcycle')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M4 11L7 5H17L20 11H22V16H2V11H4Z" stroke="#ffffff" strokeWidth="2.2" fill="#ff1a3c" strokeLinejoin="round" />
        <circle cx="6.5" cy="16.5" r="2.5" stroke="#ffffff" strokeWidth="2" fill="#ffd600" />
        <circle cx="17.5" cy="16.5" r="2.5" stroke="#ffffff" strokeWidth="2" fill="#ffd600" />
      </svg>
    );
  }
  // Default Drop Diamond
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 22,12 12,22 2,12" stroke="#ffffff" strokeWidth="2.2" fill="#ff1a3c" />
      <circle cx="12" cy="12" r="2.5" fill="#ffd600" />
    </svg>
  );
}
