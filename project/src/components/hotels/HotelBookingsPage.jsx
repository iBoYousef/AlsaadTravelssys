import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaHotel, FaCalendarAlt, FaUsers, FaBed, FaMoneyBillWave, FaCheck, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import CustomerSearch from '../shared/CustomerSearch';
import DateInput from '../shared/DateInput';
import { getCurrentDate } from '../../utils/dateUtils';
import HotelForm from './HotelForm';
import employeeService from '../../services/employeeService';
import { addHotelBooking } from '../../services/hotelService';
import PageHeader from '../shared/PageHeader';
import { addRevenueForBooking, addInvoiceForBooking, addReceiptForBooking } from '../../services/accountingService';
import { useActionLogger } from '../../hooks/useActionLogger';

const agents = [
  "ملتي",
  "صفا",
  "الفرسان",
  "الرواد",
  "السفير",
  "آخر"
];

export default function HotelBookingsPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showHotelForm, setShowHotelForm] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    receiptCode: '',
    receiptNumber: '',
    cost: '',
    price: '',
    paymentMethod: 'knet',
    paymentDate: getCurrentDate(),
    deferredPaymentDate: getCurrentDate(),
    firstInstallment: '',
    secondInstallment: '',
    thirdInstallment: '',
    notes: ''
  });
  const { logPageView, logCreate, logDelete, logUpdate, logAction, ACTION_TYPES, ACTION_CATEGORIES } = useActionLogger();

  // تسجيل عرض الصفحة عند التحميل
  useEffect(() => {
    logPageView('حجوزات الفنادق', ACTION_CATEGORIES.HOTEL);
  }, [logPageView]);

  // جلب رقم الإيصال التلقائي عند تحميل الصفحة
  useEffect(() => {
    const fetchReceiptCode = async () => {
      try {
        const nextReceiptCode = await employeeService.getNextReceiptCode();
        setPaymentData(prev => ({
          ...prev,
          receiptCode: nextReceiptCode
        }));
      } catch (error) {
        console.error('خطأ في جلب رقم الإيصال التلقائي:', error);
        toast.error('خطأ في جلب رقم الإيصال التلقائي');
      }
    };
    
    fetchReceiptCode();
  }, []);

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddHotel = (hotelData) => {
    if (editingHotelId) {
      setHotels(hotels.map(hotel => 
        hotel.id === editingHotelId ? { ...hotelData, id: editingHotelId } : hotel
      ));
      setEditingHotelId(null);
      toast.success('تم تحديث حجز الفندق بنجاح');
      logUpdate('حجز فندق', editingHotelId, ACTION_CATEGORIES.HOTEL, hotelData);
    } else {
      const newHotel = { ...hotelData, id: Date.now() };
      setHotels([...hotels, newHotel]);
      toast.success('تم إضافة حجز الفندق بنجاح');
      logCreate('حجز فندق', newHotel.id, ACTION_CATEGORIES.HOTEL, hotelData);
    }
    setShowHotelForm(false);
  };

  const handleEditHotel = (hotel) => {
    setEditingHotelId(hotel.id);
    setShowHotelForm(true);
  };

  const handleDeleteHotel = (hotelId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
      const hotelToDelete = hotels.find(h => h.id === hotelId);
      setHotels(hotels.filter(h => h.id !== hotelId));
      toast.success('تم حذف حجز الفندق بنجاح');
      logDelete('حجز فندق', hotelId, ACTION_CATEGORIES.HOTEL, hotelToDelete);
    }
  };

  const validateBooking = () => {
    if (!selectedCustomer) {
      toast.error('يجب اختيار عميل قبل حفظ الحجز');
      return false;
    }

    if (hotels.length === 0) {
      toast.error('يجب إضافة حجز فندق واحد على الأقل قبل الحفظ');
      return false;
    }

    if (!paymentData.receiptNumber) {
      toast.error('يجب إدخال رقم الإيصال');
      return false;
    }

    // التحقق من صحة طريقة الدفع والحقول المرتبطة بها
    if (paymentData.paymentMethod === 'deferred' && !paymentData.deferredPaymentDate) {
      toast.error('يجب إدخال تاريخ الدفع الآجل');
      return false;
    }

    if (paymentData.paymentMethod === 'installments') {
      if (!paymentData.firstInstallment || !paymentData.secondInstallment || !paymentData.thirdInstallment) {
        toast.error('يجب إدخال مبالغ جميع الدفعات');
        return false;
      }
      
      // التحقق من أن مجموع الدفعات يساوي المبلغ الإجمالي
      const totalPrice = hotels.reduce((sum, hotel) => sum + parseFloat(hotel.price || 0), 0);
      const totalInstallments = 
        parseFloat(paymentData.firstInstallment || 0) + 
        parseFloat(paymentData.secondInstallment || 0) + 
        parseFloat(paymentData.thirdInstallment || 0);
      
      if (Math.abs(totalPrice - totalInstallments) > 0.001) {
        toast.error('مجموع الدفعات يجب أن يساوي إجمالي سعر البيع');
        return false;
      }
    }

    return true;
  };

  const handleSaveBooking = async () => {
    if (!validateBooking()) {
      return;
    }

    setIsLoading(true);
    try {
      // حفظ كل حجز فندق
      for (const hotel of hotels) {
        // حفظ الحجز
        const bookingId = await addHotelBooking({
          customerCode: selectedCustomer.code,
          customerName: selectedCustomer.name,
          customerId: selectedCustomer.id,
          employeeId: user.id,
          employeeName: user.name,
          ...hotel,
          ...paymentData,
          bookingDate: getCurrentDate()
        });
        // إضافة الإيراد المحاسبي
        try {
          // تم استبدال الاستيراد الديناميكي باستيراد ثابت في الأعلى
          // const { addRevenueForBooking, addInvoiceForBooking, addReceiptForBooking } = await import('../../services/accountingService');
          await addRevenueForBooking(bookingId, {
            amount: paymentData.price,
            bookingType: 'hotel',
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            paymentMethod: paymentData.paymentMethod,
            receiptNumber: paymentData.receiptNumber,
            createdBy: user.id,
            createdByName: user.name,
            createdAt: new Date(),
          });
          toast.success('تم حفظ الحجز وإضافة الإيراد بنجاح');

          // إضافة الفاتورة
          try {
            await addInvoiceForBooking(bookingId, {
              amount: paymentData.price,
              bookingType: 'hotel',
              customerId: selectedCustomer.id,
              customerName: selectedCustomer.name,
              paymentMethod: paymentData.paymentMethod,
              receiptNumber: paymentData.receiptNumber,
              createdBy: user.id,
              createdByName: user.name,
              createdAt: new Date(),
            });
            toast.success('تم إنشاء الفاتورة بنجاح');
          } catch (invoiceError) {
            console.error('خطأ في إنشاء الفاتورة:', invoiceError);
            toast.error('تم حفظ الحجز لكن حدث خطأ أثناء إنشاء الفاتورة');
          }

          // إضافة سند القبض
          try {
            await addReceiptForBooking(bookingId, {
              amount: paymentData.price,
              bookingType: 'hotel',
              customerId: selectedCustomer.id,
              customerName: selectedCustomer.name,
              paymentMethod: paymentData.paymentMethod,
              receiptNumber: paymentData.receiptNumber,
              createdBy: user.id,
              createdByName: user.name,
              createdAt: new Date(),
            });
            toast.success('تم إنشاء سند القبض بنجاح');
          } catch (receiptError) {
            console.error('خطأ في إنشاء سند القبض:', receiptError);
            toast.error('تم حفظ الحجز لكن حدث خطأ أثناء إنشاء سند القبض');
          }
        } catch (revenueError) {
          console.error('خطأ في إضافة الإيراد:', revenueError);
          toast.error('تم حفظ الحجز لكن حدث خطأ أثناء إضافة الإيراد للحسابات');
        }
      }

      toast.success('تم حفظ الحجز وإضافة الإيرادات بنجاح');
      logCreate('حجز فندق نهائي', '', ACTION_CATEGORIES.HOTEL, {
        customerName: selectedCustomer.name,
        hotelsCount: hotels.length,
        totalPrice: paymentData.price
      });
      navigate('/menu');
    } catch (error) {
      console.error('Error saving booking:', error);
      toast.error('حدث خطأ أثناء حفظ الحجز');
      logAction(ACTION_TYPES.ERROR, 'فشل في حفظ حجز فندق', ACTION_CATEGORIES.HOTEL, {
        error: error.message,
        customerName: selectedCustomer?.name
      });
    } finally {
      setIsLoading(false);
    }
  };

  // الحصول على إجمالي سعر البيع
  const getTotalPrice = () => {
    return hotels.reduce((sum, hotel) => sum + parseFloat(hotel.price || 0), 0).toFixed(3);
  };

  // عرض حقول الدفع المخصصة حسب طريقة الدفع
  const renderPaymentMethodFields = () => {
    switch(paymentData.paymentMethod) {
      case 'deferred':
        return (
          <div className="mt-4">
            <label className="block text-gray-600 mb-2">تاريخ الدفع الآجل*</label>
            <DateInput
              value={paymentData.deferredPaymentDate}
              onChange={(value) => handleDateChange('deferredPaymentDate', value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      case 'installments':
        const totalPrice = getTotalPrice();
        return (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-600 mb-2">الدفعة الأولى (د.ك)*</label>
              <input
                type="number"
                name="firstInstallment"
                value={paymentData.firstInstallment}
                onChange={handlePaymentChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.001"
                min="0"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-2">الدفعة الثانية (د.ك)*</label>
              <input
                type="number"
                name="secondInstallment"
                value={paymentData.secondInstallment}
                onChange={handlePaymentChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.001"
                min="0"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-2">الدفعة الثالثة (د.ك)*</label>
              <input
                type="number"
                name="thirdInstallment"
                value={paymentData.thirdInstallment}
                onChange={handlePaymentChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.001"
                min="0"
              />
            </div>
            <div className="md:col-span-3">
              <p className="text-sm text-gray-600">
                إجمالي الدفعات: {(parseFloat(paymentData.firstInstallment || 0) + 
                parseFloat(paymentData.secondInstallment || 0) + 
                parseFloat(paymentData.thirdInstallment || 0)).toFixed(3)} د.ك
                {' | '}
                المبلغ الإجمالي: {totalPrice} د.ك
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <PageHeader title="حجوزات الفنادق" />
      
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">بيانات الحجز</h2>
            <button
              onClick={() => {
                if (!selectedCustomer) {
                  toast.error('يجب اختيار عميل أولاً');
                  return;
                }
                setEditingHotelId(null);
                setShowHotelForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={!selectedCustomer}
            >
              <FaPlus className="inline-block ml-2" />
              إضافة حجز فندق
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              {/* قسم بيانات العميل */}
              <CustomerSearch 
                onSelect={setSelectedCustomer}
                selectedCustomer={selectedCustomer}
              />

              {/* قائمة حجوزات الفنادق */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">الفنادق المحجوزة</h2>
                {hotels.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-4 border-b">اسم الفندق</th>
                          <th className="p-4 border-b">المدينة</th>
                          <th className="p-4 border-b">نوع الغرفة</th>
                          <th className="p-4 border-b">تاريخ الدخول</th>
                          <th className="p-4 border-b">تاريخ الخروج</th>
                          <th className="p-4 border-b">عدد الليالي</th>
                          <th className="p-4 border-b">السعر لليلة</th>
                          <th className="p-4 border-b">سعر التكلفة</th>
                          <th className="p-4 border-b">سعر البيع</th>
                          <th className="p-4 border-b">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hotels.map(hotel => (
                          <tr key={hotel.id} className="hover:bg-gray-50">
                            <td className="p-4 border-b">{hotel.hotelName}</td>
                            <td className="p-4 border-b">{hotel.city}</td>
                            <td className="p-4 border-b">{hotel.roomType}</td>
                            <td className="p-4 border-b">{hotel.checkIn}</td>
                            <td className="p-4 border-b">{hotel.checkOut}</td>
                            <td className="p-4 border-b">{hotel.numberOfNights}</td>
                            <td className="p-4 border-b">{hotel.pricePerNight} د.ك</td>
                            <td className="p-4 border-b">{hotel.cost} د.ك</td>
                            <td className="p-4 border-b">{hotel.price} د.ك</td>
                            <td className="p-4 border-b">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditHotel(hotel)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <FaEdit className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteHotel(hotel.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <FaTrash className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                          <td colSpan="7" className="p-4 border-b text-left">المجموع:</td>
                          <td className="p-4 border-b">{hotels.reduce((sum, hotel) => sum + parseFloat(hotel.cost || 0), 0).toFixed(3)} د.ك</td>
                          <td className="p-4 border-b">{hotels.reduce((sum, hotel) => sum + parseFloat(hotel.price || 0), 0).toFixed(3)} د.ك</td>
                          <td className="p-4 border-b"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    لا توجد فنادق محجوزة
                  </div>
                )}
              </div>

              {/* قسم بيانات الدفع */}
              <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-6">بيانات الدفع</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-600 mb-2">الرقم الكودي للإيصال</label>
                    <input
                      type="text"
                      value={paymentData.receiptCode}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-2">رقم الإيصال*</label>
                    <input
                      type="text"
                      name="receiptNumber"
                      value={paymentData.receiptNumber}
                      onChange={handlePaymentChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-600 mb-2">إجمالي سعر التكلفة (د.ك)</label>
                    <input
                      type="number"
                      name="cost"
                      value={hotels.reduce((sum, hotel) => sum + parseFloat(hotel.cost || 0), 0).toFixed(3)}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-2">إجمالي سعر البيع (د.ك)</label>
                    <input
                      type="number"
                      name="price"
                      value={hotels.reduce((sum, hotel) => sum + parseFloat(hotel.price || 0), 0).toFixed(3)}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-2">طريقة الدفع*</label>
                    <select
                      name="paymentMethod"
                      value={paymentData.paymentMethod}
                      onChange={handlePaymentChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="cash">نقداً</option>
                      <option value="knet">كي نت</option>
                      <option value="visa">فيزا</option>
                      <option value="mastercard">ماستر كارد</option>
                      <option value="tabby">تابي</option>
                      <option value="deferred">آجل</option>
                      <option value="installments">دفعات</option>
                    </select>
                  </div>
                </div>

                {/* حقول إضافية حسب طريقة الدفع */}
                {renderPaymentMethodFields()}

                {/* حقل الملاحظات */}
                <div className="mb-6 mt-6">
                  <label className="block text-gray-600 mb-2">ملاحظات</label>
                  <textarea
                    name="notes"
                    value={paymentData.notes}
                    onChange={handlePaymentChange}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => navigate('/menu')}
                    className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition duration-200 flex items-center gap-2"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveBooking}
                    disabled={isLoading || !selectedCustomer || hotels.length === 0}
                    className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'جاري الحفظ...' : 'حفظ الحجز'}
                  </button>
                  <button
                    onClick={() => {
                      // هنا يمكن إضافة منطق طباعة الإيصال
                      toast.info('سيتم تنفيذ طباعة الإيصال قريباً');
                    }}
                    disabled={isLoading || !selectedCustomer || hotels.length === 0}
                    className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    طباعة إيصال
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* نموذج حجز الفندق */}
      {showHotelForm && (
        <HotelForm
          onSave={handleAddHotel}
          onClose={() => {
            setShowHotelForm(false);
            setEditingHotelId(null);
          }}
          editingHotel={editingHotelId ? hotels.find(h => h.id === editingHotelId) : null}
        />
      )}
    </div>
  );
}
