// ============================================
// CAKE MENU — Utility Helpers
// ============================================
import { OWNER_PHONE, TIME_SLOTS } from '../data/products';

/**
 * Format price in INR
 */
export function formatPrice(amount) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Parse any date representation safely into a Date object
 */
function parseDateSafely(input) {
  if (!input) return null;

  // 1. Firestore Timestamp instance with .toDate()
  if (typeof input?.toDate === 'function') {
    return input.toDate();
  }
  // 2. Firestore Timestamp raw object { seconds, nanoseconds }
  if (typeof input?.seconds === 'number') {
    return new Date(input.seconds * 1000);
  }
  // 3. String in YYYY-MM-DD format (prevent timezone day-shift by appending T00:00:00)
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    return new Date(input.trim() + 'T00:00:00');
  }
  // 4. ISO string, timestamp number, or Date instance
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format date to readable string (e.g. "Sun, 6 Sept, 2026")
 */
export function formatDate(input) {
  const date = parseDateSafely(input);
  if (!date) return '—';

  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date and time for placed orders (e.g. "4 Sep 2026, 01:15 PM")
 */
export function formatDateTime(input) {
  const date = parseDateSafely(input);
  if (!date) return '—';

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Calculate earliest pickup date based on lead time hours
 */
export function getEarliestPickup(leadTimeHours) {
  const now = new Date();
  const earliest = new Date(now.getTime() + leadTimeHours * 60 * 60 * 1000);
  // If it would be past 8PM (end of last slot), push to next day
  if (earliest.getHours() >= 20) {
    earliest.setDate(earliest.getDate() + 1);
    earliest.setHours(10, 0, 0, 0);
  }
  return earliest;
}

/**
 * Get date string in YYYY-MM-DD format
 */
export function toDateString(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Check if a time slot is still available for today
 */
export function isSlotAvailableToday(slotId) {
  const now = new Date();
  const hour = now.getHours();
  switch (slotId) {
    case 'morning': return hour < 10;
    case 'afternoon': return hour < 14;
    case 'evening': return hour < 17;
    default: return false;
  }
}

/**
 * Generate maximum lead time from cart items
 */
export function getMaxLeadTime(cartItems, getProduct) {
  return cartItems.reduce((max, item) => {
    const product = getProduct(item.productId);
    return Math.max(max, product?.leadTimeHours || 48);
  }, 0);
}

/**
 * Generate WhatsApp order message
 */
export function generateWhatsAppMessage(order) {
  const { items, customer, pickupDate, timeSlot, total } = order;

  let msg = `🎂 *NEW ORDER REQUEST — Cake Menu*\n`;
  if (order.id) msg += `*Order ID:* #${order.id}\n`;
  msg += `*Status:* ⏳ Pending Baker Approval\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  items.forEach((item, i) => {
    msg += `*${i + 1}. ${item.name}*\n`;
    msg += `   Size: ${item.sizeName}\n`;
    if (item.flavor) msg += `   Flavor: ${item.flavor}\n`;
    if (item.eggPreference) msg += `   Prep: ${item.eggPreference === 'Eggless' ? '🟢 Eggless' : '🥚 With Egg'}\n`;
    if (item.customMessage) msg += `   📝 Message: "${item.customMessage}"\n`;
    msg += `   Qty: ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}\n\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*Total: ${formatPrice(total)}*\n\n`;

  msg += `📅 *Pickup Date:* ${formatDate(pickupDate)}\n`;
  const selectedSlot = TIME_SLOTS.find((slot) => slot.id === timeSlot);
  msg += `🕐 *Time Slot:* ${selectedSlot ? `${selectedSlot.label} (${selectedSlot.time})` : timeSlot}\n\n`;

  msg += `👤 *Customer:* ${customer.name}\n`;
  msg += `📱 *Phone:* ${customer.phone}\n`;

  if (customer.notes) {
    msg += `\n📋 *Special Notes:* ${customer.notes}\n`;
  }

  msg += `\n💳 *Payment:* Pay on Pickup\n`;
  msg += `⏳ *Note:* Waiting for Priyanka's review & approval.\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `_Thank you for ordering from Cake Menu!_ 🧁`;

  return msg;
}

/**
 * Build WhatsApp URL
 */
export function getWhatsAppUrl(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${OWNER_PHONE}?text=${encoded}`;
}

/**
 * Generate a unique order ID
 */
export function generateOrderId() {
  return `ORD-${crypto.randomUUID().replaceAll('-', '').toUpperCase()}`;
}
