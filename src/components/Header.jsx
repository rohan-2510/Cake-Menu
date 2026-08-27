// ============================================
// Header Component — Cake Menu
// ============================================
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Phone } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import './Header.css';

export default function Header() {
  const { cartCount } = useStore();
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

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/#menu', label: 'Menu' },
    { to: '/#about', label: 'About' },
    { to: '/#testimonials', label: 'Reviews' },
    { to: '/admin', label: 'Dashboard' },
  ];

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
          {navLinks.map((link) => (
            <a
              key={link.to}
              href={link.to}
              className={`header__nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="header__actions">
          <a
            href="https://wa.me/918431441492"
            target="_blank"
            rel="noopener noreferrer"
            className="header__whatsapp-btn"
            id="header-whatsapp"
            title="Chat on WhatsApp"
          >
            <Phone size={18} />
          </a>

          <Link to="/cart" className="header__cart-btn" id="header-cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="header__cart-badge">{cartCount}</span>
            )}
          </Link>

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
            {navLinks.map((link) => (
              <a
                key={link.to}
                href={link.to}
                className="header__mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://wa.me/918431441492"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--whatsapp btn--full"
              style={{ marginTop: '0.5rem' }}
            >
              💬 Chat on WhatsApp
            </a>
          </div>
        </>
      )}
    </header>
  );
}
