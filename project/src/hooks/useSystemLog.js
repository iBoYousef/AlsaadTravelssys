import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import systemLogService from '../services/firebase/systemLogService';

/**
 * هوك لتسجيل الأحداث في سجل النظام
 * يوفر دالة لتسجيل الأحداث مع معلومات المستخدم الحالي تلقائيًا
 */
export const useSystemLog = () => {
  const { user } = useAuth();

  /**
   * تسجيل حدث في سجل النظام
   * @param {string} actionType - نوع الإجراء (مثل: إضافة، تعديل، حذف)
   * @param {string} description - وصف الإجراء
   * @returns {Promise<Object>} - نتيجة العملية
   */
  const logAction = useCallback(async (actionType, description) => {
    if (!user) {
      console.warn('محاولة تسجيل حدث بدون مستخدم مسجل الدخول');
      return { success: false, error: 'لا يوجد مستخدم مسجل الدخول' };
    }

    try {
      // استخراج معلومات المستخدم
      const employeeId = user.employeeId ? user.employeeId.toString() : 'غير معروف';
      const employeeName = user.displayName || user.name || 'غير معروف';

      // تسجيل الحدث
      return await systemLogService.logAction(
        actionType,
        description,
        employeeId,
        employeeName
      );
    } catch (error) {
      console.error('خطأ في تسجيل الحدث:', error);
      return { success: false, error: error.message || 'حدث خطأ أثناء تسجيل الحدث' };
    }
  }, [user]);

  /**
   * التحقق من صلاحية الوصول إلى سجلات النظام
   * @returns {boolean} - هل المستخدم لديه صلاحية الوصول
   */
  const canAccessSystemLogs = useCallback(() => {
    return systemLogService.canAccessSystemLogs(user);
  }, [user]);

  return {
    logAction,
    canAccessSystemLogs
  };
};

export default useSystemLog;
