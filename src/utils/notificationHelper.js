import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';

/**
 * Create an in-app notification
 * @param {string} userId - Target user ID (or 'admin' for all admins)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - 'registration' | 'donation' | 'general'
 * @param {string} link - Optional link to navigate
 */
export async function createNotification(userId, title, message, type = "general", link = "") {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      title,
      message,
      type,
      link,
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Notify user about registration status change
 */
export async function notifyRegistrationStatus(userId, eventTitle, status, reason = "") {
  const messages = {
    approved: `Pendaftaran Anda untuk "${eventTitle}" telah disetujui.`,
    rejected: `Pendaftaran Anda untuk "${eventTitle}" ditolak.${reason ? ` Alasan: ${reason}` : ""}`,
    pending: `Pendaftaran Anda untuk "${eventTitle}" sedang dalam proses review.`
  };
  await createNotification(userId, "Status Pendaftaran", messages[status] || "Status pendaftaran diperbarui.", "registration", "/jamaah/my-events");
}

/**
 * Notify user about donation status change
 */
export async function notifyDonationStatus(userId, amount, status, reason = "") {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount);
  const messages = {
    verified: `Donasi ${formattedAmount} telah diverifikasi. Terima kasih atas donasi Anda.`,
    rejected: `Donasi ${formattedAmount} ditolak.${reason ? ` Alasan: ${reason}` : ""}`,
    pending: `Donasi ${formattedAmount} sedang dalam proses verifikasi.`
  };
  await createNotification(userId, "Status Donasi", messages[status] || "Status donasi diperbarui.", "donation", "/jamaah/donation-history");
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId) {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "in", [userId, "admin", "all"]),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId) {
  try {
    await updateDoc(doc(db, "notifications", notificationId), { read: true });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId) {
  try {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (error) {
    console.error("Failed to mark all as read:", error);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId) {
  try {
    await deleteDoc(doc(db, "notifications", notificationId));
  } catch (error) {
    console.error("Failed to delete notification:", error);
  }
}

/**
 * Get unread count for a user (realtime via onSnapshot)
 */
export function subscribeUnreadCount(userId, callback) {
  const q = query(
    collection(db, "notifications"),
    where("userId", "in", [userId, "admin", "all"]),
    where("read", "==", false)
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  });
}
