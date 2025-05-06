// التحقق من صحة المدخلات
export const validateInputs = (inputs) => {
  const errors = {};
  
  // تنظيف المدخلات
  const cleanedInputs = {};
  Object.keys(inputs).forEach(key => {
    if (typeof inputs[key] === 'string') {
      cleanedInputs[key] = inputs[key].trim();
    } else {
      cleanedInputs[key] = inputs[key];
    }
  });

  // التحقق من البريد الإلكتروني
  if (!cleanedInputs.email) {
    errors.email = 'البريد الإلكتروني مطلوب';
  } else if (!/\S+@\S+\.\S+/.test(cleanedInputs.email)) {
    errors.email = 'البريد الإلكتروني غير صالح';
  }

  // التحقق من كلمة المرور
  if (!cleanedInputs.password) {
    errors.password = 'كلمة المرور مطلوبة';
  } else if (cleanedInputs.password.length < 6) {
    errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedInputs: cleanedInputs
  };
};

// معالجة أخطاء Firebase
export const handleFirebaseError = (error) => {
  console.error('Firebase error:', error);
  
  const errorMessages = {
    'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'auth/user-disabled': 'هذا الحساب معطل',
    'auth/user-not-found': 'لم يتم العثور على حساب بهذا البريد الإلكتروني',
    'auth/wrong-password': 'كلمة المرور غير صحيحة',
    'auth/email-already-in-use': 'هذا البريد الإلكتروني مستخدم بالفعل',
    'auth/weak-password': 'كلمة المرور ضعيفة جداً',
    'auth/invalid-email': 'البريد الإلكتروني غير صالح',
    'auth/too-many-requests': 'تم تجاوز عدد المحاولات المسموح بها. الرجاء المحاولة لاحقاً',
    'auth/network-request-failed': 'حدث خطأ في الاتصال بالخادم. الرجاء التحقق من اتصالك بالإنترنت'
  };
  
  return errorMessages[error.code] || error.message || 'حدث خطأ غير معروف';
};

// التحقق من الصلاحيات
export const checkPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  
  // إذا كان المستخدم لديه صلاحية 'all'، فهو يملك جميع الصلاحيات
  if (Array.isArray(user.permissions) && user.permissions.includes('all')) {
    return true;
  }
  
  // التحقق من وجود الصلاحية المحددة
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
};

// التحقق من إمكانية الوصول إلى قسم
export const canAccessSection = (user, section) => {
  if (!user) return false;
  
  // المشرف لديه وصول إلى جميع الأقسام
  if (user.role === 'admin') return true;
  
  // التحقق من الصلاحيات الخاصة بالقسم
  const sectionPermissions = {
    dashboard: ['view_dashboard'],
    users: ['manage_users', 'view_users'],
    tourPackages: ['manage_tour_packages', 'view_tour_packages'],
    bookings: ['manage_bookings', 'view_bookings'],
    customers: ['manage_customers', 'view_customers'],
    flights: ['manage_flights', 'view_flights'],
    hotels: ['manage_hotels', 'view_hotels'],
    visas: ['manage_visas', 'view_visas'],
    reports: ['view_reports'],
    settings: ['manage_settings']
  };
  
  const requiredPermissions = sectionPermissions[section] || [];
  
  if (requiredPermissions.length === 0) return false;
  
  // التحقق من وجود أي من الصلاحيات المطلوبة
  return requiredPermissions.some(permission => checkPermission(user, permission));
};

// تنسيق التاريخ
export const formatDate = (date, format = 'full') => {
  if (!date) return '';
  
  const options = {
    full: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    },
    short: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    },
    time: { 
      hour: '2-digit', 
      minute: '2-digit'
    }
  };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ar-SA', options[format] || options.full).format(dateObj);
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return date.toString();
  }
};

// تنسيق المبلغ
export const formatAmount = (amount, currency = 'KWD', decimals = 3) => {
  if (amount === null || amount === undefined) return '';
  
  try {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD', 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  } catch (error) {
    console.error('خطأ في تنسيق المبلغ:', error);
    return `${amount} د.ك`; 
  }
};

// إنشاء معرف فريد
export const generateUniqueId = (prefix = '') => {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
};

// تحويل التاريخ إلى كائن Date
export const parseDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    return new Date(dateString);
  } catch (error) {
    console.error('خطأ في تحليل التاريخ:', error);
    return null;
  }
};

// تصدير جميع الدوال
export default {
  validateInputs,
  handleFirebaseError,
  checkPermission,
  canAccessSection,
  formatDate,
  formatAmount,
  generateUniqueId,
  parseDate
};
