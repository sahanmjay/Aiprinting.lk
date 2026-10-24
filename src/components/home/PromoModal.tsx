import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { PromoSettings } from '../../types';

const KEY = 'aiprint_promo_seen';

// Shown once per browser session; once closed, hidden for dismissExpiryDays. Blocked storage = show it.
function alreadySeen(promo: PromoSettings): boolean {
  try {
    if (sessionStorage.getItem(KEY) === promo.id) return true;
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    return saved?.id === promo.id && Date.now() < saved.until;
  } catch {
    return false;
  }
}

function remember(promo: PromoSettings, storage: Storage, until?: number) {
  try {
    storage.setItem(KEY, until ? JSON.stringify({ id: promo.id, until }) : promo.id);
  } catch {
    // private mode / blocked storage: the pop-up just shows again next time
  }
}

// Homepage seasonal / offer pop-up, configured in Admin → Settings.
export const PromoModal: React.FC<{ promo?: PromoSettings }> = ({ promo }) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!promo?.isActive || !promo.id || alreadySeen(promo)) return;
    remember(promo, sessionStorage);
    ref.current?.showModal();
  }, [promo]);

  if (!promo?.isActive) return null;

  const close = () => ref.current?.close();
  const onClose = () => {
    if (promo.dismissExpiryDays > 0) remember(promo, localStorage, Date.now() + promo.dismissExpiryDays * 864e5);
  };
  const external = /^https?:\/\//.test(promo.ctaLink);
  const ctaClass =
    'inline-flex items-center justify-center w-full py-3 bg-[#D6342C] hover:bg-[#B8251E] text-white font-bold text-sm rounded transition-colors';

  return (
    <dialog
      ref={ref}
      aria-label={promo.title || 'Announcement'}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && close()}
      className="m-auto w-[calc(100%-2rem)] max-w-md p-0 rounded-lg bg-white shadow-2xl backdrop:bg-[#0F1B2D]/60 backdrop:backdrop-blur-sm"
    >
      <div className="relative">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#0F1B2D] shadow flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {promo.imageUrl && (
          <img src={promo.imageUrl} alt="" className="w-full max-h-[60vh] object-contain bg-[#FAF8F5]" />
        )}

        <div className="p-6 space-y-3 text-center">
          {promo.title && <h2 className="text-xl font-bold text-[#0F1B2D] pr-8">{promo.title}</h2>}
          {promo.message && <p className="text-sm text-slate-600 whitespace-pre-line">{promo.message}</p>}
          {promo.ctaText && promo.ctaLink && (
            external ? (
              <a href={promo.ctaLink} target="_blank" rel="noopener noreferrer" onClick={close} className={ctaClass}>
                {promo.ctaText}
              </a>
            ) : (
              <Link to={promo.ctaLink} onClick={close} className={ctaClass}>
                {promo.ctaText}
              </Link>
            )
          )}
        </div>
      </div>
    </dialog>
  );
};
