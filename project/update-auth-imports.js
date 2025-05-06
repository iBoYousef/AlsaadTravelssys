import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// الحصول على المسار الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// قائمة الملفات التي تحتاج إلى تحديث
const filesToUpdate = [
  // الصفحات الرئيسية
  'src/pages/VisaApplications.jsx',
  'src/pages/TourPackages.jsx',
  'src/pages/TourBookings.jsx',
  'src/pages/Notifications.jsx',
  'src/pages/Customers.jsx',
  
  // الهوكس
  'src/hooks/useSystemLog.js',
  'src/hooks/useActionLogger.js',
  
  // مكونات العملاء
  'src/components/customers/CompanionsPage.jsx',
  
  // مكونات الفعاليات
  'src/components/events/EventBookingsPage.jsx',
  'src/components/events/EventBookingsHistory.jsx',
  
  // مكونات المركبات
  'src/components/vehicles/VehicleBookingsPage.jsx',
  'src/components/vehicles/VehicleBookingsHistory.jsx',
  
  // مكونات التأشيرات
  'src/components/visas/VisaBookingsHistory.jsx',
  'src/components/visas/VisaBookingsPage.jsx',
  
  // مكونات المستخدمين والنظام
  'src/components/users/UsersPage.jsx',
  'src/components/system/SystemChecker.jsx',
  'src/components/system/Settings.jsx',
  'src/components/system/DataMigration.jsx',
  
  // مكونات مشتركة
  'src/components/shared/PageHeader.jsx',
  'src/components/shared/DirectDeleteButton.jsx',
  
  // مكونات الرحلات
  'src/components/flights/FlightBookingsPage.jsx',
  'src/components/flights/FlightBookingsHistory.jsx',
  
  // مكونات الإيصالات
  'src/components/receipts/ReceiptRecordsPage.jsx',
  
  // مكونات أخرى
  'src/components/MainMenu.jsx',
  'src/components/layout/Sidebar.jsx',
  'src/components/layout/MainLayout.jsx',
  
  // مكونات الفنادق
  'src/components/hotels/HotelBookingsPage.jsx',
  'src/components/hotels/HotelBookingsHistory.jsx',
  
  // مكونات الموظفين
  'src/components/employees/EmployeesPage.jsx',
  
  // مكونات المحاسبة
  'src/components/accounting/InvoicesPage.jsx',
  'src/components/accounting/RevenuesPage.jsx',
  'src/components/accounting/FinancialReportsPage.jsx',
  'src/components/accounting/JournalEntries.jsx',
  'src/components/accounting/ExpensesPage.jsx',
  'src/components/accounting/AccountingDashboard.jsx',
  'src/components/accounting/AccountingReports.jsx',
  
  // مكونات الإدارة
  'src/components/admin/DataSeedPage.jsx'
];

// دالة لتحديث ملف واحد
function updateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // استبدال استيراد useAuth من UnifiedAuthContext بـ AuthContext
      const oldImport = /import\s+\{\s*useAuth\s*\}\s+from\s+['"]\.\.?\/\.\.?\/contexts\/UnifiedAuthContext['"];/g;
      const newImport = (filePath.startsWith('src/pages/') || filePath === 'src/App.jsx')
        ? "import { useAuth } from './contexts/AuthContext';"
        : "import { useAuth } from '../../contexts/AuthContext';";
      
      // تعديل المسار بناءً على عمق الملف
      const updatedContent = content.replace(oldImport, newImport);
      
      // كتابة المحتوى المحدث إلى الملف
      fs.writeFileSync(fullPath, updatedContent, 'utf8');
      console.log(`✅ تم تحديث: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️ الملف غير موجود: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ خطأ في تحديث الملف ${filePath}:`, error);
    return false;
  }
}

// تحديث جميع الملفات
console.log('بدء تحديث استيرادات useAuth...');
let successCount = 0;
let failCount = 0;

filesToUpdate.forEach(file => {
  const success = updateFile(file);
  if (success) {
    successCount++;
  } else {
    failCount++;
  }
});

console.log(`\nاكتمل التحديث!`);
console.log(`✅ تم تحديث ${successCount} ملف بنجاح`);
console.log(`❌ فشل تحديث ${failCount} ملف`);
