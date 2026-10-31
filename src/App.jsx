import React, { Component, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store/StoreContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import './App.css';

// Code-split heavy routes for rapid initial page load & smooth navigation
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));

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

/** Protected route: only renders children if user isAdmin, else redirects to /admin/login */
function AdminRoute({ children }) {
  const { isAdmin, authReady } = useStore();
  if (!authReady) return <PageLoadingFallback />;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

function AppContent() {
  const location = useLocation();

  return (
    <div className="app">
      <ScrollToTop />
      <Header />
      <main className="main">
        <Suspense fallback={<PageLoadingFallback />}>
          <div key={location.pathname} className="route-view">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />

              {/* Admin login (standalone, no header/footer wrapper needed but kept for consistency) */}
              <Route
                path="/admin/login"
                element={<AdminLoginPage />}
              />

              {/* Protected admin route */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Suspense>
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
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </StoreProvider>
    </BrowserRouter>
  );
}
