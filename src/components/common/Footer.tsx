import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SocialIcons } from './SocialIcons';
import { RegistrationMark } from './RegistrationMark';
import logoMark from '../../assets/logo-mark.png';


export const Footer: React.FC = () => {
  const { siteSettings, categories } = useStore();

  return (
    <footer className="bg-[#0F1B2D] text-[#FAF8F5] border-t-4 border-[#D6342C] pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* TOP BRAND ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#1E2E46]">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logoMark} alt="" width={36} height={36} className="w-9 h-9 rounded-lg" />
              <span className="font-bold text-xl tracking-wide text-white">
                Ai Printing Solutions<span className="text-[#D6342C]">.</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {siteSettings.tagline}. High precision digital & offset commercial printing facility in Boralesgamuwa, serving Sri Lankan corporations, small businesses, and institutions nationwide.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <SocialIcons
                className="gap-2"
                itemClassName="w-8 h-8 rounded bg-[#182A45] hover:bg-[#D6342C] text-slate-200 flex items-center justify-center transition-colors"
              />
              <RegistrationMark size={20} className="text-slate-400" />
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1E2E46] pb-2">
              Contact Us
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D6342C] shrink-0 mt-0.5" />
                <span>{siteSettings.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D6342C] shrink-0" />
                <div>
                  <div><strong className="text-white">Hotline:</strong> {siteSettings.hotline}</div>
                  <div><strong className="text-white">Landline:</strong> {siteSettings.landline}</div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#D6342C] shrink-0 mt-0.5" />
                <div>
                  <div>{siteSettings.email}</div>
                  <div className="text-[11px] text-slate-400">Artwork: {siteSettings.artworkEmail}</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Operating Hours */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1E2E46] pb-2">
              Production Hours
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-medium">{siteSettings.hoursWeekday}</div>
                  <div>{siteSettings.hoursSaturday}</div>
                  <div className="text-red-400 mt-1">{siteSettings.hoursSunday}</div>
                </div>
              </li>
              <li className="pt-2 text-[11px] text-slate-400">
                Online orders are received 24/7. Jobs approved before 11:00 AM enter same-day production queue.
              </li>
            </ul>

            {/* Google Map Embed */}
            <div className="mt-3 rounded overflow-hidden border border-[#1E2E46] h-28 w-full">
              <iframe
                title="Ai Printing Solutions Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1980.69!2d79.900509!3d6.8192929!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae25ab43aa6afef%3A0x2984fe2e1cb28f92!2sAi%20Printing%20Solutions!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Categories & Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1E2E46] pb-2">
              Popular Print Lines
            </h4>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-0 sm:gap-y-1.5 text-xs text-slate-300">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/shop/${cat.slug}`}
                    className="hover:text-[#D6342C] transition-colors flex items-center gap-1 group py-2 sm:py-0"
                  >
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-[#D6342C] transition-transform group-hover:translate-x-0.5" />
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
              <li className="col-span-2 sm:col-span-1 mt-2 pt-2 border-t border-[#1E2E46] flex items-center gap-3 text-[11px] text-slate-400 [&>a]:py-2 sm:[&>a]:py-0">
                <Link to="/quote" className="hover:text-white underline">Custom Quote</Link>
                <span>·</span>
                <Link to="/faq" className="hover:text-white underline">FAQ</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* LEGAL LINKS */}
        <nav aria-label="Legal" className="pt-6 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-[11px] text-slate-300 [&>a]:py-1.5 [&>a:hover]:text-white [&>a]:underline">
          <Link to="/terms">Terms &amp; Conditions</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/refund-policy">Refund Policy</Link>
          <Link to="/delivery-policy">Delivery Policy</Link>
          <Link to="/contact">Contact Us</Link>
        </nav>

        {/* BOTTOM BAR: PAYMENT METHODS & COPYRIGHT */}
        <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Ai Printing Solutions (Pvt) Ltd, trading as Ai Printing (aiprinting.lk). All Rights Reserved.
            <br />
            {siteSettings.address}
          </div>

          {/* Payment Badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              We accept:
            </span>
            {['VISA', 'MASTERCARD', 'AMEX', 'EZ CASH', 'MCASH', 'GENIE', 'INTERNET BANKING', 'BANK TRANSFER'].map((m) => (
              <span key={m} className="px-2 py-0.5 rounded bg-[#182A45] text-slate-200 text-[10px] font-semibold tracking-wider">
                {m}
              </span>
            ))}
            <span className="text-[10px] text-slate-500">via PayHere</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
