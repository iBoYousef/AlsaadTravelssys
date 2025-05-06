/**
 * وظائف مساعدة للنظام
 */

/**
 * الحصول على رقم عشوائي بين قيمتين
 * @param {Number} min - القيمة الدنيا
 * @param {Number} max - القيمة القصوى
 * @returns {Number} - رقم عشوائي
 */
export const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * الحصول على تاريخ عشوائي بين تاريخين
 * @param {Date} start - تاريخ البداية
 * @param {Date} end - تاريخ النهاية
 * @returns {Date} - تاريخ عشوائي
 */
export const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

/**
 * الحصول على عنصر عشوائي من مصفوفة
 * @param {Array} array - المصفوفة
 * @returns {*} - عنصر عشوائي
 */
export const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * الحصول على عدة عناصر عشوائية من مصفوفة
 * @param {Array} array - المصفوفة
 * @param {Number} count - عدد العناصر المطلوبة
 * @returns {Array} - مصفوفة بالعناصر العشوائية
 */
export const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * تحويل التاريخ إلى تنسيق ISO بدون الوقت
 * @param {Date} date - التاريخ
 * @returns {String} - التاريخ بتنسيق ISO
 */
export const formatDateToISOString = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * إنشاء معرف فريد
 * @returns {String} - معرف فريد
 */
export const generateUniqueId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * تنسيق المبلغ كعملة
 * @param {Number} amount - المبلغ
 * @param {String} currency - العملة (افتراضي: KWD)
 * @returns {String} - المبلغ منسق كعملة
 */
export const formatCurrency = (amount, currency = 'KWD') => {
  return new Intl.NumberFormat('ar-KW', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * الحصول على تاريخ مستقبلي بإضافة أيام إلى التاريخ الحالي
 * @param {Number} days - عدد الأيام
 * @returns {Date} - التاريخ المستقبلي
 */
export const getFutureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * الحصول على تاريخ سابق بطرح أيام من التاريخ الحالي
 * @param {Number} days - عدد الأيام
 * @returns {Date} - التاريخ السابق
 */
export const getPastDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

/**
 * تحويل كائن تاريخ إلى كائن Timestamp لـ Firestore
 * @param {Date} date - التاريخ
 * @returns {Object} - كائن Timestamp
 */
export const dateToTimestamp = (date) => {
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0
  };
};

/**
 * تحويل تاريخ ISO إلى كائن Date
 * @param {String} isoString - التاريخ بتنسيق ISO
 * @returns {Date} - كائن التاريخ
 */
export const isoStringToDate = (isoString) => {
  return new Date(isoString);
};

/**
 * إنشاء رقم فاتورة فريد
 * @param {String} prefix - بادئة الفاتورة
 * @returns {String} - رقم الفاتورة
 */
export const generateInvoiceNumber = (prefix = 'INV') => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${prefix}${year}${month}-${randomNum}`;
};

/**
 * إنشاء رقم إيصال فريد
 * @param {String} prefix - بادئة الإيصال
 * @returns {String} - رقم الإيصال
 */
export const generateReceiptNumber = (prefix = 'REC') => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${prefix}${year}${month}-${randomNum}`;
};
