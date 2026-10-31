// ============================================
// AdminLoginPage — Standalone Admin Login
// ============================================
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { loginUser, isFirebaseConfigured } from '../services/firebase';
import { ADMIN_EMAIL } from '../data/products';
import './AdminLoginPage.css';

export default function AdminLoginPage() {
  const { isAdmin, dispatch, Actions } = useStore();
  const navigate = useNavigate();

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // If already admin, redirect to dashboard
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, navigate]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    const inputEmail = emailInput.trim().toLowerCase();
    const authorizedEmail = ADMIN_EMAIL.toLowerCase();

    if (inputEmail !== authorizedEmail) {
      setLoginError(`❌ Access Denied: Only "${ADMIN_EMAIL}" can access the Admin Dashboard.`);
      setIsLoggingIn(false);
      return;
    }

    try {
      if (!isFirebaseConfigured) {
        throw new Error('Admin sign-in is unavailable because Firebase is not configured.');
      }

      const user = await loginUser(inputEmail, passwordInput);
      if (user.email?.toLowerCase() !== authorizedEmail) {
        throw new Error(`Email ${user.email} is not authorized for Admin access.`);
      }

      dispatch({ type: Actions.LOGIN_USER, payload: { user: { ...user, role: 'admin' } } });
      dispatch({ type: Actions.SET_TOAST, payload: '👑 Welcome back, Store Admin!' });
      navigate('/admin', { replace: true });
    } catch (err) {
      let msg = err.message || 'Login failed';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        msg = 'Incorrect email or password.';
      }
      setLoginError(`❌ ${msg}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="admin-login-page" id="admin-login-page">
      <div className="admin-login-page__card">
        {/* Branding */}
        <div className="admin-login-page__brand">
          <span className="admin-login-page__brand-icon">🎂</span>
          <div>
            <span className="admin-login-page__brand-name font-display">Cake Menu</span>
            <span className="admin-login-page__brand-tag font-accent">by Priyanka</span>
          </div>
        </div>

        <div className="admin-login-page__divider" />

        <ShieldAlert size={40} className="admin-login-page__shield-icon" />
        <h2 className="admin-login-page__title font-display">Admin Portal</h2>
        <p className="admin-login-page__subtitle">
          Restricted access. Sign in with the administrator email to manage your catalogue.
        </p>

        <form onSubmit={handleAdminLogin} className="admin-login-page__form">
          <div className="form-group">
            <label className="admin-login-page__label">Admin Email *</label>
            <input
              type="email"
              className="input-field"
              placeholder={ADMIN_EMAIL}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="admin-login-page__label">Password *</label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter admin password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
            />
          </div>

          {loginError && (
            <div className="admin-login-page__error" role="alert">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Verifying...' : 'Sign In as Admin'}
          </button>
        </form>

        <Link to="/" className="btn btn--ghost btn--full admin-login-page__back-link">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
