// مكتبة لتوحيد معالجة الأخطاء في التطبيق
import { toast } from 'react-toastify';

// أنواع الأخطاء الشائعة في Firebase
const FIREBASE_ERROR_CODES = {
  // أخطاء المصادقة
  'auth/user-not-found': 'لم يتم العثور على المستخدم',
  'auth/wrong-password': 'كلمة المرور غير صحيحة',
  'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
  'auth/weak-password': 'كلمة المرور ضعيفة جدًا',
  'auth/invalid-email': 'البريد الإلكتروني غير صالح',
  'auth/too-many-requests': 'تم تجاوز الحد المسموح به من المحاولات، يرجى المحاولة لاحقًا',
  'auth/user-disabled': 'تم تعطيل هذا الحساب',
  'auth/requires-recent-login': 'تحتاج إلى إعادة تسجيل الدخول لإجراء هذه العملية',
  
  // أخطاء Firestore
  'permission-denied': 'ليس لديك صلاحية للقيام بهذه العملية',
  'not-found': 'لم يتم العثور على المستند المطلوب',
  'already-exists': 'المستند موجود بالفعل',
  'resource-exhausted': 'تم تجاوز حد الاستخدام، يرجى المحاولة لاحقًا',
  'failed-precondition': 'فشلت العملية بسبب حالة النظام الحالية',
  'unavailable': 'الخدمة غير متاحة حاليًا، يرجى المحاولة لاحقًا',
  
  // أخطاء عامة
  'network-error': 'حدث خطأ في الاتصال بالشبكة',
  'unknown': 'حدث خطأ غير معروف'
};

/**
 * معالجة أخطاء Firebase وعرض رسالة مناسبة للمستخدم
 * @param {Error} error - كائن الخطأ
 * @param {string} customMessage - رسالة مخصصة (اختياري)
 * @param {Function} callback - دالة يتم استدعاؤها بعد معالجة الخطأ (اختياري)
 */
export const handleFirebaseError = (error, customMessage = null, callback = null) => {
  console.error('Firebase Error:', error);
  
  // استخراج رمز الخطأ
  const errorCode = error.code || (error.message && error.message.includes('Firebase') ? 'unknown' : null);
  
  // تحديد رسالة الخطأ المناسبة
  let errorMessage = customMessage || 'حدث خطأ أثناء تنفيذ العملية';
  
  if (errorCode && FIREBASE_ERROR_CODES[errorCode]) {
    errorMessage = FIREBASE_ERROR_CODES[errorCode];
  } else if (error.message) {
    // إذا كانت الرسالة طويلة جدًا، نعرض جزءًا منها فقط
    const shortMessage = error.message.length > 100 
      ? error.message.substring(0, 100) + '...' 
      : error.message;
    
    errorMessage = customMessage 
      ? `${customMessage}: ${shortMessage}`
      : shortMessage;
  }
  
  // عرض رسالة الخطأ للمستخدم
  toast.error(errorMessage, {
    position: 'top-center',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  });
  
  // استدعاء دالة callback إذا تم تمريرها
  if (typeof callback === 'function') {
    callback(error);
  }
  
  return errorMessage;
};

/**
 * تسجيل خطأ في وحدة التحكم وعرض رسالة للمستخدم
 * @param {Error|string} error - كائن الخطأ أو رسالة الخطأ
 * @param {string} context - سياق الخطأ (اسم الوظيفة أو المكون)
 * @param {string} customMessage - رسالة مخصصة للمستخدم (اختياري)
 */
export const logError = (error, context, customMessage = null) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  console.error(`[${context}] Error:`, errorObj);
  
  if (customMessage) {
    toast.error(customMessage, {
      position: 'top-center',
      autoClose: 5000
    });
  }
};

/**
 * عرض رسالة نجاح للمستخدم
 * @param {string} message - رسالة النجاح
 */
export const showSuccess = (message) => {
  toast.success(message, {
    position: 'top-center',
    autoClose: 3000
  });
};

export default {
  handleFirebaseError,
  logError,
  showSuccess
};
