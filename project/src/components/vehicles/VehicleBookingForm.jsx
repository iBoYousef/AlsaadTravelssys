import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import DateInput from '../shared/DateInput';
import { getCurrentDate } from '../../utils/dateUtils';

const vehicleTypes = [
  'سيارة صغيرة',
  'سيارة متوسطة',
  'سيارة عائلية',
  'سيارة فاخرة',
  'دفع رباعي',
  'ميني باص',
  'باص'
];

const transmissionTypes = [
  'أوتوماتيك',
  'عادي'
];

const pickupLocations = [
  'المطار',
  'الفندق',
  'مقر الشركة',
  'عنوان العميل'
];

export default function VehicleBookingForm({ onSave, onClose }) {
  const [bookingData, setBookingData] = useState({
    vehicleType: '',
    transmission: '',
    specifications: '', // إضافة حقل جديد
    pickupDate: getCurrentDate(),
    returnDate: getCurrentDate(),
    pickupLocation: '',
    returnLocation: '',
    driverAge: '',
    numberOfDays: 1,
    dailyRate: '',
    totalAmount: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };

      // حساب عدد الأيام عند تغيير تواريخ الحجز
      if (name === 'pickupDate' || name === 'returnDate') {
        const pickup = new Date(name === 'pickupDate' ? value : prev.pickupDate);
        const returnDate = new Date(name === 'returnDate' ? value : prev.returnDate);
        const diffTime = Math.abs(returnDate - pickup);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        newData.numberOfDays = diffDays || 1;

        // تحديث المبلغ الإجمالي
        if (prev.dailyRate) {
          newData.totalAmount = (diffDays * parseFloat(prev.dailyRate)).toFixed(3);
        }
      }

      // تحديث المبلغ الإجمالي عند تغيير السعر اليومي
      if (name === 'dailyRate') {
        newData.totalAmount = (newData.numberOfDays * parseFloat(value)).toFixed(3);
      }

      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(bookingData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">إضافة حجز مركبة</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* نوع المركبة */}
              <div>
                <label className="block text-gray-700 mb-2">نوع المركبة*</label>
                <select
                  name="vehicleType"
                  value={bookingData.vehicleType}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر نوع المركبة</option>
                  {vehicleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* ناقل الحركة */}
              <div>
                <label className="block text-gray-700 mb-2">ناقل الحركة*</label>
                <select
                  name="transmission"
                  value={bookingData.transmission}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر نوع ناقل الحركة</option>
                  {transmissionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* وكالة السيارة ومواصفاتها */}
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">وكالة السيارة ومواصفاتها*</label>
                <input
                  type="text"
                  name="specifications"
                  value={bookingData.specifications}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل تفاصيل وكالة السيارة ومواصفاتها..."
                  required
                />
              </div>

              {/* تاريخ الاستلام */}
              <div>
                <label className="block text-gray-700 mb-2">تاريخ الاستلام*</label>
                <DateInput
                  name="pickupDate"
                  value={bookingData.pickupDate}
                  onChange={handleChange}
                />
              </div>

              {/* تاريخ التسليم */}
              <div>
                <label className="block text-gray-700 mb-2">تاريخ التسليم*</label>
                <DateInput
                  name="returnDate"
                  value={bookingData.returnDate}
                  onChange={handleChange}
                />
              </div>

              {/* مكان الاستلام */}
              <div>
                <label className="block text-gray-700 mb-2">مكان الاستلام*</label>
                <select
                  name="pickupLocation"
                  value={bookingData.pickupLocation}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر مكان الاستلام</option>
                  {pickupLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* مكان التسليم */}
              <div>
                <label className="block text-gray-700 mb-2">مكان التسليم*</label>
                <select
                  name="returnLocation"
                  value={bookingData.returnLocation}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر مكان التسليم</option>
                  {pickupLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* عمر السائق */}
              <div>
                <label className="block text-gray-700 mb-2">عمر السائق*</label>
                <input
                  type="number"
                  name="driverAge"
                  value={bookingData.driverAge}
                  onChange={handleChange}
                  min="18"
                  max="99"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* عدد الأيام */}
              <div>
                <label className="block text-gray-700 mb-2">عدد الأيام*</label>
                <input
                  type="number"
                  name="numberOfDays"
                  value={bookingData.numberOfDays}
                  onChange={handleChange}
                  min="1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* السعر اليومي */}
              <div>
                <label className="block text-gray-700 mb-2">السعر اليومي (د.ك)*</label>
                <input
                  type="number"
                  name="dailyRate"
                  value={bookingData.dailyRate}
                  onChange={handleChange}
                  step="0.001"
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* السعر الإجمالي */}
              <div>
                <label className="block text-gray-700 mb-2">السعر الإجمالي (د.ك)*</label>
                <input
                  type="number"
                  name="totalAmount"
                  value={bookingData.totalAmount}
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
              <label className="block text-gray-700 mb-2">ملاحظات</label>
              <textarea
                name="notes"
                value={bookingData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                حفظ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
