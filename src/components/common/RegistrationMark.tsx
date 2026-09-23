import React from 'react';

interface Props {
  className?: string;
  size?: number;
}

export const RegistrationMark: React.FC<Props> = ({ className = '', size = 24 }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity ${className}`} title="CMYK Calibration Standard">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="11" stroke="#0F1B2D" strokeWidth="1" />
        <line x1="16" y1="2" x2="16" y2="30" stroke="#0F1B2D" strokeWidth="1" />
        <line x1="2" y1="16" x2="30" y2="16" stroke="#0F1B2D" strokeWidth="1" />
        <circle cx="16" cy="16" r="4" fill="#D6342C" />
      </svg>
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00A3E0]" title="Cyan" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#EC008C]" title="Magenta" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#FFD100]" title="Yellow" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#0F1B2D]" title="Key Black" />
      </div>
    </div>
  );
};
