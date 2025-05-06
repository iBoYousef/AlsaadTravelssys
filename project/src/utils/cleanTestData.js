// وظيفة لتنظيف البيانات التجريبية من جميع المجموعات
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';

// قائمة بجميع المجموعات في قاعدة البيانات
const collections = [
  'customers',
  'employees',
  'users',
  'visaApplications',
  'tourPackages',
  'tourBookings',
  'hotelBookings',
  'flightBookings',
  'vehicleBookings',
  'eventBookings',
  'invoices',
  'receipts',
  'expenses',
  'revenues',
  'systemLogs',
  'notifications'
];

/**
 * حذف البيانات التجريبية من جميع المجموعات
 * @returns {Promise<Object>} - إحصائيات الحذف
 */
export const cleanAllTestData = async () => {
  const stats = {
    totalDeleted: 0,
    collectionStats: {}
  };

  try {
    // معالجة كل مجموعة على حدة
    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      
      // إنشاء استعلام للحصول على البيانات التجريبية فقط
      // البيانات التجريبية إما تحتوي على حقل isTestData = true
      // أو تحتوي على كلمة "تجريبي" أو "test" في الاسم أو الوصف
      const testDataQuery = query(collectionRef, where("isTestData", "==", true));
      
      const querySnapshot = await getDocs(testDataQuery);
      let deletedCount = 0;
      
      // حذف كل وثيقة تجريبية
      for (const docSnapshot of querySnapshot.docs) {
        await deleteDoc(doc(db, collectionName, docSnapshot.id));
        deletedCount++;
      }
      
      // تخزين إحصائيات الحذف لهذه المجموعة
      stats.collectionStats[collectionName] = deletedCount;
      stats.totalDeleted += deletedCount;
    }
    
    return {
      success: true,
      stats
    };
  } catch (error) {
    console.error("Error cleaning test data:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * تنظيف البيانات التجريبية وعرض رسالة نجاح
 */
export const cleanTestDataWithToast = async () => {
  try {
    const result = await cleanAllTestData();
    
    if (result.success) {
      toast.success(`تم حذف ${result.stats.totalDeleted} سجل تجريبي بنجاح`);
      return result;
    } else {
      toast.error(`حدث خطأ أثناء حذف البيانات التجريبية: ${result.error}`);
      return result;
    }
  } catch (error) {
    toast.error(`حدث خطأ غير متوقع: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

export default cleanTestDataWithToast;
