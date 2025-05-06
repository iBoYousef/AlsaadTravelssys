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
const COLLECTION_NAME = 'tourPackages';
const BOOKINGS_COLLECTION = 'tourBookings';

/**
 * خدمة إدارة البرامج السياحية
 * توفر واجهة موحدة للتعامل مع بيانات البرامج السياحية والحجوزات في قاعدة البيانات
 */
class TourPackageService {
  /**
   * الحصول على جميع البرامج السياحية
   * @param {number} limitCount - عدد البرامج المطلوب (اختياري)
   * @returns {Promise<Array>} - قائمة البرامج
   */
  async getAllPackages(limitCount = 100) {
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
      console.error('خطأ في جلب بيانات البرامج السياحية:', error);
      throw error;
    }
  }

  /**
   * البحث عن برامج سياحية
   * @param {Object} filters - معايير البحث
   * @returns {Promise<Array>} - نتائج البحث
   */
  async searchPackages(filters = {}) {
    try {
      let q = collection(db, COLLECTION_NAME);
      
      // إنشاء الاستعلام بناءً على المعايير المقدمة
      const queryConstraints = [];
      
      if (filters.destination) {
        queryConstraints.push(where('destination', '==', filters.destination));
      }
      
      if (filters.duration) {
        queryConstraints.push(where('duration', '==', filters.duration));
      }
      
      if (filters.active !== undefined) {
        queryConstraints.push(where('active', '==', filters.active));
      }
      
      if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
        queryConstraints.push(where('price', '>=', filters.priceMin));
        queryConstraints.push(where('price', '<=', filters.priceMax));
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
        results = results.filter(pkg => 
          pkg.name && pkg.name.toLowerCase().includes(searchTerm)
        );
      }
      
      return results;
    } catch (error) {
      console.error('خطأ في البحث عن البرامج السياحية:', error);
      throw error;
    }
  }

  /**
   * الحصول على برنامج سياحي بواسطة المعرف
   * @param {string} id - معرف البرنامج
   * @returns {Promise<Object|null>} - بيانات البرنامج
   */
  async getPackageById(id) {
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
      console.error(`خطأ في جلب بيانات البرنامج السياحي (${id}):`, error);
      throw error;
    }
  }

  /**
   * إنشاء برنامج سياحي جديد
   * @param {Object} packageData - بيانات البرنامج
   * @returns {Promise<Object>} - بيانات البرنامج المنشأ
   */
  async createPackage(packageData) {
    try {
      // التحقق من البيانات الأساسية
      if (!packageData.name || !packageData.destination || !packageData.price) {
        throw new Error('الاسم والوجهة والسعر مطلوبة');
      }
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...packageData,
        active: packageData.active !== undefined ? packageData.active : true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...packageData
      };
    } catch (error) {
      console.error('خطأ في إنشاء البرنامج السياحي:', error);
      throw error;
    }
  }

  /**
   * تحديث بيانات برنامج سياحي
   * @param {string} id - معرف البرنامج
   * @param {Object} packageData - بيانات البرنامج المحدثة
   * @returns {Promise<Object>} - بيانات البرنامج المحدثة
   */
  async updatePackage(id, packageData) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      await updateDoc(docRef, {
        ...packageData,
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        ...packageData
      };
    } catch (error) {
      console.error(`خطأ في تحديث بيانات البرنامج السياحي (${id}):`, error);
      throw error;
    }
  }

  /**
   * حذف برنامج سياحي
   * @param {string} id - معرف البرنامج
   * @returns {Promise<boolean>} - نجاح العملية
   */
  async deletePackage(id) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return true;
    } catch (error) {
      console.error(`خطأ في حذف البرنامج السياحي (${id}):`, error);
      throw error;
    }
  }

  /**
   * تغيير حالة نشاط برنامج سياحي
   * @param {string} id - معرف البرنامج
   * @param {boolean} active - حالة النشاط الجديدة
   * @returns {Promise<Object>} - بيانات البرنامج المحدثة
   */
  async togglePackageStatus(id, active) {
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
      console.error(`خطأ في تغيير حالة نشاط البرنامج السياحي (${id}):`, error);
      throw error;
    }
  }

  /**
   * إنشاء حجز برنامج سياحي
   * @param {Object} bookingData - بيانات الحجز
   * @returns {Promise<Object>} - بيانات الحجز المنشأ
   */
  async createBooking(bookingData) {
    try {
      // التحقق من البيانات الأساسية
      if (!bookingData.packageId || !bookingData.customerId) {
        throw new Error('معرف البرنامج ومعرف العميل مطلوبان');
      }
      
      // التحقق من وجود البرنامج
      const packageData = await this.getPackageById(bookingData.packageId);
      if (!packageData) {
        throw new Error('البرنامج السياحي غير موجود');
      }
      
      // إضافة معلومات البرنامج إلى الحجز
      const bookingWithPackageInfo = {
        ...bookingData,
        packageName: packageData.name,
        packageDestination: packageData.destination,
        packageDuration: packageData.duration,
        packagePrice: packageData.price,
        status: bookingData.status || 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // إنشاء الحجز
      const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), bookingWithPackageInfo);
      
      return {
        id: docRef.id,
        ...bookingWithPackageInfo
      };
    } catch (error) {
      console.error('خطأ في إنشاء حجز البرنامج السياحي:', error);
      throw error;
    }
  }

  /**
   * الحصول على جميع حجوزات البرامج السياحية
   * @param {Object} filters - معايير البحث
   * @returns {Promise<Array>} - قائمة الحجوزات
   */
  async getAllBookings(filters = {}) {
    try {
      let q = collection(db, BOOKINGS_COLLECTION);
      
      // إنشاء الاستعلام بناءً على المعايير المقدمة
      const queryConstraints = [];
      
      if (filters.packageId) {
        queryConstraints.push(where('packageId', '==', filters.packageId));
      }
      
      if (filters.customerId) {
        queryConstraints.push(where('customerId', '==', filters.customerId));
      }
      
      if (filters.employeeId) {
        queryConstraints.push(where('employeeId', '==', filters.employeeId));
      }
      
      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status));
      }
      
      if (filters.startDate && filters.endDate) {
        queryConstraints.push(where('travelDate', '>=', new Date(filters.startDate)));
        queryConstraints.push(where('travelDate', '<=', new Date(filters.endDate)));
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
      console.error('خطأ في جلب بيانات حجوزات البرامج السياحية:', error);
      throw error;
    }
  }

  /**
   * الحصول على حجز برنامج سياحي بواسطة المعرف
   * @param {string} id - معرف الحجز
   * @returns {Promise<Object|null>} - بيانات الحجز
   */
  async getBookingById(id) {
    try {
      const docRef = doc(db, BOOKINGS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`خطأ في جلب بيانات حجز البرنامج السياحي (${id}):`, error);
      throw error;
    }
  }

  /**
   * تحديث بيانات حجز برنامج سياحي
   * @param {string} id - معرف الحجز
   * @param {Object} bookingData - بيانات الحجز المحدثة
   * @returns {Promise<Object>} - بيانات الحجز المحدثة
   */
  async updateBooking(id, bookingData) {
    try {
      const docRef = doc(db, BOOKINGS_COLLECTION, id);
      
      await updateDoc(docRef, {
        ...bookingData,
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        ...bookingData
      };
    } catch (error) {
      console.error(`خطأ في تحديث بيانات حجز البرنامج السياحي (${id}):`, error);
      throw error;
    }
  }

  /**
   * تغيير حالة حجز برنامج سياحي
   * @param {string} id - معرف الحجز
   * @param {string} status - الحالة الجديدة
   * @param {string} notes - ملاحظات إضافية (اختياري)
   * @returns {Promise<Object>} - بيانات الحجز المحدثة
   */
  async changeBookingStatus(id, status, notes = '') {
    try {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('حالة الحجز غير صالحة');
      }
      
      const docRef = doc(db, BOOKINGS_COLLECTION, id);
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
      console.error(`خطأ في تغيير حالة حجز البرنامج السياحي (${id}):`, error);
      throw error;
    }
  }

  /**
   * حذف حجز برنامج سياحي
   * @param {string} id - معرف الحجز
   * @returns {Promise<boolean>} - نجاح العملية
   */
  async deleteBooking(id) {
    try {
      await deleteDoc(doc(db, BOOKINGS_COLLECTION, id));
      return true;
    } catch (error) {
      console.error(`خطأ في حذف حجز البرنامج السياحي (${id}):`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات البرامج السياحية
   * @param {Object} filters - معايير التصفية
   * @returns {Promise<Object>} - إحصائيات البرامج
   */
  async getPackageStats(filters = {}) {
    try {
      // الحصول على البرامج المطابقة للمعايير
      const packages = await this.searchPackages(filters);
      
      // الحصول على الحجوزات
      const bookings = await this.getAllBookings(filters);
      
      // حساب الإحصائيات
      const stats = {
        totalPackages: packages.length,
        activePackages: packages.filter(pkg => pkg.active).length,
        totalBookings: bookings.length,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        statusCounts: {
          pending: 0,
          confirmed: 0,
          cancelled: 0,
          completed: 0,
          refunded: 0
        },
        destinationStats: {},
        durationStats: {}
      };
      
      // حساب المبالغ والعدادات
      bookings.forEach(booking => {
        // حساب المبالغ
        const price = parseFloat(booking.payment?.price || booking.packagePrice || 0);
        const cost = parseFloat(booking.cost || 0);
        
        stats.totalRevenue += price;
        stats.totalCost += cost;
        
        // عد الحالات
        if (booking.status) {
          stats.statusCounts[booking.status] = (stats.statusCounts[booking.status] || 0) + 1;
        }
      });
      
      // إحصائيات الوجهات
      packages.forEach(pkg => {
        if (pkg.destination) {
          stats.destinationStats[pkg.destination] = (stats.destinationStats[pkg.destination] || 0) + 1;
        }
        
        if (pkg.duration) {
          stats.durationStats[pkg.duration] = (stats.durationStats[pkg.duration] || 0) + 1;
        }
      });
      
      // حساب الربح الإجمالي
      stats.totalProfit = stats.totalRevenue - stats.totalCost;
      
      return stats;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات البرامج السياحية:', error);
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
        collection(db, BOOKINGS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // لا توجد حجوزات سابقة، نبدأ من 1001
        return 'TOUR-1001';
      }
      
      const lastBooking = querySnapshot.docs[0].data();
      const lastReceiptCode = lastBooking.payment?.receiptCode || 'TOUR-1000';
      
      // استخراج الرقم من الكود
      const matches = lastReceiptCode.match(/TOUR-(\d+)/);
      
      if (!matches || matches.length < 2) {
        // تنسيق غير صالح، نبدأ من 1001
        return 'TOUR-1001';
      }
      
      // زيادة الرقم بمقدار 1
      const nextNumber = parseInt(matches[1]) + 1;
      return `TOUR-${nextNumber}`;
    } catch (error) {
      console.error('خطأ في جلب رقم الإيصال التالي:', error);
      // في حالة الخطأ، نعيد قيمة افتراضية
      return 'TOUR-' + Date.now();
    }
  }
}

// إنشاء نسخة واحدة من الخدمة للاستخدام في جميع أنحاء التطبيق
const tourPackageService = new TourPackageService();

export default tourPackageService;
