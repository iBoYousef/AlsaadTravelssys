// سكريبت لإنشاء مستخدم تجريبي في Firebase Authentication و Firestore
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getFirestore, serverTimestamp } from 'firebase/firestore';
import app from '../firebase.jsx';

const auth = getAuth(app);
const db = getFirestore(app);

async function createTestUser() {
  const email = 'testuser2000@alsaad.com';
  const password = 'AAA';
  const employeeId = '2000';
  const name = 'مستخدم تجريبي';
  try {
    // إنشاء المستخدم في Firebase Authentication
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    // إضافة بيانات المستخدم في Firestore
    await setDoc(doc(db, 'users', uid), {
      email,
      employeeId,
      name,
      role: 'user',
      permissions: ['main_menu'],
      active: true,
      createdAt: serverTimestamp(),
      jobTitle: 'مستخدم تجريبي'
    });
    console.log('تم إنشاء المستخدم التجريبي بنجاح');
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('المستخدم التجريبي موجود بالفعل');
    } else {
      console.error('خطأ أثناء إنشاء المستخدم التجريبي:', error);
    }
  }
}

createTestUser();
