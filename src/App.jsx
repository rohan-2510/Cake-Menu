import React, { useState, Component, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store/StoreContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import './App.css';

// Code-split heavy routes for rapid initial page load & smooth navigation
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function PageLoadingFallback() {
  return (
    <div className="page-loader" aria-label="Loading content...">
      <div className="page-loader__spinner" />
      <span className="page-loader__text font-display">Freshly baking your view...</span>
    </div>
  );
}

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
  const { currentUser, authReady } = useStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();

  // While Firebase is still resolving the initial auth state, show a neutral
  // loader — this prevents the 1-frame flash to the login page on navigation.
  if (!authReady) {
    return <PageLoadingFallback />;
  }

  // Allow /admin to render directly without blocking (admin has its own auth)
  const isAdminRoute = location.pathname === '/admin';
  if (!currentUser && !isAdminRoute) {
    return (
      <div className="app">
        <Suspense fallback={<PageLoadingFallback />}>
          <AuthPage />
        </Suspense>
        <Toast />
      </div>
    );
  }

  return (
    <div className="app">
      <ScrollToTop />
      <Header onOpenAuth={() => setShowAuthModal(true)} />
      <main className="main">
        <Suspense fallback={<PageLoadingFallback />}>
          <div key={location.pathname} className="route-view">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/track" element={<TrackOrderPage />} />
              <Route path="/track/:orderId" element={<TrackOrderPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </div>
        </Suspense>
      </main>
      <Footer />
      {showAuthModal && (
        <Suspense fallback={null}>
          <AuthPage onClose={() => setShowAuthModal(false)} isModal={true} />
        </Suspense>
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
