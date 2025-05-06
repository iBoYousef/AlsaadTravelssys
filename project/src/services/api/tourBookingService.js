import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import firebaseServices from '../../firebase';

const { db } = firebaseServices;
const COLLECTION_NAME = 'tourBookings';

/**
 * خدمة إدارة حجوزات البرامج السياحية
 */
class TourBookingService {
  /**
   * جلب جميع حجوزات البرامج السياحية
   * @param {number} limitCount عدد النتائج المطلوبة
   * @returns {Promise<Array>} مصفوفة من حجوزات البرامج السياحية
   */
  async getAllBookings(limitCount = 100) {
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
  }

  /**
   * جلب حجوزات البرامج السياحية حسب حالة الحجز
   * @param {string} status حالة الحجز (pending, confirmed, cancelled, completed)
   * @param {number} limitCount عدد النتائج المطلوبة
   * @returns {Promise<Array>} مصفوفة من حجوزات البرامج السياحية
   */
  async getBookingsByStatus(status, limitCount = 100) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * جلب حجوزات البرامج السياحية لعميل معين
   * @param {string} customerId معرف العميل
   * @returns {Promise<Array>} مصفوفة من حجوزات البرامج السياحية
   */
  async getBookingsByCustomer(customerId) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * جلب حجوزات برنامج سياحي معين
   * @param {string} packageId معرف البرنامج السياحي
   * @returns {Promise<Array>} مصفوفة من حجوزات البرامج السياحية
   */
  async getBookingsByPackage(packageId) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('packageId', '==', packageId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * البحث في حجوزات البرامج السياحية
   * @param {Object} filters مرشحات البحث
   * @returns {Promise<Array>} مصفوفة من حجوزات البرامج السياحية
   */
  async searchBookings(filters = {}) {
    let q = collection(db, COLLECTION_NAME);
    
    // بناء الاستعلام حسب المرشحات
    const queryFilters = [];
    
    if (filters.status) {
      queryFilters.push(where('status', '==', filters.status));
    }
    
    if (filters.customerId) {
      queryFilters.push(where('customerId', '==', filters.customerId));
    }
    
    if (filters.packageId) {
      queryFilters.push(where('packageId', '==', filters.packageId));
    }
    
    if (filters.fromDate && filters.toDate) {
      // تحويل التواريخ إلى كائنات Date
      const fromDate = new Date(filters.fromDate);
      const toDate = new Date(filters.toDate);
      
      queryFilters.push(where('bookingDate', '>=', fromDate));
      queryFilters.push(where('bookingDate', '<=', toDate));
    }
    
    // تطبيق المرشحات على الاستعلام
    if (queryFilters.length > 0) {
      q = query(q, ...queryFilters, orderBy('createdAt', 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * جلب تفاصيل حجز برنامج سياحي
   * @param {string} id معرف الحجز
   * @returns {Promise<Object>} بيانات الحجز
   */
  async getBookingById(id) {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('الحجز غير موجود');
    }
  }

  /**
   * إنشاء حجز جديد لبرنامج سياحي
   * @param {Object} bookingData بيانات الحجز
   * @returns {Promise<Object>} بيانات الحجز المنشأ
   */
  async createBooking(bookingData) {
    if (!bookingData.packageId || !bookingData.customerId) {
      throw new Error('معرف البرنامج ومعرف العميل مطلوبان');
    }
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...bookingData,
      status: bookingData.status || 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...bookingData
    };
  }

  /**
   * تحديث حجز برنامج سياحي
   * @param {string} id معرف الحجز
   * @param {Object} bookingData بيانات الحجز المحدثة
   * @returns {Promise<Object>} بيانات الحجز المحدثة
   */
  async updateBooking(id, bookingData) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...bookingData,
      updatedAt: serverTimestamp()
    });
    
    return {
      id,
      ...bookingData
    };
  }

  /**
   * تغيير حالة حجز برنامج سياحي
   * @param {string} id معرف الحجز
   * @param {string} status الحالة الجديدة
   * @param {string} notes ملاحظات إضافية
   * @returns {Promise<Object>} بيانات الحجز المحدثة
   */
  async updateBookingStatus(id, status, notes = '') {
    const docRef = doc(db, COLLECTION_NAME, id);
    const statusUpdate = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (notes) {
      statusUpdate.statusNotes = notes;
    }
    
    await updateDoc(docRef, statusUpdate);
    
    return {
      id,
      status,
      notes
    };
  }

  /**
   * حذف حجز برنامج سياحي
   * @param {string} id معرف الحجز
   * @returns {Promise<void>}
   */
  async deleteBooking(id) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }

  /**
   * الحصول على إحصائيات حجوزات البرامج السياحية
   * @returns {Promise<Object>} إحصائيات الحجوزات
   */
  async getBookingStats() {
    const bookings = await this.getAllBookings(1000);
    
    // حساب إجمالي الحجوزات حسب الحالة
    const statusCounts = bookings.reduce((acc, booking) => {
      const status = booking.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // حساب إجمالي الإيرادات
    const totalRevenue = bookings.reduce((sum, booking) => {
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        return sum + (booking.totalAmount || 0);
      }
      return sum;
    }, 0);
    
    // حساب عدد الحجوزات الشهرية
    const monthlyBookings = bookings.reduce((acc, booking) => {
      if (booking.createdAt && booking.createdAt.toDate) {
        const date = booking.createdAt.toDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const key = `${year}-${month}`;
        
        if (!acc[key]) {
          acc[key] = {
            month,
            year,
            count: 0,
            revenue: 0
          };
        }
        
        acc[key].count += 1;
        
        if (booking.status === 'confirmed' || booking.status === 'completed') {
          acc[key].revenue += (booking.totalAmount || 0);
        }
      }
      
      return acc;
    }, {});
    
    return {
      total: bookings.length,
      statusCounts,
      totalRevenue,
      monthlyBookings: Object.values(monthlyBookings).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
    };
  }
}

// Exportar como default para mantener consistencia con otros servicios
const tourBookingService = new TourBookingService();
export default tourBookingService;

// También exportar como named export para compatibilidad con index.js
export { tourBookingService };
