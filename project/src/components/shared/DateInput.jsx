import React from 'react';
import { formatDate, parseDate } from '../../utils/dateUtils';

export default function DateInput({ value, onChange, name, label, required = false, disabled = false, icon = null, className = '' }) {
  const handleChange = (e) => {
    const inputDate = e.target.value; // yyyy-mm-dd
    const formattedDate = inputDate ? formatDate(inputDate) : ''; // تحويل إلى dd/MM/yyyy
    
    // تحديث القيمة مع الاحتفاظ بنفس هيكل الحدث
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: formattedDate
      }
    };
    
    onChange(syntheticEvent);
  };

  // تحويل القيمة من dd/MM/yyyy إلى yyyy-mm-dd لعنصر input
  const inputValue = parseDate(value) || '';

  return (
    <div>
      {label && (
        <label className="block text-gray-700 mb-2 flex items-center gap-2">
          {icon}
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="date"
        name={name}
        value={inputValue}
        onChange={handleChange}
        className={`${className} w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}