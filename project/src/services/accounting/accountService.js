// خدمة إدارة الحسابات المالية
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// إضافة حساب جديد
export async function addAccount(account) {
  const ref = await addDoc(collection(db, 'accounts'), account);
  return ref.id;
}

// جلب كل الحسابات
export async function getAccounts({ branchId, accountType } = {}) {
  let q = collection(db, 'accounts');
  // يمكن إضافة فلاتر حسب الحاجة
  // ...
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// جلب حساب واحد
export async function getAccountById(id) {
  const ref = doc(db, 'accounts', id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// تحديث حساب
export async function updateAccount(id, data) {
  const ref = doc(db, 'accounts', id);
  await updateDoc(ref, data);
}
