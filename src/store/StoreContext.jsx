// ============================================
// CAKE MENU — State Management with Firebase Sync & localStorage
// ============================================
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { MAX_ORDERS_PER_DAY, ADMIN_EMAIL, normalizeOrderStatus } from '../data/products';
import {
  onAuthListener,
  subscribeMenu,
  subscribeTestimonials,
  subscribeOrders,
  subscribeCustomerOrders,
  addMenuItem as fbAddMenuItem,
  updateMenuItem as fbUpdateMenuItem,
  deleteMenuItem as fbDeleteMenuItem,
  addTestimonial as fbAddTestimonial,
  updateTestimonial as fbUpdateTestimonial,
  deleteTestimonial as fbDeleteTestimonial,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  logoutUser,
  fetchOrderById,
  isFirebaseConfigured,
} from '../services/firebase';

// --- Initial State Helper ---
const getStoredState = (key, fallback) => {
  try {
    const stored = localStorage.getItem(`cakeMenu_${key}`);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeOrders = (ordersList) => Array.isArray(ordersList)
  ? ordersList.map((order) => ({ ...order, status: normalizeOrderStatus(order.status) }))
  : [];

const initialState = {
  cart: getStoredState('cart', []),
  orders: normalizeOrders(getStoredState('orders', [])),
  menuItems: getStoredState('menuItems', []),
  testimonials: getStoredState('testimonials', []),
  blockedDates: getStoredState('blockedDates', []),
  maxOrdersPerDay: getStoredState('maxOrdersPerDay', MAX_ORDERS_PER_DAY),
  productOverrides: getStoredState('productOverrides', {}),
  currentUser: null,
  toast: null,
};

// --- Actions ---
const Actions = {
  SET_MENU_ITEMS: 'SET_MENU_ITEMS',
  SET_TESTIMONIALS: 'SET_TESTIMONIALS',
  SET_ORDERS: 'SET_ORDERS',
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
  LOGIN_USER: 'LOGIN_USER',
  SET_GUEST: 'SET_GUEST',
  LOGOUT: 'LOGOUT',
  SET_TOAST: 'SET_TOAST',
  CLEAR_TOAST: 'CLEAR_TOAST',
};

// --- Reducer ---
function storeReducer(state, action) {
  switch (action.type) {
    case Actions.SET_MENU_ITEMS:
      return { ...state, menuItems: action.payload };

    case Actions.SET_TESTIMONIALS:
      return { ...state, testimonials: action.payload };

    case Actions.SET_ORDERS:
      return {
        ...state,
        orders: normalizeOrders(action.payload),
      };

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
        id: action.payload.id || `ORD-${Date.now().toString(36).toUpperCase()}`,
        status: action.payload.status ? normalizeOrderStatus(action.payload.status) : 'pending_approval',
        placedAt: new Date().toISOString(),
      };
      return {
        ...state,
        orders: [order, ...state.orders],
        cart: [],
      };
    }

    case Actions.UPDATE_ORDER_STATUS: {
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.orderId
            ? { ...order, ...action.payload }
            : order
        ),
      };
    }

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

    case Actions.LOGIN_USER: {
      return {
        ...state,
        currentUser: action.payload.user,
      };
    }

    case Actions.SET_GUEST:
      return {
        ...state,
        currentUser: {
          id: 'guest_user',
          name: 'Guest',
          role: 'guest',
        },
      };

    case Actions.LOGOUT:
      return {
        ...state,
        currentUser: null,
      };

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

  // 1. Firebase Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthListener((user) => {
      if (user) {
        dispatch({ type: Actions.LOGIN_USER, payload: { user } });
      } else {
        dispatch({ type: Actions.LOGOUT });
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Menu Sync
  useEffect(() => {
    const unsubscribe = subscribeMenu((items) => {
      if (items) {
        dispatch({ type: Actions.SET_MENU_ITEMS, payload: items });
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. Real-time Firestore Testimonials Sync
  useEffect(() => {
    const unsubscribe = subscribeTestimonials((items) => {
      if (items) {
        dispatch({ type: Actions.SET_TESTIMONIALS, payload: items });
      }
    }, undefined, state.currentUser?.role === 'admin');
    return () => unsubscribe();
  }, [state.currentUser?.role]);

  // 4. Real-time Firestore Orders Sync (active when admin is logged in)
  useEffect(() => {
    if (state.currentUser?.role === 'admin') {
      const unsubscribe = subscribeOrders((orders) => {
        if (orders) {
          dispatch({ type: Actions.SET_ORDERS, payload: orders });
        }
      });
      return () => unsubscribe();
    }
  }, [state.currentUser?.role]);

  // 5. Real-time Firestore Orders Sync for Customer (active when customer is logged in)
  useEffect(() => {
    const user = state.currentUser;
    if (user?.uid && user.role === 'customer') {
      const unsubscribe = subscribeCustomerOrders(user, (orders) => {
        if (orders) {
          dispatch({ type: Actions.SET_ORDERS, payload: orders });
        }
      });
      return () => unsubscribe();
    }
  }, [state.currentUser]);

  // Local Storage Persistence
  useEffect(() => {
    localStorage.setItem('cakeMenu_menuItems', JSON.stringify(state.menuItems));
  }, [state.menuItems]);

  useEffect(() => {
    localStorage.setItem('cakeMenu_testimonials', JSON.stringify(state.testimonials));
  }, [state.testimonials]);

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

  useEffect(() => {
    localStorage.removeItem('cakeMenu_currentUser');
  }, []);

  useEffect(() => {
    // Remove passwords saved by older offline-only account versions.
    localStorage.removeItem('cakeMenu_users');
    localStorage.removeItem('cakeMenu_cancelledOrders');
  }, []);

  // Auto-clear toast
  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => dispatch({ type: Actions.CLEAR_TOAST }), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.toast]);

  // Helper: get product with overrides applied (reads from live menuItems)
  const getProduct = useCallback(
    (id) => {
      const base = (state.menuItems || []).find((p) => p.id === id);
      if (!base) return null;
      return { ...base, ...(state.productOverrides[id] || {}) };
    },
    [state.menuItems, state.productOverrides]
  );

  // Helper: get all products with overrides
  const getProducts = useCallback(
    (category = 'all') => {
      return (state.menuItems || []).map((p) => ({
        ...p,
        ...(state.productOverrides[p.id] || {}),
      })).filter((p) => category === 'all' || p.category === category);
    },
    [state.menuItems, state.productOverrides]
  );

  // Helper: check if date is blocked or fully booked
  const isDateAvailable = useCallback(
    (dateStr) => {
      if (state.blockedDates.includes(dateStr)) return false;
      const ordersOnDate = state.orders.filter(
        (o) => (o.pickupDate || o.deliveryDate) === dateStr && o.status !== 'picked_up' && o.status !== 'cancelled'
      );
      return ordersOnDate.length < state.maxOrdersPerDay;
    },
    [state.blockedDates, state.orders, state.maxOrdersPerDay]
  );

  // Menu CRUD Operations (Firestore + Local)
  const addMenuProduct = async (productData) => {
    try {
      if (isFirebaseConfigured) {
        await fbAddMenuItem(productData);
      } else {
        const newItem = { ...productData, id: productData.id || `custom_${Date.now()}` };
        dispatch({ type: Actions.SET_MENU_ITEMS, payload: [...state.menuItems, newItem] });
      }
      dispatch({ type: Actions.SET_TOAST, payload: '✅ Menu item added successfully!' });
    } catch (err) {
      dispatch({ type: Actions.SET_TOAST, payload: `❌ Failed to add item: ${err.message}` });
    }
  };

  const updateMenuProduct = async (productId, updates) => {
    try {
      if (isFirebaseConfigured) {
        await fbUpdateMenuItem(productId, updates);
      } else {
        dispatch({
          type: Actions.SET_MENU_ITEMS,
          payload: state.menuItems.map((p) => (p.id === productId ? { ...p, ...updates } : p)),
        });
      }
      dispatch({ type: Actions.SET_TOAST, payload: '✅ Menu item updated!' });
    } catch (err) {
      dispatch({ type: Actions.SET_TOAST, payload: `❌ Failed to update item: ${err.message}` });
    }
  };

  const deleteMenuProduct = async (productId) => {
    try {
      if (isFirebaseConfigured) {
        await fbDeleteMenuItem(productId);
      } else {
        dispatch({
          type: Actions.SET_MENU_ITEMS,
          payload: state.menuItems.filter((p) => p.id !== productId),
        });
      }
      dispatch({ type: Actions.SET_TOAST, payload: '🗑️ Menu item deleted!' });
    } catch (err) {
      dispatch({ type: Actions.SET_TOAST, payload: `❌ Failed to delete item: ${err.message}` });
    }
  };

  // Testimonials CRUD Operations (Firestore + Local)
  const addCustomerTestimonial = async (data) => {
    try {
      if (isFirebaseConfigured) {
        await fbAddTestimonial(data);
      } else {
        const newItem = { ...data, id: `test_${Date.now()}` };
        dispatch({ type: Actions.SET_TESTIMONIALS, payload: [...state.testimonials, newItem] });
      }
      dispatch({ type: Actions.SET_TOAST, payload: '✅ Review added!' });
    } catch (err) {
      dispatch({ type: Actions.SET_TOAST, payload: `❌ Failed to add review: ${err.message}` });
    }
  };

  const updateCustomerTestimonial = async (id, updates) => {
    try {
      if (isFirebaseConfigured) {
        await fbUpdateTestimonial(id, updates);
      } else {
        dispatch({
          type: Actions.SET_TESTIMONIALS,
          payload: state.testimonials.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        });
      }
      dispatch({ type: Actions.SET_TOAST, payload: '✅ Review updated!' });
    } catch (err) {
      dispatch({ type: Actions.SET_TOAST, payload: `❌ Failed to update review: ${err.message}` });
    }
  };

  const deleteCustomerTestimonial = async (id) => {
    try {
      if (isFirebaseConfigured) {
        await fbDeleteTestimonial(id);
      } else {
        dispatch({
          type: Actions.SET_TESTIMONIALS,
          payload: state.testimonials.filter((t) => t.id !== id),
        });
      }
      dispatch({ type: Actions.SET_TOAST, payload: '🗑️ Review removed!' });
    } catch (err) {
      dispatch({ type: Actions.SET_TOAST, payload: `❌ Failed to delete review: ${err.message}` });
    }
  };

  // Orders Operations (Firestore + Local)
  const placeOrder = async (orderData) => {
    const orderId = orderData.id || `ORD-${crypto.randomUUID().replaceAll('-', '').toUpperCase()}`;
    const fullOrder = {
      ...orderData,
      id: orderId,
      status: 'pending_approval',
      placedAt: new Date().toISOString(),
    };
    if (isFirebaseConfigured) {
      const savedOrder = await saveOrderToFirestore(fullOrder);
      dispatch({ type: Actions.PLACE_ORDER, payload: savedOrder });
      return savedOrder;
    }
    dispatch({ type: Actions.PLACE_ORDER, payload: fullOrder });
    return fullOrder;
  };

  const updateOrderStatus = async (orderId, status, extraFields = {}) => {
    if (!isFirebaseConfigured) {
      dispatch({ type: Actions.SET_TOAST, payload: 'Order updates are unavailable because Firebase is not configured.' });
      return false;
    }
    try {
      await updateOrderStatusInFirestore(orderId, status, extraFields);
    } catch (error) {
      dispatch({ type: Actions.SET_TOAST, payload: `Could not update order: ${error.message}` });
      return false;
    }
    const payload = { orderId, status, ...extraFields };
    dispatch({ type: Actions.UPDATE_ORDER_STATUS, payload });
    return true;
  };

  // Helper: cart totals
  const cartTotal = state.cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  // Auth Helpers
  const currentUser = state.currentUser;
  const isLoggedIn = Boolean(currentUser && currentUser.role !== 'guest');
  const isAdmin = Boolean(
    currentUser &&
    currentUser.role === 'admin' &&
    currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
  const isGuest = Boolean(currentUser && currentUser.role === 'guest');

  const cancelOrder = async (orderId, reason = '') => {
    if (!currentUser?.uid) return false;
    const existingOrder = state.orders.find((o) => o.id === orderId) || await fetchOrderById(orderId, currentUser.uid);
    if (!existingOrder || existingOrder.userId !== currentUser.uid) return false;
    // Edge case: Customer can only cancel UNTIL it gets approved
    if (existingOrder && existingOrder.status !== 'pending_approval' && existingOrder.status !== 'cancelled') {
      dispatch({
        type: Actions.SET_TOAST,
        payload: `⚠️ Cannot cancel order #${orderId}: This order has already been approved by Priyanka!`,
      });
      return false;
    }

    const cancelInfo = {
      cancelledBy: 'customer',
      cancelledAt: new Date().toISOString(),
      cancelReason: reason || 'Cancelled by customer before approval',
    };

    const success = await updateOrderStatus(orderId, 'cancelled', cancelInfo);
    if (success) {
      dispatch({ type: Actions.SET_TOAST, payload: '❌ Order cancelled successfully' });
    }
    return success;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      dispatch({ type: Actions.LOGOUT });
    }
  };

  const value = {
    state,
    dispatch,
    Actions,
    currentUser,
    isLoggedIn,
    isAdmin,
    isGuest,
    getProduct,
    getProducts,
    isDateAvailable,
    cartTotal,
    cartCount,
    addMenuProduct,
    updateMenuProduct,
    deleteMenuProduct,
    addCustomerTestimonial,
    updateCustomerTestimonial,
    deleteCustomerTestimonial,
    placeOrder,
    updateOrderStatus,
    cancelOrder,
    logout,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}

export { Actions };
