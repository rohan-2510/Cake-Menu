// ============================================
// TrackOrderPage — Live Customer Order Tracking
// ============================================
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search, Package, Clock, CheckCircle2, MapPin, Phone,
  Copy, Check, ArrowLeft, RefreshCw,
  ShoppingBag, ChefHat, XCircle
} from 'lucide-react';
import { WhatsAppIcon } from '../components/icons/SocialIcons';
import { useStore } from '../store/StoreContext';
import { ORDER_STATUSES, OWNER_PHONE, OWNER_NAME, SHOP_LOCATION, normalizeOrderStatus } from '../data/products';
import { formatPrice, formatDate, formatDateTime } from '../utils/helpers';
import {
  subscribeSingleOrder,
  fetchOrderById,
  fetchCustomerOrders,
  isFirebaseConfigured,
} from '../services/firebase';
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
  const { state, dispatch, Actions, isAdmin, isGuest, isLoggedIn, currentUser, cancelOrder } = useStore();

  // Redirect admin users directly to Admin Dashboard
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, navigate]);

  // Redirect guests — they can't place orders, so Track Order is not applicable
  useEffect(() => {
    if (isGuest || !currentUser) {
      navigate('/', { replace: true });
    }
  }, [isGuest, currentUser, navigate]);

  const [searchQuery, setSearchQuery] = useState(urlOrderId || '');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showSearch, setShowSearch] = useState(Boolean(urlOrderId));
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Cancel order handler (available until order is approved)
  const handleCancelOrder = async () => {
    if (!currentOrder?.id) return;
    setIsCancelling(true);
    try {
      const success = await cancelOrder(currentOrder.id);
      if (success) {
        setCurrentOrder((prev) => (prev ? {
          ...prev,
          status: 'cancelled',
          cancelledBy: 'customer',
          cancelledAt: new Date().toISOString()
        } : null));
      }
      setShowCancelModal(false);
    } catch (err) {
      console.error('Failed to cancel order:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  // Compute all orders belonging to the currently logged in customer
  const customerOrders = useMemo(() => {
    if (!currentUser) return [];
    const targetUid = currentUser.uid;
    if (!targetUid) return [];

    return (state.orders || [])
      .filter((o) => {
        return o.userId === targetUid;
      })
      .sort((a, b) => new Date(b.placedAt || b.createdAt || 0) - new Date(a.placedAt || a.createdAt || 0));
  }, [state.orders, currentUser]);

  // On mount, ensure customer orders are fetched from Firestore into state
  useEffect(() => {
    if (currentUser && isFirebaseConfigured) {
      fetchCustomerOrders(currentUser).then((remoteOrders) => {
        if (remoteOrders && remoteOrders.length > 0) {
          const existingIds = new Set((state.orders || []).map((o) => o.id));
          const newOrders = remoteOrders.filter((o) => !existingIds.has(o.id));
          if (newOrders.length > 0) {
            dispatch({
              type: Actions.SET_ORDERS,
              payload: [...(state.orders || []), ...newOrders],
            });
          }
        }
      });
    }
  }, [currentUser]);

  // Auto-select the customer's latest order if no specific order is in URL
  useEffect(() => {
    if (!urlOrderId && customerOrders.length > 0) {
      if (!currentOrder || !customerOrders.some((o) => o.id === currentOrder.id)) {
        setCurrentOrder(customerOrders[0]);
      } else {
        const synced = customerOrders.find((o) => o.id === currentOrder.id);
        if (synced && synced.status !== currentOrder.status) {
          setCurrentOrder(synced);
        }
      }
    }
  }, [customerOrders, urlOrderId, currentOrder]);

  // Helper: Find order in local customer orders
  const findCustomerOrder = (query) => {
    if (!query) return null;
    const clean = query.trim().toUpperCase().replace('#', '');

    return customerOrders.find((o) => {
      if (o.userId !== currentUser?.uid) return false;
      const oId = (o.id || '').toUpperCase().replace('#', '');
      return (
        oId === clean ||
        oId === `ORD-${clean}` ||
        `ORD-${oId}` === clean
      );
    });
  };

  // Perform search / lookup
  const lookupOrder = async (query) => {
    const q = (query || '').trim();
    if (!q) return;

    setIsLoading(true);
    setNotFound(false);

    // 1. Check customer's orders first
    const match = findCustomerOrder(q);
    if (match) {
      setCurrentOrder(match);
      setIsLoading(false);
      return;
    }

    // 2. Fetch from Firestore if available
    if (isFirebaseConfigured) {
      const cleanId = q.toUpperCase().replace('#', '');
      const targetId = cleanId.startsWith('ORD-') ? cleanId : `ORD-${cleanId}`;

      try {
        const remoteOrder = await fetchOrderById(targetId, currentUser?.uid) || await fetchOrderById(cleanId, currentUser?.uid);
        if (remoteOrder) {
          setCurrentOrder(remoteOrder);
          setNotFound(false);
        } else {
          setNotFound(true);
          setCurrentOrder(null);
        }
      } catch {
        setNotFound(true);
      }
    } else {
      setNotFound(true);
      setCurrentOrder(null);
    }

    setIsLoading(false);
  };

  // Real-time Firestore subscriber when an order is active
  useEffect(() => {
    if (!currentOrder?.id || !isFirebaseConfigured) return;

    const unsubscribe = subscribeSingleOrder(currentOrder.id, currentUser?.uid, (updated) => {
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
  }, [currentOrder?.id, currentUser?.uid, dispatch, Actions]);

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

  const handleSelectOrder = (ord) => {
    setCurrentOrder(ord);
    setNotFound(false);
    navigate(`/track/${ord.id}`, { replace: true });
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

  return (
    <div className="track-page" id="track-page">
      <div className="container track-page__container">
        {/* Navigation / Header */}
        <div className="track-page__header">
          <Link to="/" className="btn btn--ghost btn--sm">
            <ArrowLeft size={16} />
            Back to Menu
          </Link>
          <h1 className="font-display">Track Your Orders</h1>
          <p>Check the live preparation and pickup status of your handcrafted cake</p>
        </div>

        {/* Customer Orders Selector: Shown automatically if customer has multiple orders */}
        {customerOrders.length > 1 && (
          <div className="track-orders-selector animate-fade-in-up">
            <div className="track-orders-selector__header">
              <h3 className="track-orders-selector__title">
                <Package size={18} />
                Your Placed Orders ({customerOrders.length})
              </h3>
            </div>
            <div className="track-orders-grid">
              {customerOrders.map((ord) => {
                const ordStatus = normalizeOrderStatus(ord.status);
                const statusObj = ORDER_STATUSES.find((s) => s.id === ordStatus);
                const isSelected = currentOrder?.id === ord.id;
                return (
                  <button
                    key={ord.id}
                    type="button"
                    className={`track-order-card ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectOrder(ord)}
                  >
                    <div className="track-order-card__top">
                      <span className="track-order-card__id">#{ord.id}</span>
                      <span className={`badge badge--status-${ordStatus} track-order-card__badge`}>
                        {statusObj?.icon || '⏳'} {statusObj?.shortLabel || statusObj?.label || ordStatus}
                      </span>
                    </div>
                    <div className="track-order-card__desc">
                      {ord.items?.map((it) => `${it.name} (${it.quantity})`).join(', ')}
                    </div>
                    <div className="track-order-card__bottom">
                      <span>📅 {formatDate(ord.pickupDate || ord.deliveryDate)}</span>
                      <strong className="font-display">{formatPrice(ord.total)}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State: Shown if customer has not placed any orders yet */}
        {customerOrders.length === 0 && !currentOrder && !isLoading && !notFound && (
          <div className="track-empty-state animate-fade-in-up">
            <span className="track-empty-state__icon">🎂</span>
            <h2>No Orders Placed Yet</h2>
            <p>
              You haven't placed any cake orders yet with your account. Once you order from our delicious menu, you can track the approval, baking, and pickup status right here in real time!
            </p>
            <Link to="/" className="btn btn--primary btn--lg">
              Browse Cake Menu & Order
            </Link>
          </div>
        )}

        {/* Not Found State */}
        {notFound && (
          <div className="track-not-found animate-fade-in-up">
            <Package size={48} />
            <h3>Order Not Found</h3>
            <p>
              We couldn't find an order matching "<strong>{searchQuery}</strong>".
              Please double check the ID from your confirmation message.
            </p>
          </div>
        )}

        {/* Active Order Card: Automatically displayed without needing to search */}
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
                {currentOrder.userId === currentUser?.uid && currentStatus === 'pending_approval' && (
                  <button
                    type="button"
                    className="btn btn--outline-danger btn--sm"
                    onClick={() => setShowCancelModal(true)}
                    title="Cancel this order before baker approval"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <XCircle size={13} />
                    <span>Cancel Order</span>
                  </button>
                )}
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
                <div className="track-status-banner__icon">
                  {currentOrder.cancelledBy === 'customer' ? '🚫' : '❌'}
                </div>
                <div>
                  <h2 className="track-status-banner__title font-display">
                    {currentOrder.cancelledBy === 'customer' ? 'Order Cancelled by You' : 'Order Declined by Baker'}
                  </h2>
                  <p className="track-status-banner__desc">
                    {currentOrder.cancelledBy === 'customer'
                      ? 'You have cancelled this order before baker approval. No charges were made, and no baking will take place.'
                      : 'Unfortunately, this order request could not be accepted for the requested date/time. If you would like to reschedule or request another slot, please feel free to place a new order or chat with Priyanka on WhatsApp.'}
                  </p>
                  {currentOrder.cancelledAt && (
                    <span style={{ display: 'inline-block', marginTop: '0.45rem', fontSize: '0.82rem', color: '#991B1B', fontWeight: 500 }}>
                      🕒 Cancelled on: {formatDateTime(currentOrder.cancelledAt)}
                    </span>
                  )}
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

            {currentOrder.userId === currentUser?.uid && currentStatus === 'pending_approval' && (
              <div className="track-approval-notice">
                <span className="track-approval-notice__icon">⏳</span>
                <div style={{ flex: 1 }}>
                  <strong>Order is waiting for Priyanka's approval</strong>
                  <p>Priyanka bakes every cake fresh to order. She will verify kitchen capacity and approve your pickup slot shortly. This page will update live in real-time as soon as approved!</p>
                  <p style={{ marginTop: '0.45rem', fontSize: '0.825rem', color: '#8D6E63' }}>
                    Need to change your plans? You can cancel this order anytime until it gets approved.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn--outline-danger btn--sm"
                  onClick={() => setShowCancelModal(true)}
                  style={{ alignSelf: 'center', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <XCircle size={14} />
                  <span>Cancel Order</span>
                </button>
              </div>
            )}

            {/* Visual Step Progress Tracker (Only shown for active non-cancelled orders) */}
            {currentStatus !== 'cancelled' && (
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
            )}

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
                            className={`badge ${item.eggPreference === 'Eggless' ? 'badge--veg' : 'badge--neutral'
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

        {/* Secondary Search Option (For tracking an older order ID if needed) */}
        <div className="track-secondary-search">
          {!showSearch ? (
            <button
              type="button"
              className="track-search-toggle-btn"
              onClick={() => setShowSearch(true)}
            >
              <Search size={15} />
              <span>Looking for a specific Order ID? Search here</span>
            </button>
          ) : (
            <div className="track-search-card animate-fade-in-up">
              <form onSubmit={handleSearchSubmit} className="track-search-form">
                <div className="track-search-input-wrap">
                  <Search size={20} className="track-search-icon" />
                  <input
                    type="text"
                    className="input-field track-search-input"
                    placeholder="Enter Order ID (e.g. ORD-MTMN5LF3)"
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
          )}
        </div>
        {/* Cancellation Confirmation Modal */}
        {showCancelModal && currentOrder && (
          <div className="order-popup-overlay" onClick={() => !isCancelling && setShowCancelModal(false)}>
            <div className="order-cancel-popup" onClick={(e) => e.stopPropagation()}>
              <div className="order-cancel-popup__icon">⚠️</div>
              <h3 className="order-cancel-popup__title font-display">Cancel Order #{currentOrder.id}?</h3>
              <p className="order-cancel-popup__desc">
                Are you sure you want to cancel this order? Since this order has not been approved yet, you can cancel it now without any charges.
              </p>
              <div className="order-cancel-popup__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isCancelling}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
