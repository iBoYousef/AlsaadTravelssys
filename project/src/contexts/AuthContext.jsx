import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { useToast } from '@chakra-ui/react';
import firebaseServices from '../firebase';

const { auth, db } = firebaseServices;
const AuthContext = createContext();

/**
 * سياق المصادقة الموحد
 * يوفر إدارة حالة المستخدم والصلاحيات بشكل مركزي
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  // التحقق من الصلاحيات
  const checkPermission = (permission) => {
    if (!user || !user.permissions) return false;
    
    // إذا كان المستخدم لديه صلاحية 'all'، فهو يملك جميع الصلاحيات
    if (Array.isArray(user.permissions) && user.permissions.includes('all')) {
      return true;
    }
    
    // التحقق من وجود الصلاحية المحددة
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  };

  // التحقق من إمكانية الوصول إلى قسم
  const canAccessSection = (section) => {
    if (!user) return false;
    
    // المشرف لديه وصول إلى جميع الأقسام
    if (user.role === 'admin' || user.isAdmin) return true;
    
    // التحقق من الصلاحيات الخاصة بالقسم
    const sectionPermissions = {
      dashboard: ['view_dashboard'],
      users: ['manage_users', 'view_users'],
      tourPackages: ['manage_tour_packages', 'view_tour_packages'],
      bookings: ['manage_bookings', 'view_bookings'],
      customers: ['manage_customers', 'view_customers'],
      flights: ['manage_flights', 'view_flights'],
      hotels: ['manage_hotels', 'view_hotels'],
      visas: ['manage_visas', 'view_visas'],
      reports: ['view_reports'],
      settings: ['manage_settings']
    };
    
    const requiredPermissions = sectionPermissions[section] || [];
    
    if (requiredPermissions.length === 0) return false;
    
    // التحقق من وجود أي من الصلاحيات المطلوبة
    return requiredPermissions.some(permission => checkPermission(permission));
  };

  // دالة تسجيل الدخول
  const signIn = async (email, password) => {
    try {
      console.log('محاولة تسجيل الدخول في AuthContext:', { email });
      
      // التحقق من بيانات المسؤول الافتراضية
      const adminEmail = import.meta.env.VITE_DEFAULT_ADMIN_EMAIL || 'admin@alsaadtravels.com';
      const adminPassword = import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD || 'A@669393a';
      
      let userCredential = null;
      
      console.log('بيانات المسؤول المتوقعة:', { adminEmail, adminPassword });
      console.log('بيانات المستخدم المدخلة:', { email, password });
      
      // التحقق من المعرفات البديلة للمسؤول (رقم وظيفي أو اسم مستخدم أو بريد إلكتروني)
      if (email === adminEmail || email === 'admin' || email === '1001' || email === '1000' || 
          String(email) === '1000' || String(email) === '1001') {
        if (password === adminPassword) {
          console.log('تسجيل دخول مسؤول النظام باستخدام معرف:', email);
          userCredential = {
            user: {
              uid: 'JpUCRAB3jpTX5v8c852ohdHkc5A2',
              email: adminEmail
            }
          };
        } else {
          throw new Error('كلمة المرور غير صحيحة لمسؤول النظام');
        }
      } else {
        // محاولة تسجيل الدخول باستخدام Firebase Authentication
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
          console.log('خطأ في تسجيل الدخول:', err.code);
          console.error('تفاصيل الخطأ الكاملة:', err);
          
          // إذا كان البريد هو بريد المسؤول وكلمة المرور صحيحة
          if (email === adminEmail && password === adminPassword) {
            console.log('تسجيل دخول مسؤول النظام مباشرة من Firestore');
            userCredential = {
              user: {
                uid: 'JpUCRAB3jpTX5v8c852ohdHkc5A2',
                email: adminEmail
              }
            };
          }
          // إذا كانت مشكلة مفتاح API منتهي
          else if (err.code === 'auth/api-key-expired.-please-renew-the-api-key.') {
            console.log('مفتاح API منتهي، نحاول الطريقة البديلة');
            // التحقق من المستخدم مباشرة في Firestore
            if (email === adminEmail && password === adminPassword) {
              userCredential = {
                user: {
                  uid: 'JpUCRAB3jpTX5v8c852ohdHkc5A2',
                  email: adminEmail
                }
              };
            } else {
              throw new Error('فشل تسجيل الدخول: مفتاح API منتهي وبيانات المستخدم غير صحيحة');
            }
          } else {
            throw err;
          }
        }
      }
      
      // البحث عن المستخدم في جدول users باستخدام البريد الإلكتروني أو رقم وظيفي أو اسم مستخدم
      const usersRef = collection(db, 'users');
      let userQuery = query(usersRef, where('email', '==', email));
      let querySnapshot = await getDocs(userQuery);
      let userDoc = null;
      let userData = null;
      
      // إذا كان هذا هو مسؤول النظام باستخدام الطريقة البديلة
      if (userCredential.user.uid === 'admin-uid' && email === adminEmail) {
        console.log('البحث عن بيانات مسؤول النظام باستخدام البريد الإلكتروني');
        // البحث عن مسؤول النظام باستخدام البريد الإلكتروني
        userQuery = query(usersRef, where('email', '==', adminEmail), where('role', '==', 'admin'));
        querySnapshot = await getDocs(userQuery);
      }

      // إذا لم يوجد، جرب البحث برقم وظيفي أو اسم مستخدم (إذا كان الإدخال ليس بريد إلكتروني)
      if (querySnapshot.empty && !email.includes('@')) {
        // جرب البحث بالرقم الوظيفي
        userQuery = query(usersRef, where('employeeId', '==', email));
        querySnapshot = await getDocs(userQuery);
        // إذا لم يوجد، جرب البحث باسم المستخدم
        if (querySnapshot.empty) {
          userQuery = query(usersRef, where('username', '==', email));
          querySnapshot = await getDocs(userQuery);
        }
      }

      // إذا لم نجد المستخدم بالاستعلامات، جرب جلبه مباشرة بالـ uid
      if (querySnapshot.empty) {
        const directUserDoc = await getDoc(doc(usersRef, userCredential.user.uid));
        if (directUserDoc.exists()) {
          userDoc = directUserDoc;
          userData = userDoc.data();
        }
      } else {
        userDoc = querySnapshot.docs[0];
        userData = userDoc.data();
      }

      if (!userData) {
        // إذا لم يتم العثور على المستخدم في جدول users وجربت كل الطرق
        const adminEmail = import.meta.env.VITE_DEFAULT_ADMIN_EMAIL || 'admin@alsaadtravels.com';
        const adminPassword = import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD || 'A@669393';
        if (email === adminEmail) {
          // إنشاء سجل مسؤول النظام في users إذا لم يكن موجودًا
          const adminUserData = {
            email: adminEmail,
            employeeId: 1000,
            isActive: true,
            isSeedData: true,
            jobTitle: 'مسؤول النظام',
            jobTitleEn: 'Admin',
            name: 'مسؤول النظام',
            password: adminPassword, // فقط للحفظ المرجعي، لا يتم التحقق من كلمة المرور من Firestore
            phone: '94411555',
            role: 'Admin',
            permissions: ['all'],
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            authUid: userCredential.user.uid
          };
          const adminUserRef = doc(usersRef, userCredential.user.uid);
          try {
            await setDoc(adminUserRef, adminUserData);
            console.log('تم إنشاء مستند مسؤول النظام في Firestore:', adminUserRef.id);
          } catch (error) {
            console.error('فشل في إنشاء مستند مسؤول النظام في Firestore:', error);
            throw error;
          }
          // انتظر حتى يصبح المستند متاحًا فعليًا في Firestore (polling)
          let confirmedUserDoc = null;
          let pollingAttempts = 0;
          while (pollingAttempts < 5 && !confirmedUserDoc) {
            await new Promise(res => setTimeout(res, 200));
            const checkDoc = await getDoc(adminUserRef);
            if (checkDoc.exists()) {
              confirmedUserDoc = checkDoc;
            }
            pollingAttempts++;
          }
          if (!confirmedUserDoc) {
            throw new Error('فشل التأكد من إنشاء بيانات مسؤول النظام في قاعدة البيانات. يرجى المحاولة لاحقًا.');
          }
          const adminUser = { id: adminUserRef.id, uid: userCredential.user.uid, ...adminUserData, isAdmin: true };
          setUser(adminUser);
          localStorage.setItem('user', JSON.stringify(adminUser));
          return { success: true, user: adminUser };

        }
        // تسجيل الخروج لأن المستخدم غير موجود في قاعدة البيانات
        await auth.signOut();
        return { success: false, error: 'لم يتم العثور على حساب بهذا البريد الإلكتروني أو رقم وظيفي أو اسم مستخدم. يرجى التواصل مع مسؤول النظام.' };
      }
      
      // جلب بيانات المستخدم من Firestore (تم تعريف userDoc و userData مسبقًا)
      userDoc = querySnapshot.docs[0];
      userData = userDoc.data();
      
      // التحقق من حالة المستخدم
      if (!userData.isActive && userData.status !== 'active') {
        await auth.signOut();
        return { 
          success: false, 
          error: 'تم تعطيل هذا الحساب. يرجى التواصل مع مسؤول النظام.' 
        };
      }
      
      // التحقق من دور المستخدم
      const isAdmin = userData.role === 'admin' || userData.jobTitle === 'مسؤول النظام';
      
      // إنشاء كائن المستخدم
      const userObject = {
        id: userDoc.id,
        uid: userCredential.user.uid,
        ...userData,
        isAdmin: isAdmin
      };
      
      // تخزين بيانات المستخدم في الحالة والتخزين المحلي
      setUser(userObject);
      localStorage.setItem('user', JSON.stringify(userObject));
      
      // إرجاع بيانات المستخدم
      return { 
        success: true, 
        user: userObject
      };
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      
      let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
      
      // ترجمة رسائل الخطأ الشائعة
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'تم تعطيل هذا الحساب';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'لم يتم العثور على حساب بهذا البريد الإلكتروني';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'كلمة المرور غير صحيحة';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'تم تجاوز عدد المحاولات المسموح بها. الرجاء المحاولة لاحقاً';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // دالة تسجيل الخروج
  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      localStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      return { success: false, error: error.message };
    }
  };

  // دالة جلب بيانات المستخدم من Firestore
  const fetchUserData = async (uid) => {
    try {
      console.log('[FETCH USER DATA] محاولة جلب بيانات المستخدم من Firestore بالـ UID:', uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        console.log('[FETCH USER DATA] تم العثور على بيانات المستخدم:', userDoc.data());
        return { id: uid, ...userDoc.data() };
      }
      console.warn('[FETCH USER DATA] لم يتم العثور على بيانات المستخدم بالـ UID:', uid);
      return null;
    } catch (error) {
      console.error('[FETCH USER DATA ERROR] خطأ في جلب بيانات المستخدم:', error, 'للـ UID:', uid);
      return null;
    }
  };


  // مراقبة حالة المصادقة وإنشاء بيانات المسؤول تلقائيًا إذا لم تكن موجودة
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        console.log('[AUTH EFFECT] onAuthStateChanged triggered. authUser:', authUser);
        if (authUser) {
          const adminEmail = (import.meta.env.VITE_DEFAULT_ADMIN_EMAIL || 'admin@alsaadtravels.com').toLowerCase();
          console.log('[AUTH EFFECT] البريد الإلكتروني للمسؤول المتوقع:', adminEmail, '| البريد الحالي:', authUser.email);
          const isAdmin = authUser.email && authUser.email.toLowerCase() === adminEmail;
          console.log('[AUTH EFFECT] isAdmin:', isAdmin, '| authUser.uid:', authUser.uid);
          let userData = await fetchUserData(authUser.uid);
          console.log('[AUTH EFFECT] نتيجة fetchUserData:', userData);
          if (!userData) {
            // إجبار الإنشاء إذا كان UID هو UID مسؤول النظام حتى لو لم يتحقق شرط البريد الإلكتروني
            if (isAdmin || authUser.uid === 'JpUCRAB3jpTX5v8c852ohdHkc5A2') {
              if (!isAdmin) {
                console.warn('[ADMIN CREATE] سيتم إنشاء سجل مسؤول النظام بناءً على UID فقط (بدون تحقق البريد). البريد الحالي:', authUser.email, '| UID:', authUser.uid);
              } else {
                console.log('[ADMIN CREATE] سيتم إنشاء سجل مسؤول النظام بناءً على البريد الإلكتروني المطابق. البريد:', authUser.email, '| UID:', authUser.uid);
              }
              // إنشاء سجل مسؤول النظام في قاعدة البيانات
              const adminUserData = {
                email: 'admin@alsaadtravels.com',
                employeeId: 1000,
                isActive: true,
                isSeedData: true,
                jobTitle: 'مسؤول النظام',
                jobTitleEn: 'Admin',
                name: 'مسؤول النظام',
                password: import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD || 'A@669393',
                phone: '94411555',
                role: 'admin', // توحيد role
                permissions: ['all'],
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                authUid: authUser.uid
              };
              try {
                console.log('[ADMIN CREATE] محاولة إنشاء سجل مسؤول النظام:', adminUserData, '| UID:', authUser.uid);
                await setDoc(doc(collection(db, 'users'), authUser.uid), adminUserData);
                // Polling لجلب المستند بعد الإنشاء
                let confirmedUserDoc = null;
                let pollingAttempts = 0;
                const maxPolling = 10;
                while (pollingAttempts < maxPolling && !confirmedUserDoc) {
                  await new Promise(res => setTimeout(res, 350));
                  try {
                    console.log(`[ADMIN POLL] محاولة جلب مستند المسؤول بالـ UID: ${authUser.uid} (محاولة رقم ${pollingAttempts + 1})`);
                    const checkDoc = await getDoc(doc(collection(db, 'users'), authUser.uid));
                    if (checkDoc.exists()) {
                      confirmedUserDoc = checkDoc;
                      console.log(`[ADMIN POLL SUCCESS] تم جلب مستند المسؤول بعد المحاولة ${pollingAttempts + 1}:`, checkDoc.data());
                    } else {
                      console.warn(`[ADMIN POLL] لم يتم العثور على مستند المسؤول بعد المحاولة ${pollingAttempts + 1}`);
                    }
                  } catch (pollErr) {
                    if (pollErr.code && pollErr.code.includes('permission')) {
                      console.error('[ADMIN POLL PERMISSION ERROR]', pollErr);
                      setError('ليس لديك صلاحية للوصول إلى بيانات المستخدم. يرجى مراجعة قواعد Firestore.');
                      toast({ title: 'خطأ صلاحيات Firestore', description: pollErr.message, status: 'error', duration: 7000, isClosable: true, position: 'top' });
                      await auth.signOut();
                      setUser(null);
                      localStorage.removeItem('user');
                      return;
                    }
                    console.error('[ADMIN POLL ERROR]', pollErr);
                  }
                  pollingAttempts++;
                }
                if (!confirmedUserDoc) {
                  console.error('[ADMIN POLL FAIL] لم يتم العثور على مستند المسؤول بعد 10 محاولات. UID:', authUser.uid);
                  setError('فشل جلب بيانات مسؤول النظام بعد عدة محاولات. يرجى المحاولة لاحقاً أو مراجعة قواعد Firestore.');
                  toast({ title: 'فشل جلب بيانات المسؤول', description: 'لم يتم العثور على بيانات المسؤول بعد عدة محاولات. سيتم تسجيل الخروج.', status: 'error', duration: 7000, isClosable: true, position: 'top' });
                  await auth.signOut();
                  setUser(null);
                  localStorage.removeItem('user');
                  return;
                }
                userData = { ...confirmedUserDoc.data(), id: authUser.uid, isAdmin: true };
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                toast({ title: 'تم إنشاء حساب مسؤول النظام في قاعدة البيانات تلقائيًا', status: 'success', duration: 4000, isClosable: true, position: 'top' });
                console.log('[ADMIN CREATED] تم إنشاء سجل مسؤول النظام وتأكيده:', userData);
              } catch (err) {
                if (err.code && err.code.includes('permission')) {
                  setError('ليس لديك صلاحية لإنشاء حساب مسؤول النظام. يرجى مراجعة قواعد Firestore.');
                  toast({ title: 'خطأ صلاحيات Firestore', description: err.message, status: 'error', duration: 7000, isClosable: true, position: 'top' });
                }
                console.error('[ADMIN CREATE ERROR] فشل في إنشاء سجل مسؤول النظام تلقائيًا:', err);
                setError('فشل في إنشاء حساب مسؤول النظام تلقائيًا. يرجى التواصل مع الدعم.');
                toast({ title: 'فشل إنشاء حساب مسؤول النظام', description: err.message, status: 'error', duration: 6000, isClosable: true, position: 'top' });
                await auth.signOut();
                setUser(null);
                localStorage.removeItem('user');
                return;
              }
            } else {
              // إعادة المحاولة لجلب بيانات المستخدم العادية
              let retryUserData = null;
              let attempts = 0;
              const maxAttempts = 5;
              while (attempts < maxAttempts && !retryUserData) {
                console.warn(`[USER RETRY] لم يتم العثور على بيانات المستخدم في قاعدة البيانات، إعادة المحاولة رقم ${attempts + 1} بعد 200ms...`);
                await new Promise(res => setTimeout(res, 200));
                retryUserData = await fetchUserData(authUser.uid);
                attempts++;
              }
              if (retryUserData) {
                setUser(retryUserData);
                localStorage.setItem('user', JSON.stringify(retryUserData));
                console.log('[USER RETRY SUCCESS] تم جلب بيانات المستخدم بعد إعادة المحاولة:', retryUserData);
              } else {
                console.error('[USER RETRY FAIL] فشل في جلب بيانات المستخدم من قاعدة البيانات بعد عدة محاولات. سيتم تسجيل الخروج.');
                toast({ title: 'فشل جلب بيانات المستخدم', description: 'فشل النظام في جلب بيانات المستخدم بعد عدة محاولات. سيتم تسجيل الخروج.', status: 'error', duration: 6000, isClosable: true, position: 'top' });
                await auth.signOut();
                setUser(null);
                localStorage.removeItem('user');
              }
            }
          } else {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('[USER FOUND] تم جلب بيانات المستخدم بنجاح:', userData);
          }
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (err) {
        console.error('[AUTH STATE ERROR] خطأ في مراقبة حالة المصادقة:', err);
        setError(err.message);
        toast({ title: 'خطأ في مراقبة المصادقة', description: err.message, status: 'error', duration: 6000, isClosable: true, position: 'top' });
      } finally {
        setLoading(false);
      }
    });

    // محاولة استعادة بيانات المستخدم من التخزين المحلي
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('[LOCAL USER ERROR] خطأ في استعادة بيانات المستخدم من التخزين المحلي:', err);
        localStorage.removeItem('user');
      }
    }
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    error,
    setError,
    signIn,
    signOut,
    checkPermission,
    canAccessSection
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook مخصص للوصول إلى سياق المصادقة
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('يجب استخدام useAuth داخل AuthProvider');
  }
  return context;
};

export default AuthContext;
