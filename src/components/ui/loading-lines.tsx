import React from 'react';

// "AI PRINTING" letters flash in sequence while a CMYK ink glow sweeps behind raster lines.
// Keyframes (loadLetter, loadSweep, loadFade) live in index.css.
const LoadingLines: React.FC<{ text?: string; fullScreen?: boolean }> = ({ text = 'AI PRINTING', fullScreen = false }) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex items-center justify-center bg-[#FAF8F5] ${fullScreen ? 'fixed inset-0 z-[100]' : 'min-h-[60vh]'}`}
    >
      <div className="relative flex items-center justify-center px-4 py-6 font-['Space_Grotesk'] text-3xl sm:text-5xl font-bold tracking-[0.08em] select-none">
        {text.split('').map((letter, idx) => (
          <span
            key={idx}
            className="loading-letter relative inline-block z-[2] text-[#0F1B2D]"
            style={{ animationDelay: `${0.1 + idx * 0.105}s` }}
          >
            {letter === ' ' ? ' ' : letter}
          </span>
        ))}

        {/* Raster lines, like a halftone screen */}
        <div
          aria-hidden
          className="absolute inset-0 z-[1] overflow-hidden [mask:repeating-linear-gradient(90deg,transparent_0,transparent_6px,black_7px,black_8px)]"
        >
          {/* Cyan / magenta / yellow ink glow sweeping left and right */}
          <div className="loading-glow absolute inset-0 [background-image:radial-gradient(circle_at_50%_50%,#FFD100_0%,transparent_50%),radial-gradient(circle_at_45%_45%,#EC008C_0%,transparent_45%),radial-gradient(circle_at_55%_55%,#00A3E0_0%,transparent_45%),radial-gradient(circle_at_45%_55%,#D6342C_0%,transparent_40%)] [mask:radial-gradient(circle_at_50%_50%,transparent_0%,transparent_10%,black_25%)]" />
        </div>
      </div>
    </div>
  );
};

export default LoadingLines;
