import React, { useEffect } from 'react';
import useSystemLog from '../../hooks/useSystemLog';

/**
 * مكون لتسجيل الأحداث تلقائيًا
 * يمكن استخدامه لتغليف المكونات الأخرى وتسجيل أحداث معينة عند تحميلها
 * 
 * @param {Object} props - خصائص المكون
 * @param {string} props.actionType - نوع الإجراء (مثل: عرض، تعديل، إضافة)
 * @param {string} props.description - وصف الإجراء
 * @param {boolean} props.logOnMount - هل يتم تسجيل الحدث عند تحميل المكون (افتراضي: true)
 * @param {React.ReactNode} props.children - المكونات الفرعية
 */
const LogActionWrapper = ({ 
  actionType, 
  description, 
  logOnMount = true, 
  children 
}) => {
  const { logAction } = useSystemLog();

  useEffect(() => {
    if (logOnMount && actionType && description) {
      logAction(actionType, description);
    }
  }, [logOnMount, actionType, description, logAction]);

  return <>{children}</>;
};

export default LogActionWrapper;
