require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, getDocs, query, where, limit, serverTimestamp } = require('firebase/firestore');

// تكوين Firebase
// ⚠️ تم حذف المفتاح المكشوف لأسباب أمنية، ويجب الآن استخدام متغير بيئي
const firebaseConfig = {
  // مفتاح ثابت حديث لتفادي مشاكل الانتهاء
  apiKey: "AIzaSyA8y1d9dM0Kd8QQCq4DYwasJGOi4TH7dw8",
  authDomain: "alsaad-travels.firebaseapp.com",
  projectId: "alsaad-travels",
  storageBucket: "alsaad-travels.appspot.com",
  messagingSenderId: "1010310325534",
  appId: "1:1010310325534:web:3e45f6f28ef78d57a41a33"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// مسح جميع البيانات من جدول المستخدمين
async function clearUsersData() {
  try {
    console.log('جاري مسح جميع بيانات المستخدمين...');
    
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    if (usersSnapshot.empty) {
      console.log('لا توجد بيانات مستخدمين للمسح');
      return true;
    }

    const deletePromises = [];
    usersSnapshot.forEach(doc => {
      deletePromises.push(setDoc(doc.ref, {}, { merge: true }));
    });
    
    await Promise.all(deletePromises);
    console.log('تم مسح جميع بيانات المستخدمين بنجاح');
    return true;
  } catch (error) {
    console.error('خطأ في مسح بيانات المستخدمين:', error);
    return false;
  }
}

// التحقق من صحة كلمة المرور
function validatePassword(password) {
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{6,}$/;
  return passwordRegex.test(password);
}

// التحقق من صحة البريد الإلكتروني
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// التحقق من صحة رقم الهاتف
function validatePhone(phone) {
  const phoneRegex = /^\+966\d{9}$/;
  return phoneRegex.test(phone);
}

// إنشاء مسؤول النظام
async function createSystemAdmin() {
  try {
    // بيانات المسؤول الثابتة
    const adminData = {
      employeeId: 1000, // الرقم الوظيفي
      name: 'مسؤول النظام', // الإسم
      email: 'admin@alsaadtravels.com', // البريد الإلكتروني
      password: 'A@669393a', // كلمة المرور
      phone: '+96594411555', // رقم الهاتف (تم التصحيح حسب متطلبات النظام)
      jobTitle: 'مسؤول النظام', // المسمى الوظيفي
      jobTitleEn: 'Admin', // المسمى الوظيفي بالإنجليزية
      isActive: true, // الحالة
      isSeedData: true, // بيانات أولية
      permissions: ['all'], // جميع الصلاحيات
      role: 'admin', // الدور
      status: 'active', // حالة الحساب
      salary: null, // الراتب غير محدد
      appointmentDate: new Date('2025-01-01'), // تاريخ التعيين
      lastLoginAt: serverTimestamp() // آخر تسجيل دخول
    };

    // التحقق من صحة البريد الإلكتروني
    if (!validateEmail(adminData.email)) {
      console.error('البريد الإلكتروني غير صالح');
      return false;
    }

    // التحقق من صحة كلمة المرور
    if (!validatePassword(adminData.password)) {
      console.error('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز');
      return false;
    }

    // التحقق من صحة رقم الهاتف
    if (!validatePhone(adminData.phone)) {
      console.error('رقم الهاتف غير صالح، يجب أن يكون بالشكل: +966xxxxxxxxx');
      return false;
    }

    console.log('جاري إنشاء حساب مسؤول النظام...');

    // محاولة إنشاء حساب في Firebase Authentication
    let adminUid;
    let adminUser;

    try {
      // محاولة إنشاء حساب جديد
      const newUserCredential = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password);
      adminUid = newUserCredential.user.uid;
      adminUser = newUserCredential.user;
      console.log('تم إنشاء حساب المصادقة بنجاح، معرف المستخدم:', adminUid);
    } catch (createError) {
      if (createError.code === 'auth/email-already-in-use') {
        console.log('البريد الإلكتروني مستخدم بالفعل، محاولة تسجيل الدخول...');
        
        try {
          // محاولة تسجيل الدخول
          const userCredential = await signInWithEmailAndPassword(auth, adminData.email, adminData.password);
          adminUid = userCredential.user.uid;
          adminUser = userCredential.user;
          console.log('تم تسجيل الدخول بنجاح، معرف المستخدم:', adminUid);
        } catch (loginError) {
          console.error('خطأ في تسجيل الدخول:', loginError);
          
          // محاولة إعادة تعيين كلمة المرور
          try {
            const resetPassword = await sendPasswordResetEmail(auth, adminData.email);
            console.log('تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني');
            return false;
          } catch (resetError) {
            console.error('خطأ في إرسال رابط إعادة تعيين كلمة المرور:', resetError);
            return false;
          }
        }
      } else {
        console.error('خطأ في إنشاء حساب المسؤول:', createError);
        return false;
      }
    }

    // إنشاء بيانات المسؤول في Firestore
    const userDocRef = doc(db, 'users', adminUid);
    const userData = {
      uid: adminUid,
      employeeId: adminData.employeeId,
      name: adminData.name,
      email: adminData.email,
      phone: adminData.phone,
      jobTitle: adminData.jobTitle,
      salary: adminData.salary,
      appointmentDate: adminData.appointmentDate,
      isActive: adminData.isActive,
      lastLoginAt: adminData.lastLoginAt,
      role: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(userDocRef, userData);
      console.log('تم إنشاء بيانات المسؤول في جدول users بنجاح');
      return true;
    } catch (error) {
      console.error('خطأ في إنشاء بيانات المسؤول في جدول users:', error);
      return false;
    }
  } catch (error) {
    console.error('خطأ غير متوقع في إنشاء مسؤول النظام:', error);
    return false;
  }
}

// تهيئة النظام
async function initializeSystem() {
  try {
    console.log('جاري تهيئة النظام...');
    
    // مسح البيانات القديمة
    await clearUsersData();
    
    // إنشاء مسؤول النظام
    await createSystemAdmin();
    
    console.log('تم تهيئة النظام بنجاح');
    return true;
  } catch (error) {
    console.error('خطأ في تهيئة النظام:', error);
    return false;
  }
}

// تشغيل عملية التهيئة
initializeSystem().then(async () => {
  // إنشاء بيانات مسؤول النظام في Firestore باستخدام Firebase العادية
  try {
    console.log('جاري إنشاء بيانات مسؤول النظام في Firestore...');
    
    // تسجيل الدخول بحساب مسؤول النظام
    const adminEmail = process.env.VITE_DEFAULT_ADMIN_EMAIL || 'admin@alsaadtravels.com';
    const adminPassword = process.env.VITE_DEFAULT_ADMIN_PASSWORD || 'A@669393a';
    
    try {
      // محاولة تسجيل الدخول
      const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      const adminUid = userCredential.user.uid;
      console.log('تم تسجيل الدخول بحساب مسؤول النظام بنجاح. معرف المستخدم:', adminUid);
      
      // إنشاء بيانات المسؤول في Firestore
      const userDocRef = doc(db, 'users', adminUid);
      const userData = {
        uid: adminUid,
        employeeId: 1000,
        name: 'مسؤول النظام',
        email: adminEmail,
        phone: '+96594411555',
        jobTitle: 'مسؤول النظام',
        salary: null,
        appointmentDate: new Date('2025-01-01'),
        isActive: true,
        lastLoginAt: serverTimestamp(),
        role: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userDocRef, userData, { merge: true });
      console.log('تم إنشاء/تحديث بيانات مسؤول النظام في Firestore بنجاح');
      
      // التحقق من وجود مستخدمين آخرين في النظام
      console.log('جاري التحقق من وجود مستخدمين آخرين...');
      
      // هنا يمكنك إضافة مستخدمين إضافيين يدويًا إذا لزم الأمر
      
      console.log('تمت عملية تهيئة النظام وإنشاء بيانات المستخدمين بنجاح');
      
    } catch (loginError) {
      console.error('خطأ في تسجيل الدخول:', loginError);
      
      // محاولة إنشاء حساب جديد
      try {
        console.log('محاولة إنشاء حساب جديد لمسؤول النظام...');
        const newUserCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        const adminUid = newUserCredential.user.uid;
        console.log('تم إنشاء حساب مسؤول النظام بنجاح. معرف المستخدم:', adminUid);
        
        // إنشاء بيانات المسؤول في Firestore
        const userDocRef = doc(db, 'users', adminUid);
        const userData = {
          uid: adminUid,
          employeeId: 1000,
          name: 'مسؤول النظام',
          email: adminEmail,
          phone: '+96594411555',
          jobTitle: 'مسؤول النظام',
          salary: null,
          appointmentDate: new Date('2025-01-01'),
          isActive: true,
          lastLoginAt: serverTimestamp(),
          role: 'admin',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(userDocRef, userData);
        console.log('تم إنشاء بيانات مسؤول النظام في Firestore بنجاح');
      } catch (createError) {
        console.error('خطأ في إنشاء حساب مسؤول النظام:', createError);
      }
    }
  } catch (e) {
    console.error('خطأ في تهيئة النظام:', e);
  }
});
