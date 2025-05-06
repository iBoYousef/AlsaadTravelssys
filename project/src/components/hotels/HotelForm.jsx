import React, { useState, useEffect } from 'react';
import { FaTimes, FaHotel, FaCalendarAlt, FaBed, FaUsers, FaMoneyBillWave } from 'react-icons/fa';
import DateInput from '../shared/DateInput';
import { getCurrentDate } from '../../utils/dateUtils';

const agents = [
  "ملتي",
  "صفا",
  "الفرسان",
  "الرواد",
  "السفير",
  "آخر"
];

export default function HotelForm({ hotel, onSave, onClose }) {
  const [formData, setFormData] = useState({
    bookingNumber: '',
    bookingDate: getCurrentDate(),
    hotelName: '',
    checkIn: '',
    checkOut: '',
    nights: 0,
    agent: '',
    customAgent: '',
    roomType: 'standard',
    roomCount: 1,
    adultsCount: 1,
    childrenCount: 0,
    notes: '',
    cost: '',
    price: ''
  });

  // حساب عدد الليالي عند تغيير تاريخ الدخول أو الخروج
  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const checkIn = new Date(formData.checkIn.split('/').reverse().join('-'));
      const checkOut = new Date(formData.checkOut.split('/').reverse().join('-'));
      const diffTime = Math.abs(checkOut - checkIn);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFormData(prev => ({ ...prev, nights: diffDays }));
    }
  }, [formData.checkIn, formData.checkOut]);

  // حساب سعر التكلفة وسعر البيع عند تغيير سعر الليلة أو عدد الليالي
  useEffect(() => {
    if (formData.nights && formData.pricePerNight) {
      const total = parseFloat(formData.pricePerNight) * parseInt(formData.nights);
      setFormData(prev => ({ ...prev, price: total.toFixed(3), cost: (total * 0.8).toFixed(3) }));
    }
  }, [formData.nights, formData.pricePerNight]);

  // تحميل بيانات الحجز عند التعديل
  useEffect(() => {
    if (hotel) {
      setFormData({
        bookingNumber: hotel.bookingNumber || '',
        bookingDate: hotel.bookingDate || getCurrentDate(),
        hotelName: hotel.hotelName || '',
        checkIn: hotel.checkIn || '',
        checkOut: hotel.checkOut || '',
        nights: hotel.nights || 0,
        agent: hotel.agent || '',
        customAgent: hotel.customAgent || '',
        roomType: hotel.roomType || 'standard',
        roomCount: hotel.roomCount || 1,
        adultsCount: hotel.adultsCount || 1,
        childrenCount: hotel.childrenCount || 0,
        notes: hotel.notes || '',
        cost: hotel.cost || '',
        price: hotel.price || ''
      });
    }
  }, [hotel]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaHotel className="text-blue-500" />
            {hotel ? 'تعديل حجز فندق' : 'إضافة حجز فندق جديد'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
          {/* معلومات الحجز */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">رقم الحجز*</label>
              <input
                type="text"
                name="bookingNumber"
                value={formData.bookingNumber}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <DateInput
              name="bookingDate"
              value={formData.bookingDate}
              onChange={handleChange}
              label="تاريخ الحجز"
              required
              icon={<FaCalendarAlt className="text-gray-400" />}
            />
          </div>

          {/* معلومات الفندق */}
          <div>
            <label className="block text-gray-700 mb-2 flex items-center gap-2">
              <FaHotel className="text-blue-500" />
              اسم الفندق/المنتجع*
            </label>
            <input
              type="text"
              name="hotelName"
              value={formData.hotelName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* تواريخ الإقامة */}
          <div className="grid grid-cols-3 gap-4">
            <DateInput
              name="checkIn"
              value={formData.checkIn}
              onChange={handleChange}
              label="تاريخ الدخول*"
              required
              icon={<FaCalendarAlt className="text-green-500" />}
            />
            <DateInput
              name="checkOut"
              value={formData.checkOut}
              onChange={handleChange}
              label="تاريخ الخروج*"
              required
              icon={<FaCalendarAlt className="text-red-500" />}
            />
            <div>
              <label className="block text-gray-700 mb-2">عدد الليالي</label>
              <input
                type="number"
                value={formData.nights}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
              />
            </div>
          </div>

          {/* معلومات الغرف */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 flex items-center gap-2">
                <FaBed className="text-purple-500" />
                نوع الغرفة*
              </label>
              <select
                name="roomType"
                value={formData.roomType}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="standard">غرفة عادية</option>
                <option value="deluxe">غرفة ديلوكس</option>
                <option value="suite">جناح</option>
                <option value="family">غرفة عائلية</option>
                <option value="villa">فيلا</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">عدد الغرف*</label>
              <input
                type="number"
                name="roomCount"
                value={formData.roomCount}
                onChange={handleChange}
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 flex items-center gap-2">
                <FaUsers className="text-orange-500" />
                عدد النزلاء*
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  name="adultsCount"
                  value={formData.adultsCount}
                  onChange={handleChange}
                  min="1"
                  placeholder="البالغين"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="number"
                  name="childrenCount"
                  value={formData.childrenCount}
                  onChange={handleChange}
                  min="0"
                  placeholder="الأطفال"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* أسعار */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">سعر الليلة (د.ك)*</label>
              <input
                type="number"
                name="pricePerNight"
                value={formData.pricePerNight}
                onChange={handleChange}
                step="0.001"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">سعر التكلفة (د.ك)*</label>
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
              <label className="block text-gray-700 mb-2">سعر البيع (د.ك)*</label>
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

          {/* وكيل الحجز */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">وكيل الحجز*</label>
              <select
                name="agent"
                value={formData.agent}
                onChange={handleChange}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formData.customAgent ? 'bg-gray-100' : ''
                }`}
                disabled={!!formData.customAgent}
                required={!formData.customAgent}
              >
                <option value="">اختر وكيل الحجز</option>
                {agents.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">وكيل حجز آخر</label>
              <input
                type="text"
                name="customAgent"
                value={formData.customAgent}
                onChange={handleChange}
                placeholder="أدخل اسم وكيل الحجز"
                className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formData.agent ? 'bg-gray-100' : ''
                }`}
                disabled={!!formData.agent}
              />
            </div>
          </div>

          {/* ملاحظات */}
          <div>
            <label className="block text-gray-700 mb-2">ملاحظات</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أي ملاحظات إضافية..."
            ></textarea>
          </div>

          {/* أزرار التحكم */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {hotel ? 'حفظ التعديلات' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}