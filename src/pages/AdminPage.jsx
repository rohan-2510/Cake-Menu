// ============================================
// Admin Dashboard Page
// ============================================
import { useState, useMemo } from 'react';
import {
  Lock, LogOut, Package, Calendar, Settings, ChevronRight,
  ChevronLeft, ToggleLeft, ToggleRight, Minus, Plus, Eye
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { PRODUCTS, ORDER_STATUSES } from '../data/products';
import { formatPrice, formatDate, toDateString } from '../utils/helpers';
import './AdminPage.css';

export default function AdminPage() {
  const { state, dispatch, Actions, getProducts } = useStore();
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [calMonth, setCalMonth] = useState(new Date());

  // --- Login ---
  if (!state.isAdminLoggedIn) {
    return (
      <div className="admin-page admin-login" id="admin-login">
        <div className="admin-login__card">
          <Lock size={36} className="admin-login__icon" />
          <h2 className="font-display">Owner Dashboard</h2>
          <p>Enter your PIN to manage orders & menu</p>
          <div className="admin-login__input-wrap">
            <input
              type="password"
              className="input-field admin-login__input"
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={4}
              id="admin-pin-input"
            />
          </div>
          <button
            className="btn btn--primary btn--lg btn--full"
            onClick={() => {
              if (pin === state.adminPin) {
                dispatch({ type: Actions.ADMIN_LOGIN });
              } else {
                dispatch({ type: Actions.SET_TOAST, payload: '❌ Incorrect PIN' });
              }
            }}
            id="admin-login-btn"
          >
            Login
          </button>
          <p className="admin-login__hint">Default PIN: 1234</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'orders', label: 'Orders', icon: <Package size={18} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={18} /> },
    { id: 'menu', label: 'Menu', icon: <Settings size={18} /> },
  ];

  return (
    <div className="admin-page" id="admin-page">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="font-display">Dashboard</h1>
            <p>Welcome back, Priyanka 👩‍🍳</p>
          </div>
          <button
            className="btn btn--ghost"
            onClick={() => dispatch({ type: Actions.ADMIN_LOGOUT })}
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
            <span className="admin-stat-card__icon">👩‍🍳</span>
            <div>
              <span className="admin-stat-card__number">{state.orders.filter((o) => o.status === 'preparing').length}</span>
              <span className="admin-stat-card__label">Preparing</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__icon">✅</span>
            <div>
              <span className="admin-stat-card__number">{state.orders.filter((o) => o.status === 'delivered').length}</span>
              <span className="admin-stat-card__label">Delivered</span>
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

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <CalendarPanel
            blockedDates={state.blockedDates}
            maxOrders={state.maxOrdersPerDay}
            dispatch={dispatch}
            Actions={Actions}
            calMonth={calMonth}
            setCalMonth={setCalMonth}
          />
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <MenuPanel
            products={getProducts()}
            overrides={state.productOverrides}
            dispatch={dispatch}
            Actions={Actions}
          />
        )}
      </div>
    </div>
  );
}

// --- Orders Panel ---
function OrdersPanel({ orders, dispatch, Actions }) {
  if (orders.length === 0) {
    return (
      <div className="admin-panel admin-empty">
        <span>📭</span>
        <p>No orders yet. They'll appear here when customers place orders.</p>
      </div>
    );
  }

  const getNextStatus = (current) => {
    const flow = ['placed', 'confirmed', 'preparing', 'out', 'delivered'];
    const idx = flow.indexOf(current);
    return idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  return (
    <div className="admin-panel">
      <div className="admin-orders">
        {orders.map((order) => {
          const statusObj = ORDER_STATUSES.find((s) => s.id === order.status);
          const nextStatus = getNextStatus(order.status);
          const nextStatusObj = nextStatus ? ORDER_STATUSES.find((s) => s.id === nextStatus) : null;

          return (
            <div className="admin-order" key={order.id} id={`order-${order.id}`}>
              <div className="admin-order__header">
                <div>
                  <span className="admin-order__id">{order.id}</span>
                  <span
                    className="admin-order__status"
                    style={{ background: `${statusObj?.color}18`, color: statusObj?.color }}
                  >
                    {statusObj?.icon} {statusObj?.label}
                  </span>
                </div>
                <span className="admin-order__date">
                  {new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="admin-order__items">
                {order.items.map((item, i) => (
                  <div key={i} className="admin-order__item">
                    <span>{item.name} ({item.sizeName}) ×{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="admin-order__delivery">
                <span>📅 {formatDate(order.deliveryDate)}</span>
                <span>🕐 {order.timeSlot}</span>
              </div>

              <div className="admin-order__customer">
                <span>👤 {order.customer.name}</span>
                <span>📱 {order.customer.phone}</span>
                <span>📍 {order.customer.address}</span>
              </div>

              <div className="admin-order__footer">
                <span className="admin-order__total font-display">
                  Total: {formatPrice(order.total)}
                </span>
                {nextStatusObj && (
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() =>
                      dispatch({
                        type: Actions.UPDATE_ORDER_STATUS,
                        payload: { orderId: order.id, status: nextStatus },
                      })
                    }
                  >
                    {nextStatusObj.icon} Mark as {nextStatusObj.label}
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Calendar Panel ---
function CalendarPanel({ blockedDates, maxOrders, dispatch, Actions, calMonth, setCalMonth }) {
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = toDateString(new Date());

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, dateStr, isBlocked: blockedDates.includes(dateStr), isPast: dateStr < today });
  }

  return (
    <div className="admin-panel">
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

// --- Menu Panel ---
function MenuPanel({ products, overrides, dispatch, Actions }) {
  return (
    <div className="admin-panel">
      <div className="admin-menu-list">
        {products.map((product) => {
          const isAvailable = product.available !== false;
          return (
            <div className="admin-menu-item" key={product.id} id={`admin-product-${product.id}`}>
              <div className="admin-menu-item__info">
                <span className="admin-menu-item__emoji">
                  {product.category === 'cakes' ? '🎂' : product.category === 'cupcakes' ? '🧁' : product.category === 'brownies' ? '🍫' : '🎉'}
                </span>
                <div>
                  <span className="admin-menu-item__name">{product.name}</span>
                  <span className="admin-menu-item__price">Base: {formatPrice(product.basePrice)}</span>
                </div>
              </div>

              <div className="admin-menu-item__actions">
                <button
                  className={`admin-toggle ${isAvailable ? 'active' : ''}`}
                  onClick={() => dispatch({ type: Actions.TOGGLE_PRODUCT_AVAILABILITY, payload: product.id })}
                  title={isAvailable ? 'In Stock' : 'Out of Stock'}
                >
                  {isAvailable ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  <span className="admin-toggle__label">{isAvailable ? 'In Stock' : 'Out'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
