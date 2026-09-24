import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { Layout } from './components/layout/Layout';
import { StructuredData } from './components/seo/StructuredData';

import LoadingLines from './components/ui/loading-lines';

// Pages: the homepage ships in the main bundle; every other page is downloaded when first
// visited, with the AI PRINTING loader showing meanwhile (keeps the first load small).
import { HomePage } from './pages/HomePage';
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderConfirmationPage = lazy(() =>
  import('./pages/OrderConfirmationPage').then((m) => ({ default: m.OrderConfirmationPage }))
);
const QuotePage = lazy(() => import('./pages/QuotePage').then((m) => ({ default: m.QuotePage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const FAQPage = lazy(() => import('./pages/FAQPage').then((m) => ({ default: m.FAQPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const AdLandingPage = lazy(() => import('./pages/landing/AdLandingPage').then((m) => ({ default: m.AdLandingPage })));
const MerchantFeedPage = lazy(() => import('./pages/MerchantFeedPage').then((m) => ({ default: m.MerchantFeedPage })));

export function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <StructuredData />
        <Suspense fallback={<LoadingLines fullScreen />}>
        <Routes>
          {/* Main Storefront Layout Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="shop/:category" element={<ShopPage />} />
            <Route path="product/:slug" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order-confirmation/:id" element={<OrderConfirmationPage />} />
            <Route path="quote" element={<QuotePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="faq" element={<FAQPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="account/orders" element={<AccountPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          {/* Google Ads Landing Pages (Dedicated conversion layout) */}
          <Route
            path="/visiting-cards-colombo"
            element={<AdLandingPage variant="visiting-cards" />}
          />
          <Route
            path="/bill-book-printing-sri-lanka"
            element={<AdLandingPage variant="bill-books" />}
          />
          <Route
            path="/same-day-printing-colombo"
            element={<AdLandingPage variant="same-day" />}
          />

          {/* Google Merchant Center XML Feed */}
          <Route path="/feed/google-merchant.xml" element={<MerchantFeedPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
