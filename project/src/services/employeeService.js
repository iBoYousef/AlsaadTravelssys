import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase';

// إنشاء موظف جديد
const createEmployee = async (employeeData) => {
  try {
    const docRef = await addDoc(collection(db, 'users'), {
      ...employeeData,
      createdAt: new Date()
    });
    return { id: docRef.id, ...employeeData };
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء إنشاء الموظف');
  }
};

// تحديث بيانات موظف
const updateEmployee = async (id, employeeData) => {
  try {
    const employeeRef = doc(db, 'users', id);
    await updateDoc(employeeRef, {
      ...employeeData,
      updatedAt: new Date()
    });
    return { id, ...employeeData };
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء تحديث بيانات الموظف');
  }
};

// جلب بيانات موظف
const getEmployee = async (id) => {
  try {
    const employeeRef = doc(db, 'users', id);
    const employeeSnap = await getDoc(employeeRef);
    
    if (employeeSnap.exists()) {
      return { id: employeeSnap.id, ...employeeSnap.data() };
    } else {
      throw new Error('لم يتم العثور على الموظف');
    }
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء جلب بيانات الموظف');
  }
};

// جلب قائمة الموظفين
const getEmployees = async () => {
  try {
    const employeesQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(employeesQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء جلب قائمة الموظفين');
  }
};

// حذف موظف
const deleteEmployee = async (id) => {
  try {
    await deleteDoc(doc(db, 'users', id));
    return { success: true, message: 'تم حذف الموظف بنجاح' };
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ أثناء حذف الموظف');
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
const employeeService = {
  createEmployee,
  updateEmployee,
  getEmployee,
  getEmployees,
  deleteEmployee,
  getNextReceiptCode,
  getReceipts,
  createReceipt,
  deleteReceipt
};

export default employeeService;
