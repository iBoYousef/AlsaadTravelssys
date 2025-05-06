// سكريبت لتحديث استيرادات useAuth في جميع ملفات المشروع
// يقوم بتغيير الاستيراد من UnifiedAuthContext إلى AuthContext

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// الحصول على المسار الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateImports() {
  try {
    // البحث عن جميع ملفات JS و JSX في مجلد src
    const files = await glob('src/**/*.{js,jsx}', { ignore: ['**/node_modules/**'] });
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
      try {
        const filePath = path.resolve(file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // البحث عن استيراد useAuth من UnifiedAuthContext
        if (content.includes('UnifiedAuthContext')) {
          // تحديد المسار النسبي للاستيراد بناءً على عمق الملف
          const depth = file.split('/').length - 1;
          const importPath = depth > 1 ? '../../contexts/AuthContext' : '../contexts/AuthContext';
          
          // استبدال استيراد UnifiedAuthContext بـ AuthContext
          const updatedContent = content.replace(
            /from\s+(['"]).*\/UnifiedAuthContext\1/g,
            `from $1${importPath}$1`
          );
          
          // كتابة المحتوى المحدث إلى الملف
          fs.writeFileSync(filePath, updatedContent, 'utf8');
          console.log(`✅ تم تحديث: ${file}`);
          updatedCount++;
        }
      } catch (err) {
        console.error(`❌ خطأ في تحديث الملف ${file}:`, err);
        errorCount++;
      }
    }
    
    console.log(`\n=== تقرير التحديث ===`);
    console.log(`✅ تم تحديث ${updatedCount} ملف`);
    console.log(`❌ فشل تحديث ${errorCount} ملف`);
    
  } catch (err) {
    console.error('حدث خطأ أثناء البحث عن الملفات:', err);
  }
}

// تنفيذ وظيفة التحديث
updateImports();
