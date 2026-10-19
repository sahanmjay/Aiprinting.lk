import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, MessageCircle, Phone, ChevronDown, Layers, User } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { RegistrationMark } from './RegistrationMark';
import { getWhatsAppUrl } from '../../lib/formatters';
import logoMark from '../../assets/logo-mark.png';

interface HeaderProps {
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart }) => {
  const { cartCount, siteSettings, categories, customer } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setCategoriesDropdownOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Visiting Cards', path: '/product/double-sided-visiting-cards' },
    { label: 'Bill Books', path: '/product/carbonized-ncr-bill-books' },
    { label: 'All Products', path: '/shop' },
    { label: 'Get a Quote', path: '/quote' },
    { label: 'About Us', path: '/about' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Contact', path: '/contact' },
    { label: 'My Account', path: '/account' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled
          ? 'bg-white shadow-md border-b border-[#E6E0D6] py-1.5 sm:py-2'
          : 'bg-white shadow-sm border-b border-[#E6E0D6] py-2 sm:py-2.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* LOGO */}
        <Link
          to="/"
          className="shrink-0 flex items-center gap-2 sm:gap-2.5 hover:opacity-90 transition-opacity"
          aria-label="Ai Printing Solutions — home"
        >
          <img src={logoMark} alt="" width={38} height={38} className="w-8 h-8 max-[379px]:w-7 max-[379px]:h-7 sm:w-9 sm:h-9" />
          <span aria-hidden className="w-0.5 self-stretch bg-[#009CF0]" />
          <span className="font-['Barlow_Semi_Condensed',sans-serif] font-bold text-[#009CF0] leading-none whitespace-nowrap text-[16px] max-[379px]:text-[13px] sm:text-[19px] xl:text-[17px] 2xl:text-[20px] tracking-[0.03em]">
            Ai PRINTING SOLUTIONS
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden xl:flex items-center gap-0 2xl:gap-1">
          <Link
            to="/"
            className={`px-2 2xl:px-2.5 py-1 text-[13px] 2xl:text-sm font-medium whitespace-nowrap rounded transition-colors ${
              location.pathname === '/' ? 'text-[#D6342C] font-semibold' : 'text-[#2B2B2B] hover:text-[#0F1B2D]'
            }`}
          >
            Home
          </Link>

          {/* Categories Popover */}
          <div
            className="relative"
            onMouseEnter={() => setCategoriesDropdownOpen(true)}
            onMouseLeave={() => setCategoriesDropdownOpen(false)}
          >
            <button
              onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
              className="flex items-center gap-1 px-2 2xl:px-2.5 py-1 text-[13px] 2xl:text-sm font-medium whitespace-nowrap text-[#2B2B2B] hover:text-[#0F1B2D] rounded transition-colors"
            >
              <span>Products</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {categoriesDropdownOpen && (
              <div className="absolute top-full left-0 w-64 bg-white border border-[#E6E0D6] rounded shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#F0EBE1] mb-1 flex justify-between items-center">
                  <span>Categories</span>
                  <RegistrationMark size={14} />
                </div>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/shop/${cat.slug}`}
                    className="block px-3 py-1.5 text-xs text-[#2B2B2B] hover:bg-[#FAF8F5] hover:text-[#D6342C] transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
                <div className="border-t border-[#F0EBE1] mt-1 pt-1">
                  <Link
                    to="/shop"
                    className="block px-3 py-1.5 text-xs font-semibold text-[#0F1B2D] hover:bg-[#FAF8F5]"
                  >
                    View All Products &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/product/double-sided-visiting-cards"
            className={`px-2 2xl:px-2.5 py-1 text-[13px] 2xl:text-sm font-medium whitespace-nowrap rounded transition-colors ${
              location.pathname.includes('visiting-cards')
                ? 'text-[#D6342C] font-semibold'
                : 'text-[#2B2B2B] hover:text-[#0F1B2D]'
            }`}
          >
            Visiting Cards
          </Link>

          <Link
            to="/product/carbonized-ncr-bill-books"
            className={`px-2 2xl:px-2.5 py-1 text-[13px] 2xl:text-sm font-medium whitespace-nowrap rounded transition-colors ${
              location.pathname.includes('bill-books')
                ? 'text-[#D6342C] font-semibold'
                : 'text-[#2B2B2B] hover:text-[#0F1B2D]'
            }`}
          >
            Bill Books
          </Link>

          <Link
            to="/quote"
            className={`px-2 2xl:px-2.5 py-1 text-[13px] 2xl:text-sm font-medium whitespace-nowrap rounded transition-colors ${
              location.pathname === '/quote' ? 'text-[#D6342C] font-semibold' : 'text-[#2B2B2B] hover:text-[#0F1B2D]'
            }`}
          >
            Custom Quote
          </Link>

          <Link
            to="/about"
            className={`px-2 2xl:px-2.5 py-1 text-[13px] 2xl:text-sm font-medium whitespace-nowrap rounded transition-colors ${
              location.pathname === '/about' ? 'text-[#D6342C] font-semibold' : 'text-[#2B2B2B] hover:text-[#0F1B2D]'
            }`}
          >
            About
          </Link>

          <Link
            to="/faq"
            className={`px-2 2xl:px-2.5 py-1 text-[13px] 2xl:text-sm font-medium whitespace-nowrap rounded transition-colors ${
              location.pathname === '/faq' ? 'text-[#D6342C] font-semibold' : 'text-[#2B2B2B] hover:text-[#0F1B2D]'
            }`}
          >
            FAQ
          </Link>

          <Link
            to="/contact"
            className={`px-2 2xl:px-2.5 py-1 text-[13px] 2xl:text-sm font-medium whitespace-nowrap rounded transition-colors ${
              location.pathname === '/contact' ? 'text-[#D6342C] font-semibold' : 'text-[#2B2B2B] hover:text-[#0F1B2D]'
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* RIGHT CTAS */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* WhatsApp Direct */}
          <a
            href={getWhatsAppUrl(siteSettings.whatsapp, "Hi Ai Printing, I'd like to ask about your printing services.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/30 rounded hover:bg-[#25D366]/20 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            <span>WhatsApp Us</span>
          </a>

          {/* Account (sign in / my orders) */}
          <Link
            to="/account"
            className="relative p-1.5 text-[#0F1B2D] hover:text-[#D6342C] transition-colors rounded-full hover:bg-black/5"
            aria-label={customer ? 'My Account' : 'Sign in or register'}
            title={customer ? `Signed in as ${customer.name || customer.email}` : 'Sign in / Register'}
          >
            <User className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            {customer && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 border border-[#FAF8F5]" />
            )}
          </Link>

          {/* Cart Icon & Button */}
          <Link
            to="/cart"
            onClick={(e) => {
              if (onOpenCart) {
                e.preventDefault();
                onOpenCart();
              }
            }}
            className="relative p-1.5 text-[#0F1B2D] hover:text-[#D6342C] transition-colors rounded-full hover:bg-black/5"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#D6342C] text-white text-[9.5px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#FAF8F5] animate-in zoom-in duration-150">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 text-[#0F1B2D] hover:text-[#D6342C] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-x-0 top-[65px] bg-white border-b border-[#E6E0D6] shadow-xl max-h-[85vh] overflow-y-auto z-50 p-6 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
              <span>Main Navigation</span>
              <RegistrationMark size={14} />
            </div>

            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="py-2 text-base font-medium text-[#2B2B2B] border-b border-[#E6E0D6]/60 hover:text-[#D6342C]"
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-4 flex flex-col gap-3">
              <a
                href={getWhatsAppUrl(siteSettings.whatsapp, "Hi Ai Printing, I'd like to ask about...")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white text-sm font-semibold rounded shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href={`tel:${siteSettings.hotline.replace(/\s+/g, '')}`}
                className="flex items-center justify-center gap-2 py-2.5 bg-[#0F1B2D] text-white text-sm font-semibold rounded shadow-sm"
              >
                <Phone className="w-4 h-4 text-[#D6342C]" />
                <span>Call Hotline: {siteSettings.hotline}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
