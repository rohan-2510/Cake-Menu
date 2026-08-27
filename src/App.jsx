import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider, useStore } from './store/StoreContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import './App.css';

function Toast() {
  const { state } = useStore();
  if (!state.toast) return null;
  return <div className="toast">{state.toast}</div>;
}

function AppContent() {
  const { currentUser } = useStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // If user has not chosen guest, registered or logged in yet:
  if (!currentUser) {
    return (
      <div className="app">
        <AuthPage />
        <Toast />
      </div>
    );
  }

  return (
    <div className="app">
      <Header onOpenAuth={() => setShowAuthModal(true)} />
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <Footer />
      {showAuthModal && (
        <AuthPage onClose={() => setShowAuthModal(false)} isModal={true} />
      )}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </BrowserRouter>
  );
}
