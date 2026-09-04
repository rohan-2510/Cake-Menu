// ============================================
// Admin Dashboard Page — Firebase Realtime Sync & CRUD Controls
// ============================================
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock, LogOut, Package, Calendar, Settings, ChevronRight,
  ChevronLeft, ToggleLeft, ToggleRight, Minus, Plus, Eye,
  ShieldAlert, MessageSquare, PlusCircle, Edit3, Trash2,
  Check, X, Image, DollarSign, Star, User, Phone
} from 'lucide-react';
import { WhatsAppIcon } from '../components/icons/SocialIcons';
import { useStore } from '../store/StoreContext';
import { ORDER_STATUSES, CATEGORIES, SIZES, ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, normalizeOrderStatus } from '../data/products';
import { loginUser, isFirebaseConfigured } from '../services/firebase';
import { formatPrice, formatDate, formatDateTime, toDateString } from '../utils/helpers';
import './AdminPage.css';

export default function AdminPage() {
  const {
    state,
    dispatch,
    Actions,
    isAdmin,
    addMenuProduct,
    updateMenuProduct,
    deleteMenuProduct,
    addCustomerTestimonial,
    updateCustomerTestimonial,
    deleteCustomerTestimonial,
    updateOrderStatus,
  } = useStore();

  const [activeTab, setActiveTab] = useState('orders');
  const [calMonth, setCalMonth] = useState(new Date());
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    const inputEmail = emailInput.trim().toLowerCase();
    const authorizedEmail = ADMIN_EMAIL.toLowerCase();

    // Specific admin email check
    if (inputEmail !== authorizedEmail) {
      setLoginError(`❌ Access Denied: "${emailInput}" is not authorized. Only "${ADMIN_EMAIL}" can access the Admin Dashboard.`);
      setIsLoggingIn(false);
      return;
    }

    try {
      if (isFirebaseConfigured) {
        const user = await loginUser(inputEmail, passwordInput);
        if (user.email?.toLowerCase() !== authorizedEmail) {
          throw new Error(`Email ${user.email} is not authorized for Admin access.`);
        }
        dispatch({ type: Actions.LOGIN_USER, payload: { user: { ...user, role: 'admin' } } });
      } else {
        // Fallback for local testing when Firebase is not connected
        if (passwordInput !== DEFAULT_ADMIN_PASSWORD) {
          throw new Error('Incorrect admin password.');
        }
        dispatch({ type: Actions.ADMIN_LOGIN });
      }
      dispatch({ type: Actions.SET_TOAST, payload: '👑 Welcome back, Store Admin!' });
    } catch (err) {
      let msg = err.message || 'Login failed';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        msg = 'Incorrect email or password.';
      }
      setLoginError(`❌ ${msg}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- Restricted Access View: Email & Password Authentication Only ---
  if (!isAdmin) {
    const isLoggedAsNonAdmin = currentUser && currentUser.role !== 'admin';

    return (
      <div className="admin-page admin-login" id="admin-login">
        <div className="admin-login__card">
          <ShieldAlert size={44} className="admin-login__icon" style={{ color: 'var(--color-terracotta)' }} />
          <h2 className="font-display">Admin Portal</h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--color-gray-600)', fontSize: '0.9rem' }}>
            Restricted access. Only the administrator with email <strong>{ADMIN_EMAIL}</strong> can access this dashboard.
          </p>

          {isLoggedAsNonAdmin && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--color-cream, #FFF3EB)',
              border: '1px solid var(--color-warm-beige, #F4DFC8)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: 'var(--color-cocoa, #3D2314)',
              textAlign: 'left'
            }}>
              Currently logged in as: <strong>{currentUser.email || currentUser.name}</strong> (Not Admin). Please sign in with the administrator email.
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ marginTop: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: '1rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-gray-700)' }}>
                Admin Email Address *
              </label>
              <input
                type="email"
                className="input-field"
                placeholder={ADMIN_EMAIL}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-gray-700)' }}>
                Password *
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter admin password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>

            {loginError && (
              <div style={{
                color: 'var(--color-error, #D32F2F)',
                fontSize: '0.825rem',
                marginBottom: '1rem',
                lineHeight: 1.4,
                textAlign: 'left'
              }}>
                {loginError}
              </div>
            )}

            <button type="submit" className="btn btn--primary btn--full" disabled={isLoggingIn}>
              {isLoggingIn ? 'Verifying Admin...' : 'Sign In as Admin'}
            </button>
          </form>

          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/" className="btn btn--ghost btn--full" style={{ fontSize: '0.9rem' }}>
              Back to Home Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingOrdersCount = (state.orders || []).filter(
    (o) => normalizeOrderStatus(o.status) === 'pending_approval'
  ).length;

  const tabs = [
    {
      id: 'orders',
      label: pendingOrdersCount > 0 ? `Orders (${pendingOrdersCount} Pending)` : 'Orders',
      icon: <Package size={18} />
    },
    { id: 'menu', label: 'Menu Catalog', icon: <Settings size={18} /> },
    { id: 'testimonials', label: 'Customer Reviews', icon: <MessageSquare size={18} /> },
    { id: 'calendar', label: 'Capacity & Calendar', icon: <Calendar size={18} /> },
  ];

  return (
    <div className="admin-page" id="admin-page">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="font-display">Store Dashboard</h1>
            <p>Welcome back, Priyanka 👩‍🍳 (Admin Portal)</p>
          </div>
          <button
            className="btn btn--ghost"
            onClick={() => dispatch({ type: Actions.LOGOUT })}
            id="admin-logout-btn"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <div className={`admin-stat-card ${pendingOrdersCount > 0 ? 'admin-stat-card--attention' : ''}`}>
            <span className="admin-stat-card__icon">⏳</span>
            <div>
              <span className="admin-stat-card__number">{pendingOrdersCount}</span>
              <span className="admin-stat-card__label">Pending Approval</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__icon">🎂</span>
            <div>
              <span className="admin-stat-card__number">{state.menuItems?.length || 0}</span>
              <span className="admin-stat-card__label">Menu Items</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__icon">⭐</span>
            <div>
              <span className="admin-stat-card__number">{state.testimonials?.length || 0}</span>
              <span className="admin-stat-card__label">Reviews</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__icon">📅</span>
            <div>
              <span className="admin-stat-card__number">{state.blockedDates?.length || 0}</span>
              <span className="admin-stat-card__label">Blocked Days</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              id={`admin-tab-${tab.id}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <OrdersPanel
            orders={state.orders}
            onUpdateStatus={updateOrderStatus}
          />
        )}

        {/* Menu Catalog Tab */}
        {activeTab === 'menu' && (
          <MenuPanel
            menuItems={state.menuItems || []}
            onAdd={addMenuProduct}
            onUpdate={updateMenuProduct}
            onDelete={deleteMenuProduct}
          />
        )}

        {/* Testimonials Tab */}
        {activeTab === 'testimonials' && (
          <TestimonialsPanel
            testimonials={state.testimonials || []}
            onAdd={addCustomerTestimonial}
            onUpdate={updateCustomerTestimonial}
            onDelete={deleteCustomerTestimonial}
          />
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <CalendarPanel
            blockedDates={state.blockedDates}
            maxOrders={state.maxOrdersPerDay}
            calMonth={calMonth}
            setCalMonth={setCalMonth}
            dispatch={dispatch}
            Actions={Actions}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// 1. ORDERS PANEL
// ============================================
function OrdersPanel({ orders, onUpdateStatus }) {
  const [filter, setFilter] = useState('all');
  const ordersList = orders || [];

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return ordersList;
    return ordersList.filter((o) => normalizeOrderStatus(o.status) === filter);
  }, [ordersList, filter]);

  const pendingCount = useMemo(() => {
    return ordersList.filter((o) => normalizeOrderStatus(o.status) === 'pending_approval').length;
  }, [ordersList]);

  return (
    <div className="admin-panel" id="admin-orders-panel">
      {pendingCount > 0 && filter !== 'pending_approval' && (
        <div className="admin-pending-banner">
          <div className="admin-pending-banner__left">
            <span className="admin-pending-banner__icon">🔔</span>
            <div>
              <strong>{pendingCount} order(s) awaiting your approval!</strong>
              <p>Customers are waiting for your confirmation. Review requested dates &amp; slots to approve.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn--sm btn--primary"
            onClick={() => setFilter('pending_approval')}
          >
            Review Pending ({pendingCount})
          </button>
        </div>
      )}

      <div className="admin-filters">
        <button
          className={`admin-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({ordersList.length})
        </button>
        {ORDER_STATUSES.map(({ id, label, icon }) => {
          const count = ordersList.filter((o) => normalizeOrderStatus(o.status) === id).length;
          return (
            <button
              key={id}
              className={`admin-filter-btn ${filter === id ? 'active' : ''} ${id === 'pending_approval' && count > 0 ? 'admin-filter-btn--pending' : ''}`}
              onClick={() => setFilter(id)}
            >
              {icon} {label} ({count})
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="admin-empty">
          <Package size={48} />
          <p>No orders found with status "{filter}"</p>
        </div>
      ) : (
        <div className="admin-orders-list">
          {filteredOrders.map((order) => {
            const currentStatus = normalizeOrderStatus(order.status);
            const currentStatusObj = ORDER_STATUSES.find((s) => s.id === currentStatus);
            return (
              <div
                className={`admin-order-card ${currentStatus === 'pending_approval' ? 'admin-order-card--pending' : ''}`}
                key={order.id}
              >
                <div className="admin-order__header">
                  <div>
                    <span className="admin-order__id">#{order.id}</span>
                    <span className={`badge badge--status-${currentStatus}`}>
                      {currentStatusObj?.icon || '⏳'} {currentStatusObj?.label || currentStatus}
                    </span>
                  </div>
                  <span className="admin-order__date">
                    {formatDateTime(order.placedAt || order.createdAt)}
                  </span>
                </div>

                {/* Priority Approval Card Bar */}
                {currentStatus === 'pending_approval' && (
                  <div className="admin-order__approval-box">
                    <div className="admin-order__approval-info">
                      <span className="admin-order__approval-badge">⏳ Action Required: Review &amp; Approve</span>
                      <span className="admin-order__approval-text">
                        Requested Slot: <strong>{formatDate(order.pickupDate || order.deliveryDate)} ({order.timeSlot})</strong>
                      </span>
                    </div>
                    <div className="admin-order__approval-actions">
                      <button
                        type="button"
                        className="btn btn--sm btn--success admin-approval-btn admin-approval-btn--approve"
                        onClick={() => onUpdateStatus(order.id, 'confirmed')}
                        title="Approve this order and confirm the customer slot"
                      >
                        <Check size={16} /> Approve Order
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--outline admin-approval-btn admin-approval-btn--decline"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to decline order #${order.id}?`)) {
                            onUpdateStatus(order.id, 'cancelled');
                          }
                        }}
                        title="Decline this order"
                      >
                        <X size={16} /> Decline
                      </button>
                    </div>
                  </div>
                )}

                {/* Next Steps Quick Actions for Active Workflow */}
                {currentStatus === 'confirmed' && (
                  <div className="admin-order__next-steps">
                    <span className="admin-order__next-label">✅ Order Approved! Next Step:</span>
                    <div className="admin-order__next-actions">
                      <button
                        type="button"
                        className="btn btn--sm btn--primary"
                        onClick={() => onUpdateStatus(order.id, 'preparing')}
                      >
                        👩‍🍳 Start Baking
                      </button>
                      <a
                        href={`https://wa.me/91${order.customer?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hi ${order.customer?.name}! 👋 Great news! Your Cake Menu order #${order.id} has been APPROVED by Priyanka. We have confirmed your pickup slot for ${formatDate(order.pickupDate || order.deliveryDate)} (${order.timeSlot}). Thank you!`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn--sm btn--whatsapp-outline"
                      >
                        <WhatsAppIcon size={14} /> Send WhatsApp Approval
                      </a>
                    </div>
                  </div>
                )}

                {currentStatus === 'preparing' && (
                  <div className="admin-order__next-steps">
                    <span className="admin-order__next-label">👩‍🍳 Currently baking in kitchen:</span>
                    <div className="admin-order__next-actions">
                      <button
                        type="button"
                        className="btn btn--sm btn--primary"
                        onClick={() => onUpdateStatus(order.id, 'ready')}
                      >
                        📦 Mark Ready for Pickup
                      </button>
                    </div>
                  </div>
                )}

                {currentStatus === 'ready' && (
                  <div className="admin-order__next-steps">
                    <span className="admin-order__next-label">📦 Ready &amp; waiting for pickup:</span>
                    <div className="admin-order__next-actions">
                      <button
                        type="button"
                        className="btn btn--sm btn--success"
                        onClick={() => onUpdateStatus(order.id, 'picked_up')}
                      >
                        🎉 Mark Picked Up
                      </button>
                      <a
                        href={`https://wa.me/91${order.customer?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hi ${order.customer?.name}! 🎉 Your cake (Order #${order.id}) is freshly baked, packed, and READY FOR PICKUP at Cake Menu, Sirsi! See you soon!`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn--sm btn--whatsapp-outline"
                      >
                        <WhatsAppIcon size={14} /> Notify Customer Ready
                      </a>
                    </div>
                  </div>
                )}

                <div className="admin-order__customer">
                  <div className="admin-order__customer-item">
                    <User size={14} />
                    <span>{order.customer?.name}</span>
                  </div>
                  <div className="admin-order__customer-item">
                    <Phone size={14} />
                    <a href={`tel:${order.customer?.phone}`}>{order.customer?.phone}</a>
                    <a
                      href={`https://wa.me/91${order.customer?.phone?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-order__wa-link"
                      title="Chat on WhatsApp"
                      aria-label="Chat on WhatsApp"
                    >
                      <WhatsAppIcon size={14} />
                    </a>
                  </div>
                  {order.customer?.notes && (
                    <div className="admin-order__customer-item">
                      <span>📝 Note: {order.customer?.notes}</span>
                    </div>
                  )}
                  <div className="admin-order__delivery-info">
                    <span>📅 Pickup: <strong>{formatDate(order.pickupDate || order.deliveryDate)}</strong></span>
                    <span>⏰ Slot: <strong>{order.timeSlot}</strong></span>
                  </div>
                </div>

                <div className="admin-order__items">
                  {order.items?.map((item, i) => (
                    <div className="admin-order__item" key={i}>
                      <span>{item.name} ({item.size}) x{item.quantity}</span>
                      {item.flavor && <span className="admin-order__item-sub">Flavor: {item.flavor}</span>}
                      {item.eggPreference && (
                        <span className="admin-order__item-sub" style={{ fontWeight: 600, color: item.eggPreference === 'Eggless' ? 'var(--color-veg, #2E7D32)' : 'var(--color-terracotta)' }}>
                          {item.eggPreference === 'Eggless' ? '🟢 Eggless' : '🥚 With Egg'}
                        </span>
                      )}
                      {item.customMessage && (
                        <span className="admin-order__item-sub admin-order__item-msg">
                          💬 "{item.customMessage}"
                        </span>
                      )}
                      <span className="admin-order__item-price">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="admin-order__footer">
                  <span className="admin-order__total">Total: {formatPrice(order.total)}</span>
                  <div className="admin-order__status-actions">
                    <label htmlFor={`status-${order.id}`}>Status: </label>
                    <select
                      id={`status-${order.id}`}
                      value={currentStatus}
                      onChange={(e) =>
                        onUpdateStatus
                          ? onUpdateStatus(order.id, e.target.value)
                          : null
                      }
                      className="admin-status-select"
                    >
                      {ORDER_STATUSES.map(({ id, label, icon }) => (
                        <option key={id} value={id}>
                          {icon} {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// 2. MENU CATALOG PANEL (CRUD)
// ============================================
function MenuPanel({ menuItems, onAdd, onUpdate, onDelete }) {
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const getDefaultSizes = (category) => {
    const defaults = SIZES[category];
    if (defaults) {
      return defaults.map((s) => ({ label: s.label, serves: s.serves, multiplier: s.multiplier }));
    }
    return [{ label: '', serves: '', multiplier: 1 }];
  };

  const initialForm = {
    name: '',
    category: 'cakes',
    basePrice: '',
    description: '',
    image: '',
    flavors: '',
    sizes: getDefaultSizes('cakes'),
    eggless: true,
    available: true,
  };

  const [formData, setFormData] = useState(initialForm);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsAdding(true);
    setEditingItem(null);
  };

  const handleOpenEdit = (item) => {
    const existingSizes = Array.isArray(item.sizes) && item.sizes.length > 0
      ? item.sizes.map((s) => ({ label: s.label || '', serves: s.serves || '', multiplier: s.multiplier || 1 }))
      : getDefaultSizes(item.category || 'cakes');
    setFormData({
      name: item.name || '',
      category: item.category || 'cakes',
      basePrice: item.basePrice || '',
      description: item.description || '',
      image: item.image || '',
      flavors: Array.isArray(item.flavors) ? item.flavors.join(', ') : (item.flavors || ''),
      sizes: existingSizes,
      eggless: item.eggless !== false,
      available: item.available !== false,
    });
    setEditingItem(item);
    setIsAdding(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.basePrice) {
      alert('Please enter product name and base price');
      return;
    }

    const cleanedSizes = formData.sizes
      .filter((s) => s.label.trim())
      .map((s) => ({
        label: s.label.trim(),
        serves: s.serves.trim(),
        multiplier: Number(s.multiplier) || 1,
      }));

    const itemPayload = {
      name: formData.name.trim(),
      category: formData.category || 'cakes',
      basePrice: Number(formData.basePrice),
      description: formData.description.trim(),
      image: formData.image.trim() || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
      flavors: formData.flavors.split(',').map((f) => f.trim()).filter(Boolean),
      sizes: cleanedSizes.length > 0 ? cleanedSizes : getDefaultSizes(formData.category),
      available: formData.available,
      eggless: formData.eggless,
      isCustomizable: true,
      tags: formData.eggless ? ['veg'] : [],
      allergens: [],
      rating: 5.0,
      reviews: 1,
    };

    if (editingItem) {
      await onUpdate(editingItem.id, itemPayload);
    } else {
      await onAdd(itemPayload);
    }

    setIsAdding(false);
    setEditingItem(null);
  };

  return (
    <div className="admin-panel" id="admin-menu-panel">
      <div className="admin-panel__action-bar">
        <div>
          <h3>Menu Catalog ({menuItems.length} Products)</h3>
          <p>Add, edit, change prices, or toggle availability for your cakes and desserts.</p>
        </div>
        <div>
          <button className="btn btn--primary" onClick={handleOpenAdd}>
            <PlusCircle size={18} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAdding || editingItem) && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3>{editingItem ? 'Edit Menu Product' : 'Add New Cake / Product'}</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => {
                  setIsAdding(false);
                  setEditingItem(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="admin-form">
              <div className="admin-form-grid">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Red Velvet Deluxe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="input-field"
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setFormData({
                        ...formData,
                        category: newCat,
                        sizes: getDefaultSizes(newCat),
                      });
                    }}
                  >
                    <option value="cakes">Cakes</option>
                    <option value="cupcakes">Cupcakes</option>
                    <option value="brownies">Brownies</option>
                    <option value="seasonal">Seasonal</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Base Price (₹) *</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 500"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Size / Quantity Specification */}
              <div className="form-group">
                <label>Size / Quantity Options</label>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)', marginBottom: '8px' }}>
                  Define available sizes. Price = Base Price × Multiplier.
                </p>
                <div className="admin-sizes-list">
                  {formData.sizes.map((size, idx) => (
                    <div className="admin-size-row" key={idx}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Label (e.g. 1 kg)"
                        value={size.label}
                        onChange={(e) => {
                          const updated = [...formData.sizes];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setFormData({ ...formData, sizes: updated });
                        }}
                      />
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Serves (e.g. 8-10)"
                        value={size.serves}
                        onChange={(e) => {
                          const updated = [...formData.sizes];
                          updated[idx] = { ...updated[idx], serves: e.target.value };
                          setFormData({ ...formData, sizes: updated });
                        }}
                      />
                      <input
                        type="number"
                        className="input-field"
                        placeholder="Multiplier"
                        step="0.1"
                        min="0.1"
                        value={size.multiplier}
                        onChange={(e) => {
                          const updated = [...formData.sizes];
                          updated[idx] = { ...updated[idx], multiplier: e.target.value };
                          setFormData({ ...formData, sizes: updated });
                        }}
                      />
                      {formData.basePrice && (
                        <span className="admin-size-price">
                          {formatPrice(Math.round(Number(formData.basePrice) * Number(size.multiplier || 1)))}
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost admin-delete-btn"
                        onClick={() => {
                          const updated = formData.sizes.filter((_, i) => i !== idx);
                          setFormData({ ...formData, sizes: updated.length > 0 ? updated : [{ label: '', serves: '', multiplier: 1 }] });
                        }}
                        title="Remove size"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn--sm btn--outline"
                  style={{ marginTop: '8px' }}
                  onClick={() => setFormData({ ...formData, sizes: [...formData.sizes, { label: '', serves: '', multiplier: 1 }] })}
                >
                  <Plus size={14} />
                  Add Size Option
                </button>
              </div>

              <div className="form-group">
                <label>Flavors (Comma-separated)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Chocolate, Vanilla, Strawberry"
                  value={formData.flavors}
                  onChange={(e) => setFormData({ ...formData, flavors: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
                {formData.image && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={formData.image}
                      alt="Preview"
                      style={{
                        width: '56px',
                        height: '56px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid var(--color-gray-200)'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>
                      Image preview (shown on storefront & menu)
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Describe your delicious creation..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.eggless}
                    onChange={(e) => setFormData({ ...formData, eggless: e.target.checked })}
                  />
                  <span>🟢 Eggless Option Available</span>
                </label>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)', marginTop: '4px' }}>
                  Check this if this product is available in an eggless / pure veg preparation.
                </p>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingItem ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product List */}
      {menuItems.length === 0 ? (
        <div className="admin-empty">
          <p>No products in the catalog yet. Click "Add New Product" to add your first item!</p>
        </div>
      ) : (
        <div className="admin-menu-list">
          {menuItems.map((product) => {
          const isAvailable = product.available !== false;
          return (
            <div className="admin-menu-item" key={product.id} id={`admin-product-${product.id}`}>
              <div className="admin-menu-item__info">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="admin-menu-item__thumb" />
                ) : (
                  <span className="admin-menu-item__emoji">
                    {product.category === 'cakes' ? '🎂' : product.category === 'cupcakes' ? '🧁' : product.category === 'brownies' ? '🍫' : '🎉'}
                  </span>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="admin-menu-item__name">{product.name}</span>
                    <span className="admin-category-badge">{product.category}</span>
                  </div>
                  <span className="admin-menu-item__price">Price: {formatPrice(product.basePrice)}</span>
                </div>
              </div>

              <div className="admin-menu-item__actions">
                <button
                  className={`admin-toggle ${isAvailable ? 'active' : ''}`}
                  onClick={() => onUpdate(product.id, { available: !isAvailable })}
                  title={isAvailable ? 'Click to mark Out of Stock' : 'Click to mark In Stock'}
                >
                  {isAvailable ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  <span className="admin-toggle__label">{isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                </button>

                <button
                  className="btn btn--sm btn--outline"
                  onClick={() => handleOpenEdit(product)}
                  title="Edit product"
                >
                  <Edit3 size={15} />
                  <span>Edit</span>
                </button>

                <button
                  className="btn btn--sm btn--ghost admin-delete-btn"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                      onDelete(product.id);
                    }
                  }}
                  title="Delete product"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

// ============================================
// 3. TESTIMONIALS PANEL (CRUD)
// ============================================
function TestimonialsPanel({ testimonials, onAdd, onUpdate, onDelete }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const initialForm = {
    name: '',
    item: '',
    rating: 5,
    text: '',
    visible: true,
  };

  const [formData, setFormData] = useState(initialForm);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsAdding(true);
    setEditingItem(null);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      name: item.name || '',
      item: item.item || '',
      rating: item.rating || 5,
      text: item.text || '',
      visible: item.visible !== false,
    });
    setEditingItem(item);
    setIsAdding(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.text.trim()) {
      alert('Please enter reviewer name and feedback text');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      item: formData.item.trim(),
      rating: Number(formData.rating) || 5,
      text: formData.text.trim(),
      visible: formData.visible,
    };

    if (editingItem) {
      await onUpdate(editingItem.id, payload);
    } else {
      await onAdd(payload);
    }

    setIsAdding(false);
    setEditingItem(null);
  };

  return (
    <div className="admin-panel" id="admin-testimonials-panel">
      <div className="admin-panel__action-bar">
        <div>
          <h3>Customer Testimonials ({testimonials.length} Reviews)</h3>
          <p>Manage customer reviews shown on the website home page carousel.</p>
        </div>
        <button className="btn btn--primary" onClick={handleOpenAdd}>
          <PlusCircle size={18} />
          <span>Add Testimonial</span>
        </button>
      </div>

      {/* Add / Edit Modal */}
      {(isAdding || editingItem) && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3>{editingItem ? 'Edit Testimonial' : 'Add New Testimonial'}</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => {
                  setIsAdding(false);
                  setEditingItem(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="admin-form">
              <div className="admin-form-grid">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Rahul S."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ordered Product</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Belgian Chocolate Truffle"
                    value={formData.item}
                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Rating (1 to 5 Stars)</label>
                  <select
                    className="input-field"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                    <option value="3">⭐⭐⭐ (3 Stars)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Review / Feedback *</label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="What did the customer say about the cake?"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  required
                />
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingItem ? 'Save Changes' : 'Add Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Testimonials List */}
      {testimonials.length === 0 ? (
        <div className="admin-empty">
          <p>No customer reviews yet. Click "Add Testimonial" to add one.</p>
        </div>
      ) : (
        <div className="admin-testimonials-grid">
          {testimonials.map((t) => (
            <div className="admin-test-card" key={t.id}>
              <div className="admin-test-card__header">
                <div>
                  <strong>{t.name}</strong>
                  {t.item && <span className="admin-test-card__item">Ordered: {t.item}</span>}
                </div>
                <div className="admin-test-card__stars">
                  {Array.from({ length: Number(t.rating) || 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="var(--color-gold)" stroke="var(--color-gold)" />
                  ))}
                </div>
              </div>

              <p className="admin-test-card__text">"{t.text}"</p>

              <div className="admin-test-card__footer">
                <button
                  className="btn btn--sm btn--outline"
                  onClick={() => handleOpenEdit(t)}
                >
                  <Edit3 size={14} />
                  <span>Edit</span>
                </button>
                <button
                  className="btn btn--sm btn--ghost admin-delete-btn"
                  onClick={() => {
                    if (window.confirm(`Delete review from ${t.name}?`)) {
                      onDelete(t.id);
                    }
                  }}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 4. CALENDAR & CAPACITY PANEL
// ============================================
function CalendarPanel({ blockedDates, maxOrders, calMonth, setCalMonth, dispatch, Actions }) {
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = toDateString(new Date());

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isPast = dateStr < today;
    const isBlocked = blockedDates.includes(dateStr);
    days.push({ day: d, dateStr, isPast, isBlocked });
  }

  return (
    <div className="admin-panel" id="admin-calendar-panel">
      <div className="admin-calendar-controls">
        <h3>Max Orders Per Day</h3>
        <div className="admin-max-orders">
          <button
            className="admin-max-orders__btn"
            onClick={() => dispatch({ type: Actions.SET_MAX_ORDERS, payload: Math.max(1, maxOrders - 1) })}
          >
            <Minus size={16} />
          </button>
          <span className="admin-max-orders__value">{maxOrders}</span>
          <button
            className="admin-max-orders__btn"
            onClick={() => dispatch({ type: Actions.SET_MAX_ORDERS, payload: maxOrders + 1 })}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="admin-calendar">
        <div className="admin-calendar__header">
          <button onClick={() => setCalMonth(new Date(year, month - 1))} className="checkout-calendar__nav">
            <ChevronLeft size={18} />
          </button>
          <span className="checkout-calendar__month font-display">
            {calMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => setCalMonth(new Date(year, month + 1))} className="checkout-calendar__nav">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="checkout-calendar__weekdays">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="checkout-calendar__days">
          {days.map((day, i) =>
            day === null ? (
              <span key={`e-${i}`} className="checkout-calendar__day--empty" />
            ) : (
              <button
                key={day.dateStr}
                className={`checkout-calendar__day ${day.isBlocked ? 'blocked' : ''} ${day.isPast ? 'disabled' : ''}`}
                onClick={() => !day.isPast && dispatch({ type: Actions.TOGGLE_DATE_BLOCK, payload: day.dateStr })}
                disabled={day.isPast}
                style={day.isBlocked ? { background: 'var(--color-error)', color: 'white' } : {}}
              >
                {day.day}
              </button>
            )
          )}
        </div>
      </div>

      <p className="admin-calendar-hint">
        🔴 Tap a date to block/unblock it. Blocked dates will be unavailable for customers.
      </p>
    </div>
  );
}
