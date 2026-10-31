// ============================================
// Header Component — Cake Menu Catalogue
// ============================================
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { WhatsAppIcon } from './icons/SocialIcons';
import './Header.css';

export default function Header() {
  const { isAdmin, currentUser, dispatch, Actions, logout } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Public catalogue navigation links as specified
  const navLinks = [
    { to: '/#hero', label: 'Home' },
    { to: '/#about', label: 'About Us' },
    { to: '/#testimonials', label: 'Testimonials' },
  ];

  // Show Dashboard link only if authorized admin is logged in
  if (isAdmin) {
    navLinks.push({ to: '/admin', label: '👑 Dashboard', isAdmin: true });
  }

  const handleLogout = () => {
    logout();
    dispatch({ type: Actions.SET_TOAST, payload: '👋 Logged out successfully' });
  };

  const handleNavClick = (linkTo) => {
    setMobileMenuOpen(false);
    if (linkTo.startsWith('/#')) {
      const hash = linkTo.replace('/#', '');
      const el = document.getElementById(hash === 'cakes' || hash === 'cupcakes' || hash === 'brownies' || hash === 'seasonal' ? 'menu' : hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className={`header ${isScrolled ? 'header--scrolled' : ''}`} id="site-header">
      <div className="header__inner container">
        {/* Logo */}
        <Link to="/" className="header__logo" id="header-logo" onClick={() => setMobileMenuOpen(false)}>
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
                  className={`header__nav-link ${link.isAdmin ? 'header__nav-link--admin' : ''}`}
                  onClick={() => handleNavClick(link.to)}
                >
                  {link.label}
                </a>
              );
            }
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`header__nav-link ${location.pathname === link.to ? 'active' : ''} ${link.isAdmin ? 'header__nav-link--admin' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="header__actions">
          {/* Admin badge + logout (only when admin is logged in) */}
          {isAdmin && (
            <div className="header__user-pill" title={`Logged in as ${currentUser?.name || currentUser?.email}`}>
              <div className="header__user-info">
                <span className="header__user-role-badge">
                  <ShieldCheck size={13} />
                  <span>Admin</span>
                </span>
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
          )}

          {/* WhatsApp Button */}
          <a
            href="https://wa.me/918431441492?text=Hi%20Priyanka!%20I%20saw%20your%20bakery%20catalogue%20and%20would%20love%20to%20enquire%20about%20your%20treats."
            target="_blank"
            rel="noopener noreferrer"
            className="header__whatsapp-btn"
            id="header-whatsapp"
            title="Chat on WhatsApp"
            aria-label="Chat on WhatsApp"
          >
            <WhatsAppIcon size={18} />
          </a>

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
            {/* Admin status in mobile menu */}
            {isAdmin && (
              <div className="header__mobile-user-card">
                <div className="header__mobile-user-details">
                  <div className="header__mobile-user-tag">
                    👑 Owner Priyanka (Admin)
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
              </div>
            )}

            {navLinks.map((link) => {
              const isAnchor = link.to.startsWith('/#');
              if (isAnchor) {
                return (
                  <a
                    key={link.to}
                    href={link.to}
                    className={`header__mobile-link ${link.isAdmin ? 'header__mobile-link--admin' : ''}`}
                    onClick={() => handleNavClick(link.to)}
                  >
                    {link.label}
                  </a>
                );
              }
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`header__mobile-link ${location.pathname === link.to ? 'active' : ''} ${link.isAdmin ? 'header__mobile-link--admin' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href="https://wa.me/918431441492?text=Hi%20Priyanka!%20I%20saw%20your%20bakery%20catalogue%20and%20would%20love%20to%20enquire%20about%20your%20treats."
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
