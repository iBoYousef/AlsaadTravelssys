# نظام المصادقة والصلاحيات في تطبيق وكالة السفر

هذا المستند يشرح كيفية عمل نظام المصادقة والصلاحيات في تطبيق وكالة السفر، ويقدم إرشادات للمطورين حول كيفية استخدامه بشكل صحيح.

## سياق المصادقة (AuthContext)

يستخدم التطبيق سياق React (Context) لإدارة حالة المصادقة والصلاحيات بشكل مركزي. يوفر هذا السياق:

- معلومات المستخدم الحالي
- دوال تسجيل الدخول والخروج
- دوال التحقق من الصلاحيات والوصول إلى الأقسام

### الاستخدام الأساسي

```jsx
import { useAuth } from '../contexts/UnifiedAuthContext';

function MyComponent() {
  const { user, checkPermission, canAccessSection } = useAuth();
  
  // التحقق من وجود المستخدم
  if (!user) return <p>يرجى تسجيل الدخول</p>;
  
  // التحقق من صلاحية معينة
  if (!checkPermission('accounting.delete')) {
    return <p>ليس لديك صلاحية الحذف</p>;
  }
  
  // التحقق من إمكانية الوصول إلى قسم معين
  if (!canAccessSection('accounting')) {
    return <p>ليس لديك صلاحية الوصول إلى قسم المحاسبة</p>;
  }
  
  return <p>مرحباً {user.displayName}</p>;
}
```

## الأدوار والصلاحيات

### الأدوار المتاحة

1. **مسؤول النظام (admin)**: لديه جميع الصلاحيات ويمكنه الوصول إلى جميع الأقسام.
2. **مدير (manager)**: لديه معظم الصلاحيات ما عدا إدارة النظام والإعدادات.
3. **موظف (employee)**: لديه صلاحيات محدودة للأقسام الأساسية.
4. **محاسب (accountant)**: لديه صلاحيات للأقسام المالية فقط.

### التحقق من الصلاحيات

يوفر السياق دالتين رئيسيتين للتحقق من الصلاحيات:

#### 1. `checkPermission(permission)`

تستخدم للتحقق من صلاحية محددة مثل:
- `accounting.create`
- `accounting.read`
- `accounting.update`
- `accounting.delete`

```jsx
// مثال: التحقق من صلاحية الحذف
if (checkPermission('accounting.delete')) {
  // عرض زر الحذف
}
```

#### 2. `canAccessSection(section)`

تستخدم للتحقق من إمكانية الوصول إلى قسم معين مثل:
- `customers`
- `flights`
- `hotels`
- `accounting`
- `receipts`
- `reports`

```jsx
// مثال: التحقق من إمكانية الوصول إلى قسم العملاء
if (canAccessSection('customers')) {
  // عرض رابط قسم العملاء
}
```

## هيكل الصلاحيات

### صلاحيات الأقسام حسب الدور

#### مسؤول النظام (admin)
- جميع الأقسام

#### مدير (manager)
- جميع الأقسام ما عدا:
  - admin
  - settings

#### موظف (employee)
- customers
- flight_bookings
- hotel_bookings
- vehicle_bookings
- event_bookings
- visa_bookings
- receipts
- reports
- tour_packages
- tour_bookings

#### محاسب (accountant)
- receipts
- accounting
- reports

### صلاحيات العمليات

الصلاحيات تتبع النمط التالي: `[قسم].[عملية]`

العمليات الأساسية:
- `create`: إنشاء
- `read`: قراءة
- `update`: تحديث
- `delete`: حذف

أمثلة:
- `accounting.create`: إنشاء سجل محاسبي
- `customers.read`: عرض بيانات العملاء
- `receipts.delete`: حذف إيصال

## أفضل الممارسات

1. **استخدم دائماً دوال التحقق من الصلاحيات**:
   ```jsx
   // صحيح ✅
   if (checkPermission('accounting.delete')) {
     // ...
   }
   
   // خطأ ❌
   if (user.permissions.includes('accounting.delete')) {
     // ...
   }
   ```

2. **تحقق من وجود المستخدم قبل استخدام الصلاحيات**:
   ```jsx
   // صحيح ✅
   if (user && checkPermission('accounting.delete')) {
     // ...
   }
   ```

3. **استخدم الوصول الآمن عند التعامل مع كائن المستخدم**:
   ```jsx
   // صحيح ✅
   {user?.displayName}
   
   // أو
   {user ? user.displayName : 'زائر'}
   ```

4. **استخدم مكون `ProtectedRoute` للتحكم في الوصول إلى الصفحات**:
   ```jsx
   <Route
     path="/accounting"
     element={
       <ProtectedRoute requiredSection="accounting">
         <AccountingPage />
       </ProtectedRoute>
     }
   />
   ```

## استكشاف الأخطاء وإصلاحها

### مشكلة: "includes is not a function"

هذا الخطأ يحدث عندما يكون `user.permissions` غير معرف أو ليس مصفوفة.

**الحل**: استخدم دالة `checkPermission` بدلاً من الوصول المباشر إلى `user.permissions.includes`.

### مشكلة: المستخدم لا يمكنه الوصول إلى صفحة معينة

1. تحقق من دور المستخدم وصلاحياته في Firestore
2. تأكد من استخدام `ProtectedRoute` بشكل صحيح
3. تحقق من تعريف الصلاحيات في دالة `canAccessSection`

## ملاحظات للمطورين

- تم توحيد سياق المصادقة في ملف `UnifiedAuthContext.jsx`
- يجب استخدام هذا السياق في جميع المكونات الجديدة
- عند إضافة أقسام جديدة، تأكد من تحديث دالة `canUserAccessSection` في ملف السياق
