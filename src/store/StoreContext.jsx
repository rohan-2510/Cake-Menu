// ============================================
// CAKE MENU — State Management with localStorage
// ============================================
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { PRODUCTS, MAX_ORDERS_PER_DAY } from '../data/products';

// --- Initial State ---
const getStoredState = (key, fallback) => {
  try {
    const stored = localStorage.getItem(`cakeMenu_${key}`);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const initialState = {
  cart: getStoredState('cart', []),
  orders: getStoredState('orders', []),
  blockedDates: getStoredState('blockedDates', []),
  maxOrdersPerDay: getStoredState('maxOrdersPerDay', MAX_ORDERS_PER_DAY),
  productOverrides: getStoredState('productOverrides', {}),
  adminPin: getStoredState('adminPin', '1234'),
  isAdminLoggedIn: false,
  toast: null,
};

// --- Actions ---
const Actions = {
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  UPDATE_CART_ITEM: 'UPDATE_CART_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  PLACE_ORDER: 'PLACE_ORDER',
  UPDATE_ORDER_STATUS: 'UPDATE_ORDER_STATUS',
  TOGGLE_DATE_BLOCK: 'TOGGLE_DATE_BLOCK',
  SET_MAX_ORDERS: 'SET_MAX_ORDERS',
  TOGGLE_PRODUCT_AVAILABILITY: 'TOGGLE_PRODUCT_AVAILABILITY',
  UPDATE_PRODUCT_PRICE: 'UPDATE_PRODUCT_PRICE',
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  ADMIN_LOGOUT: 'ADMIN_LOGOUT',
  SET_TOAST: 'SET_TOAST',
  CLEAR_TOAST: 'CLEAR_TOAST',
};

// --- Reducer ---
function storeReducer(state, action) {
  switch (action.type) {
    case Actions.ADD_TO_CART: {
      const existing = state.cart.find(
        (item) =>
          item.productId === action.payload.productId &&
          item.size === action.payload.size &&
          item.flavor === action.payload.flavor &&
          item.customMessage === action.payload.customMessage
      );
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.id === existing.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [
          ...state.cart,
          {
            ...action.payload,
            id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            quantity: 1,
          },
        ],
      };
    }

    case Actions.REMOVE_FROM_CART:
      return {
        ...state,
        cart: state.cart.filter((item) => item.id !== action.payload),
      };

    case Actions.UPDATE_CART_ITEM:
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === action.payload.id
            ? { ...item, ...action.payload.updates }
            : item
        ),
      };

    case Actions.CLEAR_CART:
      return { ...state, cart: [] };

    case Actions.PLACE_ORDER: {
      const order = {
        ...action.payload,
        id: `ORD-${Date.now().toString(36).toUpperCase()}`,
        status: 'placed',
        placedAt: new Date().toISOString(),
      };
      return {
        ...state,
        orders: [order, ...state.orders],
        cart: [],
      };
    }

    case Actions.UPDATE_ORDER_STATUS:
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.status }
            : order
        ),
      };

    case Actions.TOGGLE_DATE_BLOCK: {
      const date = action.payload;
      const isBlocked = state.blockedDates.includes(date);
      return {
        ...state,
        blockedDates: isBlocked
          ? state.blockedDates.filter((d) => d !== date)
          : [...state.blockedDates, date],
      };
    }

    case Actions.SET_MAX_ORDERS:
      return { ...state, maxOrdersPerDay: action.payload };

    case Actions.TOGGLE_PRODUCT_AVAILABILITY: {
      const productId = action.payload;
      const current = state.productOverrides[productId] || {};
      return {
        ...state,
        productOverrides: {
          ...state.productOverrides,
          [productId]: {
            ...current,
            available: current.available === undefined
              ? false
              : !current.available,
          },
        },
      };
    }

    case Actions.UPDATE_PRODUCT_PRICE: {
      const { productId, price } = action.payload;
      const current = state.productOverrides[productId] || {};
      return {
        ...state,
        productOverrides: {
          ...state.productOverrides,
          [productId]: { ...current, basePrice: price },
        },
      };
    }

    case Actions.ADMIN_LOGIN:
      return { ...state, isAdminLoggedIn: true };

    case Actions.ADMIN_LOGOUT:
      return { ...state, isAdminLoggedIn: false };

    case Actions.SET_TOAST:
      return { ...state, toast: action.payload };

    case Actions.CLEAR_TOAST:
      return { ...state, toast: null };

    default:
      return state;
  }
}

// --- Context ---
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('cakeMenu_cart', JSON.stringify(state.cart));
  }, [state.cart]);

  useEffect(() => {
    localStorage.setItem('cakeMenu_orders', JSON.stringify(state.orders));
  }, [state.orders]);

  useEffect(() => {
    localStorage.setItem('cakeMenu_blockedDates', JSON.stringify(state.blockedDates));
  }, [state.blockedDates]);

  useEffect(() => {
    localStorage.setItem('cakeMenu_maxOrdersPerDay', JSON.stringify(state.maxOrdersPerDay));
  }, [state.maxOrdersPerDay]);

  useEffect(() => {
    localStorage.setItem('cakeMenu_productOverrides', JSON.stringify(state.productOverrides));
  }, [state.productOverrides]);

  // Auto-clear toast
  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => dispatch({ type: Actions.CLEAR_TOAST }), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.toast]);

  // Helper: get product with overrides applied
  const getProduct = useCallback(
    (productId) => {
      const product = PRODUCTS.find((p) => p.id === productId);
      if (!product) return null;
      const overrides = state.productOverrides[productId] || {};
      return { ...product, ...overrides };
    },
    [state.productOverrides]
  );

  // Helper: get all products with overrides
  const getProducts = useCallback(
    (category = 'all') => {
      return PRODUCTS.map((p) => ({
        ...p,
        ...(state.productOverrides[p.id] || {}),
      })).filter((p) => category === 'all' || p.category === category);
    },
    [state.productOverrides]
  );

  // Helper: check if date is blocked or fully booked
  const isDateAvailable = useCallback(
    (dateStr) => {
      if (state.blockedDates.includes(dateStr)) return false;
      const ordersOnDate = state.orders.filter(
        (o) => o.deliveryDate === dateStr && o.status !== 'delivered'
      );
      return ordersOnDate.length < state.maxOrdersPerDay;
    },
    [state.blockedDates, state.orders, state.maxOrdersPerDay]
  );

  // Helper: cart totals
  const cartTotal = state.cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    state,
    dispatch,
    Actions,
    getProduct,
    getProducts,
    isDateAvailable,
    cartTotal,
    cartCount,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}

export { Actions };
