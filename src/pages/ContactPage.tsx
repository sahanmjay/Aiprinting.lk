import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { getWhatsAppUrl } from '../lib/formatters';

export const ContactPage: React.FC = () => {
  const { siteSettings, sendContactMessage } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      alert('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendContactMessage({
        name,
        email,
        phone,
        subject,
        message,
      });
      setIsSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('Failed to send contact message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
          Get in Touch
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0F1B2D]">
          Contact Our Print Facility
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Visit our Boralesgamuwa factory, call our direct hotlines, or send us a message below. We respond promptly during production hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Contact Details Cards & Google Map */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-5">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#0F1B2D] border-b border-[#E6E0D6] pb-3">
              Direct Contact Channels
            </h3>

            <ul className="space-y-4 text-xs text-slate-700">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-[#FAF8F5] border border-[#E6E0D6] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#D6342C]" />
                </div>
                <div>
                  <div className="font-bold text-[#0F1B2D]">Factory Location</div>
                  <div className="text-slate-600">{siteSettings.address}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">GPS Coords: 6.81929, 79.89832</div>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-[#FAF8F5] border border-[#E6E0D6] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#D6342C]" />
                </div>
                <div>
                  <div className="font-bold text-[#0F1B2D]">Telephone Numbers</div>
                  <div>Hotline: <a href={`tel:${siteSettings.hotline.replace(/\s+/g, '')}`} className="font-semibold text-[#0F1B2D] hover:underline">{siteSettings.hotline}</a></div>
                  <div>Landline: <a href={`tel:${siteSettings.landline.replace(/\s+/g, '')}`} className="text-slate-600 hover:underline">{siteSettings.landline}</a></div>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-[#FAF8F5] border border-[#E6E0D6] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#D6342C]" />
                </div>
                <div>
                  <div className="font-bold text-[#0F1B2D]">Email Inquiries</div>
                  <div>General: <a href={`mailto:${siteSettings.email}`} className="text-[#0F1B2D] font-medium hover:underline">{siteSettings.email}</a></div>
                  <div>Artwork: <a href={`mailto:${siteSettings.artworkEmail}`} className="text-slate-600 hover:underline">{siteSettings.artworkEmail}</a></div>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-[#FAF8F5] border border-[#E6E0D6] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <div className="font-bold text-[#0F1B2D]">Operating Hours</div>
                  <div>{siteSettings.hoursWeekday}</div>
                  <div>{siteSettings.hoursSaturday}</div>
                  <div className="text-red-500 font-medium">{siteSettings.hoursSunday}</div>
                </div>
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-100">
              <a
                href={getWhatsAppUrl(siteSettings.whatsapp, "Hi Ai Printing, I'd like to ask a question.")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Instant Message on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Embedded Google Map */}
          <div className="bg-white p-2 rounded-lg border border-[#E6E0D6] overflow-hidden shadow-xs h-64">
            <iframe
              title="Google Map Boralesgamuwa"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.3787727092923!2d79.89613131535787!3d6.819289995071373!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae25a557b77bebd%3A0xb35a0fbf021481db!2s11%2FA%20Gangarama%20Rd%2C%20Boralesgamuwa!5e0!3m2!1sen!2slk!4v1689000000000!5m2!1sen!2slk"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* Right Column: Contact Message Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-lg border border-[#E6E0D6] shadow-xs space-y-6">
          <div className="border-b border-[#E6E0D6] pb-3">
            <h3 className="font-bold text-base text-[#0F1B2D] uppercase tracking-wider">
              Send Us a Message
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Have an inquiry about an active job or need technical advice on artwork setup? Write to us below.
            </p>
          </div>

          {isSubmitted ? (
            <div className="p-8 text-center bg-emerald-50 border border-emerald-300 rounded space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-base text-emerald-900">Message Received</h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Thank you! Your message has been routed to our customer services desk. We will respond via email or phone within 1 business day.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-3 px-4 py-2 bg-[#0F1B2D] text-white text-xs font-semibold rounded"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="contact-name" className="font-bold text-slate-700">Full Name *</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Roshan Samarajeewa"
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-email" className="font-bold text-slate-700">Email Address *</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@domain.com"
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="contact-phone" className="font-bold text-slate-700">Telephone / Mobile</label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 077 323 3533"
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-subject" className="font-bold text-slate-700">Subject *</label>
                  <input
                    id="contact-subject"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Inquiring about Double Sided Metallic Cards"
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="contact-message" className="font-bold text-slate-700">Message *</label>
                <textarea
                  id="contact-message"
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we assist with your print requirement? Please include dimensions, quantities, or specific questions."
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#D6342C] hover:bg-[#B8251E] disabled:bg-slate-400 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
