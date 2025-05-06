/**
 * سكريبت تنظيف قاعدة بيانات Firestore من جميع البيانات التجريبية
 * يحافظ فقط على بيانات مسؤول النظام (admin@alsaadtravels.com)
 * يجب تشغيل السكريبت من مجلد project بعد تثبيت firebase-admin
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const ADMIN_EMAIL = 'admin@alsaadtravels.com';
const USERS_COLLECTION = 'users';

async function cleanCollection(collectionName, preserveDocIds = []) {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.forEach(doc => {
    if (!preserveDocIds.includes(doc.id)) {
      batch.delete(doc.ref);
    }
  });
  await batch.commit();
}

async function getAdminDocId() {
  const usersSnapshot = await db.collection(USERS_COLLECTION).where('email', '==', ADMIN_EMAIL).get();
  if (usersSnapshot.empty) {
    throw new Error('لم يتم العثور على حساب مسؤول النظام!');
  }
  return usersSnapshot.docs[0].id;
}

async function cleanAll() {
  // 1. احفظ معرف المسؤول
  const adminId = await getAdminDocId();

  // 2. حذف جميع المستخدمين ما عدا المسؤول
  await cleanCollection(USERS_COLLECTION, [adminId]);

  // 3. حذف جميع المجموعات الأخرى
  const collections = await db.listCollections();
  for (const col of collections) {
    if (col.id !== USERS_COLLECTION) {
      await cleanCollection(col.id);
    }
  }

  console.log('تم تنظيف قاعدة البيانات بنجاح مع الحفاظ على حساب المسؤول فقط.');
  process.exit(0);
}

cleanAll().catch(err => {
  console.error('حدث خطأ أثناء التنظيف:', err);
  process.exit(1);
});
