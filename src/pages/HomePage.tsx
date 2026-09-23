import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileUp,
  Printer,
  PackageCheck,
  MessageCircle,
  Flame,
  Star,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatLKR } from '../lib/formatters';
import { RegistrationMark } from '../components/common/RegistrationMark';
import { SEED_TESTIMONIALS, SEED_CLIENT_LOGOS } from '../data/seedData';
import { getWhatsAppUrl } from '../lib/formatters';

export const HomePage: React.FC = () => {
  const { categories, products, siteSettings } = useStore();

  const featuredProducts = products.filter((p) => p.isFeatured || p.isHot).slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative bg-[#0F1B2D] text-[#FAF8F5] pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">
        {/* Subtle Halftone Pattern */}
        <div className="absolute inset-0 opacity-10 bg-halftone pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#1A2D4A] border border-[#2A436B] text-xs font-semibold tracking-wide text-slate-200">
                <RegistrationMark size={16} />
                <span>Commercial Printing Facility · Boralesgamuwa, Sri Lanka</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
                Precision print, <br />
                <span className="text-[#D6342C]">delivered on time</span> <br />
                to your doorstep.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
                From luxury double-sided visiting cards in 9 speciality boards to carbonless bill books and marketing collateral. Real-time pricing matrix and reliable 1–2 day island-wide delivery.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  to="/product/double-sided-visiting-cards"
                  className="px-6 py-3.5 bg-[#D6342C] hover:bg-[#B8251E] text-white font-bold text-sm rounded shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>Order Visiting Cards</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/quote"
                  className="px-6 py-3.5 bg-[#182A45] hover:bg-[#203657] text-[#FAF8F5] font-semibold text-sm rounded border border-[#2D456B] transition-colors flex items-center justify-center gap-2"
                >
                  <span>Request Custom Quote</span>
                </Link>

                <a
                  href={getWhatsAppUrl(siteSettings.whatsapp, "Hi Ai Printing, I'd like a quick quote.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:hidden px-6 py-3 bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] font-semibold text-sm rounded flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              {/* Micro Trust indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>No hidden setup fees</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Free digital PDF proof</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Island-wide 1–2 days</span>
                </span>
              </div>
            </div>

            {/* Right Visual Card Showcase */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-[#FAF8F5] text-[#2B2B2B] p-6 rounded-lg shadow-2xl border border-white/20 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6E0D6] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D6342C]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0F1B2D]">
                      Bestseller Spotlight
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#D6342C] bg-[#D6342C]/10 px-2 py-0.5 rounded">
                    HOT
                  </span>
                </div>

                <div className="rounded overflow-hidden border border-[#E6E0D6] aspect-4/3 relative group">
                  <img
                    src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=85"
                    alt="Double Sided Visiting Cards"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="eager"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#0F1B2D]/90 text-white text-[11px] px-2.5 py-1 rounded backdrop-blur-xs font-medium">
                    9 Premium Board Stocks
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-[#0F1B2D]">
                    Double Sided Visiting Cards
                  </h3>
                  <p className="text-xs text-slate-600">
                    Gloss, matte, metallic gold/silver, or textured conqueror laid.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E6E0D6] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">
                      Starting From
                    </div>
                    <div className="text-base font-bold text-[#0F1B2D]">
                      {formatLKR(1300)} <span className="text-xs font-normal text-slate-500">/ 100 cards</span>
                    </div>
                  </div>
                  <Link
                    to="/product/double-sided-visiting-cards"
                    className="px-4 py-2 bg-[#0F1B2D] hover:bg-[#182A45] text-white text-xs font-bold rounded transition-colors"
                  >
                    Configure Now &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE VALUE PROPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prop 1 */}
          <div className="bg-white p-6 rounded border border-[#E6E0D6] shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-11 h-11 rounded bg-[#0F1B2D] text-white flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#D6342C]" />
            </div>
            <h3 className="text-lg font-bold text-[#0F1B2D]">
              Money-Back Guarantee
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Everything we print is guaranteed. If you're not satisfied, for any reason, return it for a reprint, credit or refund.
            </p>
          </div>

          {/* Prop 2 */}
          <div className="bg-white p-6 rounded border border-[#E6E0D6] shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-11 h-11 rounded bg-[#0F1B2D] text-white flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-[#0F1B2D]">
              Island-Wide Delivery
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Business cards or posters in a hurry? Delivered safely to any address in all 25 districts of Sri Lanka in 1–2 days.
            </p>
          </div>

          {/* Prop 3 */}
          <div className="bg-white p-6 rounded border border-[#E6E0D6] shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-11 h-11 rounded bg-[#0F1B2D] text-white flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-[#0F1B2D]">
              1,000+ Happy Customers
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Serving Sri Lanka's leading hotel chains, corporations, agencies, and entrepreneurs with commercial grade fidelity.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SHOP BY CATEGORY (10 TILES) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b border-[#E6E0D6] pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C] mb-1">
              Print Lines
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold text-[#0F1B2D] hover:text-[#D6342C] flex items-center gap-1 group"
          >
            <span>View Full Catalogue</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop/${cat.slug}`}
              className="group bg-white rounded border border-[#E6E0D6] overflow-hidden hover:border-[#0F1B2D] hover:shadow-md transition-all flex flex-col"
            >
              <div className="aspect-4/3 overflow-hidden bg-slate-100">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-3 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#0F1B2D] group-hover:text-[#D6342C] transition-colors leading-snug">
                    {cat.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {cat.description}
                  </p>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-[#0F1B2D] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Explore</span>
                  <span>&rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex justify-between items-end border-b border-[#E6E0D6] pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C] mb-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-[#D6342C]" />
              <span>High Demand Lines</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">
              Featured Products
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded border border-[#E6E0D6] overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  <img
                    src={prod.images[0]?.imageUrl}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {prod.isHot && (
                    <span className="absolute top-2.5 left-2.5 bg-[#D6342C] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-current" />
                      Hot
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {prod.categoryName}
                  </div>
                  <h3 className="font-bold text-base text-[#0F1B2D] leading-snug group-hover:text-[#D6342C] transition-colors">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {prod.shortDescription}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">From</div>
                  <div className="text-sm font-bold text-[#0F1B2D]">
                    {formatLKR(prod.basePrice)}
                  </div>
                </div>
                <Link
                  to={`/product/${prod.slug}`}
                  className="px-3.5 py-1.5 bg-[#0F1B2D] hover:bg-[#D6342C] text-white text-xs font-semibold rounded transition-colors"
                >
                  Configure
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. HOW IT WORKS (4 STEPS) */}
      <section className="bg-white py-16 border-y border-[#E6E0D6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
              Streamlined Process
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">
              How Online Print Ordering Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              No endless phone calls or unclear invoices. Configure your exact options and track progress in 4 easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded border border-[#E6E0D6] bg-[#FAF8F5] relative space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#0F1B2D] text-white font-bold text-sm flex items-center justify-center">
                01
              </div>
              <h3 className="font-bold text-base text-[#0F1B2D]">Choose & Configure</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select your paper board, finish, and quantity. Watch the price recalculate automatically in real time.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded border border-[#E6E0D6] bg-[#FAF8F5] relative space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#0F1B2D] text-white font-bold text-sm flex items-center justify-center">
                02
              </div>
              <h3 className="font-bold text-base text-[#0F1B2D]">Upload Artwork</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drag & drop your print-ready PDF, AI, or PSD. Don't have artwork? Select "Design it for me" for Rs. 500.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded border border-[#E6E0D6] bg-[#FAF8F5] relative space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#0F1B2D] text-white font-bold text-sm flex items-center justify-center">
                03
              </div>
              <h3 className="font-bold text-base text-[#0F1B2D]">We Print & Finish</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our press technicians check CMYK bleed, expose plates, and execute precision cutting, scoring, or lamination.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded border border-[#E6E0D6] bg-[#FAF8F5] relative space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#D6342C] text-white font-bold text-sm flex items-center justify-center">
                04
              </div>
              <h3 className="font-bold text-base text-[#0F1B2D]">Island-Wide Delivery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Carefully packaged and dispatched via courier right to your office or home in 1–2 working days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
            Verified Client Reviews
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">
            What Our Clients Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SEED_TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-white p-6 rounded border border-[#E6E0D6] shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex gap-1 text-amber-500">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  "{t.content}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0F1B2D] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {t.customerName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0F1B2D]">{t.customerName}</h4>
                  <div className="text-[11px] text-slate-500">{t.customerTitle}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CLIENT LOGO WALL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Trusted by Leading Organizations Across Sri Lanka
          </span>
        </div>

        <div className="bg-white p-6 rounded border border-[#E6E0D6] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 items-center justify-items-center opacity-80 hover:opacity-100 transition-opacity">
          {SEED_CLIENT_LOGOS.map((logo) => (
            <div
              key={logo.id}
              className="w-full py-3 px-2 text-center text-xs font-semibold text-slate-600 bg-[#FAF8F5] rounded border border-slate-200/60 hover:text-[#0F1B2D] hover:border-[#0F1B2D] transition-colors"
            >
              {logo.companyName}
            </div>
          ))}
        </div>
      </section>

      {/* 8. CTA BAND */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#0F1B2D] text-white rounded-lg p-8 sm:p-12 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <RegistrationMark size={240} />
          </div>

          <div className="space-y-3 max-w-xl text-left relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A2D4A] rounded text-xs text-slate-200 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#D6342C]" />
              <span>Custom Quantities & Finishing On Request</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Have a bulk order or custom specification?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Submit your RFQ specifications online. Our prepress team will deliver an accurate quotation and digital proof within 1 business day.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full lg:w-auto">
            <Link
              to="/quote"
              className="px-6 py-3.5 bg-[#D6342C] hover:bg-[#B8251E] text-white font-bold text-xs rounded transition-colors text-center shadow-md"
            >
              Request a Custom Quote
            </Link>
            <a
              href={getWhatsAppUrl(siteSettings.whatsapp, "Hi Ai Printing, I'd like to ask about a bulk print order.")}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Direct WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
