// ============================================
// Checkout Page
// ============================================
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, User, Phone,
  FileText, Send, CheckCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { WhatsAppIcon } from '../components/icons/SocialIcons';
import { useStore } from '../store/StoreContext';
import { TIME_SLOTS } from '../data/products';
import {
  formatPrice, formatDate, getMaxLeadTime,
  getEarliestPickup, toDateString, isSlotAvailableToday,
  generateWhatsAppMessage, getWhatsAppUrl
} from '../utils/helpers';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { state, dispatch, Actions, cartTotal, getProduct, isDateAvailable, currentUser, placeOrder } = useStore();
  const { cart } = state;

  const [pickupDate, setPickupDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [customer, setCustomer] = useState({
    name: (currentUser && currentUser.role === 'customer') ? currentUser.name : '',
    phone: (currentUser && currentUser.role === 'customer') ? currentUser.phone : '',
    notes: '',
  });
  const [orderMethod, setOrderMethod] = useState('whatsapp');
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const total = cartTotal;

  const maxLeadTime = getMaxLeadTime(cart, getProduct);
  const earliestDate = getEarliestPickup(maxLeadTime);
  const earliestDateStr = toDateString(earliestDate);

  // Calendar logic
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = toDateString(new Date());

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isPast = dateStr < today;
      const isTooSoon = dateStr < earliestDateStr;
      const isBlocked = !isDateAvailable(dateStr);
      days.push({
        day: d,
        dateStr,
        disabled: isPast || isTooSoon || isBlocked,
        isPast,
        isTooSoon,
        isBlocked,
      });
    }
    return days;
  }, [calendarMonth, earliestDateStr, isDateAvailable]);

  const isToday = pickupDate === toDateString(new Date());

  const isFormValid = pickupDate && timeSlot && customer.name.trim() && customer.phone.trim().length >= 10;

  const handlePlaceOrder = async () => {
    const slotObj = TIME_SLOTS.find((s) => s.id === timeSlot);
    const orderData = {
      items: cart.map((item) => ({
        ...item,
      })),
      pickupDate,
      timeSlot: slotObj?.label + ' (' + slotObj?.time + ')',
      customer: { ...customer },
      subtotal: cartTotal,
      total,
    };

    const placedOrder = await placeOrder(orderData);

    if (orderMethod === 'whatsapp') {
      const msg = generateWhatsAppMessage(orderData);
      const url = getWhatsAppUrl(msg);
      window.open(url, '_blank');
      setOrderPlaced(placedOrder);
    } else {
      setOrderPlaced(placedOrder);
    }
  };

  if (orderPlaced) {
    return (
      <div className="checkout-page" id="checkout-page">
        <div className="container">
            <div className="checkout-success animate-fade-in-up">
              <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '0.5rem' }}>⏳</span>
              <h1 className="font-display">Order Submitted for Approval!</h1>
              <div style={{
                margin: '0.75rem 0 1.25rem',
                padding: '0.6rem 1.2rem',
                background: 'var(--color-cream, #FFF3EB)',
                border: '1px dashed var(--color-terracotta)',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-gray-600)' }}>Your Order ID:</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--color-cocoa)', fontFamily: 'monospace' }}>
                  #{orderPlaced.id}
                </strong>
              </div>
              <p>Thank you, <strong>{customer.name}</strong>! Your order request has been sent to Priyanka for approval.</p>

              <div style={{
                background: '#FFF8E1',
                border: '1px solid #FFE082',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                margin: '1.25rem auto',
                maxWidth: '480px',
                textAlign: 'left',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>👩‍🍳</span>
                <div style={{ fontSize: '0.88rem', color: '#5D4037', lineHeight: 1.45 }}>
                  <strong style={{ display: 'block', color: '#B78103', marginBottom: '2px' }}>Next Step: Baker Review & Approval</strong>
                  Priyanka will review your requested pickup slot and cake customization. Once approved, your order will be officially confirmed and prepared fresh!
                </div>
              </div>

              <div className="checkout-success__details">
                <p>📅 Requested Pickup: <strong>{formatDate(pickupDate)}</strong></p>
                <p>🕐 Time Slot: <strong>{TIME_SLOTS.find((s) => s.id === timeSlot)?.label}</strong></p>
                <p>💰 Total: <strong>{formatPrice(total)}</strong></p>
                <p>💳 Payment: <strong>Pay on Pickup</strong></p>
                <p>🏠 <strong>Self-pickup from Sirsi</strong></p>
              </div>
              {orderMethod === 'whatsapp' && (
                <p className="checkout-success__wa-note">
                  📱 A WhatsApp message has been opened. Please send it to connect directly with Priyanka.
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                <Link to={`/track/${orderPlaced.id}`} className="btn btn--primary btn--lg">
                  📍 Track Approval Status Live
                </Link>
                <Link to="/" className="btn btn--outline btn--lg">
                  Back to Home
                </Link>
              </div>
            </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page" id="checkout-page">
      <div className="container">
        <div className="checkout-page__header">
          <Link to="/cart" className="btn btn--ghost">
            <ArrowLeft size={18} />
            Back to Cart
          </Link>
          <h1 className="font-display">Checkout</h1>
        </div>

        <div className="checkout-page__layout">
          {/* Form */}
          <div className="checkout-form">
            {/* Date Picker */}
            <div className="checkout-section" id="date-picker-section">
              <h2 className="checkout-section__title">
                <Calendar size={18} />
                Pickup Date
              </h2>
              <p className="checkout-section__hint">
                ⏳ Items require at least {maxLeadTime}h preparation. Earliest: <strong>{formatDate(earliestDateStr)}</strong>
              </p>

              <div className="checkout-calendar">
                <div className="checkout-calendar__header">
                  <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="checkout-calendar__nav">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="checkout-calendar__month font-display">
                    {calendarMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="checkout-calendar__nav">
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="checkout-calendar__weekdays">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>

                <div className="checkout-calendar__days">
                  {calendarDays.map((day, i) =>
                    day === null ? (
                      <span key={`empty-${i}`} className="checkout-calendar__day--empty" />
                    ) : (
                      <button
                        key={day.dateStr}
                        className={`checkout-calendar__day ${day.disabled ? 'disabled' : ''} ${pickupDate === day.dateStr ? 'selected' : ''}`}
                        onClick={() => !day.disabled && setPickupDate(day.dateStr)}
                        disabled={day.disabled}
                        title={day.isBlocked ? 'Fully booked / blocked' : day.isTooSoon ? 'Too soon (lead time)' : ''}
                      >
                        {day.day}
                        {day.isBlocked && !day.isPast && !day.isTooSoon && (
                          <span className="checkout-calendar__blocked-dot" />
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Time Slot */}
            <div className="checkout-section" id="time-slot-section">
              <h2 className="checkout-section__title">
                <Clock size={18} />
                Time Slot
              </h2>
              <div className="checkout-slots">
                {TIME_SLOTS.map((slot) => {
                  const unavailable = isToday && !isSlotAvailableToday(slot.id);
                  return (
                    <button
                      key={slot.id}
                      className={`checkout-slot ${timeSlot === slot.id ? 'selected' : ''} ${unavailable ? 'disabled' : ''}`}
                      onClick={() => !unavailable && setTimeSlot(slot.id)}
                      disabled={unavailable}
                      id={`slot-${slot.id}`}
                    >
                      <span className="checkout-slot__icon">{slot.icon}</span>
                      <span className="checkout-slot__label">{slot.label}</span>
                      <span className="checkout-slot__time">{slot.time}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Info */}
            <div className="checkout-section" id="customer-info-section">
              <h2 className="checkout-section__title">
                <User size={18} />
                Your Details
              </h2>

              <div className="checkout-fields">
                <div className="input-group">
                  <label htmlFor="customer-name">Full Name *</label>
                  <input
                    id="customer-name"
                    className="input-field"
                    placeholder="Your full name"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="customer-phone">WhatsApp Number *</label>
                  <input
                    id="customer-phone"
                    className="input-field"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="customer-notes">
                    <FileText size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Special Notes (optional)
                  </label>
                  <textarea
                    id="customer-notes"
                    className="input-field"
                    placeholder="Any special instructions for your order"
                    rows={2}
                    value={customer.notes}
                    onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Order Method */}
            <div className="checkout-section" id="order-method-section">
              <h2 className="checkout-section__title">
                <Send size={18} />
                How would you like to order?
              </h2>
              <div className="checkout-methods">
                <button
                  className={`checkout-method ${orderMethod === 'whatsapp' ? 'selected' : ''}`}
                  onClick={() => setOrderMethod('whatsapp')}
                  id="method-whatsapp"
                >
                  <WhatsAppIcon size={24} className="checkout-method__icon checkout-method__icon--wa" />
                  <div>
                    <span className="checkout-method__label">Order via WhatsApp</span>
                    <span className="checkout-method__desc">Send order details directly to Priyanka</span>
                  </div>
                </button>
                <button
                  className={`checkout-method ${orderMethod === 'web' ? 'selected' : ''}`}
                  onClick={() => setOrderMethod('web')}
                  id="method-web"
                >
                  <Send size={24} className="checkout-method__icon" />
                  <div>
                    <span className="checkout-method__label">Place Order Online</span>
                    <span className="checkout-method__desc">Pay on Pickup — Pay when you collect</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="checkout-summary" id="checkout-summary">
            <h3 className="checkout-summary__title font-display">Order Summary</h3>

            <div className="checkout-summary__items">
              {cart.map((item) => (
                <div key={item.id} className="checkout-summary__item">
                  <span className="checkout-summary__item-name">
                    {item.name} <small>×{item.quantity}</small>
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="checkout-summary__rows">
              <div className="checkout-summary__row checkout-summary__row--total">
                <span>Total</span>
                <span className="font-display">{formatPrice(total)}</span>
              </div>
            </div>

            {pickupDate && (
              <div className="checkout-summary__delivery">
                <p>📅 {formatDate(pickupDate)}</p>
                {timeSlot && <p>🕐 {TIME_SLOTS.find((s) => s.id === timeSlot)?.label}</p>}
                <p>🏠 Self-pickup from Sirsi</p>
              </div>
            )}

            <button
              className={`btn btn--lg btn--full ${orderMethod === 'whatsapp' ? 'btn--whatsapp' : 'btn--primary'}`}
              onClick={handlePlaceOrder}
              disabled={!isFormValid}
              id="place-order-btn"
            >
              {orderMethod === 'whatsapp' ? (
                <>
                  <WhatsAppIcon size={18} />
                  Send via WhatsApp
                </>
              ) : (
                <>
                  <Send size={18} />
                  Place Order — {formatPrice(total)}
                </>
              )}
            </button>

            <p className="checkout-summary__note">
              💳 Pay on Pickup • 🏠 Self-Pickup from Sirsi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
