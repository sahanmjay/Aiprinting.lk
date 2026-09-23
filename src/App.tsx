import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { Layout } from './components/layout/Layout';
import { StructuredData } from './components/seo/StructuredData';

// Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { QuotePage } from './pages/QuotePage';
import { AboutPage } from './pages/AboutPage';
import { FAQPage } from './pages/FAQPage';
import { ContactPage } from './pages/ContactPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { AdLandingPage } from './pages/landing/AdLandingPage';
import { MerchantFeedPage } from './pages/MerchantFeedPage';

export function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <StructuredData />
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
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
