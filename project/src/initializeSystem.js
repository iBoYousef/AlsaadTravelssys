import { initializeSystem } from './firebase.jsx';

async function runInitialization() {
  try {
    console.log('بدء تهيئة النظام...');
    const result = await initializeSystem();
    
    if (result) {
      console.log('تم تهيئة النظام بنجاح');
    } else {
      console.error('فشل في تهيئة النظام');
    }
  } catch (error) {
    console.error('خطأ في تهيئة النظام:', error);
  }
}

// تشغيل عملية التهيئة
runInitialization();
