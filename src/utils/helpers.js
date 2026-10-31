// ============================================
// CAKE MENU — Utility Helpers
// ============================================

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
 * Format date and time (e.g. "4 Sep 2026, 01:15 PM")
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
 * Get date string in YYYY-MM-DD format
 */
export function toDateString(date) {
  return date.toISOString().split('T')[0];
}
