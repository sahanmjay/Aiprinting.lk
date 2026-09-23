import React, { useState, useMemo } from 'react';
import { ChevronDown, HelpCircle, MessageCircle, Phone, Search } from 'lucide-react';
import { SEED_FAQS } from '../data/seedData';
import { useStore } from '../context/StoreContext';
import { getWhatsAppUrl } from '../lib/formatters';

export const FAQPage: React.FC = () => {
  const { siteSettings } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Design', 'Pricing', 'Quality', 'Technical'];

  const filteredFaqs = useMemo(() => {
    return SEED_FAQS.filter((f) => {
      const matchCat = selectedCategory === 'All' || f.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
          Knowledge Base & Help
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0F1B2D]">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Everything you need to know about paper stock differences, RGB vs CMYK color fidelity, bleed guidelines, delivery logistics, and quotation turnaround.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-[#E6E0D6]">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#0F1B2D] text-white'
                  : 'bg-[#FAF8F5] text-slate-600 hover:text-[#0F1B2D] border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:outline-hidden"
          />
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.id}
              className="bg-white rounded-lg border border-[#E6E0D6] shadow-xs overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-sm sm:text-base text-[#0F1B2D] leading-snug">
                  {faq.question}
                </span>
                <span className="shrink-0 text-slate-400">
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#D6342C]' : ''}`}
                  />
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-[#FAF8F5]">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Still Have Questions Box */}
      <div className="bg-[#0F1B2D] text-white p-8 rounded-lg text-center space-y-4">
        <h3 className="text-xl font-bold">Have a specific question not covered here?</h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Our prepress technicians and customer support team in Boralesgamuwa are available Mon–Sat to help you choose the ideal paper and finish.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <a
            href={getWhatsAppUrl(siteSettings.whatsapp, "Hi Ai Printing, I have a question about printing specifications.")}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-[#25D366] text-white font-bold text-xs rounded flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Ask on WhatsApp</span>
          </a>

          <a
            href={`tel:${siteSettings.hotline.replace(/\s+/g, '')}`}
            className="px-5 py-2.5 bg-[#FAF8F5] text-[#0F1B2D] font-bold text-xs rounded flex items-center justify-center gap-2 hover:bg-white"
          >
            <Phone className="w-4 h-4 text-[#D6342C]" />
            <span>Call {siteSettings.hotline}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
