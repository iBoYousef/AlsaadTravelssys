import { collection, getDocs, addDoc, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * سكريبت لنقل البيانات من جدول employees إلى جدول users
 * يقوم بنقل جميع بيانات الموظفين إلى جدول المستخدمين مع الحفاظ على المعرفات
 * ويمكن استخدامه لمرة واحدة فقط عند الانتقال من النظام القديم إلى النظام الجديد
 */
export const migrateEmployeesToUsers = async () => {
  try {
    console.log('بدء عملية نقل البيانات من جدول employees إلى جدول users...');
    
    // جلب جميع البيانات من جدول employees
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    
    if (employeesSnapshot.empty) {
      console.log('لا توجد بيانات في جدول employees للنقل.');
      return { success: true, message: 'لا توجد بيانات للنقل', migratedCount: 0 };
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    // نقل البيانات لكل موظف
    for (const employeeDoc of employeesSnapshot.docs) {
      const employeeData = employeeDoc.data();
      const employeeId = employeeDoc.id;
      
      // التحقق من وجود المستخدم في جدول users
      const userDoc = await getDoc(doc(db, 'users', employeeId));
      
      if (userDoc.exists()) {
        console.log(`المستخدم موجود بالفعل في جدول users بالمعرف: ${employeeId}. تخطي...`);
        skippedCount++;
        continue;
      }
      
      // إضافة البيانات إلى جدول users بنفس المعرف
      await setDoc(doc(db, 'users', employeeId), {
        ...employeeData,
        migratedFrom: 'employees',
        migratedAt: new Date().toISOString()
      });
      
      console.log(`تم نقل الموظف بنجاح: ${employeeData.name || employeeId}`);
      migratedCount++;
    }
    
    console.log(`اكتملت عملية النقل. تم نقل ${migratedCount} موظف، وتخطي ${skippedCount} موظف.`);
    
    return { 
      success: true, 
      message: `تم نقل ${migratedCount} موظف بنجاح`, 
      migratedCount,
      skippedCount
    };
  } catch (error) {
    console.error('حدث خطأ أثناء نقل البيانات:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء نقل البيانات' 
    };
  }
};

/**
 * حذف جدول employees بعد التأكد من نقل جميع البيانات
 * تحذير: هذه العملية لا يمكن التراجع عنها!
 */
export const deleteEmployeesCollection = async () => {
  try {
    console.log('جاري التحقق من اكتمال عملية النقل قبل حذف جدول employees...');
    
    // جلب جميع البيانات من جدول employees
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    
    if (employeesSnapshot.empty) {
      console.log('جدول employees فارغ بالفعل.');
      return { success: true, message: 'جدول employees فارغ بالفعل', deletedCount: 0 };
    }
    
    // التحقق من وجود جميع الموظفين في جدول users
    let allMigrated = true;
    let missingUsers = [];
    
    for (const employeeDoc of employeesSnapshot.docs) {
      const employeeId = employeeDoc.id;
      const userDoc = await getDoc(doc(db, 'users', employeeId));
      
      if (!userDoc.exists()) {
        allMigrated = false;
        missingUsers.push(employeeId);
      }
    }
    
    if (!allMigrated) {
      console.error('لم يتم نقل جميع الموظفين إلى جدول users بعد!');
      console.error('المستخدمون المفقودون:', missingUsers);
      return { 
        success: false, 
        message: 'لم يتم نقل جميع الموظفين بعد', 
        missingUsers 
      };
    }
    
    // حذف جميع الوثائق في جدول employees
    let deletedCount = 0;
    for (const employeeDoc of employeesSnapshot.docs) {
      await deleteDoc(doc(db, 'employees', employeeDoc.id));
      deletedCount++;
    }
    
    console.log(`تم حذف ${deletedCount} موظف من جدول employees بنجاح.`);
    
    return { 
      success: true, 
      message: `تم حذف ${deletedCount} موظف من جدول employees بنجاح`, 
      deletedCount 
    };
  } catch (error) {
    console.error('حدث خطأ أثناء حذف جدول employees:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء حذف جدول employees' 
    };
  }
};

export default {
  migrateEmployeesToUsers,
  deleteEmployeesCollection
};
