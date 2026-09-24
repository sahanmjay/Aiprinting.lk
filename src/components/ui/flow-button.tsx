import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Colour sets: border / text at rest, the circle that floods in, and the text colour on hover.
const VARIANTS = {
  dark: 'border-[#0F1B2D]/40 text-[#0F1B2D] hover:text-white [--flow-fill:#0F1B2D]', // on light backgrounds
  light: 'border-white/40 text-white hover:text-[#0F1B2D] [--flow-fill:#ffffff]', // on dark backgrounds
  accent: 'border-[#D6342C] bg-[#D6342C] text-white hover:text-[#D6342C] [--flow-fill:#ffffff]', // primary call to action
};

interface FlowButtonProps {
  text?: string;
  variant?: keyof typeof VARIANTS;
  to?: string; // renders a router Link instead of a <button>
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}

export function FlowButton({
  text = 'Modern Button',
  variant = 'dark',
  to,
  onClick,
  type = 'button',
  disabled,
  className = '',
}: FlowButtonProps) {
  const classes = `group relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] px-8 py-3 text-sm font-semibold cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:rounded-[12px] active:scale-[0.95] disabled:opacity-60 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`;

  const content = (
    <>
      {/* Left arrow slides in */}
      <ArrowRight className="absolute w-4 h-4 left-[-25%] z-[9] group-hover:left-4 transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" />

      <span className="relative z-[1] -translate-x-3 group-hover:translate-x-3 transition-all duration-[800ms] ease-out">
        {text}
      </span>

      {/* Circle floods the button; sized by width so it covers wide buttons too */}
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 aspect-square rounded-[50%] bg-[var(--flow-fill)] opacity-0 group-hover:w-[150%] group-hover:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)]" />

      {/* Right arrow slides out */}
      <ArrowRight className="absolute w-4 h-4 right-4 z-[9] group-hover:right-[-25%] transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  );
}
