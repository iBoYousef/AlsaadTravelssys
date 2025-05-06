// استيراد المكتبات اللازمة
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  where,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore';
import firebaseServices from './firebaseConfig';

const { db } = firebaseServices;

// تعريف أنواع الإجراءات المختلفة
export const ACTION_TYPES = {
  LOGIN: 'تسجيل دخول',
  LOGOUT: 'تسجيل خروج',
  VIEW: 'عرض',
  CREATE: 'إضافة',
  UPDATE: 'تعديل',
  DELETE: 'حذف',
  SEARCH: 'بحث',
  EXPORT: 'تصدير',
  IMPORT: 'استيراد',
  PRINT: 'طباعة',
  PAYMENT: 'دفع',
  REFUND: 'استرداد',
  APPROVE: 'موافقة',
  REJECT: 'رفض',
  CANCEL: 'إلغاء',
  SYSTEM: 'نظام'
};

// تعريف فئات الإجراءات
export const ACTION_CATEGORIES = {
  AUTH: 'المصادقة',
  CUSTOMER: 'العملاء',
  BOOKING: 'الحجوزات',
  FLIGHT: 'الطيران',
  HOTEL: 'الفنادق',
  VISA: 'التأشيرات',
  TOUR: 'البرامج السياحية',
  FINANCE: 'المالية',
  EMPLOYEE: 'الموظفين',
  SYSTEM: 'النظام',
  REPORT: 'التقارير',
  USER: 'المستخدمين'
};

/**
 * دالة تسجيل الحدث في سجل النظام
 * @param {string} actionType - نوع الإجراء (مثل: تسجيل دخول، إضافة، تعديل، حذف)
 * @param {string} description - وصف الإجراء
 * @param {string} employeeId - رقم الموظف
 * @param {string} employeeName - اسم الموظف
 * @param {string} category - فئة الإجراء (اختياري)
 * @param {Object} metadata - بيانات إضافية عن الإجراء (اختياري)
 * @param {Object} clientInfoExtra - معلومات إضافية عن العميل (اختياري)
 * @returns {Promise<Object>} - نتيجة العملية
 */
/**
 * دالة تسجيل الحدث في سجل النظام
 * @param {string} actionType - نوع الإجراء (مثل: تسجيل دخول، إضافة، تعديل، حذف)
 * @param {string} description - وصف الإجراء
 * @param {string} employeeId - رقم الموظف
 * @param {string} employeeName - اسم الموظف
 * @param {string} category - فئة الإجراء (اختياري)
 * @param {Object} metadata - بيانات إضافية عن الإجراء (اختياري)
 * @param {Object} clientInfoExtra - معلومات إضافية عن العميل (اختياري)
 * @param {Object} user - كائن المستخدم الحالي (اختياري)
 * @returns {Promise<Object>} - نتيجة العملية
 */
export const logAction = async (
  actionType, 
  description, 
  employeeId, 
  employeeName, 
  category = '', 
  metadata = {},
  clientInfoExtra = {},
  user = undefined
) => {
  try {
    // التحقق من صحة المدخلات
    if (!actionType || !description) {
      console.error('يجب توفير نوع الإجراء والوصف');
      return { success: false, error: 'يجب توفير نوع الإجراء والوصف' };
    }

    // التحقق من صحة نوع الإجراء
    if (!Object.values(ACTION_TYPES).includes(actionType)) {
      console.warn(`نوع الإجراء غير معروف: ${actionType}`);
    }

    // التحقق من صحة الفئة
    if (category && !Object.values(ACTION_CATEGORIES).includes(category)) {
      console.warn(`الفئة غير معروفة: ${category}`);
    }

    // الحصول على معلومات العميل
    const clientInfo = {
      // معلومات المتصفح والنظام
      userAgent: navigator.userAgent || 'غير متاح',
      language: navigator.language || 'غير متاح',
      platform: navigator.platform || 'غير متاح',
      vendor: navigator.vendor || 'غير متاح',
      
      // معلومات الشاشة
      screenSize: `${window.screen.width}x${window.screen.height}`,
      screenColorDepth: window.screen.colorDepth,
      
      // معلومات النافذة
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      
      // معلومات الموقع (إذا كان متاحاً)
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'غير متاح',
      
      // معلومات الاتصال
      onLine: navigator.onLine,
      connectionType: navigator.connection ? navigator.connection.effectiveType : 'غير متاح',
      
      // معلومات الجهاز
      isMobile: /Mobi|Android/i.test(navigator.userAgent),
      isTablet: /iPad|Tablet/i.test(navigator.userAgent),
      
      // الوقت المحلي للعميل
      localTime: new Date().toISOString(),
      
      // دمج أي معلومات إضافية
      ...clientInfoExtra
    };

    // تم تعطيل جلب عنوان الـ IP الخارجي بسبب مشاكل CORS أو البيئة
    clientInfo.ip = 'غير متاح';

    // إنشاء كائن السجل
    const logData = {
      actionTime: serverTimestamp(),
      actionType,
      description,
      employeeId: employeeId || 'غير معروف',
      employeeName: employeeName || 'غير معروف',
      category: category || 'عام',
      metadata: metadata || {},
      clientInfo,
      createdAt: serverTimestamp(),
      // إضافة معلومات URL الحالي
      url: window.location.href || 'غير متاح',
      // إضافة معلومات المسار الحالي
      path: window.location.pathname || 'غير متاح',
      // إضافة معلومات طريقة الوصول
      referrer: document.referrer || 'مباشر',
      // إضافة معلومات عن حالة المستخدم
      userStatus: user ? {
        isAuthenticated: !!user,
        userId: user.uid || user.userId || 'غير متاح',
        email: user.email || 'غير متاح',
        displayName: user.displayName || 'غير متاح'
      } : {
        isAuthenticated: false,
        userId: 'guest',
        email: 'غير متاح',
        displayName: 'غير متاح'
      }
    };

    // التحقق من صحة البيانات قبل الإرسال
    if (!logData.actionType || !logData.description) {
      throw new Error('بيانات السجل غير صالحة');
    }

    // إضافة السجل إلى مجموعة SystemLog
    const docRef = await addDoc(collection(db, 'SystemLog'), logData);

    // تسجيل النجاح في الكونسول
    console.log(`تم تسجيل الإجراء بنجاح: ${actionType} - ${description}`);

    return { 
      success: true, 
      logId: docRef.id,
      timestamp: logData.actionTime
    };
  } catch (error) {
    console.error('خطأ في تسجيل الحدث:', error);
    
    // تسجيل خطأ مفصل
    const errorDetails = {
      type: 'SYSTEM_ERROR',
      message: error.message,
      stack: error.stack,
      actionType,
      description,
      timestamp: new Date().toISOString()
    };
    
    console.error('تفاصيل الخطأ:', errorDetails);
    
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء تسجيل العملية',
      details: errorDetails
    };
  }
};

/**
 * دالة جلب سجلات النظام
 * @param {Object} options - خيارات الاستعلام
 * @param {number} options.limitCount - عدد السجلات المطلوبة (افتراضي: 10)
 * @param {string} options.category - فئة الإجراء للتصفية (اختياري)
 * @param {string} options.actionType - نوع الإجراء للتصفية (اختياري)
 * @param {string} options.employeeId - رقم الموظف للتصفية (اختياري)
 * @param {Date} options.startDate - تاريخ البداية للتصفية (اختياري)
 * @param {Date} options.endDate - تاريخ النهاية للتصفية (اختياري)
 * @param {string} options.clientInfo - معلومات العميل للتصفية (اختياري)
 * @param {string} options.sortBy - حقل الترتيب (افتراضي: 'actionTime')
 * @param {string} options.sortDirection - اتجاه الترتيب (افتراضي: 'desc')
 * @param {Object} options.lastDoc - آخر مستند تم جلبه للصفحات (اختياري)
 * @returns {Promise<Object>} - كائن يحتوي على سجلات النظام ومعلومات الصفحات
 */
export const getSystemLogs = async (options = {}) => {
  try {
    // التحقق من صحة الخيارات
    const {
      limitCount = 10,
      category = '',
      actionType = '',
      employeeId = '',
      startDate = '',
      endDate = '',
      clientInfo = '',
      sortBy = 'actionTime',
      sortDirection = 'desc',
      lastDoc = null
    } = options;

    // التحقق من صحة حقل الترتيب
    if (!['actionTime', 'actionType', 'category', 'employeeName'].includes(sortBy)) {
      console.warn(`حقل الترتيب غير معروف: ${sortBy}`);
      sortBy = 'actionTime';
    }

    // التحقق من صحة اتجاه الترتيب
    if (sortDirection !== 'asc' && sortDirection !== 'desc') {
      console.warn(`اتجاه الترتيب غير صحيح: ${sortDirection}`);
      sortDirection = 'desc';
    }

    // إنشاء مرجع المجموعة
    const logsRef = collection(db, 'SystemLog');
    
    // بناء الاستعلام الأساسي
    let queryConstraints = [];
    
    // إضافة شروط التصفية
    if (category) {
      queryConstraints.push(where('category', '==', category));
    }
    
    if (actionType) {
      queryConstraints.push(where('actionType', '==', actionType));
    }
    
    if (employeeId) {
      // البحث في رقم الموظف أو اسم الموظف
      queryConstraints.push(
        where('employeeId', '==', employeeId)
      );
    }
    
    if (startDate) {
      try {
        const startDateTime = new Date(startDate);
        if (isNaN(startDateTime.getTime())) {
          throw new Error('تاريخ البداية غير صالح');
        }
        startDateTime.setHours(0, 0, 0, 0);
        queryConstraints.push(
          where('actionTime', '>=', Timestamp.fromDate(startDateTime))
        );
      } catch (error) {
        console.warn('خطأ في تحليل تاريخ البداية:', error);
      }
    }
    
    if (endDate) {
      try {
        const endDateTime = new Date(endDate);
        if (isNaN(endDateTime.getTime())) {
          throw new Error('تاريخ النهاية غير صالح');
        }
        endDateTime.setHours(23, 59, 59, 999);
        queryConstraints.push(
          where('actionTime', '<=', Timestamp.fromDate(endDateTime))
        );
      } catch (error) {
        console.warn('خطأ في تحليل تاريخ النهاية:', error);
      }
    }
    
    // إضافة الترتيب
    queryConstraints.push(orderBy(sortBy, sortDirection));
    
    // إضافة حد عدد النتائج
    queryConstraints.push(limit(limitCount));
    
    // إضافة آخر مستند للصفحات
    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    }
    
    // تنفيذ الاستعلام
    const q = query(logsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    // تحضير النتائج
    const logs = [];
    let lastVisible = null;
    
    querySnapshot.forEach((doc) => {
      try {
        // تحويل البيانات إلى كائن جافاسكريبت
        const logData = { id: doc.id, ...doc.data() };
        
        // التحقق من صحة البيانات
        if (!logData.actionType || !logData.description) {
          console.warn('سجل غير صالح:', logData);
          return;
        }
        
        // تصفية إضافية على معلومات العميل (لا يمكن تنفيذها في Firestore مباشرة)
        if (clientInfo && logData.clientInfo) {
          const clientInfoStr = JSON.stringify(logData.clientInfo).toLowerCase();
          if (!clientInfoStr.includes(clientInfo.toLowerCase())) {
            return; // تخطي هذا السجل إذا لم يتطابق مع معلومات العميل
          }
        }
        
        // تحويل الطوابع الزمنية إلى كائنات Date
        if (logData.actionTime) {
          logData.actionTime = logData.actionTime.toDate();
        }
        if (logData.createdAt) {
          logData.createdAt = logData.createdAt.toDate();
        }
        
        logs.push(logData);
        lastVisible = doc;
      } catch (error) {
        console.error('خطأ في معالجة سجل:', error);
      }
    });
    
    // التحقق مما إذا كان هناك المزيد من النتائج
    let hasMore = false;
    if (lastVisible) {
      try {
        const nextQuery = query(
          logsRef,
          ...queryConstraints.slice(0, -1), // استخدام نفس الشروط باستثناء limit
          limit(1),
          startAfter(lastVisible)
        );
        const nextSnapshot = await getDocs(nextQuery);
        hasMore = !nextSnapshot.empty;
      } catch (error) {
        console.error('خطأ في التحقق من المزيد من النتائج:', error);
        hasMore = false;
      }
    }
    
    return {
      logs,
      lastDoc: lastVisible,
      hasMore,
      total: logs.length
    };
  } catch (error) {
    console.error('خطأ في جلب سجلات النظام:', error);
    
    // تسجيل خطأ مفصل
    const errorDetails = {
      type: 'SYSTEM_ERROR',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      options
    };
    
    console.error('تفاصيل الخطأ:', errorDetails);
    
    return { 
      error: error.message || 'حدث خطأ أثناء جلب سجلات النظام',
      logs: [],
      lastDoc: null,
      hasMore: false,
      details: errorDetails
    };
  }
};

/**
 * دالة التحقق من صلاحية الوصول إلى سجلات النظام
 * @param {Object} user - كائن المستخدم الحالي
 * @returns {boolean} - هل المستخدم لديه صلاحية الوصول
 */
export const canAccessSystemLogs = (user) => {
  if (!user) return false;
  
  // فقط المسؤول يمكنه الوصول إلى سجلات النظام
  return user.isAdmin || user.role === 'admin' || (user.jobTitle && user.jobTitle === 'مسؤول النظام');
};

/**
 * دالة للحصول على إحصائيات سجل النظام
 * @returns {Promise<Object>} - إحصائيات سجل النظام
 */
export const getSystemLogStats = async () => {
  try {
    // جلب جميع السجلات
    const logsRef = collection(db, 'SystemLog');
    const q = query(logsRef, orderBy('actionTime', 'desc'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: true, stats: {} };
    }

    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });

    // الحصول على التاريخ الحالي
    const now = new Date();
    
    // تاريخ قبل 30 يوم
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    // تاريخ قبل 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    // تاريخ اليوم في بداية اليوم
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // إحصائيات عامة
    const totalLogs = logs.length;
    
    // عدد السجلات في آخر 30 يوم
    const lastMonthLogs = logs.filter(log => {
      if (!log.actionTime) return false;
      const logDate = log.actionTime.seconds ? new Date(log.actionTime.seconds * 1000) : new Date(log.actionTime);
      return logDate >= thirtyDaysAgo;
    }).length;
    
    // عدد عمليات تسجيل الدخول
    const loginCount = logs.filter(log => log.actionType === ACTION_TYPES.LOGIN).length;
    
    // عدد عمليات تسجيل الدخول اليوم
    const todayLoginCount = logs.filter(log => {
      if (!log.actionTime || log.actionType !== ACTION_TYPES.LOGIN) return false;
      const logDate = log.actionTime.seconds ? new Date(log.actionTime.seconds * 1000) : new Date(log.actionTime);
      return logDate >= startOfToday;
    }).length;
    
    // عدد المستخدمين النشطين (فريد)
    const activeUsers = new Set(
      logs.filter(log => {
        if (!log.actionTime) return false;
        const logDate = log.actionTime.seconds ? new Date(log.actionTime.seconds * 1000) : new Date(log.actionTime);
        return logDate >= thirtyDaysAgo;
      }).map(log => log.employeeId)
    ).size;
    
    // عدد المستخدمين النشطين في آخر 7 أيام
    const weeklyActiveUsers = new Set(
      logs.filter(log => {
        if (!log.actionTime) return false;
        const logDate = log.actionTime.seconds ? new Date(log.actionTime.seconds * 1000) : new Date(log.actionTime);
        return logDate >= sevenDaysAgo;
      }).map(log => log.employeeId)
    ).size;
    
    // متوسط الإجراءات اليومية
    const avgDailyActions = Math.round(lastMonthLogs / 30);
    
    // متوسط الإجراءات اليومية في الأسبوع الماضي
    const lastWeekLogs = logs.filter(log => {
      if (!log.actionTime) return false;
      const logDate = log.actionTime.seconds ? new Date(log.actionTime.seconds * 1000) : new Date(log.actionTime);
      return logDate >= sevenDaysAgo;
    }).length;
    const lastWeekAvgActions = Math.round(lastWeekLogs / 7);
    
    // توزيع الإجراءات حسب النوع
    const actionTypeDistribution = {};
    logs.forEach(log => {
      if (log.actionType) {
        actionTypeDistribution[log.actionType] = (actionTypeDistribution[log.actionType] || 0) + 1;
      }
    });
    
    // توزيع الإجراءات حسب الفئة
    const categoryDistribution = {};
    logs.forEach(log => {
      if (log.category) {
        categoryDistribution[log.category] = (categoryDistribution[log.category] || 0) + 1;
      }
    });
    
    // أكثر المستخدمين نشاطاً
    const userActivityMap = {};
    logs.forEach(log => {
      if (log.employeeName) {
        const userName = log.employeeName;
        userActivityMap[userName] = (userActivityMap[userName] || 0) + 1;
      }
    });
    
    // توزيع النشاط على مدار اليوم (24 ساعة)
    const hourlyDistribution = {};
    for (let i = 0; i < 24; i++) {
      hourlyDistribution[i] = 0;
    }
    
    logs.forEach(log => {
      if (log.actionTime) {
        const logDate = log.actionTime.seconds ? new Date(log.actionTime.seconds * 1000) : new Date(log.actionTime);
        const hour = logDate.getHours();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      }
    });
    
    // توزيع النشاط حسب أيام الأسبوع
    const dayOfWeekDistribution = {
      0: 0, // الأحد
      1: 0, // الإثنين
      2: 0, // الثلاثاء
      3: 0, // الأربعاء
      4: 0, // الخميس
      5: 0, // الجمعة
      6: 0  // السبت
    };
    
    logs.forEach(log => {
      if (log.actionTime) {
        const logDate = log.actionTime.seconds ? new Date(log.actionTime.seconds * 1000) : new Date(log.actionTime);
        const dayOfWeek = logDate.getDay();
        dayOfWeekDistribution[dayOfWeek] = (dayOfWeekDistribution[dayOfWeek] || 0) + 1;
      }
    });
    
    // توزيع النشاط حسب الشهر
    const monthlyDistribution = {};
    for (let i = 0; i < 12; i++) {
      monthlyDistribution[i] = 0;
    }
    
    logs.forEach(log => {
      if (log.actionTime) {
        const logDate = log.actionTime.seconds ? new Date(log.actionTime.seconds * 1000) : new Date(log.actionTime);
        const month = logDate.getMonth();
        monthlyDistribution[month] = (monthlyDistribution[month] || 0) + 1;
      }
    });
    
    // معدل النمو في النشاط (مقارنة بالشهر السابق)
    const previousMonthDate = new Date();
    previousMonthDate.setMonth(now.getMonth() - 1);
    previousMonthDate.setDate(1);
    previousMonthDate.setHours(0, 0, 0, 0);
    
    const twoMonthsAgoDate = new Date();
    twoMonthsAgoDate.setMonth(now.getMonth() - 2);
    twoMonthsAgoDate.setDate(1);
    twoMonthsAgoDate.setHours(0, 0, 0, 0);
    
    const currentMonthDate = new Date();
    currentMonthDate.setDate(1);
    currentMonthDate.setHours(0, 0, 0, 0);
    
    const currentMonthLogs = logs.filter(log => {
      if (!log.actionTime) return false;
      const logDate = log.actionTime.seconds ? new Date(log.actionTime.seconds * 1000) : new Date(log.actionTime);
      return logDate >= currentMonthDate;
    }).length;
    
    const previousMonthLogs = logs.filter(log => {
      if (!log.actionTime) return false;
      const logDate = log.actionTime.seconds ? new Date(log.actionTime.seconds * 1000) : new Date(log.actionTime);
      return logDate >= previousMonthDate && logDate < currentMonthDate;
    }).length;
    
    const twoMonthsAgoLogs = logs.filter(log => {
      if (!log.actionTime) return false;
      const logDate = log.actionTime.seconds ? new Date(log.actionTime.seconds * 1000) : new Date(log.actionTime);
      return logDate >= twoMonthsAgoDate && logDate < previousMonthDate;
    }).length;
    
    const growthRateCurrent = previousMonthLogs > 0 ? 
      ((currentMonthLogs - previousMonthLogs) / previousMonthLogs) * 100 : 0;
    
    const growthRatePrevious = twoMonthsAgoLogs > 0 ? 
      ((previousMonthLogs - twoMonthsAgoLogs) / twoMonthsAgoLogs) * 100 : 0;
    
    // تجميع الإحصائيات
    const stats = {
      totalLogs,
      lastMonthLogs,
      loginCount,
      todayLoginCount,
      activeUsers,
      weeklyActiveUsers,
      avgDailyActions,
      lastWeekAvgActions,
      actionTypeDistribution,
      categoryDistribution,
      topUsers: userActivityMap,
      hourlyDistribution,
      dayOfWeekDistribution,
      monthlyDistribution,
      growthRateCurrent,
      growthRatePrevious,
      currentMonthLogs,
      previousMonthLogs,
      lastUpdated: new Date().toISOString()
    };

    return { success: true, stats };
  } catch (error) {
    console.error('خطأ في جلب إحصائيات سجل النظام:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء جلب إحصائيات سجل النظام' 
    };
  }
};

// تصدير الدوال
const systemLogService = {
  logAction,
  getSystemLogs,
  canAccessSystemLogs,
  getSystemLogStats,
  ACTION_TYPES,
  ACTION_CATEGORIES
};

export default systemLogService;
