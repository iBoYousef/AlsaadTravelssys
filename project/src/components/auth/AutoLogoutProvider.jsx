import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@chakra-ui/react';

// المدة الافتراضية لعدم النشاط قبل تسجيل الخروج التلقائي (30 دقيقة)
const DEFAULT_INACTIVITY_TIMEOUT = 30 * 60 * 1000;

/**
 * مكون لتنفيذ آلية تسجيل الخروج التلقائي بعد فترة من عدم النشاط
 * @param {Object} props - خصائص المكون
 * @param {React.ReactNode} props.children - العناصر الفرعية
 * @param {number} props.timeout - المدة بالمللي ثانية قبل تسجيل الخروج (الافتراضي: 30 دقيقة)
 */
const AutoLogoutProvider = ({ children, timeout = DEFAULT_INACTIVITY_TIMEOUT }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const timerRef = useRef(null);
  
  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // إعادة تعيين المؤقت فقط إذا كان المستخدم مسجل الدخول
    if (user) {
      timerRef.current = setTimeout(() => {
        // تسجيل الخروج وتوجيه المستخدم إلى صفحة تسجيل الدخول
        logout();
        navigate('/login');
        toast({
          title: 'تسجيل خروج تلقائي',
          description: 'تم تسجيل خروجك تلقائيًا بسبب عدم النشاط',
          status: 'info',
          duration: 5000,
          isClosable: true,
          position: 'top'
        });
      }, timeout);
    }
  };
  
  useEffect(() => {
    // إنشاء مستمعي الأحداث لإعادة تعيين المؤقت عند نشاط المستخدم
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // إعادة تعيين المؤقت عند تحميل المكون
    resetTimer();
    
    // إضافة مستمعي الأحداث
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });
    
    // إزالة مستمعي الأحداث عند إزالة المكون
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [user, logout, navigate, timeout]);
  
  return <>{children}</>;
};

export default AutoLogoutProvider;
