// ============================================
// AuthPage Component — Welcome, Login & Register
// ============================================
import { useState } from 'react';
import { Lock, User, UserPlus, Sparkles, Phone, Mail, ArrowRight, Cake, X, Loader2 } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { SHOP_NAME, ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../data/products';
import { registerCustomer, loginUser, isFirebaseConfigured } from '../services/firebase';
import './AuthPage.css';

export default function AuthPage({ onClose, isModal = false }) {
  const { state, dispatch, Actions } = useStore();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [isLoading, setIsLoading] = useState(false);

  // Customer / Admin Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Customer Register State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Handle Login (Customer or Admin)
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      dispatch({ type: Actions.SET_TOAST, payload: '⚠️ Please enter both identifier and password' });
      return;
    }

    const trimmedId = loginIdentifier.trim().toLowerCase();
    setIsLoading(true);

    try {
      if (isFirebaseConfigured) {
        const emailToUse = trimmedId.includes('@')
          ? trimmedId
          : `${trimmedId.replace(/\D/g, '')}@cakemenu.local`;
        const userData = await loginUser(emailToUse, loginPassword);
        dispatch({ type: Actions.LOGIN_USER, payload: { user: userData } });
        dispatch({
          type: Actions.SET_TOAST,
          payload: userData.role === 'admin'
            ? '👑 Welcome back, Store Admin!'
            : `👋 Welcome back, ${userData.name}!`,
        });
        if (onClose) onClose();
      } else {
        // 1. Check if Admin Email & Password (fallback)
        if (
          trimmedId === ADMIN_EMAIL.toLowerCase() &&
          loginPassword === DEFAULT_ADMIN_PASSWORD
        ) {
          dispatch({ type: Actions.ADMIN_LOGIN });
          dispatch({ type: Actions.SET_TOAST, payload: '👑 Welcome back, Priyanka (Admin)!' });
          if (onClose) onClose();
          return;
        }

        // 2. Check Customer Accounts (fallback)
        const foundUser = (state.users || []).find(
          (u) =>
            (u.email?.toLowerCase() === trimmedId || u.phone?.replace(/\D/g, '') === trimmedId.replace(/\D/g, '')) &&
            u.password === loginPassword
        );

        if (foundUser) {
          if (foundUser.role === 'admin') {
            dispatch({ type: Actions.ADMIN_LOGIN });
            dispatch({ type: Actions.SET_TOAST, payload: `👑 Welcome back, ${foundUser.name}!` });
          } else {
            dispatch({ type: Actions.LOGIN_USER, payload: { user: foundUser } });
            dispatch({ type: Actions.SET_TOAST, payload: `👋 Welcome back, ${foundUser.name}!` });
          }
          if (onClose) onClose();
        } else {
          dispatch({ type: Actions.SET_TOAST, payload: '❌ Invalid phone/email or password' });
        }
      }
    } catch (err) {
      let msg = err.message;
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        msg = '❌ Invalid email or password';
      }
      dispatch({ type: Actions.SET_TOAST, payload: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Customer Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim()) {
      dispatch({ type: Actions.SET_TOAST, payload: '⚠️ Please fill in all required fields' });
      return;
    }

    const cleanPhone = regPhone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      dispatch({ type: Actions.SET_TOAST, payload: '⚠️ Please enter a valid 10-digit phone number' });
      return;
    }

    const emailToUse = regEmail.trim()
      ? regEmail.trim().toLowerCase()
      : `${cleanPhone}@cakemenu.local`;

    if (emailToUse === ADMIN_EMAIL.toLowerCase()) {
      dispatch({ type: Actions.SET_TOAST, payload: '⚠️ This email is reserved for Admin. Please sign in.' });
      setTab('login');
      setLoginIdentifier(ADMIN_EMAIL);
      return;
    }

    setIsLoading(true);
    try {
      if (isFirebaseConfigured) {
        const newUser = await registerCustomer(regName.trim(), cleanPhone, emailToUse, regPassword);
        dispatch({ type: Actions.LOGIN_USER, payload: { user: newUser } });
        dispatch({ type: Actions.SET_TOAST, payload: `🎉 Account created! Welcome, ${regName.trim()}!` });
        if (onClose) onClose();
      } else {
        const existing = (state.users || []).find(
          (u) =>
            u.phone?.replace(/\D/g, '') === cleanPhone ||
            (regEmail.trim() && u.email?.toLowerCase() === regEmail.trim().toLowerCase())
        );

        if (existing) {
          dispatch({ type: Actions.SET_TOAST, payload: '⚠️ Account exists with this phone or email. Please sign in.' });
          setTab('login');
          setLoginIdentifier(cleanPhone);
          return;
        }

        dispatch({
          type: Actions.REGISTER_USER,
          payload: {
            name: regName.trim(),
            phone: regPhone.trim(),
            email: regEmail.trim(),
            password: regPassword,
          },
        });
        dispatch({ type: Actions.SET_TOAST, payload: `🎉 Account created! Welcome, ${regName.trim()}!` });
        if (onClose) onClose();
      }
    } catch (err) {
      let msg = err.message;
      if (err.code === 'auth/email-already-in-use') {
        msg = '⚠️ This email is already registered. Please sign in.';
      } else if (err.code === 'auth/weak-password') {
        msg = '⚠️ Password should be at least 6 characters.';
      }
      dispatch({ type: Actions.SET_TOAST, payload: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Continue as Guest
  const handleGuest = () => {
    dispatch({ type: Actions.SET_GUEST });
    dispatch({ type: Actions.SET_TOAST, payload: '✨ Welcome to Cake Menu!' });
    if (onClose) onClose();
  };

  return (
    <div className={`auth-container ${isModal ? 'auth-container--modal' : ''}`}>
      <div className="auth-card">
        {onClose && (
          <button
            type="button"
            className="auth-close-btn"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <X size={20} />
          </button>
        )}

        {/* Boutique Brand Header */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Cake size={32} className="auth-logo-icon" />
          </div>
          <h1 className="font-display auth-title">{SHOP_NAME}</h1>
          <p className="auth-subtitle font-accent">Handcrafted Artisanal Boutique Bakery</p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
          >
            <User size={16} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => setTab('register')}
          >
            <UserPlus size={16} />
            <span>Create Account</span>
          </button>
        </div>

        {/* Tab 1: Login (Customer & Admin) */}
        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-form-intro">
              <h3>Welcome Back</h3>
              <p>Sign in with your email or phone number</p>
            </div>

            <div className="form-group">
              <label htmlFor="login-id">Email or Phone Number</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  id="login-id"
                  type="text"
                  className="input-field"
                  placeholder="e.g. your@email.com or 9876543210"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-pass">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="login-pass"
                  type="password"
                  className="input-field"
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn--primary btn--full btn--lg auth-submit-btn">
              <span>Sign In</span>
              <ArrowRight size={18} />
            </button>

            <div className="auth-switch-prompt">
              <span>New to {SHOP_NAME}? </span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => setTab('register')}
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Register (Customer) */}
        {tab === 'register' && (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-form-intro">
              <h3>Create Customer Account</h3>
              <p>Order handcrafted cakes & schedule pickup quickly</p>
            </div>

            <div className="form-group">
              <label htmlFor="reg-name">Full Name *</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  className="input-field"
                  placeholder="Your Name (e.g. Rahul Sharma)"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone">Mobile Phone Number *</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input
                  id="reg-phone"
                  type="tel"
                  className="input-field"
                  placeholder="10-digit WhatsApp number"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email (Optional)</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  className="input-field"
                  placeholder="your.email@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-pass">Create Password *</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="reg-pass"
                  type="password"
                  className="input-field"
                  placeholder="At least 4 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn--primary btn--full btn--lg auth-submit-btn">
              <span>Register & Start Shopping</span>
              <ArrowRight size={18} />
            </button>

            <div className="auth-switch-prompt">
              <span>Already have an account? </span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => setTab('login')}
              >
                Sign in here
              </button>
            </div>
          </form>
        )}

        {/* Divider & Guest Option */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="btn btn--outline btn--full guest-btn"
          onClick={handleGuest}
          id="guest-browse-btn"
        >
          <Sparkles size={18} className="guest-sparkle-icon" />
          <span>Continue as Guest</span>
        </button>
        <p className="guest-subtext">Browse cakes and menu without signing in</p>
      </div>
    </div>
  );
}
