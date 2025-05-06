import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import DateInput from '../shared/DateInput';

export default function FlightBookingForm({ onSave, onClose, editingFlight }) {
  const [formData, setFormData] = useState({
    airline: '',
    flightNumber: '',
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    cost: '',
    price: '',
    ticketType: 'ذهاب وعودة',
    segmentType: 'مباشر',
    segmentCount: '1',
    routeCode: '',
    notes: ''
  });

  useEffect(() => {
    if (editingFlight) {
      setFormData({
        ...editingFlight,
        segmentType: editingFlight.segmentType || 'مباشر',
        segmentCount: editingFlight.segmentCount || '1'
      });
    }
  }, [editingFlight]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ['airline', 'flightNumber', 'origin', 'destination', 'cost', 'price', 'segmentType', 'segmentCount', 'routeCode'];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        return `يجب إدخال ${getFieldLabel(field)}`;
      }
    }

    if (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) <= 0) {
      return 'يجب إدخال سعر تكلفة صحيح';
    }

    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      return 'يجب إدخال سعر بيع صحيح';
    }

    return null;
  };

  const getFieldLabel = (field) => {
    const labels = {
      airline: 'اسم شركة الطيران',
      flightNumber: 'رقم الرحلة',
      origin: 'مدينة المغادرة',
      destination: 'مدينة الوصول',
      departureDate: 'تاريخ المغادرة',
      returnDate: 'تاريخ العودة',
      cost: 'سعر التكلفة',
      price: 'سعر البيع',
      ticketType: 'نوع التذكرة',
      segmentType: 'نوع السجمنت',
      segmentCount: 'عدد السجمنت',
      routeCode: 'مسار الرحلة',
      notes: 'ملاحظات'
    };
    return labels[field] || field;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    onSave({
      ...formData,
      cost: parseFloat(formData.cost).toFixed(3),
      price: parseFloat(formData.price).toFixed(3)
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-90vh overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingFlight ? 'تعديل معلومات رحلة الطيران' : 'إضافة رحلة طيران جديدة'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-600 mb-2">شركة الطيران*</label>
              <input
                type="text"
                name="airline"
                value={formData.airline}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-2">رقم الرحلة*</label>
              <input
                type="text"
                name="flightNumber"
                value={formData.flightNumber}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-600 mb-2">من*</label>
              <input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-2">إلى*</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-gray-600 mb-2">نوع التذكرة*</label>
              <select
                name="ticketType"
                value={formData.ticketType}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="ذهاب فقط">ذهاب فقط</option>
                <option value="ذهاب وعودة">ذهاب وعودة</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 mb-2">نوع السجمنت*</label>
              <select
                name="segmentType"
                value={formData.segmentType}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="مباشر">مباشر</option>
                <option value="ترانزيت">ترانزيت</option>
                <option value="توقف">توقف</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 mb-2">عدد السجمنت*</label>
              <select
                name="segmentCount"
                value={formData.segmentCount}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 mb-2">مسار الرحلة*</label>
              <input
                type="text"
                name="routeCode"
                value={formData.routeCode}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">تاريخ المغادرة*</label>
              <DateInput
                value={formData.departureDate}
                onChange={handleDateChange}
                name="departureDate"
                required={false}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">تاريخ العودة</label>
              <DateInput
                value={formData.returnDate}
                onChange={handleDateChange}
                name="returnDate"
                required={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-600 mb-2">سعر التكلفة (د.ك)*</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                step="0.001"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-2">سعر البيع (د.ك)*</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.001"
                min="0"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              placeholder="أدخل أي ملاحظات إضافية هنا..."
            />
          </div>

          <div className="flex justify-end mt-6 gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {editingFlight ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
