import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { getWhatsAppUrl } from '../../lib/formatters';

export const FloatingWhatsApp: React.FC = () => {
  const { siteSettings } = useStore();
  const onProductPage = useLocation().pathname.startsWith('/product/'); // has its own sticky bar on phones
  const url = getWhatsAppUrl(
    siteSettings.whatsapp,
    "Hi Ai Printing, I'd like to ask about your printing services and get a price estimate."
  );

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center group ${onProductPage ? 'max-lg:hidden' : ''}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-white"
        aria-label="Direct WhatsApp Chat with Ai Printing Solutions"
      >
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-6 h-6 fill-current text-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
        </div>
        <div className="text-left leading-tight hidden sm:block">
          <div className="text-[11px] font-medium opacity-90">Instant Quote & Support</div>
          <div className="text-xs font-bold uppercase tracking-wider">Chat on WhatsApp</div>
        </div>
      </a>
    </div>
  );
};
