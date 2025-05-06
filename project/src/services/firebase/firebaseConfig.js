// استيراد المكتبات اللازمة
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  limit, 
  deleteDoc, 
  updateDoc, 
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  addDoc,
  getFirestore
} from 'firebase/firestore';
import { validateInputs, handleFirebaseError } from '../../utils/firebaseUtils';
import { getApp } from 'firebase/app';

// استخدام تطبيق Firebase الموجود بالفعل
if (import.meta.env.DEV) {
  console.log('استخدام تطبيق Firebase الموجود...');
}
const app = getApp();

// الحصول على Firestore الموجود بالفعل
const db = getFirestore(app);

// تهيئة المصادقة
const auth = getAuth(app);

// تسجيل معلومات التكوين للتشخيص
if (import.meta.env.DEV) {
  console.log('معلومات تكوين Firebase (من الخدمة):', {
    appInitialized: app ? '✓' : '✗',
    dbInitialized: db ? '✓' : '✗',
    authInitialized: auth ? '✓' : '✗'
  });
}

// دالة تسجيل الدخول
const signIn = async (email, password) => {
  try {
    if (import.meta.env.DEV) {
      console.log('محاولة تسجيل الدخول:', { email });
    }
    
    // التحقق من صحة المدخلات
    const validationResult = validateInputs({ email, password });
    if (!validationResult.isValid) {
      return { success: false, error: Object.values(validationResult.errors)[0] };
    }
    
    // البحث عن المستخدم في جدول users باستخدام البريد الإلكتروني
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', validationResult.sanitizedInputs.email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('لم يتم العثور على مستخدم بهذا البريد الإلكتروني');
      return { 
        success: false, 
        error: 'لم يتم العثور على مستخدم بهذا البريد الإلكتروني. يرجى التواصل مع مسؤول النظام للحصول على حساب.' 
      };
    }
    
    // محاولة تسجيل الدخول باستخدام Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, validationResult.sanitizedInputs.email, validationResult.sanitizedInputs.password);
    const user = userCredential.user;
    
    // جلب بيانات المستخدم من Firestore
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    // التحقق من حالة المستخدم
    if (!userData.isActive) {
      await signOut(auth);
      return { 
        success: false, 
        error: 'تم تعطيل هذا الحساب. يرجى التواصل مع مسؤول النظام.' 
      };
    }
    
    // إرجاع بيانات المستخدم
    return { 
      success: true, 
      user: {
        uid: user.uid,
        email: user.email,
        ...userData
      }
    };
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    return { 
      success: false, 
      error: handleFirebaseError(error)
    };
  }
};

// دالة تسجيل الخروج
const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    return { success: false, error: handleFirebaseError(error) };
  }
};

// دالة إعادة تعيين كلمة المرور
const resetPassword = async (email) => {
  try {
    const validationResult = validateInputs({ email });
    if (!validationResult.isValid) {
      return { success: false, error: Object.values(validationResult.errors)[0] };
    }
    
    await sendPasswordResetEmail(auth, validationResult.sanitizedInputs.email);
    return { success: true };
  } catch (error) {
    console.error('خطأ في إعادة تعيين كلمة المرور:', error);
    return { success: false, error: handleFirebaseError(error) };
  }
};

// دالة الحصول على بيانات المستخدم
const getUserData = async (uid) => {
  try {
    if (!uid) {
      console.error('لم يتم توفير معرف المستخدم');
      return null;
    }
    
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      return { id: uid, ...userDoc.data() };
    } else {
      console.error('لم يتم العثور على بيانات المستخدم');
      return null;
    }
  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error);
    return null;
  }
};

// دالة تحديث بيانات المستخدم
const updateUser = async (uid, userData) => {
  try {
    if (!uid) {
      return { success: false, error: 'لم يتم توفير معرف المستخدم' };
    }
    
    // تحديث البيانات في Firestore
    await updateDoc(doc(db, 'users', uid), {
      ...userData,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في تحديث بيانات المستخدم:', error);
    return { success: false, error: handleFirebaseError(error) };
  }
};

// تصدير الكائنات والدوال
const firebaseServices = {
  app,
  auth,
  db,
  signIn,
  signOut: signOutUser,
  resetPassword,
  getUserData,
  updateUser
};

export default firebaseServices;
