// ملف مساعد لتصفية البيانات بناءً على وضع التطبيق
import { isTestMode } from './appMode';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * تصفية البيانات بناءً على وضع التطبيق
 * @param {Array} data - مصفوفة البيانات
 * @returns {Array} - البيانات المصفاة
 */
export const filterDataByAppMode = (data) => {
  if (!Array.isArray(data)) return [];
  
  // في وضع الإنتاج، استبعد البيانات التجريبية
  if (!isTestMode()) {
    return data.filter(item => !item.isTestData);
  }
  
  // في وضع الاختبار، اعرض جميع البيانات
  return data;
};

/**
 * إنشاء استعلام مصفى بناءً على وضع التطبيق
 * @param {string} collectionName - اسم المجموعة
 * @param {string} sortField - حقل الترتيب (اختياري)
 * @param {string} sortDirection - اتجاه الترتيب (اختياري)
 * @returns {Object} - الاستعلام المصفى
 */
export const createFilteredQuery = (collectionName, sortField = 'created_at', sortDirection = 'desc') => {
  const collectionRef = collection(db, collectionName);
  
  // في وضع الإنتاج، استبعد البيانات التجريبية
  if (!isTestMode()) {
    // تجنب استخدام شرط عدم المساواة مع الترتيب على حقول مختلفة
    // بدلاً من ذلك، نستخدم الاستعلام البسيط ثم نقوم بتصفية النتائج في الكود
    return query(
      collectionRef,
      orderBy(sortField, sortDirection)
    );
  }
  
  // في وضع الاختبار، اعرض جميع البيانات
  return query(collectionRef, orderBy(sortField, sortDirection));
};

/**
 * إضافة علامة للبيانات الرئيسية
 * @param {Object} data - البيانات المراد إضافة علامة لها
 * @returns {Object} - البيانات مع العلامة
 */
export const addProductionFlag = (data) => ({
  ...data,
  isTestData: false,
  productionDataCreatedAt: new Date().toISOString()
});

/**
 * التحقق مما إذا كانت البيانات تجريبية
 * @param {Object} data - البيانات المراد التحقق منها
 * @returns {boolean} - هل البيانات تجريبية؟
 */
export const isTestData = (data) => {
  return data && data.isTestData === true;
};

/**
 * التحقق مما إذا كانت البيانات رئيسية
 * @param {Object} data - البيانات المراد التحقق منها
 * @returns {boolean} - هل البيانات رئيسية؟
 */
export const isProductionData = (data) => {
  return data && (data.isTestData === false || data.isTestData === undefined);
};
