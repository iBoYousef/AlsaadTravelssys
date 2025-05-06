// تنسيق المبالغ المالية (دائمًا بالدينار الكويتي)
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '';
  
  const number = parseFloat(amount);
  if (isNaN(number)) return '';

  return number.toLocaleString('ar-KW', {
    style: 'currency',
    currency: 'KWD', // الدينار الكويتي
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });
};

// تنسيق التاريخ
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('ar-KW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// تنسيق الوقت
export const formatTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleTimeString('ar-KW', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// تنسيق التاريخ والوقت معاً
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleString('ar-KW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// تنسيق رقم الهاتف
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // إزالة كل شيء ما عدا الأرقام
  const cleaned = phone.replace(/\D/g, '');
  
  // تنسيق الرقم بالشكل المطلوب (مثال: +965 xxxx xxxx)
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  } else if (cleaned.length > 8) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  
  return cleaned;
};

// تنسيق رقم الهوية المدنية
export const formatCivilId = (id) => {
  if (!id) return '';
  
  // إزالة كل شيء ما عدا الأرقام
  const cleaned = id.replace(/\D/g, '');
  
  // تنسيق الرقم بالشكل المطلوب (مثال: 123456789012)
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
  }
  
  return cleaned;
};

// تنسيق رقم الجواز
export const formatPassportNumber = (number) => {
  if (!number) return '';
  
  // إزالة المسافات وتحويل إلى أحرف كبيرة
  return number.replace(/\s/g, '').toUpperCase();
};
