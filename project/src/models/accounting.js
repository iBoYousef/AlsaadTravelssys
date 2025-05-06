// نموذج/مخطط بيانات القيود اليومية والحسابات في Firestore

export const journalEntrySchema = {
  journalNumber: '', // رقم القيد
  date: '', // تاريخ القيد (ISO string)
  branchId: '', // رقم الفرع
  employeeName: '', // اسم الموظف
  lines: [
    // كل سطر: حساب مدين ودائن ومبلغ ووصف
    {
      debitAccount: '',
      creditAccount: '',
      amount: 0,
      description: '',
    },
  ],
  createdBy: '', // معرف المستخدم
  createdAt: '', // تاريخ الإنشاء
  updatedAt: '', // آخر تحديث
  status: 'open', // حالة القيد
};

export const accountSchema = {
  accountNumber: '',
  accountName: '',
  accountType: '', // أصل/خصم/إيراد/مصروف
  branchId: '',
  balance: 0,
};
