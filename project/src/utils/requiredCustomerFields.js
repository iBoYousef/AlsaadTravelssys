// ملف مركزي لتعريف الحقول الإجبارية للعملاء
// يمكن لمسؤول النظام تعديله من الإعدادات لاحقًا

export const DEFAULT_REQUIRED_CUSTOMER_FIELDS = [
  'name',
  'idNumber', // الرقم المدني
  'passportNumber',
  'phone',
  'nationality'
];

// دالة مساعدة للحصول على الحقول الإجبارية (لاحقًا يمكن ربطها بالإعدادات)
export function getRequiredCustomerFields(settings) {
  // إذا تم توفير إعدادات مخصصة من المسؤول
  if (settings && Array.isArray(settings.requiredCustomerFields)) {
    return settings.requiredCustomerFields;
  }
  // الافتراضي
  return DEFAULT_REQUIRED_CUSTOMER_FIELDS;
}
