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
const COLLECTION_NAME = 'payments';

/**
 * خدمة إدارة المدفوعات والمعاملات المالية
 * توفر واجهة موحدة للتعامل مع المدفوعات في النظام
 */
class PaymentService {
  /**
   * إنشاء معاملة دفع جديدة
   * @param {Object} paymentData - بيانات المعاملة
   * @returns {Promise<Object>} - بيانات المعاملة المنشأة
   */
  async createPayment(paymentData) {
    try {
      // التحقق من البيانات الأساسية
      if (!paymentData.amount || !paymentData.method) {
        throw new Error('المبلغ وطريقة الدفع مطلوبة');
      }
      
      // إنشاء رقم إيصال فريد
      const receiptNumber = await this.getNextReceiptNumber();
      
      const payment = {
        ...paymentData,
        receiptNumber,
        status: paymentData.status || 'completed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), payment);
      
      return {
        id: docRef.id,
        ...payment
      };
    } catch (error) {
      console.error('خطأ في إنشاء معاملة الدفع:', error);
      throw error;
    }
  }

  /**
   * الحصول على معاملة دفع بواسطة المعرف
   * @param {string} id - معرف المعاملة
   * @returns {Promise<Object|null>} - بيانات المعاملة
   */
  async getPaymentById(id) {
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
      console.error(`خطأ في جلب بيانات معاملة الدفع (${id}):`, error);
      throw error;
    }
  }

  /**
   * البحث عن معاملات الدفع
   * @param {Object} filters - معايير البحث
   * @returns {Promise<Array>} - نتائج البحث
   */
  async searchPayments(filters = {}) {
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
      
      if (filters.bookingId) {
        queryConstraints.push(where('bookingId', '==', filters.bookingId));
      }
      
      if (filters.bookingType) {
        queryConstraints.push(where('bookingType', '==', filters.bookingType));
      }
      
      if (filters.method) {
        queryConstraints.push(where('method', '==', filters.method));
      }
      
      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status));
      }
      
      if (filters.minAmount !== undefined) {
        queryConstraints.push(where('amount', '>=', filters.minAmount));
      }
      
      if (filters.maxAmount !== undefined) {
        queryConstraints.push(where('amount', '<=', filters.maxAmount));
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
      console.error('خطأ في البحث عن معاملات الدفع:', error);
      throw error;
    }
  }

  /**
   * تحديث بيانات معاملة دفع
   * @param {string} id - معرف المعاملة
   * @param {Object} paymentData - بيانات المعاملة المحدثة
   * @returns {Promise<Object>} - بيانات المعاملة المحدثة
   */
  async updatePayment(id, paymentData) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      await updateDoc(docRef, {
        ...paymentData,
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        ...paymentData
      };
    } catch (error) {
      console.error(`خطأ في تحديث بيانات معاملة الدفع (${id}):`, error);
      throw error;
    }
  }

  /**
   * تغيير حالة معاملة دفع
   * @param {string} id - معرف المعاملة
   * @param {string} status - الحالة الجديدة
   * @param {string} notes - ملاحظات إضافية (اختياري)
   * @returns {Promise<Object>} - بيانات المعاملة المحدثة
   */
  async changePaymentStatus(id, status, notes = '') {
    try {
      const validStatuses = ['pending', 'completed', 'refunded', 'cancelled', 'failed'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('حالة المعاملة غير صالحة');
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
      
      await updateDoc(docRef, updateData);
      
      return {
        id,
        status,
        notes
      };
    } catch (error) {
      console.error(`خطأ في تغيير حالة معاملة الدفع (${id}):`, error);
      throw error;
    }
  }

  /**
   * إنشاء معاملة استرداد
   * @param {string} originalPaymentId - معرف معاملة الدفع الأصلية
   * @param {number} amount - المبلغ المسترد
   * @param {string} reason - سبب الاسترداد
   * @param {string} method - طريقة الاسترداد (اختياري)
   * @returns {Promise<Object>} - بيانات معاملة الاسترداد
   */
  async createRefund(originalPaymentId, amount, reason, method = null) {
    try {
      // الحصول على معاملة الدفع الأصلية
      const originalPayment = await this.getPaymentById(originalPaymentId);
      
      if (!originalPayment) {
        throw new Error('معاملة الدفع الأصلية غير موجودة');
      }
      
      // التحقق من المبلغ
      if (amount <= 0 || amount > originalPayment.amount) {
        throw new Error('مبلغ الاسترداد غير صالح');
      }
      
      // إنشاء معاملة الاسترداد
      const refundData = {
        originalPaymentId,
        amount: -amount, // قيمة سالبة للاسترداد
        method: method || originalPayment.method,
        reason,
        customerId: originalPayment.customerId,
        employeeId: originalPayment.employeeId,
        bookingId: originalPayment.bookingId,
        bookingType: originalPayment.bookingType,
        type: 'refund',
        status: 'completed'
      };
      
      const refund = await this.createPayment(refundData);
      
      // تحديث حالة المعاملة الأصلية
      if (amount === originalPayment.amount) {
        await this.changePaymentStatus(originalPaymentId, 'refunded', `تم استرداد كامل المبلغ: ${amount}`);
      } else {
        await this.changePaymentStatus(originalPaymentId, 'partially_refunded', `تم استرداد جزء من المبلغ: ${amount}`);
      }
      
      return refund;
    } catch (error) {
      console.error('خطأ في إنشاء معاملة استرداد:', error);
      throw error;
    }
  }

  /**
   * الحصول على الرقم التسلسلي التالي للإيصال
   * @returns {Promise<string>} - رقم الإيصال التالي
   */
  async getNextReceiptNumber() {
    try {
      // الحصول على آخر معاملة
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // لا توجد معاملات سابقة، نبدأ من 10001
        return 'PAY-10001';
      }
      
      const lastPayment = querySnapshot.docs[0].data();
      const lastReceiptNumber = lastPayment.receiptNumber || 'PAY-10000';
      
      // استخراج الرقم من الكود
      const matches = lastReceiptNumber.match(/PAY-(\d+)/);
      
      if (!matches || matches.length < 2) {
        // تنسيق غير صالح، نبدأ من 10001
        return 'PAY-10001';
      }
      
      // زيادة الرقم بمقدار 1
      const nextNumber = parseInt(matches[1]) + 1;
      return `PAY-${nextNumber}`;
    } catch (error) {
      console.error('خطأ في جلب رقم الإيصال التالي:', error);
      // في حالة الخطأ، نعيد قيمة افتراضية
      return 'PAY-' + Date.now();
    }
  }

  /**
   * إنشاء معاملة دفع لحجز
   * @param {string} bookingId - معرف الحجز
   * @param {string} bookingType - نوع الحجز (flight, hotel, visa, tour)
   * @param {string} customerId - معرف العميل
   * @param {string} employeeId - معرف الموظف
   * @param {number} amount - المبلغ
   * @param {string} method - طريقة الدفع
   * @param {Object} additionalData - بيانات إضافية (اختياري)
   * @returns {Promise<Object>} - بيانات المعاملة المنشأة
   */
  async createBookingPayment(bookingId, bookingType, customerId, employeeId, amount, method, additionalData = {}) {
    try {
      const paymentData = {
        bookingId,
        bookingType,
        customerId,
        employeeId,
        amount,
        method,
        type: 'payment',
        ...additionalData
      };
      
      return this.createPayment(paymentData);
    } catch (error) {
      console.error('خطأ في إنشاء معاملة دفع لحجز:', error);
      throw error;
    }
  }

  /**
   * الحصول على إجمالي المدفوعات حسب الفترة
   * @param {Date} startDate - تاريخ البداية
   * @param {Date} endDate - تاريخ النهاية
   * @returns {Promise<Object>} - إحصائيات المدفوعات
   */
  async getPaymentStats(startDate = null, endDate = null) {
    try {
      // تحديد الفترة الزمنية
      const filters = {};
      
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }
      
      // الحصول على المدفوعات
      const payments = await this.searchPayments(filters);
      
      // تهيئة الإحصائيات
      const stats = {
        totalPayments: 0,
        totalRefunds: 0,
        netAmount: 0,
        paymentMethods: {},
        bookingTypes: {},
        dailyStats: {}
      };
      
      // حساب الإحصائيات
      payments.forEach(payment => {
        const amount = parseFloat(payment.amount || 0);
        
        if (payment.type === 'refund' || amount < 0) {
          stats.totalRefunds += Math.abs(amount);
        } else {
          stats.totalPayments += amount;
        }
        
        // إحصائيات طرق الدفع
        if (payment.method) {
          if (!stats.paymentMethods[payment.method]) {
            stats.paymentMethods[payment.method] = 0;
          }
          stats.paymentMethods[payment.method] += amount;
        }
        
        // إحصائيات أنواع الحجوزات
        if (payment.bookingType) {
          if (!stats.bookingTypes[payment.bookingType]) {
            stats.bookingTypes[payment.bookingType] = 0;
          }
          stats.bookingTypes[payment.bookingType] += amount;
        }
        
        // إحصائيات يومية
        const date = payment.createdAt ? 
          (payment.createdAt.toDate ? payment.createdAt.toDate() : new Date(payment.createdAt)) : 
          new Date();
        
        const dateString = date.toISOString().split('T')[0];
        
        if (!stats.dailyStats[dateString]) {
          stats.dailyStats[dateString] = {
            date: dateString,
            payments: 0,
            refunds: 0,
            net: 0
          };
        }
        
        if (payment.type === 'refund' || amount < 0) {
          stats.dailyStats[dateString].refunds += Math.abs(amount);
        } else {
          stats.dailyStats[dateString].payments += amount;
        }
        
        stats.dailyStats[dateString].net = stats.dailyStats[dateString].payments - stats.dailyStats[dateString].refunds;
      });
      
      // حساب المبلغ الصافي
      stats.netAmount = stats.totalPayments - stats.totalRefunds;
      
      // تحويل الإحصائيات اليومية إلى مصفوفة وترتيبها
      stats.dailyStats = Object.values(stats.dailyStats).sort((a, b) => a.date.localeCompare(b.date));
      
      return stats;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المدفوعات:', error);
      throw error;
    }
  }

  /**
   * الحصول على مدفوعات العميل
   * @param {string} customerId - معرف العميل
   * @returns {Promise<Array>} - قائمة المدفوعات
   */
  async getCustomerPayments(customerId) {
    try {
      return this.searchPayments({ customerId });
    } catch (error) {
      console.error(`خطأ في جلب مدفوعات العميل (${customerId}):`, error);
      throw error;
    }
  }

  /**
   * الحصول على مدفوعات الحجز
   * @param {string} bookingId - معرف الحجز
   * @param {string} bookingType - نوع الحجز
   * @returns {Promise<Array>} - قائمة المدفوعات
   */
  async getBookingPayments(bookingId, bookingType) {
    try {
      return this.searchPayments({ bookingId, bookingType });
    } catch (error) {
      console.error(`خطأ في جلب مدفوعات الحجز (${bookingId}):`, error);
      throw error;
    }
  }
}

// إنشاء نسخة واحدة من الخدمة للاستخدام في جميع أنحاء التطبيق
const paymentService = new PaymentService();

export default paymentService;
