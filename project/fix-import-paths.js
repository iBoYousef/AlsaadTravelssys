import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// الحصول على المسار الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixImportPaths() {
  try {
    // البحث عن جميع ملفات JSX في مجلدات المكونات
    const files = await glob('src/components/**/*.jsx', { ignore: ['**/node_modules/**'] });
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
      try {
        const filePath = path.resolve(file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // البحث عن استيراد غير صحيح من AuthContext
        if (content.includes("from '../contexts/AuthContext'")) {
          console.log(`🔍 فحص الملف: ${file}`);
          
          // استبدال المسار غير الصحيح بالمسار الصحيح
          const updatedContent = content.replace(
            /from\s+(['"])\.\.\/contexts\/AuthContext\1/g,
            "from '../../contexts/AuthContext'"
          );
          
          // كتابة المحتوى المحدث إلى الملف
          fs.writeFileSync(filePath, updatedContent, 'utf8');
          console.log(`✅ تم تصحيح مسار الاستيراد في: ${file}`);
          updatedCount++;
        }
      } catch (err) {
        console.error(`❌ خطأ في تحديث الملف ${file}:`, err);
        errorCount++;
      }
    }
    
    console.log(`\n=== تقرير التصحيح ===`);
    console.log(`✅ تم تصحيح ${updatedCount} ملف`);
    console.log(`❌ فشل تصحيح ${errorCount} ملف`);
    
  } catch (err) {
    console.error('حدث خطأ أثناء البحث عن الملفات:', err);
  }
}

// تنفيذ وظيفة التصحيح
fixImportPaths();
