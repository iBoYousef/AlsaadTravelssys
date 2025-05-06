# دليل الانتقال إلى نظام المصادقة الموحد

هذا الدليل يشرح خطوات الانتقال من نظامي المصادقة المنفصلين (`hooks/AuthContext.jsx` و `contexts/AuthContext.jsx`) إلى نظام المصادقة الموحد الجديد (`contexts/UnifiedAuthContext.jsx`).

## لماذا التوحيد؟

كان التطبيق يستخدم نسختين مختلفتين من سياق المصادقة:
1. `hooks/AuthContext.jsx`
2. `contexts/AuthContext.jsx`

هذا التكرار يمكن أن يسبب:
- تناقضات في السلوك
- صعوبة في الصيانة
- أخطاء غير متوقعة
- ارتباك للمطورين

## خطوات الانتقال

### 1. تحديث استيرادات المكونات

قم بتغيير جميع استيرادات `useAuth` و `AuthProvider` في المكونات لتشير إلى الملف الجديد:

```jsx
// من
import { useAuth } from '../../hooks/AuthContext';
// أو
import { useAuth } from '../../contexts/AuthContext';

// إلى
import { useAuth } from '../../contexts/UnifiedAuthContext';
```

### 2. تحديث ملف App.jsx

قم بتحديث ملف `App.jsx` لاستخدام `AuthProvider` من السياق الموحد:

```jsx
// من
import { AuthProvider } from './hooks/AuthContext';
// أو
import { AuthProvider } from './contexts/AuthContext';

// إلى
import { AuthProvider } from './contexts/UnifiedAuthContext';
```

### 3. التحقق من المكونات التي تستخدم صلاحيات خاصة

بعض المكونات قد تستخدم دوال أو خصائص كانت متوفرة في أحد السياقين ولكن ليست في الآخر. تأكد من أن جميع هذه الدوال متوفرة في السياق الموحد الجديد.

### 4. اختبار التطبيق

بعد تحديث جميع الاستيرادات، قم باختبار التطبيق بشكل شامل للتأكد من:
- تسجيل الدخول يعمل بشكل صحيح
- تسجيل الخروج يعمل بشكل صحيح
- التحقق من الصلاحيات يعمل بشكل صحيح
- الوصول إلى الأقسام المختلفة يعمل بشكل صحيح

## قائمة المكونات التي تحتاج إلى تحديث

فيما يلي قائمة بالمكونات التي تستخدم حاليًا `useAuth` من أحد السياقين وتحتاج إلى تحديث:

### من hooks/AuthContext.jsx:
- `components/visas/VisaBookingsPage.jsx`
- `components/vehicles/VehicleBookingsPage.jsx`
- `components/system/Settings.jsx`
- `components/shared/Layout.jsx`
- `components/shared/PageHeader.jsx`
- `components/receipts/ReceiptRecordsPage.jsx`
- `components/MainMenu.jsx`
- `components/hotels/HotelBookingsPage.jsx`
- `components/flights/FlightBookingsPage.jsx`
- `components/events/EventBookingsPage.jsx`
- `components/employees/EmployeesPage.jsx`
- `components/customers/CustomersPage.jsx`
- `components/customers/CompanionsPage.jsx`
- `components/auth/ProtectedRoute.jsx`
- `components/auth/LoginPage.jsx`
- `App.jsx`
- `components/accounting/ExpensesPage.jsx`
- `components/accounting/InvoicesPage.jsx`
- `components/accounting/RevenuesPage.jsx`

### من contexts/AuthContext.jsx:
- `pages/VisaApplications.jsx`
- `pages/TourPackages.jsx`
- `pages/TourBookings.jsx`
- `components/layout/Sidebar.jsx`
- `components/layout/MainLayout.jsx`

## مثال على تحديث مكون

### قبل:

```jsx
import React from 'react';
import { useAuth } from '../../hooks/AuthContext';

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>جاري التحميل...</div>;
  if (!user) return <div>يرجى تسجيل الدخول</div>;
  
  return <div>مرحباً {user.displayName}</div>;
}
```

### بعد:

```jsx
import React from 'react';
import { useAuth } from '../../contexts/UnifiedAuthContext';

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>جاري التحميل...</div>;
  if (!user) return <div>يرجى تسجيل الدخول</div>;
  
  return <div>مرحباً {user.displayName}</div>;
}
```

## الخطوات النهائية

بعد الانتهاء من تحديث جميع المكونات واختبار التطبيق بشكل كامل، يمكنك:

1. حذف الملفات القديمة:
   - `hooks/AuthContext.jsx`
   - `contexts/AuthContext.jsx`

2. تحديث التوثيق ليشير إلى السياق الموحد الجديد

## ملاحظات إضافية

- تأكد من أن جميع الدوال والخصائص التي كانت تستخدمها المكونات متوفرة في السياق الموحد الجديد
- قد تحتاج إلى تعديل بعض المكونات إذا كانت تعتمد على سلوك محدد في أحد السياقين القديمين
- استخدم أدوات البحث والاستبدال في محرر الكود لتسهيل عملية تحديث الاستيرادات
