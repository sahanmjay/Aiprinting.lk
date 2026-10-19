import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CUSTOMER_LOGOS, CustomerLogoItem } from '../../data/customerLogos';

export const CustomerLogoMarquee: React.FC = () => {
  // Split the 64 logos into two balanced rows of 32
  const mid = Math.ceil(CUSTOMER_LOGOS.length / 2);
  const row1 = CUSTOMER_LOGOS.slice(0, mid);
  const row2 = CUSTOMER_LOGOS.slice(mid);

  const renderLogoCard = (logo: CustomerLogoItem, index: number, prefix: string) => (
    <div
      key={`${prefix}-${logo.id}-${index}`}
      className="shrink-0 mx-2 sm:mx-3 bg-white border border-[#E6E0D6] hover:border-[#009CF0]/60 rounded-xl px-4 py-2 sm:px-5 sm:py-3 h-15 sm:h-18 min-w-[130px] sm:min-w-[155px] max-w-[160px] sm:max-w-[180px] flex items-center justify-center shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group/card select-none"
      title={`${logo.name} · ${logo.category}`}
    >
      <img
        src={logo.logoUrl}
        alt={logo.name}
        loading="lazy"
        className="max-h-8 sm:max-h-10 max-w-[105px] sm:max-w-[125px] w-auto h-auto object-contain filter grayscale opacity-75 group-hover/card:grayscale-0 group-hover/card:opacity-100 transition-all duration-300 group-hover/card:scale-105"
      />
    </div>
  );

  return (
    <section
      aria-label="Trusted Customer Logos"
      className="relative -mt-6 sm:-mt-8 py-8 sm:py-12 bg-gradient-to-b from-[#FAF8F5] via-white to-[#FAF8F5] border-y border-[#E6E0D6] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#009CF0] animate-pulse" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#0F1B2D]">
              Trusted by 500+ Leading Sri Lankan Businesses, Brands & Institutions
            </h2>
          </div>
          <Link
            to="/about#clients"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D6342C] hover:text-[#009CF0] transition-colors group"
          >
            <span>View All Corporate Clients</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Marquee Carousel Container with Hover Pause & Edge Gradient Fades */}
      <div className="relative w-full overflow-hidden marquee-pause">
        {/* Left Edge Gradient Fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/90 to-transparent z-10"
        />

        {/* Right Edge Gradient Fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#FAF8F5] via-[#FAF8F5]/90 to-transparent z-10"
        />

        {/* Track 1: Running Left */}
        <div className="overflow-hidden py-1 sm:py-1.5">
          <div className="animate-marquee">
            {row1.map((logo, i) => renderLogoCard(logo, i, 'r1-a'))}
            {row1.map((logo, i) => renderLogoCard(logo, i, 'r1-b'))}
          </div>
        </div>

        {/* Track 2: Running Right */}
        <div className="overflow-hidden py-1 sm:py-1.5">
          <div className="animate-marquee-reverse">
            {row2.map((logo, i) => renderLogoCard(logo, i, 'r2-a'))}
            {row2.map((logo, i) => renderLogoCard(logo, i, 'r2-b'))}
          </div>
        </div>
      </div>

      {/* Trust Micro-Badge Under Ticker */}
      <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] sm:text-xs text-slate-500 font-medium px-4">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#009CF0]" />
          <span>Banking & Financial Leaders</span>
        </span>
        <span className="hidden sm:inline text-slate-300">·</span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#D6342C]" />
          <span>Top Universities & Academies</span>
        </span>
        <span className="hidden sm:inline text-slate-300">·</span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#0F1B2D]" />
          <span>Conglomerates & National Brands</span>
        </span>
      </div>
    </section>
  );
};
