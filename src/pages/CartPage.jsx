// ============================================
// Cart Page
// ============================================
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { formatPrice } from '../utils/helpers';
import './CartPage.css';

export default function CartPage() {
  const { state, dispatch, Actions, cartTotal, cartCount } = useStore();
  const { cart } = state;



  const updateQty = (id, delta) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      dispatch({ type: Actions.REMOVE_FROM_CART, payload: id });
    } else {
      dispatch({ type: Actions.UPDATE_CART_ITEM, payload: { id, updates: { quantity: newQty } } });
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page cart-page--empty" id="cart-page">
        <div className="container">
          <div className="cart-empty">
            <span className="cart-empty__icon">🛒</span>
            <h2 className="font-display">Your cart is empty</h2>
            <p>Looks like you haven't added any treats yet!</p>
            <Link to="/" className="btn btn--primary btn--lg">
              <ArrowLeft size={18} />
              Explore Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page" id="cart-page">
      <div className="container">
        <div className="cart-page__header">
          <Link to="/" className="btn btn--ghost">
            <ArrowLeft size={18} />
            Continue Shopping
          </Link>
          <h1 className="font-display">Your Cart</h1>
          <span className="cart-page__count">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
        </div>

        <div className="cart-page__layout">
          {/* Cart Items */}
          <div className="cart-page__items">
            {cart.map((item) => (
              <div className="cart-item" key={item.id} id={`cart-item-${item.id}`}>
                <div className="cart-item__image">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="cart-item__img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <span
                    className="cart-item__emoji"
                    style={{ display: item.image ? 'none' : 'block' }}
                  >
                    {item.category === 'cakes' ? '🎂' : item.category === 'cupcakes' ? '🧁' : item.category === 'brownies' ? '🍫' : '🎉'}
                  </span>
                </div>

                <div className="cart-item__details">
                  <h3 className="cart-item__name">{item.name}</h3>
                  <div className="cart-item__meta">
                    <span>{item.sizeName}</span>
                    {item.flavor && <span>• {item.flavor}</span>}
                    {item.eggPreference && (
                      <span style={{ color: item.eggPreference === 'Eggless' ? 'var(--color-veg, #2E7D32)' : 'var(--color-terracotta)' }}>
                        • {item.eggPreference === 'Eggless' ? '🟢 Eggless' : '🥚 With Egg'}
                      </span>
                    )}
                  </div>
                  {item.customMessage && (
                    <p className="cart-item__message">📝 "{item.customMessage}"</p>
                  )}
                  <span className="cart-item__price font-display">{formatPrice(item.price)}</span>
                </div>

                <div className="cart-item__actions">
                  <div className="cart-item__qty">
                    <button onClick={() => updateQty(item.id, -1)} className="cart-item__qty-btn" aria-label="Decrease quantity">
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="cart-item__qty-btn" aria-label="Increase quantity">
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="cart-item__subtotal font-display">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                  <button
                    className="cart-item__remove"
                    onClick={() => dispatch({ type: Actions.REMOVE_FROM_CART, payload: item.id })}
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="cart-summary" id="cart-summary">
            <h3 className="cart-summary__title font-display">Order Summary</h3>

            <div className="cart-summary__rows">
              <div className="cart-summary__row">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="cart-summary__row cart-summary__row--total">
                <span>Total</span>
                <span className="font-display">{formatPrice(cartTotal)}</span>
              </div>
            </div>

            <Link to="/checkout" className="btn btn--primary btn--lg btn--full" id="proceed-checkout-btn">
              Proceed to Checkout
              <ArrowRight size={18} />
            </Link>

            <p className="cart-summary__note">
              💳 Pay on Pickup • 🏠 Self-Pickup from Sirsi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
