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
const COLLECTION_NAME = 'visaBookings';

/**
 * خدمة إدارة طلبات التأشيرات
 * توفر واجهة موحدة للتعامل مع بيانات طلبات التأشيرات في قاعدة البيانات
 */
class VisaService {
  /**
   * الحصول على جميع طلبات التأشيرات
   * @param {number} limitCount - عدد الطلبات المطلوب (اختياري)
   * @returns {Promise<Array>} - قائمة الطلبات
   */
  async getAllVisaApplications(limitCount = 100) {
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
      console.error('خطأ في جلب بيانات طلبات التأشيرات:', error);
      throw error;
    }
  }

  /**
   * البحث عن طلبات تأشيرات
   * @param {Object} filters - معايير البحث
   * @returns {Promise<Array>} - نتائج البحث
   */
  async searchVisaApplications(filters = {}) {
    try {
      let q = collection(db, COLLECTION_NAME);
      
      // إنشاء الاستعلام بناءً على المعايير المقدمة
      const queryConstraints = [];
      
      if (filters.customerId) {
        queryConstraints.push(where('customerId', '==', filters.customerId));
      }
      
      if (filters.employeeId) {
        queryConstraints.push(where('employeeId', '==', filters.employeeId));
      }
      
      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status));
      }
      
      if (filters.visaType) {
        queryConstraints.push(where('visaType', '==', filters.visaType));
      }
      
      if (filters.country) {
        queryConstraints.push(where('country', '==', filters.country));
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
      let results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // تصفية إضافية على جانب العميل إذا لزم الأمر
      if (filters.customerName) {
        const searchTerm = filters.customerName.toLowerCase();
        results = results.filter(application => 
          application.customerName && application.customerName.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.passportNumber) {
        const searchTerm = filters.passportNumber.toLowerCase();
        results = results.filter(application => 
          application.passportNumber && application.passportNumber.toLowerCase().includes(searchTerm)
        );
      }
      
      return results;
    } catch (error) {
      console.error('خطأ في البحث عن طلبات التأشيرات:', error);
      throw error;
    }
  }

  /**
   * الحصول على طلب تأشيرة بواسطة المعرف
   * @param {string} id - معرف الطلب
   * @returns {Promise<Object|null>} - بيانات الطلب
   */
  async getVisaApplicationById(id) {
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
      console.error(`خطأ في جلب بيانات طلب التأشيرة (${id}):`, error);
      throw error;
    }
  }

  /**
   * إنشاء طلب تأشيرة جديد
   * @param {Object} applicationData - بيانات الطلب
   * @returns {Promise<Object>} - بيانات الطلب المنشأ
   */
  async createVisaApplication(applicationData) {
    try {
      // التحقق من وجود العميل
      if (!applicationData.customerId) {
        throw new Error('معرف العميل مطلوب');
      }
      
      // التحقق من البيانات الأساسية
      if (!applicationData.visaType || !applicationData.country) {
        throw new Error('نوع التأشيرة والدولة مطلوبة');
      }
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...applicationData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: applicationData.status || 'pending'
      });
      
      return {
        id: docRef.id,
        ...applicationData
      };
    } catch (error) {
      console.error('خطأ في إنشاء طلب التأشيرة:', error);
      throw error;
    }
  }

  /**
   * تحديث بيانات طلب تأشيرة
   * @param {string} id - معرف الطلب
   * @param {Object} applicationData - بيانات الطلب المحدثة
   * @returns {Promise<Object>} - بيانات الطلب المحدثة
   */
  async updateVisaApplication(id, applicationData) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      await updateDoc(docRef, {
        ...applicationData,
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        ...applicationData
      };
    } catch (error) {
      console.error(`خطأ في تحديث بيانات طلب التأشيرة (${id}):`, error);
      throw error;
    }
  }

  /**
   * حذف طلب تأشيرة
   * @param {string} id - معرف الطلب
   * @returns {Promise<boolean>} - نجاح العملية
   */
  async deleteVisaApplication(id) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return true;
    } catch (error) {
      console.error(`خطأ في حذف طلب التأشيرة (${id}):`, error);
      throw error;
    }
  }

  /**
   * تغيير حالة طلب تأشيرة
   * @param {string} id - معرف الطلب
   * @param {string} status - الحالة الجديدة
   * @param {string} notes - ملاحظات إضافية (اختياري)
   * @returns {Promise<Object>} - بيانات الطلب المحدثة
   */
  async changeVisaStatus(id, status, notes = '') {
    try {
      const validStatuses = ['pending', 'submitted', 'approved', 'rejected', 'delivered', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('حالة الطلب غير صالحة');
      }
      
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData = {
        status,
        updatedAt: serverTimestamp(),
        statusHistory: {
          date: new Date(),
          status,
          notes
        }
      };
      
      // إذا كانت الحالة "موافق عليها"، نضيف تاريخ الموافقة
      if (status === 'approved') {
        updateData.approvalDate = new Date();
      }
      
      // إذا كانت الحالة "مسلمة"، نضيف تاريخ التسليم
      if (status === 'delivered') {
        updateData.deliveryDate = new Date();
      }
      
      await updateDoc(docRef, updateData);
      
      return {
        id,
        status,
        notes
      };
    } catch (error) {
      console.error(`خطأ في تغيير حالة طلب التأشيرة (${id}):`, error);
      throw error;
    }
  }

  /**
   * إضافة مستند لطلب تأشيرة
   * @param {string} id - معرف الطلب
   * @param {Object} document - بيانات المستند
   * @returns {Promise<Object>} - بيانات الطلب المحدثة
   */
  async addDocument(id, document) {
    try {
      if (!document.name || !document.type) {
        throw new Error('اسم ونوع المستند مطلوبان');
      }
      
      const docRef = doc(db, COLLECTION_NAME, id);
      const application = await this.getVisaApplicationById(id);
      
      if (!application) {
        throw new Error('طلب التأشيرة غير موجود');
      }
      
      const documents = application.documents || [];
      const newDocument = {
        id: Date.now().toString(),
        name: document.name,
        type: document.type,
        url: document.url || '',
        uploadDate: new Date(),
        status: document.status || 'pending'
      };
      
      await updateDoc(docRef, {
        documents: [...documents, newDocument],
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        document: newDocument
      };
    } catch (error) {
      console.error(`خطأ في إضافة مستند لطلب التأشيرة (${id}):`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات طلبات التأشيرات
   * @param {Object} filters - معايير التصفية
   * @returns {Promise<Object>} - إحصائيات الطلبات
   */
  async getVisaStats(filters = {}) {
    try {
      // الحصول على الطلبات المطابقة للمعايير
      const applications = await this.searchVisaApplications(filters);
      
      // حساب الإحصائيات
      const stats = {
        totalApplications: applications.length,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        statusCounts: {
          pending: 0,
          submitted: 0,
          approved: 0,
          rejected: 0,
          delivered: 0,
          cancelled: 0
        },
        countryStats: {},
        visaTypeStats: {}
      };
      
      // حساب المبالغ والعدادات
      applications.forEach(application => {
        // حساب المبالغ
        const price = parseFloat(application.payment?.price || 0);
        const cost = parseFloat(application.cost || 0);
        
        stats.totalRevenue += price;
        stats.totalCost += cost;
        
        // عد الحالات
        if (application.status) {
          stats.statusCounts[application.status] = (stats.statusCounts[application.status] || 0) + 1;
        }
        
        // إحصائيات الدول
        if (application.country) {
          stats.countryStats[application.country] = (stats.countryStats[application.country] || 0) + 1;
        }
        
        // إحصائيات أنواع التأشيرات
        if (application.visaType) {
          stats.visaTypeStats[application.visaType] = (stats.visaTypeStats[application.visaType] || 0) + 1;
        }
      });
      
      // حساب الربح الإجمالي
      stats.totalProfit = stats.totalRevenue - stats.totalCost;
      
      return stats;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات طلبات التأشيرات:', error);
      throw error;
    }
  }

  /**
   * الحصول على الرقم التسلسلي التالي للإيصال
   * @returns {Promise<string>} - رقم الإيصال التالي
   */
  async getNextReceiptCode() {
    try {
      // الحصول على آخر طلب
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // لا توجد طلبات سابقة، نبدأ من 1001
        return 'VSA-1001';
      }
      
      const lastApplication = querySnapshot.docs[0].data();
      const lastReceiptCode = lastApplication.payment?.receiptCode || 'VSA-1000';
      
      // استخراج الرقم من الكود
      const matches = lastReceiptCode.match(/VSA-(\d+)/);
      
      if (!matches || matches.length < 2) {
        // تنسيق غير صالح، نبدأ من 1001
        return 'VSA-1001';
      }
      
      // زيادة الرقم بمقدار 1
      const nextNumber = parseInt(matches[1]) + 1;
      return `VSA-${nextNumber}`;
    } catch (error) {
      console.error('خطأ في جلب رقم الإيصال التالي:', error);
      // في حالة الخطأ، نعيد قيمة افتراضية
      return 'VSA-' + Date.now();
    }
  }
}

// إنشاء نسخة واحدة من الخدمة للاستخدام في جميع أنحاء التطبيق
const visaService = new VisaService();

export default visaService;
