// ============================================
// App — Cake Menu Root Component
// ============================================
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider, useStore } from './store/StoreContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminPage from './pages/AdminPage';
import './App.css';

function Toast() {
  const { state } = useStore();
  if (!state.toast) return null;
  return <div className="toast">{state.toast}</div>;
}

function ScrollToTop() {
  const { pathname } = window.location;
  // Simple scroll-to-top on navigation
  return null;
}

function AppContent() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <Footer />
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
