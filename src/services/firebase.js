// ============================================
// Firebase Service — Auth, Firestore & Realtime Sync
// ============================================
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { ADMIN_EMAIL } from '../data/products';

// Firebase configuration from environment variables
const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';

const firebaseConfig = {
  apiKey: rawApiKey.trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId: rawProjectId.trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
};

// Check if valid Firebase keys are provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('YOUR_API_KEY') &&
  firebaseConfig.apiKey.length > 5
);

// Safe Initialization
let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
}

export { app, auth, db };

// ============================================
// 1. AUTHENTICATION SERVICES
// ============================================

/**
 * Register a new customer
 */
export async function registerCustomer(name, phone, email, password) {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase credentials not configured yet. Please add them to .env file.');
  }

  // 1. Create user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Update display name in Firebase Auth
  await updateProfile(user, { displayName: name });

  // 3. Determine role (Admin or Customer)
  const role = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer';

  // 4. Save user profile in Firestore "users" collection
  const userDocRef = doc(db, 'users', user.uid);
  const userData = {
    uid: user.uid,
    name,
    phone,
    email: email.toLowerCase(),
    role,
    createdAt: new Date().toISOString(),
  };

  await setDoc(userDocRef, userData);
  return userData;
}

/**
 * Sign in user (Customer or Admin)
 */
export async function loginUser(email, password) {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase credentials not configured yet. Please add them to .env file.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Fetch role and details from Firestore
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      return userSnap.data();
    }
  } catch (err) {
    console.warn('Could not read user document from Firestore:', err);
  }

  // Fallback if doc doesn't exist yet
  const role = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer';
  return {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email,
    role,
  };
}

/**
 * Sign out current user
 */
export async function logoutUser() {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthListener(callback) {
  if (!isFirebaseConfigured || !auth) {
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    try {
      if (db) {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          callback(userSnap.data());
          return;
        }
      }
    } catch (e) {
      console.warn('Error fetching Firestore user profile:', e);
    }

    const role = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer';
    callback({
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email,
      role,
    });
  });
}

// ============================================
// 2. MENU (PRODUCTS) SERVICES
// ============================================

/**
 * Subscribe to live changes in the "menu" collection
 */
export function subscribeMenu(onUpdate, onError) {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  try {
    const menuCol = collection(db, 'menu');
    return onSnapshot(
      menuCol,
      (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        onUpdate(items);
      },
      (error) => {
        console.warn('Error fetching menu from Firestore (check Security Rules):', error);
        if (onError) onError(error);
      }
    );
  } catch (e) {
    console.warn('Firestore menu subscription error:', e);
    return () => {};
  }
}

/**
 * Add a new item to "menu" collection
 */
export async function addMenuItem(itemData) {
  if (!db) throw new Error('Firestore not initialized');
  const customId = itemData.id || `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const itemDocRef = doc(db, 'menu', customId);
  const data = {
    ...itemData,
    id: customId,
    available: itemData.available ?? true,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(itemDocRef, data);
  return data;
}

/**
 * Update existing item in "menu" collection
 */
export async function updateMenuItem(itemId, updates) {
  if (!db) throw new Error('Firestore not initialized');
  const itemDocRef = doc(db, 'menu', itemId);
  await updateDoc(itemDocRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete item from "menu" collection
 */
export async function deleteMenuItem(itemId) {
  if (!db) throw new Error('Firestore not initialized');
  const itemDocRef = doc(db, 'menu', itemId);
  await deleteDoc(itemDocRef);
}

// ============================================
// 3. TESTIMONIALS SERVICES
// ============================================

/**
 * Subscribe to live changes in "testimonials" collection
 */
export function subscribeTestimonials(onUpdate, onError) {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  try {
    const testCol = collection(db, 'testimonials');
    return onSnapshot(
      testCol,
      (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        onUpdate(items);
      },
      (error) => {
        console.warn('Error fetching testimonials from Firestore (check Security Rules):', error);
        if (onError) onError(error);
      }
    );
  } catch (e) {
    console.warn('Firestore testimonials subscription error:', e);
    return () => {};
  }
}

/**
 * Add a testimonial
 */
export async function addTestimonial(testimonialData) {
  if (!db) throw new Error('Firestore not initialized');
  const customId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const docRef = doc(db, 'testimonials', customId);
  const data = {
    ...testimonialData,
    id: customId,
    visible: testimonialData.visible ?? true,
    createdAt: new Date().toISOString(),
  };
  await setDoc(docRef, data);
  return data;
}

/**
 * Update a testimonial
 */
export async function updateTestimonial(testimonialId, updates) {
  if (!db) throw new Error('Firestore not initialized');
  const docRef = doc(db, 'testimonials', testimonialId);
  await updateDoc(docRef, updates);
}

/**
 * Delete a testimonial
 */
export async function deleteTestimonial(testimonialId) {
  if (!db) throw new Error('Firestore not initialized');
  const docRef = doc(db, 'testimonials', testimonialId);
  await deleteDoc(docRef);
}

// ============================================
// 4. ORDERS SERVICES
// ============================================

/**
 * Subscribe to orders for Admin in real-time
 */
export function subscribeOrders(onUpdate) {
  if (!isFirebaseConfigured || !db) return () => {};

  try {
    const ordersCol = collection(db, 'orders');
    return onSnapshot(ordersCol, (snapshot) => {
      const orders = [];
      snapshot.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...docSnap.data() });
      });
      orders.sort((a, b) => new Date(b.placedAt || 0) - new Date(a.placedAt || 0));
      onUpdate(orders);
    }, (err) => {
      console.warn('Orders subscription error:', err);
    });
  } catch (e) {
    console.warn('Orders subscription failed:', e);
    return () => {};
  }
}

/**
 * Save new order to Firestore
 */
export async function saveOrderToFirestore(orderData) {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const orderId = orderData.id || `ORD-${Date.now().toString(36).toUpperCase()}`;
    const docRef = doc(db, 'orders', orderId);
    const data = { ...orderData, id: orderId };
    await setDoc(docRef, data);
    return data;
  } catch (err) {
    console.warn('Could not save order to Firestore:', err);
    return null;
  }
}

/**
 * Update order status in Firestore
 */
export async function updateOrderStatusInFirestore(orderId, status) {
  if (!isFirebaseConfigured || !db) return;
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status });
  } catch (err) {
    console.warn('Could not update order status in Firestore:', err);
  }
}

/**
 * Subscribe to a single order for real-time tracking
 */
export function subscribeSingleOrder(orderId, onUpdate, onError) {
  if (!isFirebaseConfigured || !db || !orderId) return () => {};

  try {
    const docRef = doc(db, 'orders', orderId);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate({ id: docSnap.id, ...docSnap.data() });
        } else {
          onUpdate(null);
        }
      },
      (err) => {
        console.warn(`Firestore real-time tracking error for ${orderId}:`, err);
        if (onError) onError(err);
      }
    );
  } catch (e) {
    console.warn('Real-time order subscription failed:', e);
    return () => {};
  }
}

/**
 * Fetch a single order by ID from Firestore
 */
export async function fetchOrderById(orderId) {
  if (!isFirebaseConfigured || !db || !orderId) return null;
  try {
    const docRef = doc(db, 'orders', orderId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (err) {
    console.warn(`Could not fetch order ${orderId} from Firestore:`, err);
    return null;
  }
}
