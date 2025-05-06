// وسائل الدفع المتاحة في النظام
export const paymentMethods = [
  { value: 'cash', label: 'نقداً' },
  { value: 'knet', label: 'كي-نت' },
  { value: 'visa', label: 'فيزا' },
  { value: 'mastercard', label: 'ماستر كارد' },
  { value: 'tabby', label: 'تابي' },
  { value: 'credit', label: 'آجل' },
  { value: 'installments', label: 'دفعات' }
];

// دالة مساعدة للحصول على النص العربي لطريقة الدفع
export const getPaymentMethodLabel = (value) => {
  const method = paymentMethods.find(m => m.value === value);
  return method ? method.label : value;
};

// دالة للتحقق من صحة طريقة الدفع
export const validatePaymentMethod = (paymentMethod, amount, dueDate, installments) => {
  if (!paymentMethod) {
    return { isValid: false, error: 'يجب اختيار طريقة الدفع' };
  }

  if (paymentMethod === 'credit' && !dueDate) {
    return { isValid: false, error: 'يجب تحديد تاريخ الاستحقاق للدفع الآجل' };
  }

  if (paymentMethod === 'installments') {
    if (!installments || !installments.length) {
      return { isValid: false, error: 'يجب إضافة دفعة واحدة على الأقل' };
    }

    const totalInstallments = installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0);
    if (Math.abs(totalInstallments - amount) > 0.001) { // استخدام هامش صغير للتعامل مع أخطاء التقريب
      return { isValid: false, error: 'مجموع الدفعات يجب أن يساوي المبلغ الإجمالي' };
    }
  }

  return { isValid: true };
};
