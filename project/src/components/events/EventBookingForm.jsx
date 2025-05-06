import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTicketAlt, FaMoneyBillWave, FaRegStickyNote } from 'react-icons/fa';
import DateInput from '../shared/DateInput';
import { getCurrentDate } from '../../utils/dateUtils';

const eventTypes = [
  "مؤتمر",
  "معرض",
  "حفل",
  "مهرجان",
  "ندوة",
  "ورشة عمل",
  "آخر"
];

export default function EventBookingForm({ onSave, onClose, editingEvent }) {
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'مؤتمر',
    eventDate: getCurrentDate(),
    eventTime: '',
    location: '',
    ticketCount: '1',
    ticketType: 'عادي',
    cost: '',
    price: '',
    notes: ''
  });

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        ...editingEvent,
        ticketCount: editingEvent.ticketCount?.toString() || '1',
        ticketType: editingEvent.ticketType || 'عادي',
        eventDate: editingEvent.eventDate || getCurrentDate()
      });
    }
  }, [editingEvent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // حساب سعر البيع تلقائيًا عند تغيير سعر التكلفة (زيادة 20%)
    if (name === 'cost' && value) {
      const cost = parseFloat(value);
      if (!isNaN(cost)) {
        const suggestedPrice = (cost * 1.2).toFixed(3);
        setFormData(prev => ({
          ...prev,
          price: suggestedPrice
        }));
      }
    }
  };

  const handleDateChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      eventDate: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ['eventName', 'eventType', 'eventDate', 'eventTime', 'location', 'ticketCount', 'ticketType', 'cost', 'price'];
    
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

    if (isNaN(parseInt(formData.ticketCount)) || parseInt(formData.ticketCount) <= 0) {
      return 'يجب إدخال عدد تذاكر صحيح';
    }

    return null;
  };

  const getFieldLabel = (field) => {
    const labels = {
      eventName: 'اسم الفعالية',
      eventType: 'نوع الفعالية',
      eventDate: 'تاريخ الفعالية',
      eventTime: 'وقت الفعالية',
      location: 'موقع الفعالية',
      ticketCount: 'عدد التذاكر',
      ticketType: 'نوع التذكرة',
      cost: 'سعر التكلفة',
      price: 'سعر البيع',
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
      cost: formData.cost ? parseFloat(formData.cost).toFixed(3) : '',
      price: parseFloat(formData.price).toFixed(3),
      ticketCount: parseInt(formData.ticketCount)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaTicketAlt className="text-blue-500" />
            {editingEvent ? 'تعديل حجز فعالية' : 'إضافة حجز فعالية جديد'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
          {/* معلومات الفعالية */}
          <div>
            <label className="block text-gray-700 mb-2 flex items-center gap-2">
              <FaTicketAlt className="text-blue-500" />
              اسم الفعالية*
            </label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 flex items-center gap-2">
                نوع الفعالية*
              </label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-500" />
                موقع الفعالية*
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* تاريخ ووقت الفعالية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 flex items-center gap-2">
                <FaCalendarAlt className="text-green-500" />
                تاريخ الفعالية*
              </label>
              <DateInput
                value={formData.eventDate}
                onChange={handleDateChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={false}
                name="eventDate"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 flex items-center gap-2">
                <FaClock className="text-orange-500" />
                وقت الفعالية*
              </label>
              <input
                type="time"
                name="eventTime"
                value={formData.eventTime}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* معلومات التذاكر */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 flex items-center gap-2">
                <FaTicketAlt className="text-purple-500" />
                نوع التذكرة*
              </label>
              <select
                name="ticketType"
                value={formData.ticketType}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="عادي">عادي</option>
                <option value="VIP">VIP</option>
                <option value="VVIP">VVIP</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">عدد التذاكر*</label>
              <input
                type="number"
                name="ticketCount"
                value={formData.ticketCount}
                onChange={handleChange}
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* معلومات السعر */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 flex items-center gap-2">
                <FaMoneyBillWave className="text-green-600" />
                سعر التكلفة (د.ك)*
              </label>
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
              <label className="block text-gray-700 mb-2 flex items-center gap-2">
                <FaMoneyBillWave className="text-blue-600" />
                سعر البيع (د.ك)*
              </label>
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

          {/* ملاحظات */}
          <div>
            <label className="block text-gray-700 mb-2 flex items-center gap-2">
              <FaRegStickyNote className="text-yellow-500" />
              ملاحظات
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
