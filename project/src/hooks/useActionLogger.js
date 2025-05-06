import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import systemLogService, { ACTION_TYPES, ACTION_CATEGORIES } from '../services/firebase/systemLogService';

/**
 * هوك لتسجيل الأحداث في جميع أنحاء التطبيق
 * يوفر دوال مساعدة لتسجيل أنواع مختلفة من الأحداث
 */
export const useActionLogger = () => {
  const { user } = useAuth();

  /**
   * تسجيل حدث عام
   * @param {string} actionType - نوع الإجراء
   * @param {string} description - وصف الإجراء
   * @param {string} category - فئة الإجراء
   * @param {Object} metadata - بيانات إضافية
   */
  const logAction = useCallback(
    async (actionType, description, category = '', metadata = {}) => {
      if (!user) return { success: false, error: 'لا يوجد مستخدم مسجل الدخول' };

      const employeeId = user.employeeId ? user.employeeId.toString() : 'غير معروف';
      const employeeName = user.displayName || user.name || 'غير معروف';

      return await systemLogService.logAction(
        actionType,
        description,
        employeeId,
        employeeName,
        category,
        metadata
      );
    },
    [user]
  );

  /**
   * تسجيل حدث عرض صفحة
   * @param {string} pageName - اسم الصفحة
   * @param {string} category - فئة الصفحة
   * @param {Object} metadata - بيانات إضافية
   */
  const logPageView = useCallback(
    async (pageName, category = ACTION_CATEGORIES.SYSTEM, metadata = {}) => {
      return await logAction(
        ACTION_TYPES.VIEW,
        `تم عرض صفحة ${pageName}`,
        category,
        metadata
      );
    },
    [logAction]
  );

  /**
   * تسجيل حدث إضافة
   * @param {string} entityType - نوع الكيان (مثل: عميل، حجز، موظف)
   * @param {string} entityId - معرف الكيان
   * @param {string} category - فئة الكيان
   * @param {Object} metadata - بيانات إضافية
   */
  const logCreate = useCallback(
    async (entityType, entityId = '', category = '', metadata = {}) => {
      return await logAction(
        ACTION_TYPES.CREATE,
        `تم إضافة ${entityType}${entityId ? ` برقم ${entityId}` : ''}`,
        category,
        metadata
      );
    },
    [logAction]
  );

  /**
   * تسجيل حدث تعديل
   * @param {string} entityType - نوع الكيان (مثل: عميل، حجز، موظف)
   * @param {string} entityId - معرف الكيان
   * @param {string} category - فئة الكيان
   * @param {Object} metadata - بيانات إضافية
   */
  const logUpdate = useCallback(
    async (entityType, entityId = '', category = '', metadata = {}) => {
      return await logAction(
        ACTION_TYPES.UPDATE,
        `تم تعديل ${entityType}${entityId ? ` برقم ${entityId}` : ''}`,
        category,
        metadata
      );
    },
    [logAction]
  );

  /**
   * تسجيل حدث حذف
   * @param {string} entityType - نوع الكيان (مثل: عميل، حجز، موظف)
   * @param {string} entityId - معرف الكيان
   * @param {string} category - فئة الكيان
   * @param {Object} metadata - بيانات إضافية
   */
  const logDelete = useCallback(
    async (entityType, entityId = '', category = '', metadata = {}) => {
      return await logAction(
        ACTION_TYPES.DELETE,
        `تم حذف ${entityType}${entityId ? ` برقم ${entityId}` : ''}`,
        category,
        metadata
      );
    },
    [logAction]
  );

  /**
   * تسجيل حدث بحث
   * @param {string} searchType - نوع البحث
   * @param {string} searchQuery - استعلام البحث
   * @param {string} category - فئة البحث
   * @param {Object} metadata - بيانات إضافية
   */
  const logSearch = useCallback(
    async (searchType, searchQuery = '', category = '', metadata = {}) => {
      return await logAction(
        ACTION_TYPES.SEARCH,
        `تم البحث عن ${searchType}${searchQuery ? `: ${searchQuery}` : ''}`,
        category,
        metadata
      );
    },
    [logAction]
  );

  /**
   * تسجيل حدث طباعة
   * @param {string} documentType - نوع المستند
   * @param {string} documentId - معرف المستند
   * @param {string} category - فئة المستند
   * @param {Object} metadata - بيانات إضافية
   */
  const logPrint = useCallback(
    async (documentType, documentId = '', category = '', metadata = {}) => {
      return await logAction(
        ACTION_TYPES.PRINT,
        `تم طباعة ${documentType}${documentId ? ` برقم ${documentId}` : ''}`,
        category,
        metadata
      );
    },
    [logAction]
  );

  /**
   * تسجيل حدث تصدير
   * @param {string} exportType - نوع التصدير
   * @param {string} exportFormat - صيغة التصدير
   * @param {string} category - فئة التصدير
   * @param {Object} metadata - بيانات إضافية
   */
  const logExport = useCallback(
    async (exportType, exportFormat = '', category = '', metadata = {}) => {
      return await logAction(
        ACTION_TYPES.EXPORT,
        `تم تصدير ${exportType}${exportFormat ? ` بصيغة ${exportFormat}` : ''}`,
        category,
        metadata
      );
    },
    [logAction]
  );

  /**
   * تسجيل حدث دفع
   * @param {string} paymentType - نوع الدفع
   * @param {string} amount - المبلغ
   * @param {string} category - فئة الدفع
   * @param {Object} metadata - بيانات إضافية
   */
  const logPayment = useCallback(
    async (paymentType, amount = '', category = ACTION_CATEGORIES.FINANCE, metadata = {}) => {
      return await logAction(
        ACTION_TYPES.PAYMENT,
        `تم تسجيل دفع ${paymentType}${amount ? ` بمبلغ ${amount}` : ''}`,
        category,
        metadata
      );
    },
    [logAction]
  );

  return {
    logAction,
    logPageView,
    logCreate,
    logUpdate,
    logDelete,
    logSearch,
    logPrint,
    logExport,
    logPayment,
    ACTION_TYPES,
    ACTION_CATEGORIES
  };
};

export default useActionLogger;
