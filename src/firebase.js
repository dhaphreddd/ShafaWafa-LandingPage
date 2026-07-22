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
