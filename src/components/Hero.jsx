// ============================================
// Hero Section — Cake Menu
// ============================================
import { ArrowRight, Sparkles } from 'lucide-react';
import { WhatsAppIcon } from './icons/SocialIcons';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero" id="hero">
      {/* Decorative elements */}
      <div className="hero__decor">
        <div className="hero__decor-circle hero__decor-circle--1" />
        <div className="hero__decor-circle hero__decor-circle--2" />
        <div className="hero__decor-circle hero__decor-circle--3" />
      </div>

      <div className="hero__inner container">
        <div className="hero__content">
          <div className="hero__badge animate-fade-in-up">
            <span className="hero__badge-dot" />
            Eggless &amp; With-Egg Options Available
          </div>

          <h1 className="hero__title font-display animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Handcrafted Cakes,<br />
            <span className="hero__title-accent">Baked with Love</span>
          </h1>

          <p className="hero__subtitle animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Artisanal home-baked cakes, cupcakes &amp; brownies in Sirsi.
            Made fresh with premium ingredients for your special moments.
          </p>

          <div className="hero__actions animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <a href="#menu" className="btn btn--primary btn--lg" id="hero-explore-btn">
              Explore Menu
              <ArrowRight size={18} />
            </a>
            <a
              href="https://wa.me/918431441492?text=Hi%20Priyanka!%20I'd%20like%20to%20order%20a%20cake."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--whatsapp btn--lg"
              id="hero-whatsapp-btn"
            >
              <WhatsAppIcon size={18} />
              Chat on WhatsApp
            </a>
          </div>
        </div>

        <div className="hero__visual animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="hero__image-wrapper">
            <div className="hero__image-glow" />
            <div className="hero__image-placeholder">
              <span className="hero__emoji">🎂</span>
              <Sparkles className="hero__sparkle hero__sparkle--1" size={20} />
              <Sparkles className="hero__sparkle hero__sparkle--2" size={16} />
              <Sparkles className="hero__sparkle hero__sparkle--3" size={14} />
            </div>
          </div>
          <div className="hero__float-card hero__float-card--1">
            <span>🧁</span> Fresh Cupcakes
          </div>
          <div className="hero__float-card hero__float-card--2">
            <span>🍫</span> Fudgy Brownies
          </div>
        </div>
      </div>
    </section>
  );
}
