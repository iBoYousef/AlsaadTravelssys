// تصدير جميع الأدوات المساعدة من ملف واحد لتسهيل الاستيراد

import validationUtils from './validationUtils';
import firebaseUtils from './firebaseUtils';

// تصدير جميع الأدوات المساعدة
export {
  validationUtils,
  firebaseUtils
};

// تصدير الأدوات المساعدة كافتراضي
export default {
  validation: validationUtils,
  firebase: firebaseUtils
};
