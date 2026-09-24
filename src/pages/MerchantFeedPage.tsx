import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';

export const MerchantFeedPage: React.FC = () => {
  const { products, getFromPrice } = useStore();

  const xmlContent = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Ai Printing Solutions Product Feed</title>
    <link>https://aiprinting.lk</link>
    <description>Commercial printing in Sri Lanka — pre-press to fulfilment</description>
    ${products
      .filter((p) => p.isActive && getFromPrice(p.id) > 0)
      .map(
        (p) => `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.shortDescription}]]></g:description>
      <g:link>https://aiprinting.lk/product/${p.slug}</g:link>
      <g:image_link>${p.images[0]?.imageUrl || ''}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${getFromPrice(p.id).toFixed(2)} LKR</g:price>
      <g:brand>Ai Printing Solutions</g:brand>
      <g:google_product_category>536</g:google_product_category>
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return (
    <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
      {xmlContent}
    </pre>
  );
};
