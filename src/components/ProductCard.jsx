// ============================================
// ProductCard Component — Cake Menu
// ============================================
import { useState } from 'react';
import { Star, Clock, ShoppingBag, Eye } from 'lucide-react';
import { formatPrice } from '../utils/helpers';
import './ProductCard.css';

export default function ProductCard({ product, onQuickView, onAddToCart }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    name = 'Delicious Cake',
    basePrice = 0,
    description = '',
    image = '',
    tags = [],
    isCustomizable = false,
    leadTimeHours = 48,
    rating = 5.0,
    reviews = 1,
    available = true,
    category = 'cakes',
  } = product || {};

  const getCategoryEmoji = () => {
    switch (category) {
      case 'cakes': return '🎂';
      case 'cupcakes': return '🧁';
      case 'brownies': return '🍫';
      case 'seasonal': return '🎉';
      default: return '🍰';
    }
  };

  return (
    <article
      className={`product-card card ${!available ? 'product-card--unavailable' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id={`product-${product.id}`}
    >
      {/* Image */}
      <div className="product-card__image-wrap">
        {image && !imageError ? (
          <img
            src={image}
            alt={name}
            className={`product-card__img ${imageLoaded ? 'product-card__img--loaded' : ''}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : null}

        {(!image || imageError || !imageLoaded) && (
          <div className={`product-card__image-placeholder ${image && !imageError ? 'product-card__image-placeholder--under' : ''}`}>
            <span className="product-card__emoji">{getCategoryEmoji()}</span>
          </div>
        )}

        {/* Badges */}
        <div className="product-card__badges">

          {(tags || []).includes('bestseller') && (
            <span className="badge badge--bestseller">⭐ Bestseller</span>
          )}
          {(tags || []).includes('seasonal') && (
            <span className="badge badge--seasonal">🎉 Seasonal</span>
          )}
          {isCustomizable && (
            <span className="badge badge--custom">🎨 Customizable</span>
          )}
        </div>

        {/* Hover Overlay */}
        <div className={`product-card__overlay ${isHovered ? 'visible' : ''}`}>
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => onQuickView(product)}
            id={`quick-view-${product.id}`}
          >
            <Eye size={14} />
            Quick View
          </button>
        </div>

        {!available && (
          <div className="product-card__sold-out">
            <span>Currently Unavailable</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="product-card__body">
        <div className="product-card__meta">

          <div className="product-card__lead-time">
            <Clock size={12} />
            <span>{leadTimeHours}h notice</span>
          </div>
        </div>

        <h3 className="product-card__name font-display">{name}</h3>
        <p className="product-card__desc">
          {description ? `${description.slice(0, 90)}${description.length > 90 ? '...' : ''}` : ''}
        </p>

        <div className="product-card__footer">
          <div className="product-card__price">
            <span className="product-card__price-label">From</span>
            <span className="product-card__price-value font-display">
              {formatPrice(basePrice)}
            </span>
          </div>

          {available && (
            <button
              className="product-card__add-btn btn btn--primary btn--sm"
              onClick={() => onQuickView(product)}
              id={`add-btn-${product.id}`}
            >
              <ShoppingBag size={14} />
              Order
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
