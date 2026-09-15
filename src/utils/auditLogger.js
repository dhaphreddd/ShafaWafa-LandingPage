import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Log audit actions to Firestore
 * @param {string} userId - ID of admin performing action
 * @param {string} action - 'create' | 'update' | 'delete'
 * @param {string} module - e.g., 'donations', 'registrations'
 * @param {string} recordId - ID of affected record
 * @param {object} oldValue - Value before change
 * @param {object} newValue - Value after change
 */
export async function logAudit(userId, action, module, recordId, oldValue, newValue) {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      userId,
      action,
      module,
      recordId,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}
