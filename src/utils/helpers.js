// ============================================
// CAKE MENU — Utility Helpers
// ============================================
import { OWNER_PHONE, DELIVERY_FEE, FREE_DELIVERY_ABOVE } from '../data/products';

/**
 * Format price in INR
 */
export function formatPrice(amount) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Format date to readable string
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get delivery fee based on subtotal
 */
export function getDeliveryFee(subtotal) {
  return subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
}

/**
 * Calculate earliest delivery date based on lead time hours
 */
export function getEarliestDelivery(leadTimeHours) {
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
    return Math.max(max, product?.leadTimeHours || 24);
  }, 0);
}

/**
 * Generate WhatsApp order message
 */
export function generateWhatsAppMessage(order) {
  const { items, customer, deliveryDate, timeSlot, subtotal, deliveryFee, total } = order;

  let msg = `🎂 *NEW ORDER — Cake Menu*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  items.forEach((item, i) => {
    msg += `*${i + 1}. ${item.name}*\n`;
    msg += `   Size: ${item.sizeName}\n`;
    if (item.flavor) msg += `   Flavor: ${item.flavor}\n`;
    if (item.customMessage) msg += `   📝 Message: "${item.customMessage}"\n`;
    msg += `   Qty: ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}\n\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `Subtotal: ${formatPrice(subtotal)}\n`;
  msg += `Delivery: ${deliveryFee === 0 ? 'FREE 🎉' : formatPrice(deliveryFee)}\n`;
  msg += `*Total: ${formatPrice(total)}*\n\n`;

  msg += `📅 *Delivery Date:* ${formatDate(deliveryDate)}\n`;
  msg += `🕐 *Time Slot:* ${timeSlot}\n\n`;

  msg += `👤 *Customer:* ${customer.name}\n`;
  msg += `📱 *Phone:* ${customer.phone}\n`;
  msg += `📍 *Address:* ${customer.address}, Sirsi\n`;

  if (customer.notes) {
    msg += `\n📋 *Special Notes:* ${customer.notes}\n`;
  }

  msg += `\n💳 *Payment:* Cash on Delivery\n`;
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
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `CM-${timestamp}-${random}`;
}
