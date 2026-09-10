// ============================================
// Header Component — Cake Menu
// ============================================
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Phone, LogOut, User, ShieldCheck, KeyRound } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { WhatsAppIcon } from './icons/SocialIcons';
import './Header.css';

export default function Header({ onOpenAuth }) {
  const { cartCount, isAdmin, isLoggedIn, isGuest, currentUser, dispatch, Actions } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Base links visible to all users
  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/#menu', label: 'Menu' },
  ];

  // Track Order is ONLY for logged-in customers (hidden for Admin and Guests)
  if (!isAdmin && isLoggedIn) {
    navLinks.push({ to: '/track', label: '📍 Track Order' });
  }

  navLinks.push(
    { to: '/#about', label: 'About' },
    { to: '/#testimonials', label: 'Reviews' }
  );

  // ONLY show Dashboard if user is authenticated Admin
  if (isAdmin) {
    navLinks.push({ to: '/admin', label: '👑 Dashboard', isAdmin: true });
  }

  const handleLogout = () => {
    dispatch({ type: Actions.LOGOUT });
    dispatch({ type: Actions.SET_TOAST, payload: '👋 Logged out successfully' });
  };

  return (
    <header className={`header ${isScrolled ? 'header--scrolled' : ''}`} id="site-header">
      <div className="header__inner container">
        {/* Logo */}
        <Link to="/" className="header__logo" id="header-logo">
          <span className="header__logo-icon">🎂</span>
          <div className="header__logo-text">
            <span className="header__brand font-display">Cake Menu</span>
            <span className="header__tagline font-accent">by Priyanka</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="header__nav" id="desktop-nav">
          {navLinks.map((link) => {
            const isAnchor = link.to.startsWith('/#');
            if (isAnchor) {
              return (
                <a
                  key={link.to}
                  href={link.to}
                  className={`header__nav-link ${
                    link.isAdmin ? 'header__nav-link--admin' : ''
                  }`}
                >
                  {link.label}
                </a>
              );
            }
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`header__nav-link ${location.pathname === link.to ? 'active' : ''} ${
                  link.isAdmin ? 'header__nav-link--admin' : ''
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="header__actions">
          {/* User Status / Login Pill */}
          {isLoggedIn ? (
            <div className="header__user-pill" title={`Logged in as ${currentUser?.name}`}>
              <div className="header__user-info">
                {isAdmin ? (
                  <span className="header__user-role-badge">
                    <ShieldCheck size={13} />
                    <span>Admin</span>
                  </span>
                ) : (
                  <span className="header__user-name">
                    <User size={14} />
                    <span>{currentUser?.name?.split(' ')[0]}</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                className="header__user-logout-btn"
                onClick={handleLogout}
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="header__auth-trigger-btn"
              onClick={onOpenAuth}
              title="Sign In / Register"
            >
              <KeyRound size={15} />
              <span className="header__auth-label">Login</span>
            </button>
          )}

          {/* WhatsApp Button */}
          <a
            href="https://wa.me/918431441492"
            target="_blank"
            rel="noopener noreferrer"
            className="header__whatsapp-btn"
            id="header-whatsapp"
            title="Chat on WhatsApp"
            aria-label="Chat on WhatsApp"
          >
            <WhatsAppIcon size={18} />
          </a>

          {/* Cart Button */}
          <Link to="/cart" className="header__cart-btn" id="header-cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="header__cart-badge">{cartCount}</span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="header__menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div className="header__mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="header__mobile-menu" id="mobile-menu">
            {/* User status in mobile menu */}
            <div className="header__mobile-user-card">
              {isLoggedIn ? (
                <div className="header__mobile-user-details">
                  <div className="header__mobile-user-tag">
                    {isAdmin ? '👑 Owner Priyanka' : `👤 ${currentUser?.name}`}
                  </div>
                  <button
                    type="button"
                    className="btn btn--sm btn--outline"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="header__mobile-auth-prompt">
                  <p>Browsing as Guest</p>
                  <button
                    type="button"
                    className="btn btn--sm btn--primary"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenAuth) onOpenAuth();
                    }}
                  >
                    <KeyRound size={14} />
                    <span>Sign In / Register</span>
                  </button>
                </div>
              )}
            </div>

            {navLinks.map((link) => {
              const isAnchor = link.to.startsWith('/#');
              if (isAnchor) {
                return (
                  <a
                    key={link.to}
                    href={link.to}
                    className={`header__mobile-link ${link.isAdmin ? 'header__mobile-link--admin' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                );
              }
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`header__mobile-link ${location.pathname === link.to ? 'active' : ''} ${
                    link.isAdmin ? 'header__mobile-link--admin' : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href="https://wa.me/918431441492"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--whatsapp btn--full"
              style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <WhatsAppIcon size={18} />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </>
      )}
    </header>
  );
}

