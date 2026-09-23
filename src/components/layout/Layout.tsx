import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from '../common/TopBar';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { FloatingWhatsApp } from '../common/FloatingWhatsApp';
import { CartDrawer } from '../common/CartDrawer';

export const Layout: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2B2B2B] relative selection:bg-[#D6342C] selection:text-white">
      <TopBar />
      <Header onOpenCart={() => setIsCartOpen(true)} />
      
      <main className="flex-grow">
        <Outlet />
      </main>

      <Footer />
      <FloatingWhatsApp />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};
