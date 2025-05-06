/**
 * وظائف مساعدة للتحقق من صحة البيانات
 */

/**
 * التحقق من صحة البريد الإلكتروني
 * @param {string} email - البريد الإلكتروني المراد التحقق منه
 * @returns {boolean} - نتيجة التحقق
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * التحقق من صحة رقم الهاتف
 * @param {string} phone - رقم الهاتف المراد التحقق منه
 * @returns {boolean} - نتيجة التحقق
 */
export const isValidPhone = (phone) => {
  // يقبل أرقام الهاتف بالصيغ المختلفة مثل: +966501234567, 0501234567, 501234567
  const phoneRegex = /^(\+?\d{1,3})?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
  return phoneRegex.test(phone);
};

/**
 * التحقق من صحة رقم جواز السفر
 * @param {string} passport - رقم جواز السفر المراد التحقق منه
 * @returns {boolean} - نتيجة التحقق
 */
export const isValidPassport = (passport) => {
  // يقبل أرقام جوازات السفر المكونة من أحرف وأرقام (8-9 خانات)
  const passportRegex = /^[A-Z0-9]{8,9}$/i;
  return passportRegex.test(passport);
};

/**
 * التحقق من صحة رقم جواز السفر (صيغة أكثر مرونة لمختلف الدول)
 * @param {string} passportNumber - رقم جواز السفر المراد التحقق منه
 * @returns {boolean} - نتيجة التحقق
 */
export const isValidPassportNumber = (passportNumber) => {
  if (!passportNumber) return false;
  
  // يقبل أرقام جوازات السفر المكونة من أحرف وأرقام (5-15 خانة)
  // أكثر مرونة للتعامل مع مختلف صيغ جوازات السفر حول العالم
  const passportRegex = /^[A-Z0-9]{5,15}$/i;
  return passportRegex.test(passportNumber.trim());
};

/**
 * التحقق من صحة التاريخ
 * @param {string|Date} date - التاريخ المراد التحقق منه
 * @returns {boolean} - نتيجة التحقق
 */
export const isValidDate = (date) => {
  if (!date) return false;
  
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

/**
 * التحقق من أن التاريخ في المستقبل
 * @param {string|Date} date - التاريخ المراد التحقق منه
 * @returns {boolean} - نتيجة التحقق
 */
export const isFutureDate = (date) => {
  if (!isValidDate(date)) return false;
  
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return dateObj >= today;
};

/**
 * التحقق من صحة المبلغ المالي
 * @param {number|string} amount - المبلغ المراد التحقق منه
 * @returns {boolean} - نتيجة التحقق
 */
export const isValidAmount = (amount) => {
  if (typeof amount === 'string') {
    amount = parseFloat(amount);
  }
  
  return !isNaN(amount) && amount >= 0;
};

/**
 * التحقق من أن القيمة غير فارغة
 * @param {any} value - القيمة المراد التحقق منها
 * @returns {boolean} - نتيجة التحقق
 */
export const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  
  if (typeof value === 'string') {
    return value.trim() !== '';
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  
  return true;
};

/**
 * التحقق من صحة الرقم الوطني السعودي
 * @param {string} id - الرقم الوطني المراد التحقق منه
 * @returns {boolean} - نتيجة التحقق
 */
export const isValidSaudiId = (id) => {
  // الرقم الوطني السعودي يتكون من 10 أرقام ويبدأ بـ 1 أو 2
  const idRegex = /^[12]\d{9}$/;
  return idRegex.test(id);
};

/**
 * التحقق من صحة رقم التأشيرة
 * @param {string} visaNumber - رقم التأشيرة المراد التحقق منه
 * @returns {boolean} - نتيجة التحقق
 */
export const isValidVisaNumber = (visaNumber) => {
  // رقم التأشيرة يتكون من أحرف وأرقام (8-12 خانة)
  const visaRegex = /^[A-Z0-9]{8,12}$/i;
  return visaRegex.test(visaNumber);
};

/**
 * التحقق من صحة رقم الرحلة
 * @param {string} flightNumber - رقم الرحلة المراد التحقق منه
 * @returns {boolean} - نتيجة التحقق
 */
export const isValidFlightNumber = (flightNumber) => {
  // رقم الرحلة يتكون من حرفين متبوعين بـ 3-4 أرقام (مثل SV123)
  const flightRegex = /^[A-Z]{2}\d{3,4}$/i;
  return flightRegex.test(flightNumber);
};

/**
 * تنسيق رقم الهاتف
 * @param {string} phone - رقم الهاتف المراد تنسيقه
 * @returns {string} - رقم الهاتف المنسق
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  // إزالة جميع الأحرف غير الرقمية
  const digits = phone.replace(/\D/g, '');
  
  // إذا كان الرقم يبدأ بـ 00 أو +، نستبدلها بـ +
  if (digits.startsWith('00')) {
    return '+' + digits.substring(2);
  }
  
  // إذا كان الرقم سعودي ويبدأ بـ 0، نستبدله بـ +966
  if (digits.startsWith('0') && digits.length === 10) {
    return '+966' + digits.substring(1);
  }
  
  // إذا كان الرقم سعودي بدون 0 في البداية، نضيف +966
  if (digits.length === 9 && (digits.startsWith('5') || digits.startsWith('9'))) {
    return '+966' + digits;
  }
  
  // إذا كان الرقم يحتوي على مفتاح دولة، نضيف +
  if (digits.length > 10) {
    return '+' + digits;
  }
  
  return phone;
};

/**
 * تنسيق المبلغ المالي
 * @param {number|string} amount - المبلغ المراد تنسيقه
 * @param {string} currency - العملة (يتم تجاهلها وسيتم استخدام الدينار الكويتي دائمًا)
 * @returns {string} - المبلغ المنسق بالدينار الكويتي
 */
export const formatAmount = (amount, currency = 'KWD') => {
  if (!isValidAmount(amount)) return '';
  
  // استخدام الدينار الكويتي دائمًا بغض النظر عن العملة المدخلة
  const formatter = new Intl.NumberFormat('ar-KW', {
    style: 'currency',
    currency: 'KWD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });
  
  return formatter.format(amount);
};

/**
 * تنسيق التاريخ
 * @param {string|Date} date - التاريخ المراد تنسيقه
 * @param {string} format - صيغة التنسيق (اختياري)
 * @returns {string} - التاريخ المنسق
 */
export const formatDate = (date, format = 'long') => {
  if (!isValidDate(date)) return '';
  
  const dateObj = new Date(date);
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('ar-SA');
  }
  
  if (format === 'time') {
    return dateObj.toLocaleTimeString('ar-SA');
  }
  
  if (format === 'datetime') {
    return dateObj.toLocaleString('ar-SA');
  }
  
  // التنسيق الطويل الافتراضي
  return dateObj.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// تصدير جميع الدوال
export default {
  isValidEmail,
  isValidPhone,
  isValidPassport,
  isValidPassportNumber,
  isValidDate,
  isFutureDate,
  isValidAmount,
  isNotEmpty,
  isValidSaudiId,
  isValidVisaNumber,
  isValidFlightNumber,
  formatPhone,
  formatAmount,
  formatDate
};
