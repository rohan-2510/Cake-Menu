// ============================================
// ProductModal — Interactive Customizer
// ============================================
import { useState, useMemo } from 'react';
import { X, Star, Clock, ShoppingBag, Minus, Plus, AlertCircle } from 'lucide-react';
import { SIZES } from '../data/products';
import { useStore } from '../store/StoreContext';
import { formatPrice, getEarliestPickup, formatDate, toDateString } from '../utils/helpers';
import './ProductModal.css';

export default function ProductModal({ product, onClose }) {
  if (!product) return null;

  const { dispatch, Actions } = useStore();
  const [imgError, setImgError] = useState(false);

  const tags = Array.isArray(product?.tags) ? product.tags : [];
  const flavors = Array.isArray(product?.flavors)
    ? (product.flavors.length > 0 ? product.flavors : ['Standard'])
    : typeof product?.flavors === 'string' && product.flavors.trim()
    ? product.flavors.split(',').map((f) => f.trim()).filter(Boolean)
    : ['Standard'];

  const sizes = SIZES[product?.category] || SIZES.cakes;
  const [selectedSize, setSelectedSize] = useState(sizes[0] || { id: 'std', label: 'Standard', serves: '1-2', multiplier: 1 });
  const [selectedFlavor, setSelectedFlavor] = useState(flavors[0] || 'Standard');
  const [eggPreference, setEggPreference] = useState('Eggless');
  const [customMessage, setCustomMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const currentPrice = useMemo(() => {
    return Math.round((product?.basePrice || 0) * (selectedSize?.multiplier || 1));
  }, [product?.basePrice, selectedSize]);

  const totalPrice = currentPrice * quantity;

  const earliest = getEarliestPickup(product?.leadTimeHours || 24);
  const earliestStr = formatDate(toDateString(earliest));

  const maxMessageLength = 60;

  const handleAddToCart = () => {
    dispatch({
      type: Actions.ADD_TO_CART,
      payload: {
        productId: product.id,
        name: product.name,
        image: product.image,
        size: selectedSize.id,
        sizeName: selectedSize.label,
        flavor: selectedFlavor,
        eggPreference,
        customMessage: customMessage.trim(),
        price: currentPrice,
        leadTimeHours: product.leadTimeHours || 24,
        category: product.category || 'cakes',
      },
    });
    dispatch({
      type: Actions.SET_TOAST,
      payload: `${product.name} added to cart! 🎉`,
    });
    setAdded(true);
    setTimeout(() => onClose(), 800);
  };

  const getCategoryEmoji = () => {
    switch (product?.category) {
      case 'cakes': return '🎂';
      case 'cupcakes': return '🧁';
      case 'brownies': return '🍫';
      case 'seasonal': return '🎉';
      default: return '🍰';
    }
  };

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal product-modal" id="product-modal">
        {/* Close */}
        <button className="product-modal__close" onClick={onClose} id="modal-close">
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
            <h2 className="product-modal__name font-display">{product.name}</h2>
            <p className="product-modal__desc">{product.description}</p>

            <div className="product-modal__info-row">
              <div className="product-modal__rating">
                <Star size={14} fill="var(--color-gold)" stroke="var(--color-gold)" />
                <span>{product.rating || 5.0}</span>
                <span className="product-modal__review-count">({product.reviews || 1} reviews)</span>
              </div>
              <div className="product-modal__lead-badge">
                <Clock size={14} />
                <span>Requires {product.leadTimeHours || 24}h notice</span>
              </div>
            </div>
          </div>

          {/* Size Selector */}
          <div className="product-modal__section">
            <h3 className="product-modal__section-title">Select Size</h3>
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

          {/* Flavor Selector */}
          {flavors.length > 1 && (
            <div className="product-modal__section">
              <h3 className="product-modal__section-title">Choose Flavor</h3>
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

          {/* Preparation Preference */}
          <div className="product-modal__section">
            <h3 className="product-modal__section-title">Preparation Preference</h3>
            <div className="product-modal__flavors">
              <button
                type="button"
                className={`product-modal__flavor-btn ${eggPreference === 'Eggless' ? 'active' : ''}`}
                onClick={() => setEggPreference('Eggless')}
              >
                🟢 100% Eggless
              </button>
              <button
                type="button"
                className={`product-modal__flavor-btn ${eggPreference === 'With Egg' ? 'active' : ''}`}
                onClick={() => setEggPreference('With Egg')}
              >
                🥚 With Egg
              </button>
            </div>
          </div>

          {/* Custom Message */}
          {product.isCustomizable && (
            <div className="product-modal__section">
              <h3 className="product-modal__section-title">
                Message on Cake <span className="optional">(optional)</span>
              </h3>
              <div className="product-modal__message-wrap">
                <textarea
                  className="input-field product-modal__message"
                  placeholder="e.g. Happy Birthday Priya!"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value.slice(0, maxMessageLength))}
                  rows={2}
                  id="cake-message-input"
                />
                <span className="product-modal__char-count">
                  {customMessage.length}/{maxMessageLength}
                </span>
              </div>
            </div>
          )}

          {/* Allergens */}
          {Array.isArray(product?.allergens) && product.allergens.length > 0 && (
            <div className="product-modal__allergens">
              <span className="product-modal__allergen-label">Contains:</span>
              {product.allergens.map((a) => (
                <span key={a} className="product-modal__allergen-tag">{a}</span>
              ))}
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="product-modal__actions">
            <div className="product-modal__qty">
              <button
                className="product-modal__qty-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                id="qty-minus"
              >
                <Minus size={16} />
              </button>
              <span className="product-modal__qty-value">{quantity}</span>
              <button
                className="product-modal__qty-btn"
                onClick={() => setQuantity(quantity + 1)}
                id="qty-plus"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              className={`btn btn--primary btn--lg product-modal__cart-btn ${added ? 'added' : ''}`}
              onClick={handleAddToCart}
              disabled={added}
              id="add-to-cart-btn"
            >
              <ShoppingBag size={18} />
              {added ? 'Added! ✓' : `Add to Cart — ${formatPrice(totalPrice)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
