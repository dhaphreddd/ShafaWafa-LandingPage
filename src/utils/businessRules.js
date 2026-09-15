import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Business Rules Engine for SIMAYA
 * Enforces constraints from PRD v2.0
 */

/**
 * Rule 1: Registration - Member must be 'active' to register for events
 * @returns {{ allowed: boolean, reason: string }}
 */
export async function canRegisterForEvent(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return { allowed: false, reason: "Akun tidak ditemukan." };
    }
    const userData = userDoc.data();
    if (userData.status !== "active") {
      return { allowed: false, reason: `Akun Anda berstatus "${userData.status}". Hanya akun aktif yang dapat mendaftar kegiatan.` };
    }
    return { allowed: true, reason: "" };
  } catch (error) {
    console.error("Business rule check failed:", error);
    return { allowed: false, reason: "Gagal memeriksa status akun." };
  }
}

/**
 * Rule 2: Quota - If event quota reached, registration auto-closes
 * @returns {{ allowed: boolean, reason: string, currentCount: number, quota: number }}
 */
export async function checkEventQuota(eventId) {
  try {
    const eventDoc = await getDoc(doc(db, "events", eventId));
    if (!eventDoc.exists()) {
      return { allowed: false, reason: "Kegiatan tidak ditemukan.", currentCount: 0, quota: 0 };
    }
    const eventData = eventDoc.data();
    const quota = eventData.quota || 0; // 0 = unlimited

    if (quota === 0) {
      return { allowed: true, reason: "", currentCount: 0, quota: 0 };
    }

    const regsQuery = query(
      collection(db, "eventRegistrations"),
      where("eventId", "==", eventId),
      where("status", "in", ["pending", "approved"])
    );
    const regsSnap = await getDocs(regsQuery);
    const currentCount = regsSnap.size;

    if (currentCount >= quota) {
      return { allowed: false, reason: `Kuota kegiatan telah penuh (${currentCount}/${quota}). Pendaftaran ditutup.`, currentCount, quota };
    }
    return { allowed: true, reason: "", currentCount, quota };
  } catch (error) {
    console.error("Quota check failed:", error);
    return { allowed: false, reason: "Gagal memeriksa kuota.", currentCount: 0, quota: 0 };
  }
}

/**
 * Rule 3: Donation totals - Only 'verified' donations counted
 * @returns {number} Total verified donation amount
 */
export async function getTotalVerifiedDonations() {
  try {
    const q = query(collection(db, "donations"), where("status", "==", "verified"));
    const snap = await getDocs(q);
    return snap.docs.reduce((sum, d) => sum + Number(d.data().amount || 0), 0);
  } catch (error) {
    console.error("Failed to calculate verified donations:", error);
    return 0;
  }
}

/**
 * Rule 4: Edit profile - Member can only edit own profile
 * @returns {{ allowed: boolean, reason: string }}
 */
export function canEditProfile(currentUserId, targetUserId, currentUserRole) {
  if (currentUserRole === "superadmin" || currentUserRole === "admin") {
    return { allowed: true, reason: "" };
  }
  if (currentUserId === targetUserId) {
    return { allowed: true, reason: "" };
  }
  return { allowed: false, reason: "Anda hanya dapat mengedit profil milik Anda sendiri." };
}

/**
 * Rule 5: Approval permissions - Staff can process registrations but NOT verified donations
 * @returns {{ allowed: boolean, reason: string }}
 */
export function canProcessAction(userRole, module, currentStatus) {
  const roleLevel = { superadmin: 100, admin: 80, staff: 60, member: 10 };
  const level = roleLevel[userRole] || 0;

  // Staff (level 60) can process registrations but not modify verified donations
  if (level === 60) {
    if (module === "donations" && currentStatus === "verified") {
      return { allowed: false, reason: "Staff tidak dapat mengubah donasi yang telah diverifikasi." };
    }
  }

  // Member (level 10) cannot process any admin actions
  if (level < 60) {
    return { allowed: false, reason: "Anda tidak memiliki akses untuk melakukan aksi ini." };
  }

  return { allowed: true, reason: "" };
}

/**
 * Validate file upload
 * @returns {{ valid: boolean, reason: string }}
 */
export function validateFileUpload(file, options = {}) {
  const {
    maxSizeMB = 5,
    allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
  } = options;

  if (!file) {
    return { valid: false, reason: "File tidak ditemukan." };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, reason: `Tipe file "${file.type}" tidak diizinkan. Format yang diizinkan: ${allowedTypes.join(", ")}` };
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, reason: `Ukuran file ${(file.size / 1048576).toFixed(1)}MB melebihi batas ${maxSizeMB}MB.` };
  }

  return { valid: true, reason: "" };
}

/**
 * Validate donation amount
 * @returns {{ valid: boolean, reason: string }}
 */
export function validateDonationAmount(amount) {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) {
    return { valid: false, reason: "Nominal donasi harus lebih dari 0." };
  }
  if (num < 10000) {
    return { valid: false, reason: "Nominal donasi minimal Rp 10.000." };
  }
  if (num > 100000000) {
    return { valid: false, reason: "Nominal donasi maksimal Rp 100.000.000. Hubungi admin untuk donasi lebih besar." };
  }
  return { valid: true, reason: "" };
}

/**
 * Validate registration form
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateRegistrationForm(formData) {
  const errors = {};
  if (!formData.name?.trim()) errors.name = "Nama wajib diisi.";
  if (!formData.phone?.trim()) errors.phone = "Nomor HP wajib diisi.";
  if (formData.phone && !/^08\d{8,13}$/.test(formData.phone.replace(/[\s-]/g, ""))) {
    errors.phone = "Format nomor HP tidak valid (contoh: 081234567890).";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Get all active rules for display/debugging
 */
export function getAllRules() {
  return [
    { id: "R001", name: "Status Akun Aktif", description: "Member harus berstatus 'active' untuk mendaftar kegiatan.", module: "registration" },
    { id: "R002", name: "Kuota Kegiatan", description: "Pendaftaran otomatis ditutup jika kuota tercapai.", module: "registration" },
    { id: "R003", name: "Donasi Verified Only", description: "Hanya donasi berstatus 'verified' yang dihitung dalam total.", module: "donation" },
    { id: "R004", name: "Edit Profil Sendiri", description: "Member hanya dapat mengedit profil miliknya sendiri.", module: "profile" },
    { id: "R005", name: "Staff Restriction", description: "Staff tidak dapat mengubah donasi yang sudah verified.", module: "donation" },
    { id: "R006", name: "File Validation", description: "Upload dibatasi: JPG/PNG/WebP/PDF, maks 5MB.", module: "media" },
    { id: "R007", name: "Donation Amount Range", description: "Donasi minimal Rp 10.000, maksimal Rp 100.000.000.", module: "donation" },
    { id: "R008", name: "Phone Validation", description: "Nomor HP harus format Indonesia (08xxxxxxxxxx).", module: "registration" },
  ];
}
