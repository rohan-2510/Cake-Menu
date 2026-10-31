// ============================================
// CAKE MENU — State Management with Firebase Sync & localStorage
// ============================================
import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { ADMIN_EMAIL } from '../data/products';
import {
  onAuthListener,
  subscribeMenu,
  subscribeTestimonials,
  addMenuItem as fbAddMenuItem,
  updateMenuItem as fbUpdateMenuItem,
  deleteMenuItem as fbDeleteMenuItem,
  addTestimonial as fbAddTestimonial,
  updateTestimonial as fbUpdateTestimonial,
  deleteTestimonial as fbDeleteTestimonial,
  logoutUser,
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

const initialState = {
  menuItems: getStoredState('menuItems', []),
  testimonials: getStoredState('testimonials', []),
  currentUser: null,
  toast: null,
};

// --- Actions ---
const Actions = {
  SET_MENU_ITEMS: 'SET_MENU_ITEMS',
  SET_TESTIMONIALS: 'SET_TESTIMONIALS',
  LOGIN_USER: 'LOGIN_USER',
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

    case Actions.LOGIN_USER:
      return {
        ...state,
        currentUser: action.payload.user,
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
  const [authReady, setAuthReady] = useState(false);

  // 1. Firebase Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthListener((user) => {
      if (user) {
        dispatch({ type: Actions.LOGIN_USER, payload: { user } });
      } else {
        dispatch({ type: Actions.LOGOUT });
      }
      setAuthReady(true);
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

  // 3. Real-time Firestore Testimonials Sync (includeHidden=true for admin)
  useEffect(() => {
    const isAdmin = Boolean(
      state.currentUser &&
      state.currentUser.role === 'admin' &&
      state.currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    );
    const unsubscribe = subscribeTestimonials((items) => {
      if (items) {
        dispatch({ type: Actions.SET_TESTIMONIALS, payload: items });
      }
    }, undefined, isAdmin);
    return () => unsubscribe();
  }, [state.currentUser]);

  // Local Storage Persistence (dev fallback)
  useEffect(() => {
    localStorage.setItem('cakeMenu_menuItems', JSON.stringify(state.menuItems));
  }, [state.menuItems]);

  useEffect(() => {
    localStorage.setItem('cakeMenu_testimonials', JSON.stringify(state.testimonials));
  }, [state.testimonials]);

  // Cleanup stale keys from older versions
  useEffect(() => {
    localStorage.removeItem('cakeMenu_currentUser');
    localStorage.removeItem('cakeMenu_cart');
    localStorage.removeItem('cakeMenu_orders');
    localStorage.removeItem('cakeMenu_blockedDates');
    localStorage.removeItem('cakeMenu_maxOrdersPerDay');
    localStorage.removeItem('cakeMenu_productOverrides');
    localStorage.removeItem('cakeMenu_users');
    localStorage.removeItem('cakeMenu_cancelledOrders');
  }, []);

  // Auto-clear toast after 3s
  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => dispatch({ type: Actions.CLEAR_TOAST }), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.toast]);

  // Helper: get product by id (reads from live menuItems)
  const getProduct = useCallback(
    (id) => {
      return (state.menuItems || []).find((p) => p.id === id) || null;
    },
    [state.menuItems]
  );

  // Helper: get all products, optionally filtered by category
  const getProducts = useCallback(
    (category = 'all') => {
      return (state.menuItems || []).filter(
        (p) => category === 'all' || p.category === category
      );
    },
    [state.menuItems]
  );

  // Auth helpers
  const currentUser = state.currentUser;
  const isAdmin = Boolean(
    currentUser &&
    currentUser.role === 'admin' &&
    currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  // Menu CRUD Operations (Firestore + Local fallback)
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

  // Testimonials CRUD Operations (Firestore + Local fallback)
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
    authReady,
    currentUser,
    isAdmin,
    getProduct,
    getProducts,
    addMenuProduct,
    updateMenuProduct,
    deleteMenuProduct,
    addCustomerTestimonial,
    updateCustomerTestimonial,
    deleteCustomerTestimonial,
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
