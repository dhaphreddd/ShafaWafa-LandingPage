import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';

/**
 * Role definitions with customizable permissions
 */
export const ROLES = {
  superadmin: {
    label: 'Super Admin',
    level: 100,
    permissions: ['*'], // all permissions
    color: '#ef4444',
    icon: 'fas fa-crown',
  },
  admin: {
    label: 'Admin',
    level: 80,
    permissions: [
      'manage_events', 'manage_registrations', 'manage_donations',
      'manage_users', 'view_reports', 'manage_cms',
    ],
    color: '#f59e0b',
    icon: 'fas fa-shield-alt',
  },
  staff: {
    label: 'Staff',
    level: 60,
    permissions: [
      'manage_events', 'manage_registrations', 'view_reports',
    ],
    color: '#3b82f6',
    icon: 'fas fa-user-tie',
  },
  member: {
    label: 'Anggota',
    level: 10,
    permissions: [
      'register_events', 'submit_donations', 'view_profile',
    ],
    color: '#10b981',
    icon: 'fas fa-user',
  },
};

/**
 * Default permission list for role manager UI
 */
export const ALL_PERMISSIONS = [
  { id: 'manage_cms', label: 'Kelola CMS Landing Page', group: 'CMS' },
  { id: 'manage_events', label: 'Kelola Kegiatan', group: 'Kegiatan' },
  { id: 'manage_registrations', label: 'Kelola Pendaftaran', group: 'Kegiatan' },
  { id: 'manage_donations', label: 'Kelola Donasi', group: 'Donasi' },
  { id: 'manage_users', label: 'Kelola Jamaah', group: 'User' },
  { id: 'view_reports', label: 'Lihat Laporan', group: 'Lainnya' },
  { id: 'register_events', label: 'Daftar Kegiatan', group: 'Member' },
  { id: 'submit_donations', label: 'Kirim Donasi', group: 'Member' },
  { id: 'view_profile', label: 'Lihat Profil', group: 'Member' },
];

/**
 * Get user profile from Firestore
 * @param {string} uid
 * @returns {object|null}
 */
export async function getUserProfile(uid) {
  if (!db) return null;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('getUserProfile error:', error);
    return null;
  }
}

/**
 * Create or update user profile
 * @param {string} uid
 * @param {object} data
 */
export async function upsertUserProfile(uid, data) {
  if (!db) throw new Error('Firebase not configured');
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error('upsertUserProfile error:', error);
    throw error;
  }
}

/**
 * Get all users
 * @returns {Array}
 */
export async function getAllUsers() {
  if (!db) return [];
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const users = [];
    snapshot.forEach(docSnap => {
      users.push({ id: docSnap.id, ...docSnap.data() });
    });
    return users;
  } catch (error) {
    console.error('getAllUsers error:', error);
    return [];
  }
}

/**
 * Update user role/status
 * @param {string} uid
 * @param {object} updates - { role, status, permissions }
 */
export async function updateUserProfile(uid, updates) {
  if (!db) throw new Error('Firebase not configured');
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('updateUserProfile error:', error);
    throw error;
  }
}

/**
 * Delete user profile
 * @param {string} uid
 */
export async function deleteUserProfile(uid) {
  if (!db) throw new Error('Firebase not configured');
  try {
    const docRef = doc(db, 'users', uid);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('deleteUserProfile error:', error);
    throw error;
  }
}

/**
 * Check if user has specific permission
 * @param {object} userRole - user's role object { role, permissions }
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(userRole, permission) {
  if (!userRole) return false;
  const roleConfig = ROLES[userRole.role];
  if (!roleConfig) return false;
  if (roleConfig.permissions.includes('*')) return true;
  if (roleConfig.level >= 80) return true; // admin & superadmin see all
  if (userRole.permissions && Array.isArray(userRole.permissions)) {
    return userRole.permissions.includes(permission);
  }
  return roleConfig.permissions.includes(permission);
}

/**
 * Check if user is admin (admin or superadmin)
 * @param {object} userRole
 * @returns {boolean}
 */
export function isAdmin(userRole) {
  if (!userRole) return false;
  return ['superadmin', 'admin'].includes(userRole.role);
}

/**
 * Check if user is superadmin
 * @param {object} userRole
 * @returns {boolean}
 */
export function isSuperAdmin(userRole) {
  return userRole?.role === 'superadmin';
}

/**
 * Get role display info
 * @param {string} roleKey
 * @returns {object}
 */
export function getRoleInfo(roleKey) {
  return ROLES[roleKey] || { label: roleKey, level: 0, color: '#6b7280', icon: 'fas fa-user' };
}
