import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Send,
  UploadCloud,
  CheckCircle2,
  Phone,
  MessageCircle,
  FileCheck,
  X,
  FileDown,
  Search,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { uploadFile } from '../lib/supabase';
import { getWhatsAppUrl, formatLKR } from '../lib/formatters';
import { useQuotationPrint, QuotationData } from '../components/common/QuotationDocument';
import { Quotation } from '../types';

// Staff price a quote in the admin panel; until then the PDF is a "quotation request" without amounts.
const isPriced = (q: Quotation) => q.quotedAmount != null && (q.status === 'quoted' || q.status === 'won');

const quoteToDocument = (q: Quotation): QuotationData => {
  const details = [q.specifications];
  if (q.deadline) details.push(`Required by: ${q.deadline}`);
  return {
    quoteNumber: q.quoteNumber,
    date: new Date(isPriced(q) && q.quotedAt ? q.quotedAt : q.createdAt),
    customerName: q.name,
    company: q.company ?? '',
    phone: q.phone,
    lines: [
      {
        description: q.productType,
        details,
        quantity: q.quantity,
        amount: isPriced(q) ? Number(q.quotedAmount) : undefined,
      },
    ],
    notes: '',
    deliveryFee: 0, // staff quote the full price including delivery
  };
};

export const QuotePage: React.FC = () => {
  const { createQuote, trackQuote, siteSettings, categories } = useStore();
  const { printQuotation, quotationDoc } = useQuotationPrint(siteSettings);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [productType, setProductType] = useState('Visiting Cards');
  const [otherProductType, setOtherProductType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [deadline, setDeadline] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<Quotation | null>(null);

  // "Download your quotation" lookup
  const [lookupNumber, setLookupNumber] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResult, setLookupResult] = useState<Quotation | 'not-found' | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupNumber.trim() || !lookupPhone.trim()) return;
    setIsLookingUp(true);
    try {
      setLookupResult((await trackQuote(lookupNumber.trim(), lookupPhone.trim())) ?? 'not-found');
    } catch (err) {
      console.error('Quote lookup failed:', err);
      alert('Could not look up the quotation right now. Please try again, or contact us on WhatsApp.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setAttachmentName(`Uploading ${file.name}…`);
    try {
      setAttachmentUrl(await uploadFile('quote-attachments', file));
      setAttachmentName(file.name);
    } catch (err) {
      console.error('Attachment upload failed:', err);
      setAttachmentName('');
      alert('Could not upload the attachment. Please try again, or email it to us.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !quantity || !specifications) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalProductType = productType === 'Other' ? otherProductType || 'Custom Job' : productType;
      const quote = await createQuote({
        name,
        email,
        phone,
        company,
        productType: finalProductType,
        quantity,
        specifications,
        deadline,
        attachmentName,
        attachmentUrl,
      });

      setSubmittedQuote(quote);
    } catch (err) {
      console.error('Failed to submit quote:', err);
      alert('Sorry, we could not send your quote request. Please try again, or contact us on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedQuote) {
    const submittedQuoteNumber = submittedQuote.quoteNumber;
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        {quotationDoc}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Quotation Request Received
          </div>
          <h1 className="text-3xl font-bold text-[#0F1B2D]">Quote #{submittedQuoteNumber}</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Thank you, {name}! Our commercial estimating team has received your job specifications. We will review your materials and price them within <strong>one working day</strong>. Once priced, download your official quotation from this page using quote number <strong>{submittedQuoteNumber}</strong> and your phone number.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => printQuotation(quoteToDocument(submittedQuote))}
            className="px-6 py-3 bg-[#0F1B2D] hover:bg-[#182A45] text-white font-bold text-xs rounded flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Quotation Request (PDF)</span>
          </button>

          <a
            href={getWhatsAppUrl(
              siteSettings.whatsapp,
              `Hi Ai Printing, I submitted RFQ #${submittedQuoteNumber} for ${productType} (${quantity}). Could you check on it?`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-[#25D366] text-white font-bold text-xs rounded flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Follow Up on WhatsApp</span>
          </a>

          <button
            onClick={() => {
              setSubmittedQuote(null);
              setSpecifications('');
              setQuantity('');
              setAttachmentName('');
            }}
            className="px-6 py-3 border border-[#0F1B2D] text-[#0F1B2D] font-semibold text-xs rounded hover:bg-slate-50"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
      {quotationDoc}
      {/* Header */}
      <div className="bg-white rounded-lg border border-[#E6E0D6] p-6 sm:p-10 space-y-3 relative overflow-hidden">
        <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
          Custom Commercial Estimates
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F1B2D]">
          Request a Custom Print Quotation
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
          For bulk production (5,000+ units), custom dimensions, foil stamping, spot UV varnishes, bespoke bookbinding, or multi-item corporate packages. We provide written quotations within 1 working day.
        </p>

        <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#D6342C]" />
            <span>Response within 24 hours</span>
          </span>
          <span>·</span>
          <span>Free prepress check</span>
          <span>·</span>
          <span>Island-wide commercial shipping</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* RFQ Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-lg border border-[#E6E0D6] shadow-xs space-y-5">
          <h2 className="font-bold text-base text-[#0F1B2D] border-b border-[#E6E0D6] pb-3 uppercase tracking-wider">
            Job & Contact Specifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label htmlFor="quote-name" className="font-bold text-slate-700">Your Name *</label>
              <input
                id="quote-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. S.K.K Wijesekara"
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="quote-phone" className="font-bold text-slate-700">Telephone / Mobile *</label>
              <input
                id="quote-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 077 323 3533"
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="quote-email" className="font-bold text-slate-700">Email Address *</label>
              <input
                id="quote-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. info@company.lk"
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="quote-company" className="font-bold text-slate-700">Company / Organization (Optional)</label>
              <input
                id="quote-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Ceylon Logistics Ltd"
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="quote-product-type" className="font-bold text-slate-700">Product Line *</label>
              <select
                id="quote-product-type"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="Packaging & Carton Boxes">Packaging & Carton Boxes</option>
                <option value="Annual Reports & Booklets">Annual Reports & Booklets</option>
                <option value="Other">Other Custom Print</option>
              </select>
            </div>

            {productType === 'Other' && (
              <div className="space-y-1">
                <label htmlFor="quote-custom-product" className="font-bold text-slate-700">Specify Custom Product *</label>
                <input
                  id="quote-custom-product"
                  type="text"
                  required
                  value={otherProductType}
                  onChange={(e) => setOtherProductType(e.target.value)}
                  placeholder="e.g. Foil stamped warranty certificates"
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
                />
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="quote-quantity" className="font-bold text-slate-700">Required Quantity *</label>
              <input
                id="quote-quantity"
                type="text"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 10,000 cards or 200 books"
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="quote-deadline" className="font-bold text-slate-700">Required By / Target Deadline</label>
              <input
                id="quote-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label htmlFor="quote-specifications" className="font-bold text-slate-700">Detailed Specifications *</label>
              <textarea
                id="quote-specifications"
                rows={4}
                required
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                placeholder="Specify dimensions (e.g. 210 x 297mm), paper stock gsm, number of pages/parts, finishing (lamination, embossing, numbering), and delivery location."
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Optional File Attachment */}
            <div className="sm:col-span-2 space-y-2 pt-1">
              <span className="block font-bold text-slate-700">
                Optional Reference File / Mockup (PDF, AI, JPG, PNG)
              </span>
              {attachmentName ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs">
                  <span className="flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4" />
                    {attachmentName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentName('');
                      setAttachmentUrl('');
                    }}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-[#E6E0D6] hover:border-[#0F1B2D] rounded p-4 block text-center cursor-pointer bg-[#FAF8F5]">
                  <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-[#0F1B2D]">Attach Layout or Artwork Spec</span>
                  <input
                    type="file"
                    accept=".pdf,.ai,.psd,.cdr,.jpg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#D6342C] hover:bg-[#B8251E] disabled:bg-slate-400 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Sending Request...' : 'Submit Quotation Request'}</span>
          </button>
        </form>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-4">
          {/* Download a quotation the team has priced */}
          <form
            onSubmit={handleLookup}
            className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-3 text-xs"
          >
            <h3 className="font-bold text-sm text-[#0F1B2D] uppercase tracking-wider border-b border-[#E6E0D6] pb-2">
              Download Your Quotation
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Already sent a request? Enter your quote number and phone to download your quotation PDF.
            </p>
            <input
              aria-label="Quote number"
              placeholder="e.g. QT-2026-660961"
              value={lookupNumber}
              onChange={(e) => {
                setLookupNumber(e.target.value);
                setLookupResult(null);
              }}
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden font-mono uppercase"
            />
            <input
              aria-label="Phone number used on the request"
              type="tel"
              placeholder="Phone number used on the request"
              value={lookupPhone}
              onChange={(e) => {
                setLookupPhone(e.target.value);
                setLookupResult(null);
              }}
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isLookingUp}
              className="w-full py-2.5 bg-[#0F1B2D] hover:bg-[#182A45] text-white font-bold rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              <span>{isLookingUp ? 'Searching…' : 'Find My Quotation'}</span>
            </button>

            {lookupResult === 'not-found' && (
              <p role="status" className="text-red-600">
                No quotation found for that number and phone. Please check both and try again.
              </p>
            )}
            {lookupResult && lookupResult !== 'not-found' && (
              <div role="status" className="p-3 rounded border border-[#E6E0D6] bg-[#FAF8F5] space-y-2">
                {lookupResult.status === 'lost' ? (
                  <p className="text-slate-700">
                    Quotation <strong>{lookupResult.quoteNumber}</strong> is closed. Please send a new request or WhatsApp us.
                  </p>
                ) : isPriced(lookupResult) ? (
                  <p className="text-emerald-800">
                    Your quotation is ready: <strong>{formatLKR(Number(lookupResult.quotedAmount))}</strong>
                  </p>
                ) : (
                  <p className="text-amber-800">
                    Our team is still pricing <strong>{lookupResult.quoteNumber}</strong>. You can download your request summary now.
                  </p>
                )}
                {lookupResult.status !== 'lost' && (
                  <button
                    type="button"
                    onClick={() => printQuotation(quoteToDocument(lookupResult))}
                    className="w-full py-2.5 bg-[#D6342C] hover:bg-[#B8251E] text-white font-bold rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>{isPriced(lookupResult) ? 'Download Quotation (PDF)' : 'Download Request (PDF)'}</span>
                  </button>
                )}
              </div>
            )}
          </form>

          <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#0F1B2D] uppercase tracking-wider border-b border-[#E6E0D6] pb-2">
              Need It Faster?
            </h3>
            <p className="text-slate-600 leading-relaxed">
              If your deadline is urgent or you have an ongoing tender requirement, speak immediately with our production manager in Boralesgamuwa:
            </p>

            <div className="space-y-2 pt-1">
              <a
                href={`tel:${siteSettings.hotline.replace(/\s+/g, '')}`}
                className="flex items-center gap-2 p-3 bg-[#FAF8F5] rounded border border-[#E6E0D6] hover:border-[#0F1B2D] text-[#0F1B2D] font-bold"
              >
                <Phone className="w-4 h-4 text-[#D6342C]" />
                <span>Call: {siteSettings.hotline}</span>
              </a>

              <a
                href={getWhatsAppUrl(siteSettings.whatsapp, "Hi Ai Printing, I need an urgent quotation for printing.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-[#25D366]/10 rounded border border-[#25D366]/40 text-[#128C7E] font-bold"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>WhatsApp Express Chat</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
