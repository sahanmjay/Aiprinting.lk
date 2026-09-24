import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Phone,
  MessageCircle,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Flame,
  Star,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatLKR, getWhatsAppUrl } from '../../lib/formatters';

interface LandingProps {
  variant: 'visiting-cards' | 'bill-books' | 'same-day';
}

export const AdLandingPage: React.FC<LandingProps> = ({ variant }) => {
  const { siteSettings } = useStore();

  const config = {
    'visiting-cards': {
      title: 'Premium Visiting Cards Printing in Colombo & Island-Wide',
      subline: '8 premium paper boards. Gloss, matte, metallic gold & ribbed finishes. 100 to 5,000 cards dispatched in 24–48 hours.',
      priceStarting: 'Rs. 1,000.00',
      heroImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1200&q=85',
      primaryLink: '/product/double-sided-visiting-cards',
      buttonText: 'Order Double Sided Cards',
      whatsappNote: 'Hi Ai Printing, I saw your Google Ad for visiting cards in Colombo. Please send pricing.',
      highlights: [
        '9 Specialty Boards (Art, Ivory, Ice Gold, Ice Silver, Conqueror Laid)',
        'Dual-sided CMYK with microscopic typography precision',
        'Standard 90 × 50mm / 90 × 55mm and curved corner options',
        'Free digital proof sent via WhatsApp before printing',
      ],
    },
    'bill-books': {
      title: 'Carbonless (NCR) Bill Books & Invoice Printing Sri Lanka',
      subline: 'Duplicate and triplicate carbonized receipt, invoice, and delivery challan books with clean chemical transfer and sequential numbering.',
      priceStarting: 'Rs. 3,500.00',
      heroImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=85',
      primaryLink: '/product/carbonized-ncr-bill-books',
      buttonText: 'Configure Bill Books',
      whatsappNote: 'Hi Ai Printing, I saw your Google Ad for NCR Bill Books. I need an invoice book quote.',
      highlights: [
        '2-Part & 3-Part NCR (White / Pink / Yellow)',
        'Red/Black crash numbering with micro-perforated tear lines',
        'Wrap-around writing shield with protective binding',
        'Official SVAT and tax invoice formatting support',
      ],
    },
    'same-day': {
      title: 'Same Day Commercial Printing Facility in Colombo',
      subline: 'Urgent print jobs dispatched across Colombo and Western Province within hours. Visiting cards, flyers, posters, and pitch decks.',
      priceStarting: 'Rs. 100.00',
      heroImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85',
      primaryLink: '/quote',
      buttonText: 'Submit Express Print Job',
      whatsappNote: 'Hi Ai Printing, I need same-day printing in Colombo today. Are you available?',
      highlights: [
        'Immediate queue placement for orders approved before 11:00 AM',
        'High-speed digital press resolution up to 1200 DPI',
        'Pick up at Boralesgamuwa factory or express door courier',
        'Full color or black laser documentation',
      ],
    },
  }[variant];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2B2B2B]">
      {/* High-Converting Ad Header (No Nav Distractions) */}
      <div className="bg-[#0F1B2D] text-white py-3 px-4 sm:px-6 border-b border-[#1E2E46]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FAF8F5] text-[#0F1B2D] font-bold rounded flex items-center justify-center text-sm">
              Ai
            </div>
            <span className="font-bold text-base tracking-tight">Ai Printing Solutions</span>
          </Link>

          {/* Above-the-fold Direct Call & WhatsApp */}
          <div className="flex items-center gap-3">
            <a
              href={`tel:${siteSettings.hotline.replace(/\s+/g, '')}`}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#FAF8F5] text-[#0F1B2D] px-3 py-1.5 rounded hover:bg-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#D6342C]" />
              <span>Call: {siteSettings.hotline}</span>
            </a>

            <a
              href={getWhatsAppUrl(siteSettings.whatsapp, config.whatsappNote)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-[#25D366] text-white px-3 py-1.5 rounded shadow-sm hover:bg-[#20bd5a] transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Direct</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Landing Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D6342C]/10 border border-[#D6342C]/30 text-xs font-bold text-[#D6342C] rounded">
              <Flame className="w-3.5 h-3.5 fill-[#D6342C]" />
              <span>Special Online Promotion · Island-Wide 1–2 Days</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F1B2D] leading-[1.12]">
              {config.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-xl">
              {config.subline}
            </p>

            {/* Feature Bullets */}
            <div className="space-y-2.5 pt-2">
              {config.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-slate-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            {/* Price & Immediate CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to={config.primaryLink}
                className="px-8 py-4 bg-[#D6342C] hover:bg-[#B8251E] text-white font-bold text-sm rounded shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <span>{config.buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href={getWhatsAppUrl(siteSettings.whatsapp, config.whatsappNote)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm rounded flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Instant WhatsApp Price</span>
              </a>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% Money-Back Guarantee
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#0F1B2D]" />
                All 25 Districts
              </span>
            </div>
          </div>

          {/* Right Product Image Showcase */}
          <div className="lg:col-span-5">
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-[#E6E0D6] shadow-xl space-y-4">
              <div className="aspect-4/3 rounded overflow-hidden bg-slate-100 border border-[#E6E0D6]">
                <img
                  src={config.heroImage}
                  alt={config.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Special Online Starting Rate</div>
                  <div className="text-xl font-bold text-[#0F1B2D]">{config.priceStarting}</div>
                </div>
                <div className="flex text-amber-500 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
