import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from '../common/TopBar';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { FloatingWhatsApp } from '../common/FloatingWhatsApp';
import { CartDrawer } from '../common/CartDrawer';
import LoadingLines from '../ui/loading-lines';

export const Layout: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { pathname } = useLocation();

  // New page starts at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2B2B2B] relative selection:bg-[#D6342C] selection:text-white">
      <TopBar />
      <Header onOpenCart={() => setIsCartOpen(true)} />
      
      <main className="flex-grow">
        <div key={pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Suspense fallback={<LoadingLines />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <Footer />
      <FloatingWhatsApp />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};
