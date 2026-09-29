import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatLKR } from '../../lib/formatters';
import { Product } from '../../types';

// Each hero slide = a catalogue product + a real-photo backdrop shown behind the whole hero while it is active.
const HERO_SLIDES = [
  { productId: 'prod-vc-double', tag: 'Bestseller', highlight: '8 premium board stocks', background: '/images/hero/visiting-cards.webp' },
  { productId: 'prod-bill-ncr', tag: 'Business essential', highlight: 'Duplicate & triplicate NCR', background: '/images/hero/bill-books.webp' },
  { productId: 'prod-leaflets-double', tag: 'Marketing', highlight: 'Offset printed from 500 copies', background: '/images/hero/leaflets.webp' },
  { productId: 'prod-stickers-colour', tag: 'Product labels', highlight: 'Gloss or matt sticker sheets', background: '/images/hero/stickers.webp' },
  { productId: 'prod-invitations-single', tag: 'Celebrations', highlight: 'White or metallic envelopes', background: '/images/hero/invitations.webp' },
];

const AUTOPLAY_MS = 5500;

type HeroSlide = (typeof HERO_SLIDES)[number] & { product: Product; fromPrice: number; fromUnit: string };

// Slides whose product still exists, with the lowest real price and what it buys (e.g. "100 Cards")
export function useHeroSlides(): HeroSlide[] {
  const { products, priceMatrix } = useStore();
  return HERO_SLIDES.flatMap((s) => {
    const product = products.find((p) => p.id === s.productId && p.isActive);
    if (!product) return [];
    const cells = priceMatrix[product.id] ?? [];
    const cheapest = cells.reduce<(typeof cells)[number] | undefined>((min, c) => (!min || c.price < min.price ? c : min), undefined);
    // Short unit for the price line, e.g. '2 Books · Duplicate (2-ply)' -> '2 Books'
    const fromUnit = (product.optionGroups?.[1]?.values.find((v) => v.id === cheapest?.optionValueB)?.label ?? '').split(' · ')[0];
    return [{ ...s, product, fromPrice: cheapest?.price ?? 0, fromUnit }];
  });
}

// Auto-advances every few seconds; paused on hover/focus and when the visitor prefers reduced motion
export function useHeroSlider(count: number) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, count]);
  return { index: count ? index % count : 0, go: (i: number) => setIndex(((i % count) + count) % count), setPaused };
}

// Real-photo backgrounds that cross-fade (with a slow zoom) in step with the product slider
export const HeroBackdrop: React.FC<{ slides: HeroSlide[]; index: number }> = ({ slides, index }) => (
  <div aria-hidden className="absolute inset-0">
    {slides.map((s, i) => (
      <img
        key={s.background}
        src={s.background}
        alt=""
        decoding="async"
        className={`absolute inset-0 w-full h-full object-cover transition-[opacity,transform] duration-[1200ms,7000ms] ease-out ${
          i === index ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
        }`}
      />
    ))}
    {/* Keeps the headline readable over any photo */}
    <div className="absolute inset-0 bg-[#0F1B2D]/80 lg:bg-transparent lg:bg-linear-to-r lg:from-[#0F1B2D] lg:via-[#0F1B2D]/85 lg:to-[#0F1B2D]/45" />
    <div className="absolute inset-0 bg-linear-to-t from-[#0F1B2D]/80 via-transparent to-[#0F1B2D]/30" />
  </div>
);

export const HeroProductSlider: React.FC<{
  slides: HeroSlide[];
  index: number;
  go: (i: number) => void;
  setPaused: (p: boolean) => void;
}> = ({ slides, index, go, setPaused }) => {
  const swipeStart = useRef<number | null>(null);
  const didSwipe = useRef(false); // a swipe must not also count as a tap on the product link
  if (!slides.length) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured products"
      className="relative mx-auto max-w-md bg-[#FAF8F5] text-[#2B2B2B] p-6 rounded-lg shadow-2xl border border-white/20 touch-pan-y select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={(e) => (swipeStart.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipeStart.current == null) return;
        const dx = e.clientX - swipeStart.current;
        swipeStart.current = null;
        didSwipe.current = Math.abs(dx) > 40;
        if (didSwipe.current) go(index + (dx < 0 ? 1 : -1));
      }}
      onClickCapture={(e) => {
        if (!didSwipe.current) return;
        didSwipe.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* All slides share one grid cell, so the card keeps the height of the tallest slide (no jumping) */}
      <div className="grid">
        {slides.map((s, i) => {
          const active = i === index;
          const image = s.product.images[0];
          return (
            <div
              key={s.productId}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}: ${s.product.name}`}
              aria-hidden={!active}
              inert={!active}
              className={`[grid-area:1/1] space-y-4 transition-all duration-500 ease-out ${
                active ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#E6E0D6] pb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D6342C]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F1B2D]">{s.tag}</span>
                </div>
                {s.product.isHot && (
                  <span className="flex items-center gap-1 text-xs font-bold text-[#D6342C] bg-[#D6342C]/10 px-2 py-0.5 rounded">
                    <Flame className="w-3 h-3 fill-current" />
                    HOT
                  </span>
                )}
              </div>

              <Link to={`/product/${s.product.slug}`} className="block rounded overflow-hidden border border-[#E6E0D6] aspect-4/3 relative group" draggable={false}>
                <img
                  src={image?.imageUrl}
                  alt={image?.altText ?? s.product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
                <div className="absolute bottom-2 left-2 bg-[#0F1B2D]/90 text-white text-[11px] px-2.5 py-1 rounded backdrop-blur-xs font-medium">
                  {s.highlight}
                </div>
              </Link>

              <div className="space-y-1">
                <h3 className="font-bold text-lg text-[#0F1B2D]">{s.product.name}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 min-h-[2lh]">{s.product.shortDescription}</p>
              </div>

              <div className="pt-2 border-t border-[#E6E0D6] flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">
                    {s.fromPrice ? 'Starting From' : 'Price'}
                  </div>
                  {s.fromPrice ? (
                    <div className="text-base font-bold text-[#0F1B2D]">
                      {formatLKR(s.fromPrice)}{' '}
                      {s.fromUnit && <span className="text-xs font-normal text-slate-500">/ {s.fromUnit}</span>}
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-[#0F1B2D]">To be confirmed</div>
                  )}
                </div>
                <Link
                  to={`/product/${s.product.slug}`}
                  className="shrink-0 px-4 py-2 bg-[#0F1B2D] hover:bg-[#182A45] text-white text-xs font-bold rounded transition-colors"
                  draggable={false}
                >
                  {s.fromPrice ? 'Configure Now' : 'Get a Price'} &rarr;
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous product"
          className="w-9 h-9 rounded-full border border-[#E6E0D6] text-[#0F1B2D] flex items-center justify-center hover:bg-[#0F1B2D] hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.productId}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${s.product.name}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-[#D6342C]' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next product"
          className="w-9 h-9 rounded-full border border-[#E6E0D6] text-[#0F1B2D] flex items-center justify-center hover:bg-[#0F1B2D] hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
