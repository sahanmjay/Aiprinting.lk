import React, { useEffect } from 'react';

const ELFSIGHT_SCRIPT = 'https://elfsightcdn.com/platform.js';

// Elfsight's Google Reviews widget; the widget id is set in Admin → Settings.
export const GoogleReviews: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  useEffect(() => {
    if (!widgetId || document.querySelector(`script[src="${ELFSIGHT_SCRIPT}"]`)) return;
    const script = document.createElement('script');
    script.src = ELFSIGHT_SCRIPT;
    script.async = true;
    document.body.appendChild(script);
  }, [widgetId]);

  if (!widgetId) return null;
  return (
    <section className="reveal max-w-7xl mx-auto px-4 sm:px-6 space-y-4 -mt-6 sm:-mt-12">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">Google Reviews</div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">What Our Customers Say</h2>
      </div>
      <div className={`elfsight-app-${widgetId}`} data-elfsight-app-lazy />
    </section>
  );
};
