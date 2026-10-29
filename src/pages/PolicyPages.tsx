import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

const LAST_UPDATED = '29 October 2026';
const LEGAL_NAME = 'Ai Printing Solutions (Pvt) Ltd';

const Policy: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
    <title>{`${title} | Ai Printing`}</title>
    <meta name="description" content={description} />
    <div className="border-b border-[#E6E0D6] pb-4 mb-8">
      <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">Legal</div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">{title}</h1>
      <p className="text-xs text-slate-500 mt-1">Last updated: {LAST_UPDATED}</p>
    </div>
    <div className="space-y-6 text-sm text-slate-700 leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-[#0F1B2D] [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-[#D6342C] [&_a]:font-semibold [&_a:hover]:underline">
      {children}
    </div>
  </div>
);

const ContactBlock: React.FC = () => {
  const { siteSettings } = useStore();
  return (
    <ul>
      <li>Phone: <a href={`tel:${siteSettings.hotline.replace(/\s+/g, '')}`}>{siteSettings.hotline}</a></li>
      <li>WhatsApp: {siteSettings.whatsapp}</li>
      <li>Email: <a href={`mailto:${siteSettings.email}`}>{siteSettings.email}</a></li>
      <li>Address: {siteSettings.address}</li>
    </ul>
  );
};

export const TermsPage: React.FC = () => (
  <Policy title="Terms & Conditions" description="Terms and conditions for ordering printing from Ai Printing (aiprinting.lk): ordering, artwork, proofs, prices in LKR and governing law.">
    <section>
      <p>
        These terms apply to every order placed on aiprinting.lk. The website is operated by {LEGAL_NAME}, trading as
        Ai Printing ("we", "us"), of 11/A Gangarama Rd, Werahara, Boralesgamuwa, Sri Lanka. By placing an order you agree
        to these terms, our <Link to="/refund-policy">Refund Policy</Link>, <Link to="/delivery-policy">Delivery Policy</Link> and{' '}
        <Link to="/privacy-policy">Privacy Policy</Link>.
      </p>
    </section>
    <section>
      <h2>1. Ordering</h2>
      <ul>
        <li>Choose your product, options and quantity, upload your artwork (or request design help) and add it to your cart.</li>
        <li>At checkout, enter your contact and delivery details, choose courier delivery or free pickup, and choose a payment method.</li>
        <li>Your order is confirmed once payment is received through PayHere, or once we verify your bank transfer slip.</li>
        <li>We may decline or cancel an order (with a full refund) if the artwork is unlawful, infringes someone else's rights, or cannot be printed.</li>
      </ul>
    </section>
    <section>
      <h2>2. Your artwork</h2>
      <p>You are responsible for the artwork and text you supply, including:</p>
      <ul>
        <li>spelling, grammar, phone numbers, prices and all other content;</li>
        <li>correct size, bleed and safe margins for the product ordered;</li>
        <li>image resolution suitable for print (low-resolution images print blurred or pixelated);</li>
        <li>having the right to use every logo, image, font and text you upload. You confirm that your files do not infringe any copyright or trademark and you accept responsibility for any claim that they do.</li>
      </ul>
      <p>Colours on screen can differ slightly from printed colours. Small colour variations between print runs are normal and are not a print defect.</p>
    </section>
    <section>
      <h2>3. Proof approval</h2>
      <p>
        Where we send a digital proof (by WhatsApp or email), production starts only after you approve it. Please check
        the proof carefully. Once you approve a proof, we are not responsible for errors in it that you did not point out.
      </p>
    </section>
    <section>
      <h2>4. Prices and payment</h2>
      <ul>
        <li>All prices are in Sri Lankan Rupees (LKR).</li>
        <li>Prices shown on the website may change before you place an order. Once your order is paid, its price will not change.</li>
        <li>The delivery fee is shown at checkout before you pay.</li>
        <li>We accept card and wallet payments through PayHere (Visa, Mastercard, American Express, eZ Cash, mCash, Genie and internet banking) and direct bank transfer with slip upload.</li>
      </ul>
    </section>
    <section>
      <h2>5. Production and delivery</h2>
      <p>
        Production times start after payment and proof approval. One-day express production is available on selected
        products. Delivery is covered in our <Link to="/delivery-policy">Delivery Policy</Link>.
      </p>
    </section>
    <section>
      <h2>6. Our guarantee</h2>
      <p>
        If the fault is ours (a print defect, the wrong stock or size, or damage in transit) we will reprint your order
        free or give you a 100% refund. See our <Link to="/refund-policy">Refund, Return & Cancellation Policy</Link> for how to report a problem.
      </p>
    </section>
    <section>
      <h2>7. Governing law</h2>
      <p>These terms are governed by the laws of Sri Lanka, and the courts of Sri Lanka have jurisdiction over any dispute.</p>
    </section>
    <section>
      <h2>8. Contact</h2>
      <ContactBlock />
    </section>
  </Policy>
);

export const PrivacyPolicyPage: React.FC = () => (
  <Policy title="Privacy Policy" description="How Ai Printing (aiprinting.lk) collects, uses and protects your personal information and artwork files.">
    <section>
      <p>
        This policy explains how {LEGAL_NAME}, trading as Ai Printing ("we", "us"), handles your personal information
        when you use aiprinting.lk or place an order with us.
      </p>
    </section>
    <section>
      <h2>1. What we collect</h2>
      <ul>
        <li>Your name, phone number and email address.</li>
        <li>Your delivery address, city and district.</li>
        <li>Artwork files, logos and text you upload, and bank transfer slips.</li>
        <li>Your order history and any messages you send us.</li>
      </ul>
    </section>
    <section>
      <h2>2. Why we use it</h2>
      <ul>
        <li>To print, deliver and support your order, and to send you proofs and order updates.</li>
        <li>To verify payments and keep accounting records.</li>
        <li>To reply to your questions and quote requests.</li>
        <li>To understand how our website is used and improve it.</li>
      </ul>
    </section>
    <section>
      <h2>3. Card payments</h2>
      <p>Card payments are processed by PayHere. We never see or store your card details.</p>
    </section>
    <section>
      <h2>4. How long we keep your data</h2>
      <p>
        We keep your artwork files for <strong>{'{{ARTWORK_RETENTION_PERIOD}}'}</strong> after your order is completed so that
        you can reorder easily, and then delete them. Order and payment records are kept as long as required for accounting
        and legal purposes.
      </p>
    </section>
    <section>
      <h2>5. Sharing</h2>
      <p>
        We do not sell or rent your personal information. We share it only with the services needed to run your order:
        our courier (name, phone and address for delivery), PayHere (to process payment) and our website hosting and
        database providers.
      </p>
    </section>
    <section>
      <h2>6. Cookies and analytics</h2>
      <p>
        Our website uses cookies and similar technologies, including Google Tag Manager and Meta Pixel, to measure visits,
        understand which pages and adverts work, and keep your cart and login working. You can block or delete cookies in
        your browser settings; some parts of the site (such as the cart) may not work without them.
      </p>
    </section>
    <section>
      <h2>7. Your rights and deletion requests</h2>
      <p>
        You can ask us to see, correct or delete your personal information and artwork files. Contact us using the
        details below with the email or phone number used on your order. We will confirm your request and act on it,
        except for records we must keep by law.
      </p>
      <ContactBlock />
    </section>
  </Policy>
);

export const RefundPolicyPage: React.FC = () => (
  <Policy title="Refund, Return & Cancellation Policy" description="Ai Printing refund, return and cancellation policy: free cancellation before production, free reprint or full refund when the fault is ours.">
    <section>
      <p>
        Every order from Ai Printing is custom printed for you. This policy explains when you can cancel, when you are
        entitled to a reprint or refund, and how refunds are paid.
      </p>
    </section>
    <section>
      <h2>1. Cancellation</h2>
      <ul>
        <li>You can cancel free of charge at any time <strong>before production starts</strong>, and you will receive a full refund.</li>
        <li>To cancel, contact us by phone, WhatsApp or email with your order number.</li>
        <li>Once production has started, the order can no longer be cancelled.</li>
      </ul>
    </section>
    <section>
      <h2>2. Change of mind</h2>
      <p>
        Because printed items are made to your design, they are not refundable or returnable for a change of mind once
        production has started. This includes errors in artwork or text that you supplied or approved in a proof.
      </p>
    </section>
    <section>
      <h2>3. Our guarantee: when the fault is ours</h2>
      <p>If the fault is ours, we will reprint your order free of charge or give you a 100% refund. This covers:</p>
      <ul>
        <li>print defects;</li>
        <li>the wrong paper stock, size or finish compared with your order;</li>
        <li>damage in transit.</li>
      </ul>
    </section>
    <section>
      <h2>4. How to report a problem</h2>
      <ul>
        <li>Report the problem within <strong>7 days of delivery</strong> (or pickup).</li>
        <li>Send your order number and clear photos of the problem, and of the packaging if it arrived damaged.</li>
        <li>We may ask you to keep or return the items so we can check them.</li>
      </ul>
    </section>
    <section>
      <h2>5. How refunds are paid</h2>
      <ul>
        <li>Refunds are made to the original payment method within 7–14 business days of approval.</li>
        <li>Card and wallet payments made through PayHere are refunded to the same card or account.</li>
        <li>Bank transfer payments are refunded to your bank account. We will ask you for the account details.</li>
        <li>All refunds are made in Sri Lankan Rupees (LKR).</li>
      </ul>
    </section>
    <section>
      <h2>6. Contact</h2>
      <ContactBlock />
    </section>
  </Policy>
);

export const DeliveryPolicyPage: React.FC = () => (
  <Policy title="Delivery & Shipping Policy" description="Ai Printing delivery policy: island-wide courier to all 25 districts of Sri Lanka, usually 1–2 business days after production, or free pickup in Boralesgamuwa.">
    <section>
      <h2>1. Delivery options</h2>
      <ul>
        <li><strong>Island-wide courier</strong> to all 25 districts of Sri Lanka.</li>
        <li><strong>Free pickup</strong> from our workshop at 11/A Gangarama Rd, Werahara, Boralesgamuwa during opening hours.</li>
      </ul>
    </section>
    <section>
      <h2>2. Delivery times</h2>
      <ul>
        <li>Courier delivery usually takes 1–2 business days after production is complete.</li>
        <li>Production time depends on the product. One-day express production is available on selected products.</li>
        <li>Delivery times are estimates. Weather, public holidays and courier delays can occasionally add time.</li>
      </ul>
    </section>
    <section>
      <h2>3. Delivery fee</h2>
      <p>The delivery fee (in LKR) is shown at checkout before you pay. Pickup is free.</p>
    </section>
    <section>
      <h2>4. If you are unavailable</h2>
      <p>
        The courier will call the phone number on your order before delivery. If they cannot reach you or nobody is
        available, they will try again or contact you to arrange another time. If delivery still cannot be completed,
        the parcel is returned to our workshop and we will contact you to arrange re-delivery or pickup. Re-delivery is
        charged at {'{{REDELIVERY_FEE}}'}.
      </p>
    </section>
    <section>
      <h2>5. Wrong or incomplete address</h2>
      <p>
        Please check your address and phone number carefully at checkout. If you notice a mistake, contact us as soon as
        possible. We can change the address free of charge before the parcel is dispatched. If a parcel is returned
        because the address was wrong or incomplete, re-delivery is charged as above.
      </p>
    </section>
    <section>
      <h2>6. Damaged parcels</h2>
      <p>
        If your order arrives damaged, take photos and report it within 7 days of delivery. We will reprint it or refund
        you in full. See our <Link to="/refund-policy">Refund Policy</Link>.
      </p>
    </section>
    <section>
      <h2>7. Contact</h2>
      <ContactBlock />
    </section>
  </Policy>
);
