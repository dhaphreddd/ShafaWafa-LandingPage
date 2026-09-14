import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  orderBy, 
  writeBatch 
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import seedData from "./landing_data_seed.json";

// Firebase Config
// Loaded from environment variables, with hardcoded fallback for seamless deployment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyALxfbyqsioYm48tXmuplQVm3Btaj0M_Cg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shafawafa-landingpage.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shafawafa-landingpage",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shafawafa-landingpage.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "311793646236",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:311793646236:web:6771d43a580766b81f0b59"
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.authDomain
);

let app, auth, db, storage;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase is not fully configured. Using fallback local JSON seed data.");
}

export { auth, db, storage };

// SIMAYA SYSTEM COLLECTIONS (no seed fallback - live data)
export const SYSTEM_COLLECTIONS = {
  USERS: 'users',
  EVENTS: 'events',
  REGISTRATIONS: 'eventRegistrations',
  DONATIONS: 'donations',
  PAYMENT_METHODS: 'paymentMethods',
  COST_CENTERS: 'costCenters',
  EVENT_CATEGORIES: 'eventCategories',
};

// HELPER: Fetch live collection (no seed fallback)
export async function getLiveCollection(collectionName, orderField = 'createdAt', orderDir = 'desc') {
  if (!isFirebaseConfigured || !db) return [];
  try {
    let q;
    if (orderField) {
      q = query(collection(db, collectionName), orderBy(orderField, orderDir));
    } else {
      q = query(collection(db, collectionName));
    }
    const snapshot = await getDocs(q);
    const data = [];
    snapshot.forEach(docSnap => {
      data.push({ id: docSnap.id, ...docSnap.data() });
    });
    return data;
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
}

// HELPER FUNCTION: Fetch Collection with local fallback
export async function getCollectionData(collectionName, defaultTable) {
  if (!isFirebaseConfigured || !db) {
    return seedData[defaultTable] || [];
  }
  try {
    const q = query(collection(db, collectionName));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      // If Firestore collection is empty, fall back to seed data
      return seedData[defaultTable] || [];
    }
    const data = [];
    snapshot.forEach(docSnap => {
      data.push({ id: docSnap.id, ...docSnap.data() });
    });
    // Sort by urutan or id if available
    return data.sort((a, b) => {
      if (a.urutan !== undefined && b.urutan !== undefined) {
        return a.urutan - b.urutan;
      }
      return (a.id > b.id) ? 1 : -1;
    });
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return seedData[defaultTable] || [];
  }
}

// HELPER FUNCTION: Fetch Site Settings key-value pairs
export async function getSiteSettings() {
  const defaultSettingsObj = {};
  if (seedData.site_settings) {
    seedData.site_settings.forEach(item => {
      defaultSettingsObj[item.key] = item.value;
    });
  }

  if (!isFirebaseConfigured || !db) {
    return defaultSettingsObj;
  }

  try {
    const docRef = doc(db, "settings", "site_config");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...defaultSettingsObj, ...docSnap.data() };
    } else {
      return defaultSettingsObj;
    }
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return defaultSettingsObj;
  }
}

// SEED DATABASE UTILITY
export async function seedFirestoreDatabase() {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase is not configured. Cannot seed database.");
  }

  try {
    // 1. Seed Site Settings
    const settingsRef = doc(db, "settings", "site_config");
    const settingsData = {};
    seedData.site_settings.forEach(item => {
      settingsData[item.key] = item.value;
    });
    await setDoc(settingsRef, settingsData);

    // Helper function to seed an array of items
    const seedTable = async (tableName, collectionName) => {
      const items = seedData[tableName] || [];
      for (const item of items) {
        // Use database ID as Firestore document ID to preserve relationships
        const docId = String(item.id);
        const itemCopy = { ...item };
        delete itemCopy.id; // Remove ID since it will be the doc name
        await setDoc(doc(db, collectionName, docId), itemCopy);
      }
    };

    // Seed all collections
    await seedTable("landing_hero_stats", "heroStats");
    await seedTable("landing_nilais", "nilais");
    await seedTable("landing_kegiatans", "kegiatans");
    await seedTable("landing_artikels", "artikels");
    await seedTable("landing_videos", "videos");
    await seedTable("landing_sosials", "sosials");
    await seedTable("landing_misis", "misis");
    await seedTable("landing_strukturs", "strukturs");
    await seedTable("landing_tentang_features", "tentangFeatures");
    await seedTable("landing_hero_slides", "heroSlides");
    await seedTable("landing_sejarahs", "sejarahs");

    // Special handling for galeri_events and galeri_photos relation
    // We will group photos by event_id and embed them directly inside the galeriEvents document
    const events = seedData.landing_galeri_events || [];
    const photos = seedData.landing_galeri_photos || [];

    for (const event of events) {
      const eventId = event.id;
      const eventPhotos = photos
        .filter(p => p.event_id === eventId)
        .map(p => ({
          image_path: p.image_path,
          caption: p.caption,
          is_thumbnail: !!p.is_thumbnail,
          urutan: p.urutan || 0
        }));

      const eventData = {
        title: event.title,
        description: event.description || "",
        is_active: !!event.is_active,
        urutan: event.urutan || 0,
        photos: eventPhotos
      };

      await setDoc(doc(db, "galeriEvents", String(eventId)), eventData);
    }

    return true;
  } catch (error) {
    console.error("Failed to seed Firestore:", error);
    throw error;
  }
}

// ==================== SIMAYA DATABASE SEED ====================

export async function seedSimayaDatabase() {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase is not configured. Cannot seed SIMAYA data.");
  }

  try {
    // 1. Create default admin user (if not exists)
    const superAdminId = "superadmin_001";
    const adminRef = doc(db, "users", superAdminId);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        name: "Super Admin",
        email: "superadmin@simaya.id",
        role: "superadmin",
        status: "active",
        permissions: ["*"],
        createdAt: new Date().toISOString()
      });
      console.log("✓ Created superadmin user");
    }

    // 2. Create payment methods
    const paymentMethods = [
      { id: "pm001", name: "Bank BCA", accountNumber: "1234567890", accountName: "Yayasan Ahlus Shafa Wal Wafa", isActive: true },
      { id: "pm002", name: "Bank Mandiri", accountNumber: "9876543210", accountName: "Yayasan Ahlus Shafa Wal Wafa", isActive: true },
      { id: "pm003", name: "QRIS", qrCode: "simaya_qr.png", isActive: true }
    ];
    for (const pm of paymentMethods) {
      const ref = doc(db, "paymentMethods", pm.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) await setDoc(ref, pm);
    }
    console.log("✓ Created payment methods");

    // 3. Create cost centers
    const costCenters = [
      { id: "cc001", name: "Umum", code: "UMUM", isActive: true },
      { id: "cc002", name: "Pendidikan", code: "PEND", isActive: true },
      { id: "cc003", name: "Sosial", code: "SOSIAL", isActive: true },
      { id: "cc004", name: "Pembangunan", code: "BANG", isActive: true }
    ];
    for (const cc of costCenters) {
      const ref = doc(db, "costCenters", cc.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) await setDoc(ref, cc);
    }
    console.log("✓ Created cost centers");

    // 4. Create sample events
    const events = [
      { id: "evt001", title: "Majelis Reboan Agung", description: "Pengajian rutin setiap Rabu malam", startDate: "2026-09-17", endDate: "2026-09-17", jadwal: "Setiap Rabu Malam", status: "aktif", is_active: true },
      { id: "evt002", title: "Istighasah As-Shafa", description: "Doa bersama untuk keberkahan", startDate: "2026-09-18", endDate: "2026-09-18", jadwal: "Jumat Wage", status: "aktif", is_active: true }
    ];
    for (const evt of events) {
      const ref = doc(db, "events", evt.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) await setDoc(ref, evt);
    }
    console.log("✓ Created sample events");

    // 5. Create sample registrations
    const registrations = [
      { id: "reg001", eventId: "evt001", userId: "user001", status: "pending", registeredAt: new Date().toISOString() },
      { id: "reg002", eventId: "evt002", userId: "user002", status: "approved", registeredAt: new Date().toISOString() }
    ];
    for (const reg of registrations) {
      const ref = doc(db, "eventRegistrations", reg.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) await setDoc(ref, reg);
    }
    console.log("✓ Created sample registrations");

    // 6. Create sample donations
    const donations = [
      { id: "don001", userId: "user001", amount: 250000, method: "Bank BCA", costCenter: "cc001", status: "verified", submittedAt: "2026-09-10" },
      { id: "don002", userId: "user002", amount: 100000, method: "QRIS", costCenter: "cc003", status: "pending", submittedAt: "2026-09-12" },
      { id: "don003", userId: "user003", amount: 500000, method: "Bank Mandiri", costCenter: "cc004", status: "rejected", submittedAt: "2026-09-08" }
    ];
    for (const don of donations) {
      const ref = doc(db, "donations", don.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) await setDoc(ref, don);
    }
    console.log("✓ Created sample donations");

    return true;
  } catch (error) {
    console.error("Failed to seed SIMAYA database:", error);
    throw error;
  }
}

// ==================== SIMAYA SYSTEM HELPERS ====================

// --- USERS ---
export async function createUserProfile(uid, data) {
  if (!db) throw new Error('Firebase not configured');
  await setDoc(doc(db, SYSTEM_COLLECTIONS.USERS, uid), { ...data, createdAt: new Date().toISOString() });
}

export async function updateUserRole(uid, role, permissions = []) {
  if (!db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, SYSTEM_COLLECTIONS.USERS, uid), { role, permissions, updatedAt: new Date().toISOString() });
}

export async function getAllUserProfiles() {
  return getLiveCollection(SYSTEM_COLLECTIONS.USERS);
}

// --- EVENTS ---
export async function createEvent(data) {
  if (!db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, SYSTEM_COLLECTIONS.EVENTS), { ...data, createdAt: new Date().toISOString() });
  return docRef.id;
}

export async function updateEvent(eventId, data) {
  if (!db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, SYSTEM_COLLECTIONS.EVENTS, eventId), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteEvent(eventId) {
  if (!db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, SYSTEM_COLLECTIONS.EVENTS, eventId));
}

export async function getAllEvents() {
  return getLiveCollection(SYSTEM_COLLECTIONS.EVENTS, 'startDate', 'asc');
}

// --- EVENT REGISTRATIONS ---
export async function registerForEvent(userId, eventId, data) {
  if (!db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, SYSTEM_COLLECTIONS.REGISTRATIONS), {
    userId, eventId, ...data, status: 'pending', registeredAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function approveRegistration(regId, approvedBy) {
  if (!db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, SYSTEM_COLLECTIONS.REGISTRATIONS, regId), {
    status: 'approved', approvedBy, approvedAt: new Date().toISOString(),
  });
}

export async function rejectRegistration(regId, rejectedBy, reason = '') {
  if (!db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, SYSTEM_COLLECTIONS.REGISTRATIONS, regId), {
    status: 'rejected', rejectedBy, reason, rejectedAt: new Date().toISOString(),
  });
}

export async function getRegistrationsByEvent(eventId) {
  return getLiveCollection(SYSTEM_COLLECTIONS.REGISTRATIONS);
}

// --- DONATIONS ---
export async function createDonation(data) {
  if (!db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, SYSTEM_COLLECTIONS.DONATIONS), {
    ...data, status: 'pending', submittedAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function verifyDonation(donId, verifiedBy) {
  if (!db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, SYSTEM_COLLECTIONS.DONATIONS, donId), {
    status: 'verified', verifiedBy, verifiedAt: new Date().toISOString(),
  });
}

export async function rejectDonation(donId, rejectedBy, reason = '') {
  if (!db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, SYSTEM_COLLECTIONS.DONATIONS, donId), {
    status: 'rejected', rejectedBy, reason, rejectedAt: new Date().toISOString(),
  });
}

export async function getAllDonations() {
  return getLiveCollection(SYSTEM_COLLECTIONS.DONATIONS, 'submittedAt', 'desc');
}

// --- PAYMENT METHODS ---
export async function createPaymentMethod(data) {
  if (!db) throw new Error('Firebase not configured');
  await addDoc(collection(db, SYSTEM_COLLECTIONS.PAYMENT_METHODS), { ...data, isActive: true });
}

export async function getAllPaymentMethods() {
  return getLiveCollection(SYSTEM_COLLECTIONS.PAYMENT_METHODS);
}

// --- COST CENTERS ---
export async function createCostCenter(data) {
  if (!db) throw new Error('Firebase not configured');
  await addDoc(collection(db, SYSTEM_COLLECTIONS.COST_CENTERS), { ...data, isActive: true });
}

export async function getAllCostCenters() {
  return getLiveCollection(SYSTEM_COLLECTIONS.COST_CENTERS);
}

// --- EVENT CATEGORIES ---
export async function createEventCategory(data) {
  if (!db) throw new Error('Firebase not configured');
  await addDoc(collection(db, SYSTEM_COLLECTIONS.EVENT_CATEGORIES), { ...data, isActive: true });
}

export async function getAllEventCategories() {
  return getLiveCollection(SYSTEM_COLLECTIONS.EVENT_CATEGORIES);
}
