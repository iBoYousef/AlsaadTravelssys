// استيراد المكتبات اللازمة
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  connectAuthEmulator
} from 'firebase/auth';
import { 
  getFirestore, 
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
  enableIndexedDbPersistence,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { validateInputs, handleFirebaseError } from './utils';
import { getAppMode, APP_MODES, setAppMode, isTestMode } from './utils/appMode';

// استيراد تكوين البيئة والقيم الافتراضية
import { config } from './config/environment';


// استخدام القيم الثابتة الجديدة لتجنب مشكلة انتهاء صلاحية المفتاح
const firebaseConfig = {
  // تم تحديث المفتاح بتاريخ 29-04-2025 لحل مشكلة انتهاء الصلاحية
  apiKey: "AIzaSyA8y1d9dM0Kd8QQCq4DYwasJGOi4TH7dw8",
  authDomain: "alsaad-travels.firebaseapp.com",
  databaseURL: "https://alsaad-travels-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "alsaad-travels",
  storageBucket: "alsaad-travels.firebasestorage.app",
  messagingSenderId: "540254240658",
  appId: "1:540254240658:web:e03d46f94f7e7d2fb40b4b",
};

// التحقق من وجود مفتاح API صالح وإظهار رسالة خطأ مفصلة
if (!firebaseConfig.apiKey) {
  console.error('خطأ: مفتاح API لـ Firebase غير متوفر. تأكد من تعيين متغير البيئة VITE_FIREBASE_API_KEY.');
  console.error('تكوين Firebase الحالي:', JSON.stringify(firebaseConfig, null, 2));
  // تعيين قيمة افتراضية لمنع الانهيار الكامل
  firebaseConfig.apiKey = defaultConfig.firebase.apiKey;
}

// تسجيل معلومات التكوين للتشخيص
console.log('تهيئة Firebase...');

// تعريف المتغيرات الرئيسية خارج كتلة try/catch لتكون متاحة للتصدير
let app, db, auth, storage;

try {
  // تهيئة Firebase
  app = initializeApp(firebaseConfig);

  // تهيئة Firestore مع إعدادات التخزين المؤقت
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });

  // تهيئة المصادقة
  auth = getAuth(app);
  
  // تهيئة التخزين
  storage = getStorage(app);
  
  console.log('تم تهيئة Firebase بنجاح');
} catch (error) {
  console.error('فشل في تهيئة Firebase:', error);
  app = {};
  db = { collection: () => ({ doc: () => ({ get: async () => ({}) }) }) };
  auth = { onAuthStateChanged: () => {}, signInWithEmailAndPassword: async () => { throw new Error('فشل الاتصال بخدمة Firebase') } };
  storage = { ref: () => ({ put: async () => ({}) }) };
  console.error('فشل في تهيئة Firebase حتى مع القيم الافتراضية.');
}

// تسجيل معلومات التكوين للتشخيص في وضع التطوير فقط
if (import.meta.env.DEV) {
  console.log('معلومات تكوين Firebase:', {
    apiKey: firebaseConfig.apiKey ? '✓' : '✗',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    appInitialized: app ? '✓' : '✗',
    dbInitialized: db ? '✓' : '✗',
    authInitialized: auth ? '✓' : '✗'
  });
}

// إضافة مستمعي الأحداث للتشخيص
auth.onAuthStateChanged((user) => {
  if (import.meta.env.DEV) {
    console.log('تغيير حالة المصادقة:', user ? 'مسجل الدخول' : 'غير مسجل الدخول');
  }
});

// تعريف المسميات الوظيفية والصلاحيات
const jobTitles = {
  'مسؤول النظام': {
    role: 'admin',
    permissions: {
      create: true,
      read: true,
      update: true,
      delete: true,
      sections: ['all']
    }
  },
  'مدير عام': {
    role: 'general_manager',
    permissions: {
      create: true,
      read: true,
      update: true,
      delete: false,
      sections: ['all']
    }
  },
  'مدير تنفيذي': {
    role: 'executive_manager',
    permissions: {
      create: true,
      read: true,
      update: true,
      delete: false,
      sections: ['all']
    }
  },
  'مدير فرع': {
    role: 'branch_manager',
    permissions: {
      create: true,
      read: true,
      update: true,
      delete: false,
      sections: ['users', 'bookings', 'reports', 'customers']
    }
  },
  'مسؤول الشفت': {
    role: 'shift_supervisor',
    permissions: {
      create: true,
      read: true,
      update: false,
      delete: false,
      sections: ['bookings', 'customers']
    }
  },
  'موظف حجوزات': {
    role: 'booking_agent',
    permissions: {
      create: true,
      read: true,
      update: false,
      delete: false,
      sections: ['bookings', 'customers']
    }
  },
  'محاسب': {
    role: 'accountant',
    permissions: {
      create: true,
      read: true,
      update: false,
      delete: false,
      sections: ['finance', 'reports']
    }
  }
};

// دالة للحصول على صلاحيات المستخدم بناءً على المسمى الوظيفي
const getUserPermissions = (jobTitle) => {
  return jobTitles[jobTitle]?.permissions || {
    create: false,
    read: false,
    update: false,
    delete: false,
    sections: []
  };
};

// دوال التحقق من الصلاحيات
const checkPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  if (Array.isArray(user.permissions)) {
    return user.permissions.includes(permission) || user.permissions.includes('all');
  }
  return false;
};

const canAccessSection = (user, section) => {
  // سجلات تشخيصية
  console.log('التحقق من الوصول للقسم:', { user, section });
  
  if (!user) {
    console.log('لا يوجد مستخدم، رفض الوصول');
    return false;
  }
  
  // المشرف لديه وصول لجميع الأقسام
  if (user.isAdmin || user.role === 'admin' || (user.jobTitle && user.jobTitle === 'مسؤول النظام')) {
    console.log('المستخدم مشرف، السماح بالوصول');
    return true;
  }

  // التحقق من الصلاحيات المباشرة
  if (user.permissions && Array.isArray(user.permissions)) {
    // إذا كان المستخدم لديه صلاحية 'all'، فهو يملك جميع الصلاحيات
    if (user.permissions.includes('all')) {
      console.log('المستخدم لديه صلاحية all، السماح بالوصول');
      return true;
    }
    
    // التحقق من الصلاحيات الخاصة بالقسم
    const sectionPermissions = {
      dashboard: ['view_dashboard'],
      users: ['manage_users', 'view_users'],
      customers: ['manage_customers', 'view_customers'],
      flight_bookings: ['manage_flights', 'view_flights'],
      hotel_bookings: ['manage_hotels', 'view_hotels'],
      vehicle_bookings: ['manage_vehicles', 'view_vehicles'],
      event_bookings: ['manage_events', 'view_events'],
      visa_bookings: ['manage_visas', 'view_visas'],
      tourPackages: ['manage_tour_packages', 'view_tour_packages'],
      tour_packages: ['manage_tour_packages', 'view_tour_packages'],
      tour_bookings: ['manage_tour_bookings', 'view_tour_bookings'],
      receipts: ['manage_receipts', 'view_receipts'],
      accounting: ['manage_accounting', 'view_accounting'],
      reports: ['view_reports'],
      settings: ['manage_settings'],
      employees: ['manage_employees', 'view_employees']
    };
    
    // تحويل اسم القسم إلى صيغة موحدة للمقارنة
    const normalizedSection = section.replace(/-/g, '_').toLowerCase();
    
    // البحث عن الصلاحيات المطلوبة للقسم
    let requiredPermissions = sectionPermissions[section] || sectionPermissions[normalizedSection] || [];
    
    // إذا لم يتم العثور على صلاحيات محددة، نحاول البحث عن قسم مشابه
    if (requiredPermissions.length === 0) {
      // البحث عن قسم يحتوي على اسم القسم المطلوب
      for (const [key, permissions] of Object.entries(sectionPermissions)) {
        if (key.includes(normalizedSection) || normalizedSection.includes(key)) {
          requiredPermissions = permissions;
          console.log(`تم العثور على قسم مشابه: ${key} للقسم المطلوب: ${section}`);
          break;
        }
      }
    }
    
    if (requiredPermissions.length === 0) {
      console.log(`لا توجد صلاحيات مطلوبة للقسم: ${section}، منح وصول افتراضي في بيئة التطوير`);
      // منح وصول افتراضي في بيئة التطوير
      if (import.meta.env.DEV) {
        return true;
      }
      return false;
    }
    
    // التحقق من وجود أي من الصلاحيات المطلوبة
    const hasPermission = requiredPermissions.some(permission => user.permissions.includes(permission));
    console.log('نتيجة التحقق من الصلاحيات:', { hasPermission, requiredPermissions, userPermissions: user.permissions });
    return hasPermission;
  }

  // التحقق من الدور الوظيفي
  if (user.role) {
    // المدير لديه وصول لمعظم الأقسام ما عدا إدارة النظام
    if (user.role === 'manager') {
      const allowed = ![
        'admin',
        'settings'
      ].includes(section);
      console.log('المستخدم مدير، نتيجة التحقق:', allowed);
      return allowed;
    }

    // الموظف العادي لديه وصول محدود
    if (user.role === 'employee') {
      const allowed = [
        'customers',
        'flight_bookings',
        'hotel_bookings',
        'vehicle_bookings',
        'event_bookings',
        'visa_bookings',
        'receipts',
        'reports'
      ].includes(section);
      console.log('المستخدم موظف عادي، نتيجة التحقق:', allowed);
      return allowed;
    }

    // المحاسب لديه وصول للأقسام المالية فقط
    if (user.role === 'accountant') {
      const allowed = [
        'receipts',
        'accounting',
        'reports'
      ].includes(section);
      console.log('المستخدم محاسب، نتيجة التحقق:', allowed);
      return allowed;
    }
  }

  // التحقق من المسمى الوظيفي
  if (user.jobTitle) {
    if (user.jobTitle === 'مدير') {
      const allowed = ![
        'admin',
        'settings'
      ].includes(section);
      console.log('المستخدم مدير (حسب المسمى الوظيفي)، نتيجة التحقق:', allowed);
      return allowed;
    }
    
    if (user.jobTitle === 'موظف') {
      const allowed = [
        'customers',
        'flight_bookings',
        'hotel_bookings',
        'vehicle_bookings',
        'event_bookings',
        'visa_bookings',
        'receipts',
        'reports'
      ].includes(section);
      console.log('المستخدم موظف عادي (حسب المسمى الوظيفي)، نتيجة التحقق:', allowed);
      return allowed;
    }
    
    if (user.jobTitle === 'محاسب') {
      const allowed = [
        'receipts',
        'accounting',
        'reports'
      ].includes(section);
      console.log('المستخدم محاسب (حسب المسمى الوظيفي)، نتيجة التحقق:', allowed);
      return allowed;
    }
  }

  // منح وصول افتراضي للمستخدمين في بيئة التطوير
  if (import.meta.env.DEV) {
    console.log('بيئة تطوير، منح وصول افتراضي للقسم');
    return true;
  }

  console.log('لم يتم العثور على صلاحيات، رفض الوصول');
  return false;
};

// دالة للتحقق من صلاحية المستخدم
const checkUserPermission = (user, permission) => {
  if (!user) return false;
  
  // التحقق من صلاحيات مسؤول النظام
  if (
    user.isAdmin === true || 
    user.role === 'admin' || 
    user.jobTitle === 'مسؤول النظام' ||
    (user.permissions && user.permissions.includes('all'))
  ) {
    return true;
  }
  
  // التحقق من وجود الصلاحيات وأنها مصفوفة
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }
  
  return false;
};

// دالة للتحقق من إمكانية الوصول إلى قسم معين
const checkUserAccessSection = (user, section) => {
  if (!user) return false;
  
  // المشرف لديه وصول لجميع الأقسام
  if (
    user.isAdmin === true || 
    user.role === 'admin' || 
    user.jobTitle === 'مسؤول النظام' ||
    (user.permissions && user.permissions.includes('all'))
  ) {
    return true;
  }
  
  // إذا كان القسم هو 'all'، نسمح بالوصول لجميع المستخدمين المسجلين
  if (section === 'all') {
    return true;
  }
  
  // التحقق من وجود الصلاحيات وأنها مصفوفة
  if (user.permissions && Array.isArray(user.permissions)) {
    // التحقق من وجود الصلاحية المباشرة للقسم
    if (user.permissions.includes(section)) {
      return true;
    }
    
    // التحقق من وجود صلاحيات القراءة أو الكتابة للقسم
    const readPermission = `${section}.read`;
    const writePermission = `${section}.write`;
    
    if (user.permissions.includes(readPermission) || user.permissions.includes(writePermission)) {
      return true;
    }
  }
  
  return false;
};

// --------------- 1. دوال مسؤول النظام والتهيئة ---------------

// التحقق من وجود جدول المستخدمين وإنشاء مسؤول النظام
const initializeUserSystem = async () => {
  try {
    if (import.meta.env.DEV) {
      console.log('بدء التحقق من وجود جدول المستخدمين...');
    }
    // التحقق من وجود مجموعة المستخدمين
    const usersCollection = collection(db, 'users');
    const usersQuery = query(usersCollection, limit(1));
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      // إذا كانت المجموعة فارغة أو غير موجودة، أنشئ مستند مسؤول النظام الافتراضي
      const adminUser = {
        email: 'admin@alsaadtravels.com',
        employeeId: 1000,
        isActive: true,
        isSeedData: true,
        jobTitle: 'مسؤول النظام',
        jobTitleEn: 'Admin',
        name: 'مسؤول النظام',
        password: 'A@669393a',
        phone: '94411555',
        role: 'Admin',
        permissions: ['all'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authUid: 'JpUCRAB3jpTX5v8c852ohdHkc5A2',
        isAdmin: true
      };
      const adminDocRef = doc(usersCollection, 'JpUCRAB3jpTX5v8c852ohdHkc5A2');
      await setDoc(adminDocRef, adminUser, { merge: true });
      if (import.meta.env.DEV) {
        console.log('تم إنشاء مجموعة users ومستند مسؤول النظام تلقائيًا.');
      }
      return true;
    } else {
      if (import.meta.env.DEV) {
        console.log('جدول المستخدمين موجود بالفعل');
      }
      return true;
    }
  } catch (error) {
    console.error('خطأ أثناء تهيئة نظام المستخدمين:', error);
    return false;
  }
};

// الحصول على رقم وظيفي جديد تصاعدي
const getNextUserId = async () => {
  try {
    const usersRef = collection(db, 'users');
    // البحث عن آخر رقم وظيفي في قاعدة البيانات
    const q = query(usersRef, orderBy('employeeId', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 1000; // رقم البداية الافتراضي
    }
    
    const lastUser = querySnapshot.docs[0].data();
    // التأكد من أن الرقم الوظيفي رقم صحيح
    const lastEmployeeId = parseInt(lastUser.employeeId) || 1000;
    return lastEmployeeId + 1;
  } catch (error) {
    console.error('خطأ في الحصول على الرقم الوظيفي الجديد:', error);
    return 1000; // رقم افتراضي في حالة الخطأ
  }
};

// --------------- 2. دوال المصادقة ---------------

// تسجيل الدخول
const signIn = async (email, password) => {
  try {
    // التحقق من المدخلات
    if (!email || !password) {
      return {
        success: false,
        error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
      };
    }

    // التحقق مما إذا كان البريد الإلكتروني هو بريد المسؤول
    const isAdminEmail = email === 'admin@alsaadtravels.com' || email === 'admin' || email === '1001';
    
    // تعديل البريد الإلكتروني إذا كان المستخدم هو المسؤول
    const loginEmail = isAdminEmail ? 'admin@alsaadtravels.com' : email;

    // محاولة تسجيل الدخول
    const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
    const firebaseUser = userCredential.user;

    if (!firebaseUser) {
      return {
        success: false,
        error: 'فشل في تسجيل الدخول: لم يتم العثور على بيانات المستخدم'
      };
    }

    // البحث عن بيانات المستخدم
    const userData = await findUserData(firebaseUser, loginEmail, isAdminEmail);

    if (!userData.success) {
      return userData; // إرجاع رسالة الخطأ من findUserData
    }

    // تحديث آخر تسجيل دخول
    try {
      await updateLastLogin(userData.data.id, firebaseUser.uid);
    } catch (error) {
      console.warn('خطأ في تحديث بيانات آخر تسجيل دخول:', error);
      // استمر في العملية حتى لو فشل تحديث بيانات تسجيل الدخول
    }

    return {
      success: true,
      user: {
        ...userData.data,
        uid: firebaseUser.uid
      }
    };
  } catch (error) {
    // معالجة أخطاء Firebase
    const errorDetails = handleFirebaseError(error);
    
    return {
      success: false,
      error: errorDetails.message,
      code: errorDetails.code
    };
  }
};

/**
 * البحث عن بيانات المستخدم في جداول Firestore
 * @param {Object} firebaseUser - كائن المستخدم من Firebase Authentication
 * @param {string} email - البريد الإلكتروني للمستخدم
 * @param {boolean} isAdminEmail - هل البريد الإلكتروني هو بريد المسؤول
 * @returns {Object} - بيانات المستخدم أو رسالة خطأ
 */
const findUserData = async (firebaseUser, email, isAdminEmail) => {
  try {
    // تأكد من أن البريد الإلكتروني بأحرف صغيرة
    const lowerCaseEmail = email.toLowerCase();
    
    // البحث عن المستخدم في جدول users باستخدام البريد الإلكتروني
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', lowerCaseEmail));
    const querySnapshot = await getDocs(q);
    
    let userData = null;
    let userId = null;
    let isAdmin = isAdminEmail; // تعيين المستخدم كمسؤول إذا كان البريد هو بريد المسؤول
    
    // إذا تم العثور على المستخدم في جدول users
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      userData = userDoc.data();
      userId = userDoc.id;
      
      if (import.meta.env.DEV) {
        console.log('تم العثور على بيانات المستخدم في جدول users:', userId);
      }
      
      // التحقق من حالة المستخدم
      if (userData.status && userData.status !== 'active') {
        if (import.meta.env.DEV) {
          console.log('حساب المستخدم غير نشط');
        }
        await signOut(auth);
        return { success: false, error: 'حساب المستخدم غير نشط' };
      }
      
      // التحقق من دور المستخدم
      if (userData.role === 'admin' || userData.jobTitle === 'مسؤول النظام' || isAdminEmail) {
        isAdmin = true;
        // تحديث دور المستخدم إذا كان بريد المسؤول
        if (isAdminEmail && userData.role !== 'admin') {
          await updateDoc(doc(db, 'users', userId), {
            role: 'admin',
            permissions: ['all'],
            updatedAt: serverTimestamp()
          });
          userData.role = 'admin';
          userData.permissions = ['all'];
        }
      }
    } else {
      if (import.meta.env.DEV) {
        console.log('لم يتم العثور على بيانات المستخدم في جدول users، البحث في جدول employees');
      }
    }
    
    // إذا لم يتم العثور على المستخدم في جدول users أو لم يكن له دور محدد، نبحث في جدول employees
    if (!userData || (!userData.role && !userData.jobTitle)) {
      const employeeData = await findEmployeeData(email);
      
      if (employeeData) {
        // إذا لم يتم العثور على المستخدم في جدول users، نقوم بإنشاء سجل جديد
        if (!userData) {
          const newUserData = await createUserFromEmployee(firebaseUser, employeeData, isAdminEmail);
          userData = newUserData.userData;
          userId = newUserData.userId;
        } else {
          // تحديث بيانات المستخدم من جدول employees إذا كانت ناقصة
          const updatedData = await updateUserFromEmployee(userId, userData, employeeData, isAdminEmail);
          userData = { ...userData, ...updatedData };
          
          // تحديث حالة المسؤول
          if (employeeData.jobTitle === 'مسؤول النظام' || isAdminEmail) {
            isAdmin = true;
          }
        }
      } else if (!userData) {
        // لم يتم العثور على المستخدم في أي من الجدولين
        if (import.meta.env.DEV) {
          console.log('لم يتم العثور على المستخدم في أي من الجدولين');
        }
        await signOut(auth);
        return { 
          success: false, 
          error: 'لم يتم العثور على مستخدم بهذا البريد الإلكتروني. يرجى التواصل مع مسؤول النظام للحصول على حساب.' 
        };
      }
    }
    
    // تحديث آخر تسجيل دخول ومعرّف المستخدم في Firebase Authentication
    await updateLastLogin(userId, firebaseUser.uid);
    
    // إرجاع بيانات المستخدم
    return { 
      success: true, 
      data: {
        ...userData,
        id: userId,
        uid: firebaseUser.uid,
        isAdmin: isAdmin
      }
    };
  } catch (error) {
    console.error('خطأ في البحث عن بيانات المستخدم:', error);
    throw error;
  }
};

/**
 * البحث عن بيانات الموظف في جدول employees
 * @param {string} email - البريد الإلكتروني للموظف
 * @returns {Object|null} - بيانات الموظف أو null
 */
const findEmployeeData = async (email) => {
  try {
    // تأكد من أن البريد الإلكتروني بأحرف صغيرة
    const lowerCaseEmail = email.toLowerCase();
    
    const employeesRef = collection(db, 'employees');
    const employeeQuery = query(employeesRef, where('email', '==', lowerCaseEmail));
    const employeeSnapshot = await getDocs(employeeQuery);
    
    if (!employeeSnapshot.empty) {
      const employeeDoc = employeeSnapshot.docs[0];
      const employeeData = employeeDoc.data();
      
      if (import.meta.env.DEV) {
        console.log('تم العثور على بيانات المستخدم في جدول employees:', employeeDoc.id);
      }
      
      // التحقق من حالة الموظف
      if (employeeData.status && employeeData.status !== 'active') {
        if (import.meta.env.DEV) {
          console.log('حساب الموظف غير نشط');
        }
        await signOut(auth);
        throw new Error('حساب الموظف غير نشط');
      }
      
      return { ...employeeData, id: employeeDoc.id };
    }
    
    return null;
  } catch (error) {
    console.error('خطأ في البحث عن بيانات الموظف:', error);
    throw error;
  }
};

/**
 * إنشاء مستخدم جديد من بيانات الموظف
 * @param {Object} firebaseUser - كائن المستخدم من Firebase Authentication
 * @param {Object} employeeData - بيانات الموظف
 * @param {boolean} isAdminEmail - هل البريد الإلكتروني هو بريد المسؤول
 * @returns {Object} - بيانات المستخدم الجديد ومعرفه
 */
const createUserFromEmployee = async (firebaseUser, employeeData, isAdminEmail) => {
  try {
    const usersRef = collection(db, 'users');
    
    // الحصول على الرقم الوظيفي الجديد
    const employeeId = await getNextUserId();
    
    const newUserData = {
      email: firebaseUser.email,
      name: isAdminEmail ? 'مسؤول النظام' : (employeeData.name || 'مستخدم جديد'),
      jobTitle: isAdminEmail ? 'مسؤول النظام' : (employeeData.jobTitle || ''),
      role: isAdminEmail ? 'admin' : (employeeData.role || ''),
      permissions: isAdminEmail ? ['all'] : (employeeData.permissions || []),
      status: 'active',
      employeeId: employeeId, // إضافة الرقم الوظيفي الجديد
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      authUid: firebaseUser.uid
    };
    
    // إذا كان المسمى الوظيفي هو مسؤول النظام، نضبط الدور والصلاحيات
    if (employeeData.jobTitle === 'مسؤول النظام' || isAdminEmail) {
      newUserData.role = 'admin';
      newUserData.permissions = ['all'];
    }
    
    // إنشاء سجل جديد في جدول users
    const newUserRef = doc(usersRef);
    await setDoc(newUserRef, newUserData);
    
    if (import.meta.env.DEV) {
      console.log('تم إنشاء سجل جديد في جدول users:', newUserRef.id);
      console.log('الرقم الوظيفي الجديد:', employeeId);
    }
    
    return { userData: newUserData, userId: newUserRef.id };
  } catch (error) {
    console.error('خطأ في إنشاء مستخدم جديد من بيانات الموظف:', error);
    throw error;
  }
};

/**
 * تحديث بيانات المستخدم من بيانات الموظف
 * @param {string} userId - معرف المستخدم
 * @param {Object} userData - بيانات المستخدم الحالية
 * @param {Object} employeeData - بيانات الموظف
 * @param {boolean} isAdminEmail - هل البريد الإلكتروني هو بريد المسؤول
 * @returns {Object} - التحديثات التي تم إجراؤها
 */
const updateUserFromEmployee = async (userId, userData, employeeData, isAdminEmail) => {
  try {
    const updates = {};
    
    if (!userData.role && employeeData.role) {
      updates.role = employeeData.role;
    }
    
    if (!userData.jobTitle && employeeData.jobTitle) {
      updates.jobTitle = employeeData.jobTitle;
    }
    
    if ((!userData.permissions || userData.permissions.length === 0) && employeeData.permissions) {
      updates.permissions = employeeData.permissions;
    }
    
    // إذا كان المسمى الوظيفي هو مسؤول النظام، نضبط الدور والصلاحيات
    if (employeeData.jobTitle === 'مسؤول النظام' || isAdminEmail) {
      updates.role = 'admin';
      updates.permissions = ['all'];
    }
    
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = serverTimestamp();
      await updateDoc(doc(db, 'users', userId), updates);
      
      if (import.meta.env.DEV) {
        console.log('تم تحديث بيانات المستخدم من جدول employees:', updates);
      }
    }
    
    return updates;
  } catch (error) {
    console.error('خطأ في تحديث بيانات المستخدم من بيانات الموظف:', error);
    throw error;
  }
};

/**
 * تحديث آخر تسجيل دخول للمستخدم
 * @param {string} userId - معرف المستخدم
 * @param {string} authUid - معرف المستخدم في Firebase Authentication
 */
const updateLastLogin = async (userId, authUid) => {
  try {
    const lastLoginUpdate = {
      lastLogin: new Date().toISOString(),
      authUid: authUid,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'users', userId), lastLoginUpdate);
    
    if (import.meta.env.DEV) {
      console.log('تم تحديث آخر تسجيل دخول للمستخدم');
    }
  } catch (error) {
    console.error('خطأ في تحديث آخر تسجيل دخول للمستخدم:', error);
    // لا نقوم برمي الخطأ هنا لأن هذا ليس حرجاً لعملية تسجيل الدخول
  }
};

// تسجيل الخروج
const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    return { success: false, error: error.message };
  }
};

// إعادة تعيين كلمة المرور
const resetPassword = async (email) => {
  try {
    if (!email || !/\S+@\S+\.\S+/.test(email.trim())) {
      return { success: false, error: 'البريد الإلكتروني غير صالح' };
    }
    
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (error) {
    console.error('خطأ في إعادة تعيين كلمة المرور:', error);
    return { success: false, error: handleFirebaseError(error) };
  }
};

// التحقق من حالة المصادقة
const checkAuthState = () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// الحصول على بيانات المستخدم
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

// تصدير الكائنات والدوال
const firebaseServices = {
  app,
  auth,
  db,
  storage,
  signIn,
  signOut: signOutUser,
  resetPassword,
  checkAuthState,
  getUserData,
  jobTitles,
  getUserPermissions,
  checkPermission,
  canAccessSection,
  checkUserPermission,
  checkUserAccessSection,
  getNextUserId,
  initializeUserSystem,
  isTestMode
};

// تشغيل عملية التهيئة عند بدء التطبيق
initializeUserSystem().catch(error => {
  console.error('فشل في تهيئة نظام المستخدمين:', error);
});

export default firebaseServices;
export {
  app,
  auth,
  db,
  storage,
  signIn,
  signOutUser as signOut,
  resetPassword,
  checkAuthState,
  getUserData,
  jobTitles,
  getUserPermissions,
  checkPermission,
  canAccessSection,
  checkUserPermission,
  checkUserAccessSection,
  getNextUserId,
  initializeUserSystem,
  isTestMode
};
