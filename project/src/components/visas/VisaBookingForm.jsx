import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaPassport, FaGlobe, FaCalendarAlt, FaMoneyBillWave, FaTimes } from 'react-icons/fa';
import DateInput from '../shared/DateInput';

export default function VisaBookingForm({ onSave, initialData = null, onClose }) {
  const [formData, setFormData] = useState({
    visaType: '',
    country: '',
    duration: '',
    issueDate: '',
    expiryDate: '',
    cost: '',
    price: '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // التحقق من البيانات
    if (!formData.visaType || !formData.country || !formData.duration) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    // التحقق من صحة التواريخ
    if (formData.issueDate && formData.expiryDate) {
      const issueDate = new Date(formData.issueDate);
      const expiryDate = new Date(formData.expiryDate);
      
      if (expiryDate < issueDate) {
        toast.error('تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار');
        return;
      }
    }

    // التحقق من الأسعار
    if (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) <= 0) {
      toast.error('يرجى إدخال سعر تكلفة صحيح');
      return;
    }

    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      toast.error('يرجى إدخال سعر بيع صحيح');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-90vh overflow-y-auto shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {initialData ? 'تعديل معلومات التأشيرة' : 'إضافة تأشيرة جديدة'}
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <FaTimes className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-600 mb-2">نوع التأشيرة*</label>
            <select
              name="visaType"
              value={formData.visaType}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">اختر نوع التأشيرة</option>
              <option value="سياحية">سياحية</option>
              <option value="عمل">عمل</option>
              <option value="دراسية">دراسية</option>
              <option value="علاجية">علاجية</option>
              <option value="حج">حج</option>
              <option value="عمرة">عمرة</option>
              <option value="زيارة عائلية">زيارة عائلية</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-600 mb-2">الدولة*</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">اختر الدولة</option>
              <option value="المملكة العربية السعودية">المملكة العربية السعودية</option>
              <option value="الإمارات العربية المتحدة">الإمارات العربية المتحدة</option>
              <option value="الولايات المتحدة الأمريكية">الولايات المتحدة الأمريكية</option>
              <option value="المملكة المتحدة">المملكة المتحدة</option>
              <option value="سيشل">سيشل</option>
              <option value="ماليزيا">ماليزيا</option>
              <option value="تركيا">تركيا</option>
              <option value="مصر">مصر</option>
              <option value="الأردن">الأردن</option>
              <option value="لبنان">لبنان</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-600 mb-2">مدة التأشيرة*</label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="مثال: 30 يوم، 3 أشهر، سنة"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-2">تاريخ الإصدار</label>
            <DateInput
              name="issueDate"
              value={formData.issueDate}
              onChange={(e) => handleDateChange('issueDate', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-600 mb-2">تاريخ الانتهاء</label>
            <DateInput
              name="expiryDate"
              value={formData.expiryDate}
              onChange={(e) => handleDateChange('expiryDate', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-2">سعر التكلفة (د.ك)*</label>
            <input
              type="number"
              step="0.001"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-600 mb-2">سعر البيع (د.ك)*</label>
            <input
              type="number"
              step="0.001"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-600 mb-2">ملاحظات</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-4 rtl:space-x-reverse">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {initialData ? 'تحديث' : 'إضافة'}
          </button>
        </div>
      </form>
    </div>
  );
}
