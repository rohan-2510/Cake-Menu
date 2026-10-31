// ============================================
// Home Page — Cake Menu Catalogue
// ============================================
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Leaf, ChefHat, Sparkles } from 'lucide-react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import Testimonials from '../components/Testimonials';
import { useStore } from '../store/StoreContext';
import { WhatsAppIcon } from '../components/icons/SocialIcons';
import { CATEGORIES, ALLERGEN_INFO } from '../data/products';
import './HomePage.css';

export default function HomePage() {
  const { getProducts } = useStore();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const location = useLocation();

  // Derive active category from user selection or URL hash
  const hashCategory = (location.hash || '').replace('#', '').toLowerCase();
  const activeCategory = selectedCategory ?? (['cakes', 'cupcakes', 'brownies', 'seasonal'].includes(hashCategory) ? hashCategory : 'all');

  // Smooth scroll to relevant section when hash changes
  useEffect(() => {
    const rawHash = (location.hash || '').replace('#', '').toLowerCase();
    if (['cakes', 'cupcakes', 'brownies', 'seasonal', 'menu'].includes(rawHash)) {
      const el = document.getElementById('menu');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } else if (rawHash === 'about') {
      const el = document.getElementById('about');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
    } else if (rawHash === 'testimonials') {
      const el = document.getElementById('testimonials');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [location.hash]);

  const products = getProducts(activeCategory);
  const availableProducts = products.filter((p) => p.available !== false);
  const bestsellers = getProducts('all').filter((p) => (p.tags || []).includes('bestseller') && p.available !== false);

  return (
    <div className="home-page" id="home-page">
      <Hero />

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="section bestsellers" id="bestsellers">
          <div className="container">
            <div className="section-header">
              <span className="accent-line font-accent">crowd favorites</span>
              <h2 className="font-display">Our Bestsellers</h2>
              <p>The most loved treats from our kitchen</p>
            </div>

            <div className="bestsellers__grid">
              {bestsellers.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setSelectedProduct}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Full Menu / Product Catalogue */}
      <section className="section menu" id="menu">
        <div className="container">
          <div className="section-header">
            <span className="accent-line font-accent">explore our treats</span>
            <h2 className="font-display">Our Catalogue</h2>
            <p>Available in both Eggless &amp; With-Egg options, freshly baked with premium ingredients</p>
          </div>

          {/* Category Tabs */}
          <div className="menu__tabs" id="category-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`menu__tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  window.history.replaceState(null, '', cat.id === 'all' ? '/#menu' : `/#${cat.id}`);
                }}
                id={`tab-${cat.id}`}
              >
                <span className="menu__tab-icon">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="menu__grid">
            {availableProducts.length > 0 ? (
              availableProducts.map((product, i) => (
                <div
                  key={product.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <ProductCard
                    product={product}
                    onQuickView={setSelectedProduct}
                  />
                </div>
              ))
            ) : (
              <div className="menu__empty">
                <span>🍰</span>
                <p>No items available in this category right now.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section about" id="about">
        <div className="container">
          <div className="section-header">
            <span className="accent-line font-accent">our story</span>
            <h2 className="font-display">Meet Priyanka</h2>
            <p>The heart behind every cake</p>
          </div>

          <div className="about__content">
            <div className="about__story">
              <div className="about__avatar">
                <span>👩‍🍳</span>
              </div>
              <div className="about__text">
                <h3 className="font-display">Baking Dreams Since 2026</h3>
                <p>
                  What started as a passion project in my Sirsi kitchen has grown into
                  a beloved local bakery. Every cake I bake is crafted with the finest ingredients,
                  time-honored recipes, and a whole lot of love.
                </p>
                <p>
                  I believe everyone deserves a beautiful, delicious cake for their special moments —
                  birthdays, anniversaries, festivals, or just because! We offer both
                  <strong> eggless and egg-based options</strong> to suit everyone's preferences.
                </p>
              </div>
            </div>

            <div className="about__values">
              <div className="about__value-card">
                <Leaf size={24} />
                <h4>Eggless &amp; With-Egg</h4>
                <p>Choose between eggless or with-egg preparations</p>
              </div>
              <div className="about__value-card">
                <ChefHat size={24} />
                <h4>Freshly Baked</h4>
                <p>Made fresh to order, never pre-made or frozen</p>
              </div>
              <div className="about__value-card">
                <Sparkles size={24} />
                <h4>Premium Ingredients</h4>
                <p>Quality butter, fresh cream, and Belgian cocoa</p>
              </div>
            </div>
          </div>

          {/* Allergen Guide */}
          <div className="about__allergens" id="allergen-guide">
            <h3 className="font-display">Allergen Information</h3>
            <p>We care about your health. Here's what our products may contain:</p>
            <div className="about__allergen-list">
              {ALLERGEN_INFO.map((a) => (
                <div key={a.name} className="about__allergen-item">
                  <span className="about__allergen-icon">{a.icon}</span>
                  <div>
                    <strong>{a.name}</strong>
                    <span>{a.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/918431441492?text=Hi%20Priyanka!%20I%20saw%20your%20bakery%20catalogue%20and%20would%20love%20to%20enquire%20about%20your%20cakes."
        target="_blank"
        rel="noopener noreferrer"
        className="floating-wa"
        id="floating-whatsapp"
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <WhatsAppIcon size={28} color="#FFFFFF" />
      </a>
    </div>
  );
}
