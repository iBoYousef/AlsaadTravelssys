// تصدير جميع الخدمات من ملف واحد لتسهيل الاستيراد

// استيراد خدمات API
import * as apiServices from './api';

// استيراد خدمات Firebase
import firebaseServices from './firebase/firebaseConfig';

// تصدير جميع الخدمات
export {
  apiServices,
  firebaseServices
};

// تصدير الخدمات كافتراضي
export default {
  api: apiServices,
  firebase: firebaseServices
};
