import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Truck,
  DollarSign,
  Award,
  CheckCircle2,
  Printer,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { RegistrationMark } from '../components/common/RegistrationMark';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-16 sm:space-y-24 py-10 sm:py-16">
      {/* 1. HERO STORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A2D4A]/10 border border-[#1A2D4A]/20 text-xs font-semibold rounded text-[#0F1B2D]">
              <RegistrationMark size={14} />
              <span>About Ai Printing Solutions</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F1B2D] leading-[1.12]">
              Craftsmanship, precision machinery, <br />
              <span className="text-[#D6342C]">and commercial print integrity.</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Ai Printing Solutions is a professionally managed commercial printing enterprise based in Boralesgamuwa, Sri Lanka. What began as a dedicated specialist venture has evolved into a comprehensive digital and offset print facility delivering end-to-end solutions—from prepress digital proofing and colour calibration to post-press die-cutting, embossing, foiling, and nationwide fulfilment.
            </p>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              We cater extensively to corporate entities, hospitality conglomerates, advertising agencies, and local small businesses. Our production capabilities span luxury visiting cards, carbonized invoice bill books, promotional brochures, product packaging, tags, barcode stickers, carton seals, and corporate diaries.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-[#E6E0D6] shadow-lg relative space-y-4">
              <div className="aspect-4/3 rounded overflow-hidden bg-slate-100 border border-[#E6E0D6]">
                <img
                  src="https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=800&q=85"
                  alt="Printing facility press"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2 space-y-1">
                <div className="text-xs font-bold text-[#0F1B2D]">
                  Werahara Production Facility
                </div>
                <div className="text-[11px] text-slate-500">
                  11/A Gangarama Rd, Werahara, Boralesgamuwa
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE FOUR SERVICE PILLARS (Prompt 7 requirement) */}
      <section className="reveal bg-white py-16 border-y border-[#E6E0D6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
              Our Core Commitments
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">
              The Four Service Pillars
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Every job that moves through our press floor is held to these non-negotiable operational standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1: One Day Print */}
            <div className="bg-[#FAF8F5] p-6 rounded border border-[#E6E0D6] space-y-3">
              <div className="w-12 h-12 rounded bg-[#0F1B2D] text-white flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#D6342C]" />
              </div>
              <h3 className="font-bold text-base text-[#0F1B2D]">One Day Print</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Streamlined digital press lines and dedicated queue management enable lightning-fast turnaround for express business cards and urgent collateral.
              </p>
            </div>

            {/* Pillar 2: Island-Wide Delivery */}
            <div className="bg-[#FAF8F5] p-6 rounded border border-[#E6E0D6] space-y-3">
              <div className="w-12 h-12 rounded bg-[#0F1B2D] text-white flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-base text-[#0F1B2D]">Island-Wide Delivery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct-to-door courier dispatch across all 25 districts of Sri Lanka in 1 to 2 working days with tracked consignments and protective carton packaging.
              </p>
            </div>

            {/* Pillar 3: Reasonable Prices */}
            <div className="bg-[#FAF8F5] p-6 rounded border border-[#E6E0D6] space-y-3">
              <div className="w-12 h-12 rounded bg-[#0F1B2D] text-white flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-base text-[#0F1B2D]">Reasonable Prices</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transparent live pricing matrices with no concealed plate or setup charges. Volume-scaled economies passed directly to our customers.
              </p>
            </div>

            {/* Pillar 4: Quality Service */}
            <div className="bg-[#FAF8F5] p-6 rounded border border-[#E6E0D6] space-y-3">
              <div className="w-12 h-12 rounded bg-[#0F1B2D] text-white flex items-center justify-center">
                <Award className="w-6 h-6 text-[#D6342C]" />
              </div>
              <h3 className="font-bold text-base text-[#0F1B2D]">Quality Service</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prepress technicians verify bleeds and color separations before exposure. Backed by our complete money-back reprint or refund guarantee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INFRASTRUCTURE & SPECIALITY FINISHES */}
      <section className="reveal max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="bg-white p-8 sm:p-12 rounded-lg border border-[#E6E0D6] space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
              Technical Capability
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">
              Cutting-Edge Technology & Infrastructure
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              Our press floor integrates automated commercial digital presses alongside multi-color offset machinery capable of resolving fine typefaces, microscopic halftones, and rich solid ink densities. We maintain strict climate and humidity control to ensure paper boards remain perfectly flat and warp-free.
            </p>
            <p>
              Beyond printing, our in-house post-press shop features precision programmable guillotine cutters, automatic thermal laminators (matt & gloss), high-speed crash numbering units, creasers, folder-gluers, and wire-o binderies.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
            <span className="px-3 py-1.5 bg-[#FAF8F5] border border-slate-200 rounded text-xs font-semibold text-[#0F1B2D]">
              ✓ Spot UV Varnish
            </span>
            <span className="px-3 py-1.5 bg-[#FAF8F5] border border-slate-200 rounded text-xs font-semibold text-[#0F1B2D]">
              ✓ Hot Foil Stamping (Gold/Silver)
            </span>
            <span className="px-3 py-1.5 bg-[#FAF8F5] border border-slate-200 rounded text-xs font-semibold text-[#0F1B2D]">
              ✓ Blind & Tint Embossing
            </span>
            <span className="px-3 py-1.5 bg-[#FAF8F5] border border-slate-200 rounded text-xs font-semibold text-[#0F1B2D]">
              ✓ Custom Die-Cut Tooling
            </span>
            <span className="px-3 py-1.5 bg-[#FAF8F5] border border-slate-200 rounded text-xs font-semibold text-[#0F1B2D]">
              ✓ Sequential Crash Numbering
            </span>
          </div>
        </div>
      </section>

      {/* 4. BOTTOM ACTION */}
      <section className="reveal max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4">
        <h3 className="text-xl sm:text-2xl font-bold text-[#0F1B2D]">
          Ready to partner with Sri Lanka's dedicated commercial print facility?
        </h3>
        <div className="flex justify-center gap-3">
          <Link
            to="/shop"
            className="px-6 py-3 bg-[#0F1B2D] text-white font-bold text-xs rounded hover:bg-[#182A45] transition-colors"
          >
            Explore Our Products
          </Link>
          <Link
            to="/quote"
            className="px-6 py-3 bg-[#D6342C] text-white font-bold text-xs rounded hover:bg-[#B8251E] transition-colors"
          >
            Get a Custom Quote
          </Link>
        </div>
      </section>
    </div>
  );
};
