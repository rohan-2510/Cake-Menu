// ============================================
// TrackOrderPage — Live Customer Order Tracking
// ============================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search, Package, Clock, CheckCircle2, MapPin, Phone,
  Copy, Check, ArrowLeft, RefreshCw,
  ShoppingBag, ChefHat, Sparkles
} from 'lucide-react';
import { WhatsAppIcon } from '../components/icons/SocialIcons';
import { useStore } from '../store/StoreContext';
import { ORDER_STATUSES, OWNER_PHONE, OWNER_NAME, SHOP_LOCATION, normalizeOrderStatus } from '../data/products';
import { formatPrice, formatDate, formatDateTime } from '../utils/helpers';
import { subscribeSingleOrder, fetchOrderById, isFirebaseConfigured } from '../services/firebase';
import './TrackOrderPage.css';

const TRACKING_STEPS = [
  {
    id: 'pending_approval',
    title: 'Pending Approval',
    subtitle: 'Awaiting Baker Review',
    icon: '⏳',
    desc: 'Your order has been sent to Priyanka! She will review your requested date, slot, and cake details before approving.',
  },
  {
    id: 'confirmed',
    title: 'Order Approved',
    subtitle: 'Confirmed by Baker',
    icon: '✅',
    desc: 'Great news! Priyanka has reviewed and approved your order. The pickup slot is confirmed and fresh baking is scheduled!',
  },
  {
    id: 'preparing',
    title: 'Baking & Decorating',
    subtitle: 'In the Kitchen',
    icon: '👩‍🍳',
    desc: 'Priyanka is handcrafting and decorating your cake with fresh ingredients in Sirsi!',
  },
  {
    id: 'ready',
    title: 'Ready for Pickup',
    subtitle: 'Packed & Waiting',
    icon: '📦',
    desc: '🎉 Your order is packed and ready! You can now visit to pick it up from Sirsi.',
  },
  {
    id: 'picked_up',
    title: 'Picked Up',
    subtitle: 'Completed',
    icon: '🎉',
    desc: 'Order collected & enjoyed! Thank you for celebrating with Cake Menu.',
  },
];

export default function TrackOrderPage() {
  const { orderId: urlOrderId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, Actions, isAdmin } = useStore();

  // Redirect admin users directly to Admin Dashboard
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, navigate]);

  const [searchQuery, setSearchQuery] = useState(urlOrderId || '');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Helper: Find order in local state first
  const findLocalOrder = (query) => {
    if (!query) return null;
    const clean = query.trim().toUpperCase().replace('#', '');
    const cleanPhone = query.replace(/\D/g, '');

    return (state.orders || []).find((o) => {
      const oId = (o.id || '').toUpperCase().replace('#', '');
      const oPhone = (o.customer?.phone || '').replace(/\D/g, '');
      return (
        oId === clean ||
        oId === `ORD-${clean}` ||
        `ORD-${oId}` === clean ||
        (cleanPhone.length >= 10 && oPhone === cleanPhone)
      );
    });
  };

  // Perform search / lookup
  const lookupOrder = async (query) => {
    const q = (query || '').trim();
    if (!q) return;

    setIsLoading(true);
    setNotFound(false);

    // 1. Check local state orders first
    const localMatch = findLocalOrder(q);
    if (localMatch) {
      setCurrentOrder(localMatch);
      setIsLoading(false);
    }

    // 2. Fetch from Firestore if available
    if (isFirebaseConfigured) {
      const cleanId = q.toUpperCase().replace('#', '');
      const targetId = cleanId.startsWith('ORD-') ? cleanId : `ORD-${cleanId}`;

      try {
        const remoteOrder = await fetchOrderById(targetId) || await fetchOrderById(cleanId);
        if (remoteOrder) {
          setCurrentOrder(remoteOrder);
          setNotFound(false);
        } else if (!localMatch) {
          setNotFound(true);
          setCurrentOrder(null);
        }
      } catch (err) {
        if (!localMatch) {
          setNotFound(true);
        }
      }
    } else if (!localMatch) {
      setNotFound(true);
      setCurrentOrder(null);
    }

    setIsLoading(false);
  };

  // Real-time Firestore subscriber when an order is active
  useEffect(() => {
    if (!currentOrder?.id || !isFirebaseConfigured) return;

    const unsubscribe = subscribeSingleOrder(currentOrder.id, (updated) => {
      if (updated) {
        setCurrentOrder(updated);
        // Also update local store if present
        dispatch({
          type: Actions.UPDATE_ORDER_STATUS,
          payload: { orderId: updated.id, status: updated.status },
        });
      }
    });

    return () => unsubscribe();
  }, [currentOrder?.id, dispatch, Actions]);

  // Handle URL param changes
  useEffect(() => {
    if (urlOrderId) {
      setSearchQuery(urlOrderId);
      lookupOrder(urlOrderId);
    }
  }, [urlOrderId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const cleanId = searchQuery.trim().toUpperCase().replace('#', '');
    navigate(`/track/${cleanId}`, { replace: true });
    lookupOrder(searchQuery);
  };

  const copyOrderId = () => {
    if (!currentOrder) return;
    navigator.clipboard.writeText(currentOrder.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stepper calculations
  const currentStatus = normalizeOrderStatus(currentOrder?.status);

  const getStepStatus = (stepIndex) => {
    if (!currentOrder) return 'upcoming';
    const currentStepIndex = TRACKING_STEPS.findIndex((s) => s.id === currentStatus);
    if (currentStepIndex === -1) return 'upcoming';

    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'active';
    return 'upcoming';
  };

  const activeStepObj = TRACKING_STEPS.find((s) => s.id === currentStatus) || TRACKING_STEPS[0];
  const activeStepIdx = Math.max(0, TRACKING_STEPS.findIndex((s) => s.id === currentStatus));
  const progressPercent = (activeStepIdx / (TRACKING_STEPS.length - 1)) * 100;

  // WhatsApp query link
  const getWhatsAppHelpUrl = () => {
    if (!currentOrder) return '';
    const text = encodeURIComponent(
      `Hi ${OWNER_NAME}! 👋 I am tracking my cake order #${currentOrder.id} (Status: ${activeStepObj.title}). Could you please share an update?`
    );
    return `https://wa.me/${OWNER_PHONE}?text=${text}`;
  };

  // Recent local orders
  const myRecentOrders = (state.orders || []).slice(0, 5);

  return (
    <div className="track-page" id="track-page">
      <div className="container track-page__container">
        {/* Navigation / Header */}
        <div className="track-page__header">
          <Link to="/" className="btn btn--ghost btn--sm">
            <ArrowLeft size={16} />
            Back to Menu
          </Link>
          <h1 className="font-display">Track Your Order</h1>
          <p>Check the live preparation and pickup status of your handcrafted cake</p>
        </div>

        {/* Lookup Search Bar */}
        <div className="track-search-card">
          <form onSubmit={handleSearchSubmit} className="track-search-form">
            <div className="track-search-input-wrap">
              <Search size={20} className="track-search-icon" />
              <input
                type="text"
                className="input-field track-search-input"
                placeholder="Enter Order ID (e.g. ORD-MTMN5LF3) or Phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn--primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Searching...
                </>
              ) : (
                'Track Order'
              )}
            </button>
          </form>
        </div>

        {/* Not Found State */}
        {notFound && (
          <div className="track-not-found animate-fade-in-up">
            <Package size={48} />
            <h3>Order Not Found</h3>
            <p>
              We couldn't find an order matching "<strong>{searchQuery}</strong>".
              Please double check the ID from your confirmation message or enter your WhatsApp number.
            </p>
          </div>
        )}

        {/* Active Order Card */}
        {currentOrder && (
          <div className="track-card animate-fade-in-up">
            {/* Top Bar */}
            <div className="track-card__top">
              <div className="track-card__id-group">
                <span className="track-card__id">#{currentOrder.id}</span>
                <button
                  onClick={copyOrderId}
                  className="track-card__copy-btn"
                  title="Copy Order ID"
                  type="button"
                >
                  {copied ? <Check size={14} style={{ color: 'var(--color-veg)' }} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>

              <div className="track-card__meta">
                <span className="track-card__live-pill">
                  <span className="track-card__live-dot" />
                  Live Status
                </span>
                <span className="track-card__date">
                  Placed: {formatDateTime(currentOrder.placedAt || currentOrder.createdAt)}
                </span>
              </div>
            </div>

            {/* Current Status Banner */}
            {currentStatus === 'cancelled' ? (
              <div className="track-status-banner track-status-banner--cancelled">
                <div className="track-status-banner__icon">❌</div>
                <div>
                  <h2 className="track-status-banner__title font-display">
                    Order Declined
                  </h2>
                  <p className="track-status-banner__desc">
                    Unfortunately, Priyanka was unable to approve this order (the requested pickup slot or schedule is full). Please contact Priyanka on WhatsApp to arrange a convenient alternate time.
                  </p>
                </div>
              </div>
            ) : (
              <div className={`track-status-banner track-status-banner--${currentStatus}`}>
                <div className="track-status-banner__icon">
                  {activeStepObj.icon}
                </div>
                <div>
                  <h2 className="track-status-banner__title font-display">
                    {activeStepObj.title}
                  </h2>
                  <p className="track-status-banner__desc">
                    {activeStepObj.desc}
                  </p>
                </div>
              </div>
            )}

            {currentStatus === 'pending_approval' && (
              <div className="track-approval-notice">
                <span className="track-approval-notice__icon">⏳</span>
                <div>
                  <strong>Order is waiting for Priyanka's approval</strong>
                  <p>Priyanka bakes every cake fresh to order. She will verify kitchen capacity and approve your pickup slot shortly. This page will update live in real-time as soon as approved!</p>
                </div>
              </div>
            )}

            {/* Visual Step Progress Tracker */}
            <div className="track-stepper-wrap">
              <div className="track-stepper-progress-bg">
                <div
                  className="track-stepper-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="track-stepper">
                {TRACKING_STEPS.map((step, idx) => {
                  const status = getStepStatus(idx);
                  return (
                    <div className={`track-step track-step--${status}`} key={step.id}>
                      <div className="track-step__node">
                        {status === 'completed' ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          <span className="track-step__emoji">{step.icon}</span>
                        )}
                        {status === 'active' && <span className="track-step__pulse" />}
                      </div>
                      <div className="track-step__info">
                        <span className="track-step__label">{step.title}</span>
                        <span className="track-step__sub">{step.subtitle}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pickup & Order Information */}
            <div className="track-grid">
              {/* Pickup Box */}
              <div className="track-info-box">
                <h3 className="track-info-box__title">
                  <MapPin size={18} />
                  Self-Pickup Information
                </h3>
                <div className="track-info-rows">
                  <div className="track-info-row">
                    <span className="track-info-row__label">Pickup Date:</span>
                    <span className="track-info-row__val font-display">
                      📅 {formatDate(currentOrder.pickupDate || currentOrder.deliveryDate)}
                    </span>
                  </div>
                  <div className="track-info-row">
                    <span className="track-info-row__label">Time Slot:</span>
                    <span className="track-info-row__val">
                      ⏰ {currentOrder.timeSlot || 'Standard Slot'}
                    </span>
                  </div>
                  <div className="track-info-row">
                    <span className="track-info-row__label">Pickup Location:</span>
                    <span className="track-info-row__val">
                      🏠 {SHOP_LOCATION}
                    </span>
                  </div>
                  <div className="track-info-row">
                    <span className="track-info-row__label">Customer Name:</span>
                    <span className="track-info-row__val">
                      👤 {currentOrder.customer?.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment / Contact Box */}
              <div className="track-info-box">
                <h3 className="track-info-box__title">
                  <Phone size={18} />
                  Payment &amp; Assistance
                </h3>
                <div className="track-info-rows">
                  <div className="track-info-row">
                    <span className="track-info-row__label">Payment Mode:</span>
                    <span className="track-info-row__val font-accent">
                      💳 Pay on Pickup (Cash / UPI)
                    </span>
                  </div>
                  <div className="track-info-row">
                    <span className="track-info-row__label">Total Bill:</span>
                    <span className="track-info-row__val track-info-row__total font-display">
                      {formatPrice(currentOrder.total)}
                    </span>
                  </div>
                </div>

                <div className="track-actions-wrap">
                  <a
                    href={getWhatsAppHelpUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--whatsapp btn--full"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <WhatsAppIcon size={18} />
                    Chat with Priyanka on WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Order Items Breakdown */}
            <div className="track-items-box">
              <h3 className="track-items-box__title">
                <ShoppingBag size={18} />
                Items in This Order
              </h3>
              <div className="track-items-list">
                {currentOrder.items?.map((item, idx) => (
                  <div className="track-item-card" key={idx}>
                    <div className="track-item-card__thumb">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <span>🎂</span>
                      )}
                    </div>
                    <div className="track-item-card__details">
                      <h4 className="track-item-card__name">
                        {item.name} <small>({item.sizeName || item.size})</small>
                      </h4>
                      <div className="track-item-card__tags">
                        {item.flavor && (
                          <span className="badge badge--neutral">Flavor: {item.flavor}</span>
                        )}
                        {item.eggPreference && (
                          <span
                            className={`badge ${
                              item.eggPreference === 'Eggless' ? 'badge--veg' : 'badge--neutral'
                            }`}
                          >
                            {item.eggPreference === 'Eggless' ? '🟢 Eggless' : '🥚 With Egg'}
                          </span>
                        )}
                      </div>
                      {item.customMessage && (
                        <p className="track-item-card__msg">
                          💬 Message on Cake: "{item.customMessage}"
                        </p>
                      )}
                    </div>
                    <div className="track-item-card__price font-display">
                      <span>Qty: {item.quantity}</span>
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders on This Device */}
        {myRecentOrders.length > 0 && (
          <div className="track-recent-section">
            <h3 className="track-recent-section__title font-display">
              Recent Orders on this Device
            </h3>
            <div className="track-recent-grid">
              {myRecentOrders.map((ord) => {
                const ordStatus = normalizeOrderStatus(ord.status);
                const statusObj = ORDER_STATUSES.find((s) => s.id === ordStatus);
                const isSelected = currentOrder?.id === ord.id;
                return (
                  <button
                    key={ord.id}
                    type="button"
                    className={`track-recent-card ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSearchQuery(ord.id);
                      navigate(`/track/${ord.id}`, { replace: true });
                      setCurrentOrder(ord);
                      setNotFound(false);
                    }}
                  >
                    <div className="track-recent-card__top">
                      <span className="track-recent-card__id">#{ord.id}</span>
                      <span className={`badge badge--status-${ordStatus} track-recent-card__badge`}>
                        {statusObj?.icon || '⏳'} {statusObj?.shortLabel || statusObj?.label || ordStatus}
                      </span>
                    </div>
                    <div className="track-recent-card__desc">
                      {ord.items?.map((it) => `${it.name} (${it.quantity})`).join(', ')}
                    </div>
                    <div className="track-recent-card__bottom">
                      <span>Pickup: {formatDate(ord.pickupDate || ord.deliveryDate)}</span>
                      <strong className="font-display">{formatPrice(ord.total)}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
