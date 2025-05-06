// ملف للتحكم في وضع التطبيق (إنتاج أو تجريبي)
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';

// المفتاح المستخدم في التخزين المحلي
const APP_MODE_KEY = 'alsaad_app_mode';

// الأوضاع المتاحة
export const APP_MODES = {
  PRODUCTION: 'production',
  TEST: 'test'
};

// الحصول على وضع التطبيق الحالي
export const getAppMode = () => {
  const savedMode = localStorage.getItem(APP_MODE_KEY);
  // إذا لم يكن هناك وضع محفوظ، استخدم وضع الإنتاج افتراضياً
  return savedMode || APP_MODES.PRODUCTION;
};

// تعيين وضع التطبيق
export const setAppMode = (mode) => {
  if (mode === APP_MODES.PRODUCTION || mode === APP_MODES.TEST) {
    localStorage.setItem(APP_MODE_KEY, mode);
    return true;
  }
  return false;
};

// التحقق مما إذا كان التطبيق في وضع الاختبار
export const isTestMode = () => {
  return getAppMode() === APP_MODES.TEST;
};

// التحقق من وجود بيانات تجريبية
export const checkForTestData = async () => {
  try {
    const collections = [
      'customers',
      'invoices',
      'revenues',
      'expenses',
      'visas',
      'hotels',
      'flights',
      'vehicles',
      'events'
    ];
    
    for (const collectionName of collections) {
      const testDataQuery = query(
        collection(db, collectionName),
        where('isTestData', '==', true),
        limit(1)
      );
      
      const snapshot = await getDocs(testDataQuery);
      if (!snapshot.empty) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for test data:', error);
    return false;
  }
};

// تبديل وضع التطبيق
export const toggleAppMode = () => {
  const currentMode = getAppMode();
  const newMode = currentMode === APP_MODES.PRODUCTION ? APP_MODES.TEST : APP_MODES.PRODUCTION;
  setAppMode(newMode);
  return newMode;
};
