import React, { useEffect } from 'react';
import useSystemLog from '../../hooks/useSystemLog';

/**
 * مكون عالي المستوى (HOC) لتسجيل الأحداث تلقائياً
 * يمكن استخدامه لتغليف أي مكون وتسجيل أحداث معينة عند تحميله أو عند تنفيذ إجراءات معينة
 * 
 * @param {React.ComponentType} WrappedComponent - المكون المراد تغليفه
 * @param {Object} options - خيارات التسجيل
 * @param {string} options.componentName - اسم المكون (سيستخدم في وصف الحدث)
 * @param {string} options.viewActionType - نوع إجراء العرض (افتراضي: "عرض")
 * @param {boolean} options.logOnMount - هل يتم تسجيل حدث العرض عند تحميل المكون (افتراضي: true)
 * @returns {React.ComponentType} - المكون المغلف مع تسجيل الأحداث
 */
const withSystemLog = (
  WrappedComponent,
  { 
    componentName, 
    viewActionType = "عرض", 
    logOnMount = true 
  }
) => {
  // إنشاء اسم للمكون المغلف
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'مكون';
  
  // إنشاء المكون المغلف
  const WithSystemLogComponent = (props) => {
    const { logAction } = useSystemLog();
    
    // تسجيل حدث العرض عند تحميل المكون
    useEffect(() => {
      if (logOnMount) {
        logAction(viewActionType, `تم ${viewActionType} ${displayName}`);
      }
    }, [logAction]);
    
    // إنشاء دالة مساعدة لتسجيل الأحداث
    const logActionWithComponent = (actionType, description) => {
      return logAction(actionType, `[${displayName}] ${description}`);
    };
    
    // تمرير دالة تسجيل الأحداث إلى المكون المغلف
    return <WrappedComponent {...props} logComponentAction={logActionWithComponent} />;
  };
  
  // تعيين اسم المكون المغلف للتسهيل في التصحيح
  WithSystemLogComponent.displayName = `WithSystemLog(${displayName})`;
  
  return WithSystemLogComponent;
};

export default withSystemLog;
