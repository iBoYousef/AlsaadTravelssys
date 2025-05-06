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
const COLLECTION_NAME = 'customers';

/**
 * خدمة إدارة العملاء
 * توفر واجهة موحدة للتعامل مع بيانات العملاء في قاعدة البيانات
 */
class CustomerService {
  /**
   * الحصول على جميع العملاء
   * @param {number} limitCount - عدد العملاء المطلوب (اختياري)
   * @returns {Promise<Array>} - قائمة العملاء
   */
  async getAllCustomers(limitCount = 100) {
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
      console.error('خطأ في جلب بيانات العملاء:', error);
      throw error;
    }
  }

  /**
   * البحث عن عملاء
   * @param {string} searchTerm - نص البحث
   * @returns {Promise<Array>} - نتائج البحث
   */
  async searchCustomers(searchTerm) {
    try {
      // نظراً لقيود Firestore في البحث النصي، سنقوم بجلب العملاء ثم تصفيتهم
      const allCustomers = await this.getAllCustomers(500);
      
      if (!searchTerm) return allCustomers;
      
      const normalizedSearchTerm = searchTerm.toLowerCase().trim();
      
      return allCustomers.filter(customer => {
        return (
          (customer.name && customer.name.toLowerCase().includes(normalizedSearchTerm)) ||
          (customer.phone && customer.phone.includes(normalizedSearchTerm)) ||
          (customer.email && customer.email.toLowerCase().includes(normalizedSearchTerm)) ||
          (customer.idNumber && customer.idNumber.includes(normalizedSearchTerm))
        );
      });
    } catch (error) {
      console.error('خطأ في البحث عن العملاء:', error);
      throw error;
    }
  }

  /**
   * الحصول على عميل بواسطة المعرف
   * @param {string} id - معرف العميل
   * @returns {Promise<Object|null>} - بيانات العميل
   */
  async getCustomerById(id) {
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
      console.error(`خطأ في جلب بيانات العميل (${id}):`, error);
      throw error;
    }
  }

  /**
   * إنشاء عميل جديد
   * @param {Object} customerData - بيانات العميل
   * @returns {Promise<Object>} - بيانات العميل المنشأ
   */
  async createCustomer(customerData) {
    // توليد رقم كودي فريد
    const generateCustomerCode = async () => {
      let code;
      let exists = true;
      while (exists) {
        code = 'C' + Math.floor(100000 + Math.random() * 900000); // مثال: C123456
        const q = query(collection(db, COLLECTION_NAME), where('customerCode', '==', code));
        const snapshot = await getDocs(q);
        exists = !snapshot.empty;
      }
      return code;
    };

    try {
      // التحقق من وجود عميل بنفس رقم الهوية
      if (customerData.idNumber) {
        const q = query(
          collection(db, COLLECTION_NAME),
          where('idNumber', '==', customerData.idNumber)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          throw new Error('يوجد عميل مسجل بنفس رقم الهوية');
        }
      }
      
      // تجاهل أي customerCode قادم من الواجهة
      const code = await generateCustomerCode();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...customerData,
        customerCode: code,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...customerData
      };
    } catch (error) {
      console.error('خطأ في إنشاء العميل:', error);
      throw error;
    }
  }

  /**
   * تحديث بيانات عميل
   * @param {string} id - معرف العميل
   * @param {Object} customerData - بيانات العميل المحدثة
   * @returns {Promise<Object>} - بيانات العميل المحدثة
   */
  async updateCustomer(id, customerData) {
    try {
      // التحقق من وجود عميل بنفس رقم الهوية (إذا تم تغيير رقم الهوية)
      if (customerData.idNumber) {
        const q = query(
          collection(db, COLLECTION_NAME),
          where('idNumber', '==', customerData.idNumber)
        );
        
        const querySnapshot = await getDocs(q);
        
        // التحقق من أن العميل الذي تم العثور عليه ليس هو نفس العميل الذي نقوم بتحديثه
        if (!querySnapshot.empty && querySnapshot.docs[0].id !== id) {
          throw new Error('يوجد عميل آخر مسجل بنفس رقم الهوية');
        }
      }
      
      const docRef = doc(db, COLLECTION_NAME, id);
      
      await updateDoc(docRef, {
        ...customerData,
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        ...customerData
      };
    } catch (error) {
      console.error(`خطأ في تحديث بيانات العميل (${id}):`, error);
      throw error;
    }
  }

  /**
   * حذف عميل
   * @param {string} id - معرف العميل
   * @returns {Promise<boolean>} - نجاح العملية
   */
  async deleteCustomer(id) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return true;
    } catch (error) {
      console.error(`خطأ في حذف العميل (${id}):`, error);
      throw error;
    }
  }

  /**
   * الحصول على مرافقي العميل
   * @param {string} customerId - معرف العميل
   * @returns {Promise<Array>} - قائمة المرافقين
   */
  async getCustomerCompanions(customerId) {
    try {
      const q = query(
        collection(db, 'companions'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`خطأ في جلب بيانات مرافقي العميل (${customerId}):`, error);
      throw error;
    }
  }

  /**
   * إضافة مرافق للعميل
   * @param {Object} companionData - بيانات المرافق
   * @returns {Promise<Object>} - بيانات المرافق المضاف
   */
  async addCompanion(companionData) {
    try {
      const docRef = await addDoc(collection(db, 'companions'), {
        ...companionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...companionData
      };
    } catch (error) {
      console.error('خطأ في إضافة المرافق:', error);
      throw error;
    }
  }

  /**
   * تحديث بيانات مرافق
   * @param {string} id - معرف المرافق
   * @param {Object} companionData - بيانات المرافق المحدثة
   * @returns {Promise<Object>} - بيانات المرافق المحدثة
   */
  async updateCompanion(id, companionData) {
    try {
      const docRef = doc(db, 'companions', id);
      
      await updateDoc(docRef, {
        ...companionData,
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        ...companionData
      };
    } catch (error) {
      console.error(`خطأ في تحديث بيانات المرافق (${id}):`, error);
      throw error;
    }
  }

  /**
   * حذف مرافق
   * @param {string} id - معرف المرافق
   * @returns {Promise<boolean>} - نجاح العملية
   */
  async deleteCompanion(id) {
    try {
      await deleteDoc(doc(db, 'companions', id));
      return true;
    } catch (error) {
      console.error(`خطأ في حذف المرافق (${id}):`, error);
      throw error;
    }
  }
}

// إنشاء نسخة واحدة من الخدمة للاستخدام في جميع أنحاء التطبيق
const customerService = new CustomerService();

export default customerService;
