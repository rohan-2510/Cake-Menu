import React, { useState, Component } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store/StoreContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import TrackOrderPage from './pages/TrackOrderPage';
import './App.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#FFFBF5',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '520px',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            textAlign: 'center',
            border: '1px solid #E8E4DC'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎂</div>
            <h2 style={{ color: '#3D2314', marginBottom: '0.5rem' }}>Something went wrong</h2>
            <p style={{ color: '#7A7267', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              We encountered an unexpected issue. Please try returning home or reloading.
            </p>
            {this.state.error?.message && (
              <pre style={{
                background: '#FDF3F0',
                color: '#C05621',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                overflowX: 'auto',
                textAlign: 'left',
                marginBottom: '1.5rem'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              style={{
                background: '#C05621',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.75rem',
                borderRadius: '999px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Toast() {
  const { state } = useStore();
  if (!state.toast) return null;
  return <div className="toast">{state.toast}</div>;
}

function AppContent() {
  const { currentUser } = useStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();

  // Allow /admin and /track to render directly without blocking
  const isAdminRoute = location.pathname === '/admin';
  const isTrackRoute = location.pathname.startsWith('/track');

  if (!currentUser && !isAdminRoute && !isTrackRoute) {
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
          <Route path="/track" element={<TrackOrderPage />} />
          <Route path="/track/:orderId" element={<TrackOrderPage />} />
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
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </StoreProvider>
    </BrowserRouter>
  );
}
