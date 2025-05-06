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
const COLLECTION_NAME = 'notifications';

/**
 * خدمة إدارة الإشعارات والتنبيهات
 * توفر واجهة موحدة للتعامل مع الإشعارات في النظام
 */
class NotificationService {
  /**
   * إنشاء إشعار جديد
   * @param {Object} notificationData - بيانات الإشعار
   * @returns {Promise<Object>} - بيانات الإشعار المنشأ
   */
  async createNotification(notificationData) {
    try {
      // التحقق من البيانات الأساسية
      if (!notificationData.title || !notificationData.message) {
        throw new Error('عنوان ورسالة الإشعار مطلوبة');
      }
      
      const notification = {
        ...notificationData,
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), notification);
      
      return {
        id: docRef.id,
        ...notification
      };
    } catch (error) {
      console.error('خطأ في إنشاء الإشعار:', error);
      throw error;
    }
  }

  /**
   * إنشاء إشعار للموظف
   * @param {string} employeeId - معرف الموظف
   * @param {string} title - عنوان الإشعار
   * @param {string} message - رسالة الإشعار
   * @param {string} type - نوع الإشعار (اختياري)
   * @param {Object} data - بيانات إضافية (اختياري)
   * @returns {Promise<Object>} - بيانات الإشعار المنشأ
   */
  async notifyEmployee(employeeId, title, message, type = 'info', data = {}) {
    try {
      return this.createNotification({
        recipientId: employeeId,
        recipientType: 'employee',
        title,
        message,
        type,
        data
      });
    } catch (error) {
      console.error('خطأ في إنشاء إشعار للموظف:', error);
      throw error;
    }
  }

  /**
   * إنشاء إشعار للعميل
   * @param {string} customerId - معرف العميل
   * @param {string} title - عنوان الإشعار
   * @param {string} message - رسالة الإشعار
   * @param {string} type - نوع الإشعار (اختياري)
   * @param {Object} data - بيانات إضافية (اختياري)
   * @returns {Promise<Object>} - بيانات الإشعار المنشأ
   */
  async notifyCustomer(customerId, title, message, type = 'info', data = {}) {
    try {
      return this.createNotification({
        recipientId: customerId,
        recipientType: 'customer',
        title,
        message,
        type,
        data
      });
    } catch (error) {
      console.error('خطأ في إنشاء إشعار للعميل:', error);
      throw error;
    }
  }

  /**
   * إنشاء إشعار لجميع الموظفين
   * @param {string} title - عنوان الإشعار
   * @param {string} message - رسالة الإشعار
   * @param {string} type - نوع الإشعار (اختياري)
   * @param {Object} data - بيانات إضافية (اختياري)
   * @returns {Promise<Object>} - بيانات الإشعار المنشأ
   */
  async notifyAllEmployees(title, message, type = 'info', data = {}) {
    try {
      return this.createNotification({
        recipientType: 'all_employees',
        title,
        message,
        type,
        data
      });
    } catch (error) {
      console.error('خطأ في إنشاء إشعار لجميع الموظفين:', error);
      throw error;
    }
  }

  /**
   * الحصول على إشعارات المستخدم
   * @param {string} userId - معرف المستخدم
   * @param {string} userType - نوع المستخدم (employee أو customer)
   * @param {boolean} unreadOnly - جلب الإشعارات غير المقروءة فقط
   * @param {number} limitCount - عدد الإشعارات المطلوب (اختياري)
   * @returns {Promise<Array>} - قائمة الإشعارات
   */
  async getUserNotifications(userId, userType, unreadOnly = false, limitCount = 50) {
    try {
      // إنشاء الاستعلام الأساسي
      let queryConstraints = [
        where('recipientId', '==', userId),
        where('recipientType', '==', userType),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      ];
      
      // إضافة قيد الإشعارات غير المقروءة إذا كان مطلوباً
      if (unreadOnly) {
        queryConstraints.push(where('read', '==', false));
      }
      
      // تنفيذ الاستعلام
      const q = query(collection(db, COLLECTION_NAME), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      // جلب الإشعارات العامة لهذا النوع من المستخدمين
      const allTypeQuery = query(
        collection(db, COLLECTION_NAME),
        where('recipientType', '==', `all_${userType}s`),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const allTypeSnapshot = await getDocs(allTypeQuery);
      
      // دمج النتائج
      const userNotifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const generalNotifications = allTypeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // دمج وترتيب النتائج حسب تاريخ الإنشاء
      const allNotifications = [...userNotifications, ...generalNotifications];
      allNotifications.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateB - dateA;
      });
      
      // تحديد العدد المطلوب
      return allNotifications.slice(0, limitCount);
    } catch (error) {
      console.error('خطأ في جلب إشعارات المستخدم:', error);
      throw error;
    }
  }

  /**
   * تحديث حالة قراءة الإشعار
   * @param {string} notificationId - معرف الإشعار
   * @param {boolean} read - حالة القراءة الجديدة
   * @returns {Promise<Object>} - بيانات الإشعار المحدثة
   */
  async markNotificationAsRead(notificationId, read = true) {
    try {
      const docRef = doc(db, COLLECTION_NAME, notificationId);
      
      await updateDoc(docRef, {
        read,
        updatedAt: serverTimestamp()
      });
      
      return {
        id: notificationId,
        read
      };
    } catch (error) {
      console.error(`خطأ في تحديث حالة قراءة الإشعار (${notificationId}):`, error);
      throw error;
    }
  }

  /**
   * تحديث حالة قراءة جميع إشعارات المستخدم
   * @param {string} userId - معرف المستخدم
   * @param {string} userType - نوع المستخدم (employee أو customer)
   * @returns {Promise<number>} - عدد الإشعارات التي تم تحديثها
   */
  async markAllNotificationsAsRead(userId, userType) {
    try {
      // الحصول على إشعارات المستخدم غير المقروءة
      const unreadNotifications = await this.getUserNotifications(userId, userType, true, 100);
      
      // تحديث حالة القراءة لكل إشعار
      const updatePromises = unreadNotifications.map(notification => 
        this.markNotificationAsRead(notification.id)
      );
      
      await Promise.all(updatePromises);
      
      return unreadNotifications.length;
    } catch (error) {
      console.error(`خطأ في تحديث حالة قراءة جميع إشعارات المستخدم (${userId}):`, error);
      throw error;
    }
  }

  /**
   * حذف إشعار
   * @param {string} notificationId - معرف الإشعار
   * @returns {Promise<boolean>} - نجاح العملية
   */
  async deleteNotification(notificationId) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, notificationId));
      return true;
    } catch (error) {
      console.error(`خطأ في حذف الإشعار (${notificationId}):`, error);
      throw error;
    }
  }

  /**
   * إنشاء إشعار تذكير بموعد
   * @param {string} recipientId - معرف المستلم
   * @param {string} recipientType - نوع المستلم (employee أو customer)
   * @param {string} title - عنوان التذكير
   * @param {string} message - رسالة التذكير
   * @param {Date} reminderDate - تاريخ التذكير
   * @param {Object} data - بيانات إضافية (اختياري)
   * @returns {Promise<Object>} - بيانات التذكير المنشأ
   */
  async createReminder(recipientId, recipientType, title, message, reminderDate, data = {}) {
    try {
      return this.createNotification({
        recipientId,
        recipientType,
        title,
        message,
        type: 'reminder',
        reminderDate,
        data
      });
    } catch (error) {
      console.error('خطأ في إنشاء تذكير:', error);
      throw error;
    }
  }

  /**
   * الحصول على عدد الإشعارات غير المقروءة للمستخدم
   * @param {string} userId - معرف المستخدم
   * @param {string} userType - نوع المستخدم (employee أو customer)
   * @returns {Promise<number>} - عدد الإشعارات غير المقروءة
   */
  async getUnreadCount(userId, userType) {
    try {
      // إنشاء الاستعلام للإشعارات الشخصية
      const personalQuery = query(
        collection(db, COLLECTION_NAME),
        where('recipientId', '==', userId),
        where('recipientType', '==', userType),
        where('read', '==', false)
      );
      
      // إنشاء الاستعلام للإشعارات العامة
      const generalQuery = query(
        collection(db, COLLECTION_NAME),
        where('recipientType', '==', `all_${userType}s`),
        where('read', '==', false)
      );
      
      // تنفيذ الاستعلامات
      const [personalSnapshot, generalSnapshot] = await Promise.all([
        getDocs(personalQuery),
        getDocs(generalQuery)
      ]);
      
      // حساب العدد الإجمالي
      return personalSnapshot.size + generalSnapshot.size;
    } catch (error) {
      console.error(`خطأ في حساب عدد الإشعارات غير المقروءة للمستخدم (${userId}):`, error);
      throw error;
    }
  }

  /**
   * إنشاء إشعار تلقائي عند تغيير حالة الحجز
   * @param {string} bookingType - نوع الحجز (flight, hotel, visa, tour)
   * @param {string} bookingId - معرف الحجز
   * @param {string} customerId - معرف العميل
   * @param {string} status - الحالة الجديدة
   * @param {Object} bookingDetails - تفاصيل الحجز
   * @returns {Promise<Object>} - بيانات الإشعار المنشأ
   */
  async notifyBookingStatusChange(bookingType, bookingId, customerId, status, bookingDetails) {
    try {
      // تحديد عنوان ورسالة الإشعار بناءً على نوع الحجز والحالة
      let title, message;
      
      switch (bookingType) {
        case 'flight':
          title = `تحديث حالة حجز الطيران #${bookingId}`;
          message = `تم تغيير حالة حجز الطيران الخاص بك إلى "${this._getStatusInArabic(status)}".`;
          if (bookingDetails.flightNumber) {
            message += ` رقم الرحلة: ${bookingDetails.flightNumber}`;
          }
          break;
          
        case 'hotel':
          title = `تحديث حالة حجز الفندق #${bookingId}`;
          message = `تم تغيير حالة حجز الفندق الخاص بك إلى "${this._getStatusInArabic(status)}".`;
          if (bookingDetails.hotelName) {
            message += ` اسم الفندق: ${bookingDetails.hotelName}`;
          }
          break;
          
        case 'visa':
          title = `تحديث حالة طلب التأشيرة #${bookingId}`;
          message = `تم تغيير حالة طلب التأشيرة الخاص بك إلى "${this._getStatusInArabic(status)}".`;
          if (bookingDetails.country) {
            message += ` الدولة: ${bookingDetails.country}`;
          }
          break;
          
        case 'tour':
          title = `تحديث حالة حجز البرنامج السياحي #${bookingId}`;
          message = `تم تغيير حالة حجز البرنامج السياحي الخاص بك إلى "${this._getStatusInArabic(status)}".`;
          if (bookingDetails.packageName) {
            message += ` اسم البرنامج: ${bookingDetails.packageName}`;
          }
          break;
          
        default:
          title = `تحديث حالة الحجز #${bookingId}`;
          message = `تم تغيير حالة الحجز الخاص بك إلى "${this._getStatusInArabic(status)}".`;
      }
      
      // إنشاء الإشعار
      return this.notifyCustomer(customerId, title, message, 'status_update', {
        bookingType,
        bookingId,
        status,
        ...bookingDetails
      });
    } catch (error) {
      console.error('خطأ في إنشاء إشعار تغيير حالة الحجز:', error);
      throw error;
    }
  }

  /**
   * الحصول على الترجمة العربية لحالة الحجز
   * @param {string} status - حالة الحجز بالإنجليزية
   * @returns {string} - حالة الحجز بالعربية
   * @private
   */
  _getStatusInArabic(status) {
    const statusMap = {
      pending: 'معلق',
      confirmed: 'مؤكد',
      cancelled: 'ملغي',
      completed: 'مكتمل',
      refunded: 'مسترد',
      submitted: 'مقدم',
      approved: 'موافق عليه',
      rejected: 'مرفوض',
      delivered: 'مسلم'
    };
    
    return statusMap[status] || status;
  }
}

// إنشاء نسخة واحدة من الخدمة للاستخدام في جميع أنحاء التطبيق
const notificationService = new NotificationService();

export default notificationService;
