// تحويل التاريخ من yyyy-mm-dd إلى dd/MM/yyyy
export const formatDate = (date) => {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

// تحويل التاريخ من dd/MM/yyyy إلى yyyy-mm-dd
export const parseDate = (dateString) => {
  if (!dateString) return '';
  
  // التحقق من أن dateString هو نص وليس كائن Date
  if (typeof dateString !== 'string') {
    // إذا كان كائن Date، قم بتحويله إلى تنسيق yyyy-mm-dd
    if (dateString instanceof Date) {
      const year = dateString.getFullYear();
      const month = String(dateString.getMonth() + 1).padStart(2, '0');
      const day = String(dateString.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }

  // إذا كان التاريخ بالفعل بتنسيق yyyy-mm-dd
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      // التحقق من صحة القيم
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      
      if (yearNum >= 1900 && yearNum <= 2100 &&
          monthNum >= 1 && monthNum <= 12 &&
          dayNum >= 1 && dayNum <= 31) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    return '';
  }
  
  // تحويل من dd/MM/yyyy إلى yyyy-mm-dd
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/');
    if (year && month && day) {
      // التحقق من صحة القيم
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      
      if (yearNum >= 1900 && yearNum <= 2100 &&
          monthNum >= 1 && monthNum <= 12 &&
          dayNum >= 1 && dayNum <= 31) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }
  
  return '';
};

// تنسيق التاريخ الحالي بصيغة dd/MM/yyyy
export const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
};

// تحويل التاريخ من Date object إلى dd/MM/yyyy
const formatDateFromDate = (date) => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// تحويل التاريخ من dd/MM/yyyy إلى Date object
const parseDateToDate = (dateString) => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('/');
  return new Date(year, month - 1, day);
};