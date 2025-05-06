// هذا الملف يعيد تصدير الدوال من ملف utils.js الرئيسي
// تم إنشاؤه لحل مشكلة الاستيراد الديناميكي

import { validateInputs, handleFirebaseError } from '../utils';

export { validateInputs, handleFirebaseError };

// تصدير افتراضي للتوافق مع الاستيراد الديناميكي
export default {
  validateInputs,
  handleFirebaseError
};
