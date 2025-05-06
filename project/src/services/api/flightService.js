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
const COLLECTION_NAME = 'flightBookings';

/**
 * خدمة إدارة حجوزات الطيران
 * توفر واجهة موحدة للتعامل مع بيانات حجوزات الطيران في قاعدة البيانات
 */
class FlightService {
  /**
   * الحصول على جميع حجوزات الطيران
   * @param {number} limitCount - عدد الحجوزات المطلوب (اختياري)
   * @returns {Promise<Array>} - قائمة الحجوزات
   */
  async getAllBookings(limitCount = 100) {
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
      console.error('خطأ في جلب بيانات حجوزات الطيران:', error);
      throw error;
    }
  }

  /**
   * البحث عن حجوزات طيران
   * @param {Object} filters - معايير البحث
   * @returns {Promise<Array>} - نتائج البحث
   */
  async searchBookings(filters = {}) {
    try {
      let q = collection(db, COLLECTION_NAME);
      
      // إنشاء الاستعلام بناءً على المعايير المقدمة
      const queryConstraints = [];
      
      if (filters.customerId) {
        queryConstraints.push(where('customerId', '==', filters.customerId));
      }
      
      if (filters.customerName) {
        // نظراً لقيود Firestore، سنقوم بالبحث بعد جلب البيانات
      }
      
      if (filters.employeeId) {
        queryConstraints.push(where('employeeId', '==', filters.employeeId));
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
        results = results.filter(booking => 
          booking.customerName && booking.customerName.toLowerCase().includes(searchTerm)
        );
      }
      
      return results;
    } catch (error) {
      console.error('خطأ في البحث عن حجوزات الطيران:', error);
      throw error;
    }
  }

  /**
   * الحصول على حجز طيران بواسطة المعرف
   * @param {string} id - معرف الحجز
   * @returns {Promise<Object|null>} - بيانات الحجز
   */
  async getBookingById(id) {
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
      console.error(`خطأ في جلب بيانات حجز الطيران (${id}):`, error);
      throw error;
    }
  }

  /**
   * إنشاء حجز طيران جديد
   * @param {Object} bookingData - بيانات الحجز
   * @returns {Promise<Object>} - بيانات الحجز المنشأ
   */
  async createBooking(bookingData) {
    try {
      // التحقق من وجود العميل
      if (!bookingData.customerId) {
        throw new Error('معرف العميل مطلوب');
      }
      
      // التحقق من وجود رحلات طيران
      if (!bookingData.flights || bookingData.flights.length === 0) {
        throw new Error('يجب إضافة رحلة طيران واحدة على الأقل');
      }
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...bookingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: bookingData.status || 'active'
      });
      
      return {
        id: docRef.id,
        ...bookingData
      };
    } catch (error) {
      console.error('خطأ في إنشاء حجز الطيران:', error);
      throw error;
    }
  }

  /**
   * تحديث بيانات حجز طيران
   * @param {string} id - معرف الحجز
   * @param {Object} bookingData - بيانات الحجز المحدثة
   * @returns {Promise<Object>} - بيانات الحجز المحدثة
   */
  async updateBooking(id, bookingData) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      await updateDoc(docRef, {
        ...bookingData,
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        ...bookingData
      };
    } catch (error) {
      console.error(`خطأ في تحديث بيانات حجز الطيران (${id}):`, error);
      throw error;
    }
  }

  /**
   * حذف حجز طيران
   * @param {string} id - معرف الحجز
   * @returns {Promise<boolean>} - نجاح العملية
   */
  async deleteBooking(id) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return true;
    } catch (error) {
      console.error(`خطأ في حذف حجز الطيران (${id}):`, error);
      throw error;
    }
  }

  /**
   * تغيير حالة حجز طيران
   * @param {string} id - معرف الحجز
   * @param {string} status - الحالة الجديدة
   * @returns {Promise<Object>} - بيانات الحجز المحدثة
   */
  async changeBookingStatus(id, status) {
    try {
      const validStatuses = ['active', 'completed', 'cancelled', 'refunded'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('حالة الحجز غير صالحة');
      }
      
      const docRef = doc(db, COLLECTION_NAME, id);
      
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        status
      };
    } catch (error) {
      console.error(`خطأ في تغيير حالة حجز الطيران (${id}):`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات حجوزات الطيران
   * @param {Object} filters - معايير التصفية
   * @returns {Promise<Object>} - إحصائيات الحجوزات
   */
  async getBookingStats(filters = {}) {
    try {
      // الحصول على الحجوزات المطابقة للمعايير
      const bookings = await this.searchBookings(filters);
      
      // حساب الإحصائيات
      const stats = {
        totalBookings: bookings.length,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        statusCounts: {
          active: 0,
          completed: 0,
          cancelled: 0,
          refunded: 0
        }
      };
      
      // حساب المبالغ والعدادات
      bookings.forEach(booking => {
        // حساب المبالغ
        const price = parseFloat(booking.payment?.price || 0);
        const cost = booking.flights?.reduce((sum, flight) => sum + parseFloat(flight.cost || 0), 0) || 0;
        
        stats.totalRevenue += price;
        stats.totalCost += cost;
        
        // عد الحالات
        if (booking.status) {
          stats.statusCounts[booking.status] = (stats.statusCounts[booking.status] || 0) + 1;
        }
      });
      
      // حساب الربح الإجمالي
      stats.totalProfit = stats.totalRevenue - stats.totalCost;
      
      return stats;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات حجوزات الطيران:', error);
      throw error;
    }
  }

  /**
   * الحصول على الرقم التسلسلي التالي للإيصال
   * @returns {Promise<string>} - رقم الإيصال التالي
   */
  async getNextReceiptCode() {
    try {
      // الحصول على آخر حجز
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // لا توجد حجوزات سابقة، نبدأ من 1001
        return 'FLT-1001';
      }
      
      const lastBooking = querySnapshot.docs[0].data();
      const lastReceiptCode = lastBooking.payment?.receiptCode || 'FLT-1000';
      
      // استخراج الرقم من الكود
      const matches = lastReceiptCode.match(/FLT-(\d+)/);
      
      if (!matches || matches.length < 2) {
        // تنسيق غير صالح، نبدأ من 1001
        return 'FLT-1001';
      }
      
      // زيادة الرقم بمقدار 1
      const nextNumber = parseInt(matches[1]) + 1;
      return `FLT-${nextNumber}`;
    } catch (error) {
      console.error('خطأ في جلب رقم الإيصال التالي:', error);
      // في حالة الخطأ، نعيد قيمة افتراضية
      return 'FLT-' + Date.now();
    }
  }
}

// إنشاء نسخة واحدة من الخدمة للاستخدام في جميع أنحاء التطبيق
const flightService = new FlightService();

export default flightService;
