import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseServices from '../../firebase';

const { db } = firebaseServices;
const COLLECTION_NAME = 'users';

/**
 * خدمة إدارة الموظفين
 * توفر واجهة موحدة للتعامل مع بيانات الموظفين في قاعدة البيانات
 */
class EmployeeService {
  /**
   * الحصول على جميع الموظفين
   * @param {number} limitCount - عدد الموظفين المطلوب (اختياري)
   * @returns {Promise<Array>} - قائمة الموظفين
   */
  async getAllEmployees(limitCount = 100) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('خطأ في جلب بيانات الموظفين:', error);
      throw error;
    }
  }

  /**
   * البحث عن موظفين
   * @param {Object} filters - معايير البحث
   * @returns {Promise<Array>} - نتائج البحث
   */
  async searchEmployees(filters = {}) {
    try {
      let q = collection(db, COLLECTION_NAME);
      
      // إنشاء الاستعلام بناءً على المعايير المقدمة
      const queryConstraints = [];
      
      if (filters.role) {
        queryConstraints.push(where('role', '==', filters.role));
      }
      
      if (filters.jobTitle) {
        queryConstraints.push(where('jobTitle', '==', filters.jobTitle));
      }
      
      if (filters.active !== undefined) {
        queryConstraints.push(where('active', '==', filters.active));
      }
      
      // إضافة الترتيب والحد الأقصى
      queryConstraints.push(orderBy('createdAt', 'desc'));
      queryConstraints.push(limit(filters.limit || 100));
      
      q = query(q, ...queryConstraints);
      
      const querySnapshot = await getDocs(q);
      let results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // تصفية إضافية على جانب العميل إذا لزم الأمر
      if (filters.name) {
        const searchTerm = filters.name.toLowerCase();
        results = results.filter(employee => 
          employee.name && employee.name.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.email) {
        const searchTerm = filters.email.toLowerCase();
        results = results.filter(employee => 
          employee.email && employee.email.toLowerCase().includes(searchTerm)
        );
      }
      
      return results;
    } catch (error) {
      console.error('خطأ في البحث عن الموظفين:', error);
      throw error;
    }
  }

  /**
   * الحصول على موظف بواسطة المعرف
   * @param {string} id - معرف الموظف
   * @returns {Promise<Object|null>} - بيانات الموظف
   */
  async getEmployeeById(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`خطأ في جلب بيانات الموظف (${id}):`, error);
      throw error;
    }
  }

  /**
   * إنشاء موظف جديد
   * @param {Object} employeeData - بيانات الموظف
   * @returns {Promise<Object>} - بيانات الموظف المنشأ
   */
  async createEmployee(employeeData) {
    try {
      // التحقق من البيانات الأساسية
      if (!employeeData.name || !employeeData.email || !employeeData.password) {
        throw new Error('الاسم والبريد الإلكتروني وكلمة المرور مطلوبة');
      }
      
      // إنشاء حساب المستخدم في Firebase Authentication
      // const result = await createUser({
      //   email: employeeData.email,
      //   password: employeeData.password,
      //   name: employeeData.name,
      //   role: employeeData.role || 'employee',
      //   jobTitle: employeeData.jobTitle || 'موظف'
      // });
      
      // if (!result.success) {
      //   throw new Error(result.error || 'فشل في إنشاء حساب المستخدم');
      // }
      
      // إضافة البيانات الإضافية للموظف
      const employeeWithoutPassword = { ...employeeData };
      delete employeeWithoutPassword.password;
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...employeeWithoutPassword,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...employeeWithoutPassword
      };
    } catch (error) {
      console.error('خطأ في إنشاء الموظف:', error);
      throw error;
    }
  }

  /**
   * تحديث بيانات موظف
   * @param {string} id - معرف الموظف
   * @param {Object} employeeData - بيانات الموظف المحدثة
   * @returns {Promise<Object>} - بيانات الموظف المحدثة
   */
  async updateEmployee(id, employeeData) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      // التأكد من عدم تحديث البريد الإلكتروني وكلمة المرور هنا
      // (يجب استخدام دوال Firebase Authentication لذلك)
      const employeeWithoutAuth = { ...employeeData };
      delete employeeWithoutAuth.email;
      delete employeeWithoutAuth.password;
      
      await updateDoc(docRef, {
        ...employeeWithoutAuth,
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        ...employeeWithoutAuth
      };
    } catch (error) {
      console.error(`خطأ في تحديث بيانات الموظف (${id}):`, error);
      throw error;
    }
  }

  /**
   * تغيير حالة نشاط موظف
   * @param {string} id - معرف الموظف
   * @param {boolean} active - حالة النشاط الجديدة
   * @returns {Promise<Object>} - بيانات الموظف المحدثة
   */
  async toggleEmployeeStatus(id, active) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      await updateDoc(docRef, {
        active,
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        active
      };
    } catch (error) {
      console.error(`خطأ في تغيير حالة نشاط الموظف (${id}):`, error);
      throw error;
    }
  }

  /**
   * تحديث صلاحيات موظف
   * @param {string} id - معرف الموظف
   * @param {string} role - الدور الجديد
   * @param {Array} permissions - الصلاحيات الجديدة
   * @returns {Promise<Object>} - بيانات الموظف المحدثة
   */
  async updateEmployeePermissions(id, role, permissions = []) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      await updateDoc(docRef, {
        role,
        permissions,
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        role,
        permissions
      };
    } catch (error) {
      console.error(`خطأ في تحديث صلاحيات الموظف (${id}):`, error);
      throw error;
    }
  }

  /**
   * الحصول على الرقم التسلسلي التالي للإيصال
   * @returns {Promise<string>} - رقم الإيصال التالي
   */
  async getNextReceiptCode() {
    try {
      // الحصول على آخر إيصال
      const q = query(
        collection(db, 'receipts'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // لا توجد إيصالات سابقة، نبدأ من 1001
        return 'RCT-1001';
      }
      
      const lastReceipt = querySnapshot.docs[0].data();
      const lastReceiptCode = lastReceipt.receiptCode || 'RCT-1000';
      
      // استخراج الرقم من الكود
      const matches = lastReceiptCode.match(/RCT-(\d+)/);
      
      if (!matches || matches.length < 2) {
        // تنسيق غير صالح، نبدأ من 1001
        return 'RCT-1001';
      }
      
      // زيادة الرقم بمقدار 1
      const nextNumber = parseInt(matches[1]) + 1;
      return `RCT-${nextNumber}`;
    } catch (error) {
      console.error('خطأ في جلب رقم الإيصال التالي:', error);
      // في حالة الخطأ، نعيد قيمة افتراضية
      return 'RCT-' + Date.now();
    }
  }

  /**
   * إنشاء إيصال جديد
   * @param {Object} receiptData - بيانات الإيصال
   * @returns {Promise<Object>} - بيانات الإيصال المنشأ
   */
  async createReceipt(receiptData) {
    try {
      // التحقق من البيانات الأساسية
      if (!receiptData.receiptNumber || !receiptData.amount) {
        throw new Error('رقم الإيصال والمبلغ مطلوبان');
      }
      
      const docRef = await addDoc(collection(db, 'receipts'), {
        ...receiptData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...receiptData
      };
    } catch (error) {
      console.error('خطأ في إنشاء الإيصال:', error);
      throw error;
    }
  }

  /**
   * الحصول على جميع الإيصالات
   * @param {Object} filters - معايير البحث
   * @returns {Promise<Array>} - قائمة الإيصالات
   */
  async getReceipts(filters = {}) {
    try {
      let q = collection(db, 'receipts');
      
      // إنشاء الاستعلام بناءً على المعايير المقدمة
      const queryConstraints = [];
      
      if (filters.employeeId) {
        queryConstraints.push(where('employeeId', '==', filters.employeeId));
      }
      
      if (filters.customerId) {
        queryConstraints.push(where('customerId', '==', filters.customerId));
      }
      
      if (filters.startDate && filters.endDate) {
        queryConstraints.push(where('createdAt', '>=', new Date(filters.startDate)));
        queryConstraints.push(where('createdAt', '<=', new Date(filters.endDate)));
      }
      
      // إضافة الترتيب والحد الأقصى
      queryConstraints.push(orderBy('createdAt', 'desc'));
      queryConstraints.push(limit(filters.limit || 100));
      
      q = query(q, ...queryConstraints);
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('خطأ في جلب بيانات الإيصالات:', error);
      throw error;
    }
  }
}

// إنشاء نسخة واحدة من الخدمة للاستخدام في جميع أنحاء التطبيق
const employeeService = new EmployeeService();

export default employeeService;
