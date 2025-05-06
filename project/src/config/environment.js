/**
 * ملف تكوين البيئة
 * يحتوي على جميع متغيرات البيئة المطلوبة للتطبيق
 * ويوفر آلية موحدة للوصول إليها بغض النظر عن مصدرها
 */

// القيم الافتراضية للبيئة (تستخدم في حالة عدم توفر متغيرات البيئة)
const defaultConfig = {
  firebase: {
    adminPassword: "JpUCRAB3jpTX5v8c852ohdHkc5A2",
    apiKey: "AIzaSyA8y1d9dM0Kd8QQCq4DYwasJGOi4TH7dw8",
    authDomain: "alsaad-travels.firebaseapp.com",
    projectId: "alsaad-travels",
    storageBucket: "alsaad-travels.appspot.com",
    messagingSenderId: "954918411781",
    appId: "1:954918411781:web:6a9ad466f7257324b07d87"
  },
  app: {
    name: "نظام السعد للسفريات",
    version: "1.0.0"
  }
};

/**
 * الحصول على قيمة متغير البيئة من مصادر متعددة
 * @param {string} key - اسم المتغير
 * @param {any} defaultValue - القيمة الافتراضية في حالة عدم وجود المتغير
 * @returns {any} - قيمة المتغير
 */
function getEnvValue(key, defaultValue) {
  try {
    // تغيير ترتيب الأولوية للمصادر:
    // 1. متغيرات البيئة المحددة في window.ENV_*
    // 2. متغيرات البيئة المحقونة في وقت البناء (import.meta.env)
    // 3. متغيرات البيئة المحددة في process.env
    // 4. القيمة الافتراضية المحددة

    // تحقق من وجود المتغير في window أولاً (الأولوية الأعلى في الإنتاج)
    const windowKey = `ENV_${key.replace('VITE_', '')}`;
    if (typeof window !== 'undefined' && window[windowKey]) {
      return window[windowKey];
    }

    // تحقق من وجود المتغير في import.meta.env
    if (import.meta && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }

    // تحقق من وجود المتغير في process.env
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }

    // استخدم القيمة الافتراضية
    return defaultValue;
  } catch (error) {
    console.error(`خطأ في الحصول على متغير البيئة ${key}:`, error);
    return defaultValue;
  }
}

// تكوين Firebase
const firebaseConfig = {
  apiKey: getEnvValue('VITE_FIREBASE_API_KEY', defaultConfig.firebase.apiKey),
  authDomain: getEnvValue('VITE_FIREBASE_AUTH_DOMAIN', defaultConfig.firebase.authDomain),
  projectId: getEnvValue('VITE_FIREBASE_PROJECT_ID', defaultConfig.firebase.projectId),
  storageBucket: getEnvValue('VITE_FIREBASE_STORAGE_BUCKET', defaultConfig.firebase.storageBucket),
  messagingSenderId: getEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID', defaultConfig.firebase.messagingSenderId),
  appId: getEnvValue('VITE_FIREBASE_APP_ID', defaultConfig.firebase.appId)
};

// تكوين التطبيق
const appConfig = {
  name: getEnvValue('VITE_APP_NAME', defaultConfig.app.name),
  version: getEnvValue('VITE_APP_VERSION', defaultConfig.app.version),
  mode: getEnvValue('VITE_APP_MODE', 'production'),
  debug: getEnvValue('VITE_APP_DEBUG', 'false') === 'true'
};

// تصدير التكوين
export const config = {
  firebase: firebaseConfig,
  app: appConfig,
  isProduction: appConfig.mode === 'production',
  isDevelopment: appConfig.mode === 'development',
  isDebug: appConfig.debug
};

// تسجيل التكوين في وحدة التحكم في وضع التطوير
if (appConfig.debug) {
  console.log('تكوين البيئة:', config);
}


