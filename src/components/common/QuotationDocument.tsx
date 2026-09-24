import React, { useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { formatLKR } from '../../lib/formatters';
import { SiteSettings } from '../../types';

export interface QuotationLine {
  description: string;
  details: string[];
  quantity: string;
  amount?: number; // undefined = not priced yet (quotation request)
}

export interface QuotationData {
  quoteNumber: string;
  date: Date;
  customerName: string;
  company: string;
  phone: string;
  lines: QuotationLine[];
  notes: string;
  deliveryFee: number; // 0 = delivery included in the price
}

const VALID_DAYS = 14;

// Print-only document: rendered next to #root and shown only while the browser prints
// (index.css hides #root when body has .printing-quote). "Save as PDF" in the print dialog gives the PDF.
export const QuotationDocument: React.FC<{ data: QuotationData; settings: SiteSettings }> = ({
  data,
  settings,
}) => {
  const isPriced = data.lines.every((l) => l.amount !== undefined);
  const subtotal = data.lines.reduce((sum, l) => sum + (l.amount ?? 0), 0);
  const total = subtotal + data.deliveryFee;
  const validUntil = new Date(data.date.getTime() + VALID_DAYS * 86400000);
  const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return createPortal(
    <div className="quotation-doc hidden print:block text-[#2B2B2B] text-[12px] leading-relaxed">
      {/* Letterhead */}
      <div className="flex justify-between items-start border-b-4 border-[#0F1B2D] pb-4">
        <div>
          <div className="text-2xl font-bold text-[#0F1B2D]">
            {settings.siteName}
            <span className="text-[#D6342C]">.</span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1">{settings.address}</div>
          <div className="text-[11px] text-slate-600">
            Hotline {settings.hotline} · Landline {settings.landline} · {settings.email}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold tracking-widest text-[#D6342C]">
            {isPriced ? 'QUOTATION' : 'QUOTATION REQUEST'}
          </div>
          <div className="font-mono font-bold text-[#0F1B2D] mt-1">{data.quoteNumber}</div>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-6 py-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Prepared for</div>
          <div className="font-bold text-[#0F1B2D]">{data.customerName || 'Valued Customer'}</div>
          {data.company && <div>{data.company}</div>}
          {data.phone && <div>{data.phone}</div>}
        </div>
        <div className="text-right space-y-0.5">
          <div><span className="text-slate-500">Date:</span> <strong>{fmtDate(data.date)}</strong></div>
          {isPriced && (
            <div><span className="text-slate-500">Valid until:</span> <strong>{fmtDate(validUntil)}</strong></div>
          )}
          <div><span className="text-slate-500">Currency:</span> <strong>LKR</strong></div>
        </div>
      </div>

      {/* Items */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y-2 border-[#0F1B2D] text-left text-[10px] uppercase tracking-wider">
            <th className="py-2 pr-2 w-8">#</th>
            <th className="py-2 pr-2">Description & Specification</th>
            <th className="py-2 pr-2 text-right">Quantity</th>
            {isPriced && <th className="py-2 text-right">Amount</th>}
          </tr>
        </thead>
        <tbody>
          {data.lines.map((line, i) => (
            <tr key={i} className="border-b border-slate-300 align-top">
              <td className="py-2.5 pr-2">{i + 1}</td>
              <td className="py-2.5 pr-2">
                <div className="font-bold text-[#0F1B2D]">{line.description}</div>
                {line.details.map((d, j) => (
                  <div key={j} className="text-[11px] text-slate-600 whitespace-pre-wrap">{d}</div>
                ))}
              </td>
              <td className="py-2.5 pr-2 text-right whitespace-nowrap">{line.quantity}</td>
              {isPriced && <td className="py-2.5 text-right whitespace-nowrap">{formatLKR(line.amount ?? 0)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      {isPriced ? (
        <div className="flex justify-end pt-3">
          <div className="w-64 space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatLKR(subtotal)}</span></div>
            <div className="flex justify-between">
              <span>Island-wide delivery</span>
              <span>{data.deliveryFee > 0 ? formatLKR(data.deliveryFee) : 'Included'}</span>
            </div>
            <div className="flex justify-between border-t-2 border-[#0F1B2D] pt-1.5 text-sm font-bold text-[#0F1B2D]">
              <span>Total</span><span>{formatLKR(total)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 p-3 border-2 border-[#0F1B2D]">
          <div className="font-bold text-[#0F1B2D]">Status: Awaiting pricing</div>
          <div className="text-[11px] text-slate-600 mt-1">
            Our estimating team will price these requirements within one working day. Your official priced
            quotation can then be downloaded at {window.location.host}/quote using quotation number{' '}
            <strong>{data.quoteNumber}</strong> and your phone number.
          </div>
        </div>
      )}

      {data.notes && (
        <div className="mt-5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Customer requirements</div>
          <div className="whitespace-pre-wrap">{data.notes}</div>
        </div>
      )}

      {isPriced && (
        <div className="mt-6 pt-3 border-t border-slate-300 text-[10.5px] text-slate-600 space-y-0.5">
          <div className="font-bold text-[#0F1B2D] text-[11px] mb-1">Terms & Conditions</div>
          <div>1. Prices are in Sri Lankan Rupees and valid for {VALID_DAYS} days from the date above.</div>
          <div>2. Production starts after artwork approval and payment confirmation.</div>
          <div>3. A free digital PDF proof is sent before printing. Colours may vary slightly from screen.</div>
          <div>4. Island-wide delivery in 1–2 working days after production.</div>
          <div>
            5. Payment: {settings.bankDetails.bankName}, {settings.bankDetails.branch} — {settings.bankDetails.accountName},
            A/C {settings.bankDetails.accountNumber}. Please quote {data.quoteNumber} as the reference.
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-[10.5px] text-slate-500">
        {isPriced
          ? `To confirm this quotation, WhatsApp ${settings.whatsapp} or email ${settings.email} with the quotation number.`
          : `Questions about your request? WhatsApp ${settings.whatsapp} or email ${settings.email} with the quotation number.`}{' '}
        This is a computer-generated document and does not require a signature.
      </div>
    </div>,
    document.body
  );
};

// Renders the quotation into the print-only document, then opens the print dialog ("Save as PDF").
// Returns the element to place in the page and the function that prints it.
export function useQuotationPrint(settings: SiteSettings) {
  const [data, setData] = useState<QuotationData | null>(null);

  const printQuotation = (next: QuotationData) => {
    flushSync(() => setData(next)); // document must be in the DOM before print() snapshots it
    const prevTitle = document.title;
    document.title = `Quotation ${next.quoteNumber} - ${settings.siteName}`; // default PDF file name
    document.body.classList.add('printing-quote');
    window.addEventListener(
      'afterprint',
      () => {
        document.body.classList.remove('printing-quote');
        document.title = prevTitle;
      },
      { once: true }
    );
    window.print();
  };

  return { printQuotation, quotationDoc: data && <QuotationDocument data={data} settings={settings} /> };
}
