// ============================================
// CAKE MENU — Product Catalog & Store Data
// ============================================

export const OWNER_PHONE = '918431441492';
export const OWNER_NAME = 'Priyanka';
export const ADMIN_EMAIL = 'admin@cakemenu.com';
export const SHOP_NAME = 'Cake Menu';
export const SHOP_TAGLINE = 'Handcrafted home-baked cakes & treats in Sirsi';
export const SHOP_LOCATION = 'Sirsi, Uttara Kannada, Karnataka';
export const FSSAI_NUMBER = 'XXXXXXXXXXXXXXXXX'; // Replace with real FSSAI license


export const MAX_ORDERS_PER_DAY = 8;
export const MAX_ORDER_LINE_ITEMS = 5;

export const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', time: '10:00 AM – 1:00 PM', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon', time: '2:00 PM – 5:00 PM', icon: '☀️' },
  { id: 'evening', label: 'Evening', time: '5:00 PM – 8:00 PM', icon: '🌇' },
];

export const CATEGORIES = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'cakes', label: 'Cakes', icon: '🎂' },
  { id: 'cupcakes', label: 'Cupcakes', icon: '🧁' },
  { id: 'brownies', label: 'Brownies', icon: '🍫' },
  { id: 'seasonal', label: 'Seasonal', icon: '🎉' },
];

export const SIZES = {
  cakes: [
    { id: '0.5kg', label: '0.5 kg', serves: '4-5', multiplier: 1 },
    { id: '1kg', label: '1.0 kg', serves: '8-10', multiplier: 1.9 },
    { id: '1.5kg', label: '1.5 kg', serves: '12-15', multiplier: 2.7 },
    { id: '2kg', label: '2.0 kg', serves: '18-20', multiplier: 3.5 },
  ],
  cupcakes: [
    { id: '6pack', label: '6 Pack', serves: '6', multiplier: 1 },
    { id: '12pack', label: '12 Pack', serves: '12', multiplier: 1.85 },
  ],
  brownies: [
    { id: '6pack', label: '6 Pieces', serves: '6', multiplier: 1 },
    { id: '12pack', label: '12 Pieces', serves: '12', multiplier: 1.8 },
  ],
};

export const PRODUCTS = [];

export const TESTIMONIALS = [];

export const ALLERGEN_INFO = [
  { name: 'Dairy', icon: '🥛', description: 'Contains milk, butter, cream, cream cheese' },
  { name: 'Nuts', icon: '🥜', description: 'May contain walnuts, pistachios, almonds, cashews' },
  { name: 'Gluten', icon: '🌾', description: 'Contains wheat flour (maida, atta)' },
];

export const ORDER_STATUSES = [
  { id: 'pending_approval', label: 'Pending Approval', shortLabel: 'Pending', color: '#F57C00', icon: '⏳' },
  { id: 'confirmed', label: 'Approved & Confirmed', shortLabel: 'Approved', color: '#2E7D32', icon: '✅' },
  { id: 'preparing', label: 'Baking & Decorating', shortLabel: 'Baking', color: '#FF9800', icon: '👩‍🍳' },
  { id: 'ready', label: 'Ready for Pickup', shortLabel: 'Ready', color: '#0288D1', icon: '📦' },
  { id: 'picked_up', label: 'Picked Up', shortLabel: 'Picked Up', color: '#4CAF50', icon: '🎉' },
  { id: 'cancelled', label: 'Declined / Cancelled', shortLabel: 'Declined', color: '#D32F2F', icon: '❌' },
];

export const normalizeOrderStatus = (status) => {
  if (!status || status === 'placed') return 'pending_approval';
  return status;
};

