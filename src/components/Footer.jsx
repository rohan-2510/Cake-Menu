// ============================================
// Footer Component
// ============================================
import { MapPin, Phone, Clock, Heart } from 'lucide-react';
import { SHOP_NAME, FSSAI_NUMBER, SHOP_LOCATION } from '../data/products';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-icon">🎂</span>
              <div>
                <span className="footer__logo-name font-display">{SHOP_NAME}</span>
                <span className="footer__logo-tag font-accent">by Priyanka</span>
              </div>
            </div>
            <p className="footer__desc">
              Handcrafted, 100% eggless home-baked cakes, cupcakes &amp; brownies.
              Made fresh with love in Sirsi for your celebrations.
            </p>
            <div className="footer__fssai">
              <span className="footer__fssai-badge">🏷️ FSSAI Licensed</span>
              <span className="footer__fssai-num">{FSSAI_NUMBER}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer__col">
            <h4 className="footer__col-title">Quick Links</h4>
            <a href="#menu" className="footer__link">Our Menu</a>
            <a href="#about" className="footer__link">About Us</a>
            <a href="#testimonials" className="footer__link">Reviews</a>
            <a href="/cart" className="footer__link">Cart & Checkout</a>
          </div>

          {/* Contact */}
          <div className="footer__col">
            <h4 className="footer__col-title">Contact Us</h4>
            <div className="footer__contact-item">
              <MapPin size={14} />
              <span>{SHOP_LOCATION}</span>
            </div>
            <div className="footer__contact-item">
              <Phone size={14} />
              <a href="tel:+918431441492">+91 84314 41492</a>
            </div>
            <div className="footer__contact-item">
              <Clock size={14} />
              <span>Orders: 9 AM – 8 PM</span>
            </div>
            <div className="footer__socials">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-btn"
                aria-label="Instagram"
              >
                📸
              </a>
              <a
                href="https://wa.me/918431441492"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-btn footer__social-btn--wa"
                aria-label="WhatsApp"
              >
                💬
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © {new Date().getFullYear()} {SHOP_NAME}. Made with <Heart size={12} fill="var(--color-terracotta)" stroke="var(--color-terracotta)" /> in Sirsi
          </p>
          <p className="footer__allergen-note">
            ⚠️ Our products may contain dairy, nuts, and gluten. Please check individual product allergen information.
          </p>
        </div>
      </div>
    </footer>
  );
}
