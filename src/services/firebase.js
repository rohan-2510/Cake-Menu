// ============================================
// Firebase Service — Auth, Firestore & Realtime Sync
// ============================================
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
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
 * Sign in user (Admin login)
 */
export async function loginUser(email, password) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase credentials not configured yet. Please add them to .env file.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Determine role by email
  const role = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer';

  // Try fetching user profile from Firestore (optional, non-blocking)
  if (db) {
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
          role,
        };
      }
    } catch (err) {
      console.warn('Could not read user document from Firestore:', err);
    }
  }

  // Fallback if Firestore doc doesn't exist
  return {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Admin',
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
    // No Firebase — mark auth as ready immediately with no user
    callback(null);
    return () => {};
  }

  let cancelled = false;

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    const role = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer';

    // Try to get profile from Firestore
    if (db) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (cancelled || !auth.currentUser) return;
        if (userSnap.exists()) {
          const profile = userSnap.data();
          callback({
            ...profile,
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            role,
          });
          return;
        }
      } catch (e) {
        console.warn('Error fetching Firestore user profile:', e);
      }
    }

    if (cancelled || !auth.currentUser) return;

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
