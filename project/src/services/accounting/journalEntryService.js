// خدمة إدارة القيود اليومية
import { collection, addDoc, getDocs, query, where, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// إضافة قيد جديد
export async function addJournalEntry(entry) {
  entry.createdAt = Timestamp.now();
  entry.updatedAt = Timestamp.now();
  entry.status = 'open';
  const ref = await addDoc(collection(db, 'journal_entries'), entry);
  return ref.id;
}

// جلب كل القيود (مع فلاتر اختيارية)
export async function getJournalEntries({ branchId, fromDate, toDate, employeeName }) {
  let q = collection(db, 'journal_entries');
  // يمكن إضافة فلاتر حسب الحاجة
  // ...
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// جلب قيد واحد
export async function getJournalEntryById(id) {
  const ref = doc(db, 'journal_entries', id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// تحديث قيد
export async function updateJournalEntry(id, data) {
  const ref = doc(db, 'journal_entries', id);
  data.updatedAt = Timestamp.now();
  await updateDoc(ref, data);
}
