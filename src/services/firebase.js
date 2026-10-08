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
  serverTimestamp,
  deleteDoc,
  onSnapshot,
  query,
  where,
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

  // 4. Save user profile in Firestore "users" collection
  const userDocRef = doc(db, 'users', user.uid);
  const userData = {
    uid: user.uid,
    name,
    phone,
    email: email.toLowerCase(),
    role: 'customer',
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
      const profile = userSnap.data();
      return {
        ...profile,
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
          ? 'admin'
          : (profile.role || 'customer'),
      };
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
    emailVerified: user.emailVerified,
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

  let cancelled = false;

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    try {
      if (db) {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        // Guard: if signed out during the async fetch, don't dispatch
        if (cancelled || !auth.currentUser) return;
        if (userSnap.exists()) {
          const profile = userSnap.data();
          callback({
            ...profile,
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            role: user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
              ? 'admin'
              : (profile.role || 'customer'),
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Error fetching Firestore user profile:', e);
    }

    // Guard: if signed out during the async operations, don't dispatch
    if (cancelled || !auth.currentUser) return;

    const role = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer';
    callback({
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email,
      emailVerified: user.emailVerified,
      role,
    });
  });

  return () => {
    cancelled = true;
    unsubscribe();
  };
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
export function subscribeTestimonials(onUpdate, onError, includeHidden = false) {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  try {
    const testCol = collection(db, 'testimonials');
    const visibleReviews = includeHidden ? testCol : query(testCol, where('visible', '==', true));
    return onSnapshot(
      visibleReviews,
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
 * Helper: Merge cancellation records into an array of orders
 */
function mergeCancellationsWithOrders(rawDocs) {
  const cancellations = new Map();
  const validOrders = [];

  for (const docData of rawDocs) {
    if (
      (docData.id && docData.id.startsWith('CANCEL_')) ||
      docData.type === 'cancellation'
    ) {
      const targetId = docData.targetOrderId || (docData.id ? docData.id.replace('CANCEL_', '') : '');
      if (targetId) {
        cancellations.set(targetId, docData);
      }
    } else {
      validOrders.push(docData);
    }
  }

  return validOrders.map((ord) => {
    const cancelInfo = cancellations.get(ord.id);
    if (cancelInfo) {
      return {
        ...ord,
        status: 'cancelled',
        cancelledBy: cancelInfo.cancelledBy || 'customer',
        cancelledAt: cancelInfo.cancelledAt || ord.cancelledAt || new Date().toISOString(),
        cancelReason: cancelInfo.cancelReason || ord.cancelReason || 'Cancelled by customer',
      };
    }
    return ord;
  });
}

/**
 * Subscribe to orders for Admin in real-time
 */
export function subscribeOrders(onUpdate) {
  if (!isFirebaseConfigured || !db) return () => {};

  try {
    const ordersCol = collection(db, 'orders');
    return onSnapshot(ordersCol, (snapshot) => {
      const rawDocs = [];
      snapshot.forEach((docSnap) => {
        rawDocs.push({ id: docSnap.id, ...docSnap.data() });
      });
      const orders = mergeCancellationsWithOrders(rawDocs);
      orders.sort((a, b) => new Date(b.placedAt || b.createdAt || 0) - new Date(a.placedAt || a.createdAt || 0));
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
 * Subscribe to orders for a specific customer in real-time
 */
export function subscribeCustomerOrders(userInfo, onUpdate, onError) {
  if (!isFirebaseConfigured || !db || !userInfo) return () => {};
  const uid = userInfo.uid;
  if (!uid || auth?.currentUser?.uid !== uid) return () => {};

  try {
    const ordersCol = collection(db, 'orders');
    const customerQuery = query(ordersCol, where('userId', '==', uid));
    return onSnapshot(
      customerQuery,
      (snapshot) => {
        const rawDocs = [];
        snapshot.forEach((docSnap) => {
          rawDocs.push({ id: docSnap.id, ...docSnap.data() });
        });
        const mergedOrders = mergeCancellationsWithOrders(rawDocs);

        mergedOrders.sort((a, b) => new Date(b.placedAt || b.createdAt || 0) - new Date(a.placedAt || a.createdAt || 0));
        onUpdate(mergedOrders);
      },
      (err) => {
        console.warn('Customer orders subscription error:', err);
        if (onError) onError(err);
      }
    );
  } catch (e) {
    console.warn('subscribeCustomerOrders error:', e);
    return () => {};
  }
}

/**
 * Fetch orders for a specific customer from Firestore
 */
export async function fetchCustomerOrders(userInfo) {
  if (!isFirebaseConfigured || !db || !userInfo?.uid || auth?.currentUser?.uid !== userInfo.uid) return [];

  try {
    const ordersCol = collection(db, 'orders');
    const snapshot = await getDocs(query(ordersCol, where('userId', '==', userInfo.uid)));
    const rawDocs = [];
    snapshot.forEach((docSnap) => {
      rawDocs.push({ id: docSnap.id, ...docSnap.data() });
    });
    const mergedOrders = mergeCancellationsWithOrders(rawDocs);

    mergedOrders.sort((a, b) => new Date(b.placedAt || b.createdAt || 0) - new Date(a.placedAt || a.createdAt || 0));
    return mergedOrders;
  } catch (err) {
    console.warn('fetchCustomerOrders error:', err);
    return [];
  }
}

/**
 * Save new order to Firestore
 */
export async function saveOrderToFirestore(orderData) {
  if (!auth?.currentUser && !orderData.userId) return orderData;
  if (!db || !auth?.currentUser || orderData.userId !== auth.currentUser.uid) {
    throw new Error('Sign in with a customer account to place an online order.');
  }
  const order = {
    ...orderData,
    userId: auth.currentUser.uid,
    status: 'pending_approval',
  };
  await setDoc(doc(db, 'orders', order.id), order);
  return order;
}

/**
 * Update order status in Firestore; security rules authorize the caller and allowed fields
 */
export async function updateOrderStatusInFirestore(orderId, status, extraFields = {}) {
  if (!isFirebaseConfigured || !db) return;
  if (!auth?.currentUser) throw new Error('Sign in to update an order.');
  const update = { status, updatedAt: serverTimestamp() };
  if (status === 'cancelled' && extraFields.cancelledBy === 'customer') {
    Object.assign(update, {
      cancelledBy: 'customer',
      cancelledAt: serverTimestamp(),
      cancelReason: extraFields.cancelReason || '',
    });
  } else if (status === 'cancelled') {
    Object.assign(update, {
      cancelledBy: 'admin',
      cancelledAt: serverTimestamp(),
      cancelReason: extraFields.cancelReason || '',
    });
  }
  await updateDoc(doc(db, 'orders', orderId), update);
}

/**
 * Subscribe to a single order for real-time tracking
 */
export function subscribeSingleOrder(orderId, userId, onUpdate, onError) {
  if (!isFirebaseConfigured || !db || !orderId || !userId || auth?.currentUser?.uid !== userId) return () => {};

  try {
    const docRef = doc(db, 'orders', orderId);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const orderData = { id: docSnap.id, ...docSnap.data() };
          if (orderData.userId === userId) onUpdate(orderData);
          else onUpdate(null);
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
export async function fetchOrderById(orderId, userId) {
  if (!isFirebaseConfigured || !db || !orderId || !userId || auth?.currentUser?.uid !== userId) return null;
  try {
    const docRef = doc(db, 'orders', orderId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const orderData = { id: snap.id, ...snap.data() };
      return orderData.userId === userId ? orderData : null;
    }
    return null;
  } catch (err) {
    console.warn(`Could not fetch order ${orderId} from Firestore:`, err);
    return null;
  }
}
