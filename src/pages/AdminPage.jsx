// ============================================
// Admin Dashboard Page — Firebase Realtime Sync & CRUD Controls
// ============================================
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock, LogOut, Package, Calendar, Settings, ChevronRight,
  ChevronLeft, ToggleLeft, ToggleRight, Minus, Plus, Eye,
  ShieldAlert, MessageSquare, PlusCircle, Edit3, Trash2,
  Check, X, Image, DollarSign, Star
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { ORDER_STATUSES, CATEGORIES } from '../data/products';
import { formatPrice, formatDate, toDateString } from '../utils/helpers';
import { forceSeedAllToFirestore } from '../services/firebase';
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
  } = useStore();

  const [activeTab, setActiveTab] = useState('orders');
  const [calMonth, setCalMonth] = useState(new Date());

  // --- Restricted Access View ---
  if (!isAdmin) {
    return (
      <div className="admin-page admin-login" id="admin-login">
        <div className="admin-login__card">
          <ShieldAlert size={42} className="admin-login__icon" style={{ color: 'var(--color-terracotta)' }} />
          <h2 className="font-display">Admin Access Only</h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--color-gray-600)' }}>
            This dashboard is restricted to the store administrator. Please log in with your admin account.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/" className="btn btn--primary btn--full">
              Back to Home Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'orders', label: 'Orders', icon: <Package size={18} /> },
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
          <div className="admin-stat-card">
            <span className="admin-stat-card__icon">📋</span>
            <div>
              <span className="admin-stat-card__number">{state.orders.filter((o) => o.status === 'placed').length}</span>
              <span className="admin-stat-card__label">New Orders</span>
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
              <span className="admin-stat-card__number">{state.blockedDates.length}</span>
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
            dispatch={dispatch}
            Actions={Actions}
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
function OrdersPanel({ orders, dispatch, Actions }) {
  const [filter, setFilter] = useState('all');

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  return (
    <div className="admin-panel" id="admin-orders-panel">
      <div className="admin-filters">
        <button
          className={`admin-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({orders.length})
        </button>
        {Object.entries(ORDER_STATUSES).map(([key, { label, emoji }]) => {
          const count = orders.filter((o) => o.status === key).length;
          return (
            <button
              key={key}
              className={`admin-filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {emoji} {label} ({count})
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="admin-empty">
          <p>No orders in this category yet.</p>
        </div>
      ) : (
        <div className="admin-orders-list">
          {filteredOrders.map((order) => (
            <div className="admin-order-card" key={order.id} id={`admin-order-${order.id}`}>
              <div className="admin-order__header">
                <div>
                  <span className="admin-order__id">{order.id}</span>
                  <span className="admin-order__time">
                    Placed: {order.placedAt ? formatDate(order.placedAt.slice(0, 10)) : 'Recently'}
                  </span>
                </div>
                <span
                  className="admin-order__status-badge"
                  style={{
                    backgroundColor: `${ORDER_STATUSES[order.status]?.color}20`,
                    color: ORDER_STATUSES[order.status]?.color,
                    borderColor: ORDER_STATUSES[order.status]?.color,
                  }}
                >
                  {ORDER_STATUSES[order.status]?.emoji} {ORDER_STATUSES[order.status]?.label}
                </span>
              </div>

              <div className="admin-order__details">
                <div className="admin-order__customer">
                  <strong>👤 {order.customer?.name}</strong>
                  <span>📞 {order.customer?.phone}</span>
                  {order.customer?.address && (
                    <span>📍 {order.customer.address}</span>
                  )}
                </div>

                <div className="admin-order__delivery-info">
                  <span>📅 Delivery: <strong>{formatDate(order.deliveryDate)}</strong></span>
                  <span>⏰ Slot: <strong>{order.timeSlot}</strong></span>
                </div>
              </div>

              <div className="admin-order__items">
                {order.items?.map((item, i) => (
                  <div className="admin-order__item" key={i}>
                    <span>{item.name} ({item.size}) x{item.quantity}</span>
                    {item.flavor && <span className="admin-order__item-sub">Flavor: {item.flavor}</span>}
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
                    value={order.status}
                    onChange={(e) =>
                      dispatch({
                        type: Actions.UPDATE_ORDER_STATUS,
                        payload: { orderId: order.id, status: e.target.value },
                      })
                    }
                    className="admin-status-select"
                  >
                    {Object.entries(ORDER_STATUSES).map(([key, { label, emoji }]) => (
                      <option key={key} value={key}>
                        {emoji} {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
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

  const initialForm = {
    name: '',
    category: 'cakes',
    basePrice: '',
    description: '',
    image: '',
    flavors: '',
    leadTimeHours: 24,
    available: true,
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
      category: item.category || 'cakes',
      basePrice: item.basePrice || '',
      description: item.description || '',
      image: item.image || '',
      flavors: Array.isArray(item.flavors) ? item.flavors.join(', ') : (item.flavors || ''),
      leadTimeHours: item.leadTimeHours || 24,
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

    const itemPayload = {
      name: formData.name.trim(),
      category: formData.category,
      basePrice: Number(formData.basePrice),
      description: formData.description.trim(),
      image: formData.image.trim() || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
      flavors: formData.flavors.split(',').map((f) => f.trim()).filter(Boolean),
      leadTimeHours: Number(formData.leadTimeHours) || 24,
      available: formData.available,
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

  const [isSeeding, setIsSeeding] = useState(false);

  const handleForceSeed = async () => {
    if (window.confirm('Sync and seed all default cakes & reviews into your Firestore database?')) {
      setIsSeeding(true);
      try {
        await forceSeedAllToFirestore();
        alert('🎉 Successfully synced all default cakes & reviews to your Firestore database!');
      } catch (err) {
        alert(`❌ Sync error: ${err.message}`);
      } finally {
        setIsSeeding(false);
      }
    }
  };

  return (
    <div className="admin-panel" id="admin-menu-panel">
      <div className="admin-panel__action-bar">
        <div>
          <h3>Menu Catalog ({menuItems.length} Products)</h3>
          <p>Add, edit, change prices, or toggle availability for your cakes and desserts.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn--outline"
            onClick={handleForceSeed}
            disabled={isSeeding}
            title="Upload default cakes catalog to Firestore"
          >
            <span>{isSeeding ? 'Syncing...' : '⚡ Seed Initial Catalog to Firestore'}</span>
          </button>

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
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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

                <div className="form-group">
                  <label>Lead Time (Hours)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="24"
                    value={formData.leadTimeHours}
                    onChange={(e) => setFormData({ ...formData, leadTimeHours: e.target.value })}
                  />
                </div>
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
