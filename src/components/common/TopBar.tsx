import React from 'react';
import { Phone, Mail, Truck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const TopBar: React.FC = () => {
  const { siteSettings } = useStore();

  return (
    <div className="bg-[#0F1B2D] text-[#FAF8F5] text-xs border-b border-[#1E2E46] py-1.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        {/* Trust Signal */}
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <Truck className="w-3.5 h-3.5 text-[#D6342C]" />
          <span>{siteSettings.announcementText}</span>
        </div>

        {/* Contact Links */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
          <a
            href={`tel:${siteSettings.hotline.replace(/\s+/g, '')}`}
            className="flex items-center gap-1.5 hover:text-[#FAF8F5] text-slate-300 transition-colors"
          >
            <Phone className="w-3 h-3 text-[#D6342C]" />
            <span className="font-semibold">Hotline:</span> {siteSettings.hotline}
          </a>

          <span className="hidden md:inline text-slate-500">|</span>

          <a
            href={`tel:${siteSettings.landline.replace(/\s+/g, '')}`}
            className="hidden md:flex items-center gap-1.5 hover:text-[#FAF8F5] text-slate-300 transition-colors"
          >
            <span>Landline: {siteSettings.landline}</span>
          </a>

          <span className="hidden md:inline text-slate-500">|</span>

          <a
            href={`mailto:${siteSettings.email}`}
            className="hidden sm:flex items-center gap-1.5 hover:text-[#FAF8F5] text-slate-300 transition-colors"
          >
            <Mail className="w-3 h-3 text-slate-400" />
            <span>{siteSettings.email}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
