// ============================================
// ProductModal — Product Detail View (Catalogue)
// ============================================
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, AlertCircle } from 'lucide-react';
import { SIZES, OWNER_PHONE } from '../data/products';
import { formatPrice } from '../utils/helpers';
import { WhatsAppIcon } from './icons/SocialIcons';
import './ProductModal.css';

export default function ProductModal({ product, onClose }) {
  const [imgError, setImgError] = useState(false);

  const tags = Array.isArray(product?.tags) ? product.tags : [];
  const flavors = Array.isArray(product?.flavors)
    ? (product.flavors.length > 0 ? product.flavors : ['Standard'])
    : typeof product?.flavors === 'string' && product?.flavors.trim()
    ? product.flavors.split(',').map((f) => f.trim()).filter(Boolean)
    : ['Standard'];

  const sizes = SIZES[product?.category] || SIZES.cakes;
  const [selectedSize, setSelectedSize] = useState(sizes[0] || { id: 'std', label: 'Standard', serves: '1-2', multiplier: 1 });
  const [selectedFlavor, setSelectedFlavor] = useState(flavors[0] || 'Standard');

  // Lock body scroll while modal is open & add Escape key listener
  useEffect(() => {
    if (!product) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, product]);

  // Sync state if product changes
  useEffect(() => {
    if (!product) return;
    const currentSizes = SIZES[product.category] || SIZES.cakes;
    setSelectedSize(currentSizes[0] || { id: 'std', label: 'Standard', serves: '1-2', multiplier: 1 });
    setSelectedFlavor(flavors[0] || 'Standard');
    setImgError(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, product?.category]);

  const currentPrice = useMemo(() => {
    return Math.round((product?.basePrice || 0) * (selectedSize?.multiplier || 1));
  }, [product?.basePrice, selectedSize]);

  if (!product) return null;

  const getCategoryEmoji = () => {
    switch (product.category) {
      case 'cakes': return '🎂';
      case 'cupcakes': return '🧁';
      case 'brownies': return '🍫';
      case 'seasonal': return '🎉';
      default: return '🍰';
    }
  };

  // Build WhatsApp enquiry URL
  const whatsappUrl = (() => {
    const flavorText = flavors.length > 1 ? `, ${selectedFlavor} flavor` : '';
    const msg = `Hi Priyanka! 🎂 I'm interested in "${product.name}" (${selectedSize.label}${flavorText}) — ${formatPrice(currentPrice)}. Can you please share more details?`;
    return `https://wa.me/${OWNER_PHONE}?text=${encodeURIComponent(msg)}`;
  })();

  return createPortal(
    <div
      className="product-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-name"
    >
      <div
        className="product-modal-card"
        id="product-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="product-modal__close"
          onClick={onClose}
          id="modal-close"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Image Area */}
        <div className="product-modal__image">
          {product.image && !imgError ? (
            <img
              src={product.image}
              alt={product.name}
              className="product-modal__img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="product-modal__image-bg">
              <span className="product-modal__emoji">{getCategoryEmoji()}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="product-modal__content">
          {/* Header */}
          <div className="product-modal__header">
            <div className="product-modal__tags">
              <span className="badge badge--veg">🟢 Eggless &amp; With-Egg Available</span>
              {tags.includes('bestseller') && (
                <span className="badge badge--bestseller">⭐ Bestseller</span>
              )}
              {product.isCustomizable && (
                <span className="badge badge--custom">🎨 Customizable</span>
              )}
            </div>
            <h2 className="product-modal__name font-display" id="modal-product-name">{product.name}</h2>
            <p className="product-modal__desc">{product.description}</p>

            <div className="product-modal__info-row">
              <div className="product-modal__lead-badge">
                <Clock size={14} />
                <span>Requires {product.leadTimeHours || 48}h advance notice</span>
              </div>
            </div>
          </div>

          {/* Size Selector (Informational — shows prices) */}
          <div className="product-modal__section">
            <h3 className="product-modal__section-title">Available Sizes &amp; Prices</h3>
            <div className="product-modal__sizes">
              {sizes.map((size) => (
                <button
                  key={size.id}
                  className={`product-modal__size-btn ${selectedSize.id === size.id ? 'active' : ''}`}
                  onClick={() => setSelectedSize(size)}
                  id={`size-${size.id}`}
                >
                  <span className="product-modal__size-label">{size.label}</span>
                  <span className="product-modal__size-serves">Serves {size.serves}</span>
                  <span className="product-modal__size-price">
                    {formatPrice(Math.round((product.basePrice || 0) * size.multiplier))}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Flavor Display (Informational) */}
          {flavors.length > 1 && (
            <div className="product-modal__section">
              <h3 className="product-modal__section-title">Available Flavors</h3>
              <div className="product-modal__flavors">
                {flavors.map((flavor) => (
                  <button
                    key={flavor}
                    className={`product-modal__flavor-btn ${selectedFlavor === flavor ? 'active' : ''}`}
                    onClick={() => setSelectedFlavor(flavor)}
                    id={`flavor-${flavor.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {flavor}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preparation Info (Informational) */}
          <div className="product-modal__section">
            <h3 className="product-modal__section-title">Preparation Options</h3>
            <p className="product-modal__info-text">
              🟢 <strong>100% Eggless</strong> &nbsp;|&nbsp; 🥚 <strong>With Egg</strong> — both options available. Mention your preference when you enquire.
            </p>
          </div>

          {/* Allergens */}
          {Array.isArray(product.allergens) && product.allergens.length > 0 && (
            <div className="product-modal__allergens">
              <AlertCircle size={14} />
              <span className="product-modal__allergen-label">Contains:</span>
              {product.allergens.map((a) => (
                <span key={a} className="product-modal__allergen-tag">{a}</span>
              ))}
            </div>
          )}

          {/* WhatsApp Enquiry CTA */}
          <div className="product-modal__actions">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--whatsapp btn--lg product-modal__cart-btn"
              id="enquire-whatsapp-btn"
            >
              <WhatsAppIcon size={20} color="#FFFFFF" />
              Enquire on WhatsApp — {formatPrice(currentPrice)}
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
