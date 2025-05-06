// أدوات لتحسين أمان التطبيق
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

// المدة الافتراضية لعدم النشاط قبل تسجيل الخروج التلقائي (30 دقيقة)
const DEFAULT_INACTIVITY_TIMEOUT = 30 * 60 * 1000;

/**
 * هوك لتسجيل الخروج التلقائي بعد فترة من عدم النشاط
 * @param {number} timeout - المدة بالمللي ثانية قبل تسجيل الخروج (الافتراضي: 30 دقيقة)
 */
export const useAutoLogout = (timeout = DEFAULT_INACTIVITY_TIMEOUT) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
        toast.info('تم تسجيل خروجك تلقائيًا بسبب عدم النشاط', {
          position: 'top-center',
          autoClose: 5000
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
};

/**
 * التحقق من صلاحية كلمة المرور
 * @param {string} password - كلمة المرور للتحقق
 * @returns {Object} - نتيجة التحقق
 */
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const isValid = password.length >= minLength &&
                 hasUpperCase &&
                 hasLowerCase &&
                 hasNumbers &&
                 hasSpecialChars;
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
  }
  
  if (!hasUpperCase) {
    errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
  }
  
  if (!hasLowerCase) {
    errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
  }
  
  if (!hasNumbers) {
    errors.push('يجب أن تحتوي على رقم واحد على الأقل');
  }
  
  if (!hasSpecialChars) {
    errors.push('يجب أن تحتوي على رمز خاص واحد على الأقل');
  }
  
  return {
    isValid,
    errors
  };
};

/**
 * تشفير البيانات الحساسة قبل تخزينها
 * @param {string} data - البيانات المراد تشفيرها
 * @param {string} key - مفتاح التشفير (اختياري)
 * @returns {string} - البيانات المشفرة
 */
export const encryptSensitiveData = (data, key = 'alsaad-secure-key') => {
  // هذه وظيفة بسيطة للتشفير، في الإنتاج يجب استخدام مكتبة تشفير قوية
  try {
    // تحويل البيانات والمفتاح إلى سلاسل نصية
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const keyStr = String(key);
    
    // تشفير بسيط باستخدام Base64 وخوارزمية XOR
    let encrypted = '';
    for (let i = 0; i < dataStr.length; i++) {
      const charCode = dataStr.charCodeAt(i) ^ keyStr.charCodeAt(i % keyStr.length);
      encrypted += String.fromCharCode(charCode);
    }
    
    // تحويل إلى Base64 للتخزين
    return btoa(encrypted);
  } catch (error) {
    console.error('خطأ في تشفير البيانات:', error);
    return '';
  }
};

/**
 * فك تشفير البيانات الحساسة
 * @param {string} encryptedData - البيانات المشفرة
 * @param {string} key - مفتاح التشفير (يجب أن يكون نفس المفتاح المستخدم للتشفير)
 * @returns {string} - البيانات الأصلية
 */
export const decryptSensitiveData = (encryptedData, key = 'alsaad-secure-key') => {
  try {
    // فك تشفير Base64
    const decoded = atob(encryptedData);
    const keyStr = String(key);
    
    // فك تشفير XOR
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ keyStr.charCodeAt(i % keyStr.length);
      decrypted += String.fromCharCode(charCode);
    }
    
    return decrypted;
  } catch (error) {
    console.error('خطأ في فك تشفير البيانات:', error);
    return '';
  }
};

export default {
  useAutoLogout,
  validatePassword,
  encryptSensitiveData,
  decryptSensitiveData
};
