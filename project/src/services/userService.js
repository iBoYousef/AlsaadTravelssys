import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase';

// إنشاء مستخدم جديد
const createUser = async (userData) => {
  try {
    // منع وجود أكثر من مستخدم للأدوار العليا (مسؤول النظام، المدير التنفيذي، المدير العام)
    const uniqueRoles = ['admin', 'general_manager', 'executive_manager'];
    if (uniqueRoles.includes(userData.role)) {
      const q = query(collection(db, 'users'), where('role', '==', userData.role));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        let msg = '';
        switch (userData.role) {
          case 'admin':
            msg = 'لا يمكن إنشاء أكثر من حساب لمسؤول النظام. يوجد بالفعل حساب مسؤول النظام.';
            break;
          case 'general_manager':
            msg = 'لا يمكن إنشاء أكثر من حساب للمدير العام. يوجد بالفعل حساب المدير العام.';
            break;
          case 'executive_manager':
            msg = 'لا يمكن إنشاء أكثر من حساب للمدير التنفيذي. يوجد بالفعل حساب المدير التنفيذي.';
            break;
          default:
            msg = 'لا يمكن إنشاء أكثر من حساب لهذا الدور.';
        }
        throw new Error(msg);
      }
    }
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: new Date()
    });
    return { id: docRef.id, ...userData };
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء إنشاء المستخدم');
  }
};

// تحديث بيانات مستخدم
const updateUser = async (id, userData) => {
  try {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: new Date()
    });
    return { id, ...userData };
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء تحديث بيانات المستخدم');
  }
};

// جلب بيانات مستخدم
const getUser = async (id) => {
  try {
    const userRef = doc(db, 'users', id);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    } else {
      throw new Error('لم يتم العثور على المستخدم');
    }
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء جلب بيانات المستخدم');
  }
};

// جلب قائمة المستخدمين
const getUsers = async () => {
  try {
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(usersQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء جلب قائمة المستخدمين');
  }
};

// حذف مستخدم
const deleteUser = async (id) => {
  try {
    await deleteDoc(doc(db, 'users', id));
    return { success: true, message: 'تم حذف المستخدم بنجاح' };
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء حذف المستخدم');
  }
};

// الحصول على رقم الإيصال التالي
const getNextReceiptCode = async () => {
  try {
    // جلب آخر رقم إيصال من Firestore
    const receiptsQuery = query(
      collection(db, 'receipts'), 
      orderBy('receiptCode', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(receiptsQuery);
    
    if (querySnapshot.empty) {
      // إذا لم يكن هناك إيصالات سابقة، ابدأ من 1001
      return 'REC-1001';
    }
    
    // استخراج آخر رقم إيصال وزيادته بمقدار 1
    const lastReceipt = querySnapshot.docs[0].data();
    const lastCode = lastReceipt.receiptCode;
    const numericPart = parseInt(lastCode.split('-')[1]);
    const nextCode = `REC-${numericPart + 1}`;
    
    return nextCode;
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء جلب رقم الإيصال التالي');
  }
};

// جلب قائمة الإيصالات
const getReceipts = async () => {
  try {
    const receiptsQuery = query(collection(db, 'receipts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(receiptsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء جلب قائمة الإيصالات');
  }
};

// إنشاء إيصال جديد
const createReceipt = async (receiptData) => {
  try {
    const docRef = await addDoc(collection(db, 'receipts'), {
      ...receiptData,
      createdAt: new Date()
    });
    return { id: docRef.id, ...receiptData };
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء إنشاء الإيصال');
  }
};

// حذف إيصال
const deleteReceipt = async (id) => {
  try {
    await deleteDoc(doc(db, 'receipts', id));
    return { success: true, message: 'تم حذف الإيصال بنجاح' };
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء حذف الإيصال');
  }
};

// تصدير جميع الوظائف
const userService = {
  createUser,
  updateUser,
  getUser,
  getUsers,
  deleteUser,
  getNextReceiptCode,
  getReceipts,
  createReceipt,
  deleteReceipt
};

export default userService;
