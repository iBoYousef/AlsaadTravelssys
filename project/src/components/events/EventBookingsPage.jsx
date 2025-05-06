import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import PageHeader from '../shared/PageHeader';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaTicketAlt, FaMapMarkerAlt, FaUsers, FaMoneyBillWave, FaCheck, FaArrowLeft, FaPrint } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CustomerSearch from '../shared/CustomerSearch';
import { getCurrentDate } from '../../utils/dateUtils';
import { getNextReceiptCode } from '../../services/receiptService';
import DateInput from '../shared/DateInput';
import EventBookingForm from './EventBookingForm';
import PrintReceipt from '../shared/PrintReceipt';
import { addRevenueForBooking, addInvoiceForBooking, addReceiptForBooking } from '../../services/accountingService';

const eventTypes = [
  "مؤتمر",
  "معرض",
  "حفل",
  "مهرجان",
  "ندوة",
  "ورشة عمل",
  "آخر"
];

export default function EventBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
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
  const [isLoading, setIsLoading] = useState(false);
  const [showPrintReceipt, setShowPrintReceipt] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  // جلب رقم الإيصال التلقائي عند تحميل الصفحة
  useEffect(() => {
    const fetchReceiptCode = async () => {
      try {
        const nextReceiptCode = await getNextReceiptCode();
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

  useEffect(() => {
    const q = query(collection(db, 'eventBookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(bookingsData);
    });

    return () => unsubscribe();
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

  const handleEventBookingSave = (bookingData) => {
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...bookingData, id: editingEvent.id } : e));
      setEditingEvent(null);
      toast.success('تم تعديل حجز الفعالية بنجاح');
    } else {
      setEvents(prev => [...prev, { ...bookingData, id: Date.now() }]);
      toast.success('تم إضافة حجز الفعالية بنجاح');
    }
    setShowEventForm(false);
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast.success('تم حذف حجز الفعالية بنجاح');
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleAdd = () => {
    if (!selectedCustomer) {
      toast.error('يجب اختيار العميل أولاً قبل إضافة فعالية');
      return;
    }
    setShowEventForm(true);
  };

  const handleEdit = (id) => {
    if (hasPermission('edit_event_bookings')) {
      navigate(`/events/bookings/edit/${id}`);
    } else {
      toast.error('ليس لديك صلاحية تعديل حجوزات الفعاليات');
    }
  };

  const handleDelete = async (id) => {
    if (!hasPermission('delete_event_bookings')) {
      toast.error('ليس لديك صلاحية حذف حجوزات الفعاليات');
      return;
    }

    if (window.confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
      try {
        await deleteDoc(doc(db, 'eventBookings', id));
        toast.success('تم حذف الحجز بنجاح');
      } catch (error) {
        console.error('Error deleting event booking:', error);
        toast.error('حدث خطأ أثناء حذف الحجز');
      }
    }
  };

  const validateBooking = () => {
    if (!selectedCustomer) {
      toast.error('يجب اختيار عميل قبل حفظ الحجز');
      return false;
    }

    if (events.length === 0) {
      toast.error('يجب إضافة حجز فعالية واحدة على الأقل قبل الحفظ');
      return false;
    }

    // التحقق من صحة التواريخ في جميع الفعاليات
    for (const event of events) {
      if (!event.eventDate) {
        toast.error('يجب تحديد تاريخ لكل فعالية');
        return false;
      }
      if (!event.eventTime) {
        toast.error('يجب تحديد وقت لكل فعالية');
        return false;
      }
    }

    // التحقق من إجمالي التكلفة وإجمالي سعر البيع
    const totalCost = events.reduce((sum, event) => sum + parseFloat(event.cost || 0), 0);
    const totalPrice = events.reduce((sum, event) => sum + parseFloat(event.price || 0), 0);
    
    if (totalCost <= 0) {
      toast.error('يجب أن يكون إجمالي سعر التكلفة أكبر من صفر');
      return false;
    }
    
    if (totalPrice <= 0) {
      toast.error('يجب أن يكون إجمالي سعر البيع أكبر من صفر');
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
      // إنشاء كائن البيانات للحجز
      const bookingData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        events,
        payment: paymentData,
        createdAt: new Date(),
        employeeId: user.id,
        employeeName: user.name
      };

      // حفظ الحجز في قاعدة البيانات
      const docRef = await addDoc(collection(db, 'eventBookings'), bookingData);

      // إضافة الإيراد المحاسبي + الفاتورة + سند القبض
      try {
        // تم استبدال الاستيراد الديناميكي باستيراد ثابت في الأعلى
        // const { addRevenueForBooking, addInvoiceForBooking, addReceiptForBooking } = await import('../../services/accountingService');
        await addRevenueForBooking(docRef.id, {
          amount: paymentData.price,
          bookingType: 'event',
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
          await addInvoiceForBooking(docRef.id, {
            amount: paymentData.price,
            bookingType: 'event',
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
          await addReceiptForBooking(docRef.id, {
            amount: paymentData.price,
            bookingType: 'event',
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
      
      // تحديث بيانات الحجز مع معرف المستند وعرض نافذة الطباعة
      setBookingData({
        ...bookingData,
        id: docRef.id
      });
      setShowPrintReceipt(true);
    } catch (error) {
      console.error('خطأ في حفظ الحجز:', error);
      toast.error('حدث خطأ أثناء حفظ الحجز');
    } finally {
      setIsLoading(false);
    }
  };

  // دالة لطباعة إيصال مباشرة بدون عرض النافذة
  const handlePrintReceipt = () => {
    if (!validateBooking()) {
      return;
    }

    const printData = {
      customerName: selectedCustomer.name,
      events,
      payment: paymentData,
      createdAt: new Date(),
      employeeName: user?.name || 'غير محدد'
    };

    setBookingData(printData);
    setShowPrintReceipt(true);
  };

  // الحصول على إجمالي سعر البيع
  const getTotalPrice = () => {
    return events.reduce((sum, event) => sum + parseFloat(event.price || 0), 0).toFixed(3);
  };

  // عرض حقول الدفع المخصصة حسب طريقة الدفع
  const renderPaymentMethodFields = () => {
    switch(paymentData.paymentMethod) {
      case 'deferred':
        return (
          <div className="mt-4">
            <label className="block text-gray-700 mb-2">تاريخ الدفع الآجل*</label>
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
              <label className="block text-gray-700 mb-2">الدفعة الأولى (د.ك)*</label>
              <input
                type="number"
                name="firstInstallment"
                value={paymentData.firstInstallment}
                onChange={handlePaymentChange}
                step="0.001"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">الدفعة الثانية (د.ك)*</label>
              <input
                type="number"
                name="secondInstallment"
                value={paymentData.secondInstallment}
                onChange={handlePaymentChange}
                step="0.001"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">الدفعة الثالثة (د.ك)*</label>
              <input
                type="number"
                name="thirdInstallment"
                value={paymentData.thirdInstallment}
                onChange={handlePaymentChange}
                step="0.001"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
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
      <PageHeader title="حجوزات الفعاليات" icon={<FaCalendarAlt className="w-8 h-8" />} />
      
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* صفحة إضافة حجز جديد */}
          {!showEventForm ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <FaTicketAlt className="text-blue-600 mr-2" />
                    بيانات الحجز
                  </h2>
                  <button
                    onClick={handleAdd}
                    className={`${selectedCustomer ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2`}
                    disabled={!selectedCustomer}
                  >
                    <FaPlus className="inline-block ml-2" />
                    إضافة فعالية
                  </button>
                </div>

                {/* قسم بيانات العميل */}
                <div className="mb-6">
                  <CustomerSearch 
                    selectedCustomer={selectedCustomer}
                    onSelect={setSelectedCustomer}
                    className="w-full md:w-96"
                  />
                </div>

                {/* قائمة الفعاليات المحجوزة */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <FaCalendarAlt className="text-green-600 mr-2" />
                    الفعاليات المحجوزة
                  </h2>
                  {events.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-4 border-b">اسم الفعالية</th>
                            <th className="p-4 border-b">نوع الفعالية</th>
                            <th className="p-4 border-b">التاريخ</th>
                            <th className="p-4 border-b">الوقت</th>
                            <th className="p-4 border-b">الموقع</th>
                            <th className="p-4 border-b">عدد التذاكر</th>
                            <th className="p-4 border-b">نوع التذكرة</th>
                            <th className="p-4 border-b">سعر التكلفة</th>
                            <th className="p-4 border-b">سعر البيع</th>
                            <th className="p-4 border-b">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map(event => (
                            <tr key={event.id} className="hover:bg-gray-50">
                              <td className="p-4 border-b">{event.eventName}</td>
                              <td className="p-4 border-b">{event.eventType}</td>
                              <td className="p-4 border-b">{event.eventDate}</td>
                              <td className="p-4 border-b">{event.eventTime}</td>
                              <td className="p-4 border-b">{event.location}</td>
                              <td className="p-4 border-b">{event.ticketCount}</td>
                              <td className="p-4 border-b">{event.ticketType}</td>
                              <td className="p-4 border-b">{event.cost || '-'} د.ك</td>
                              <td className="p-4 border-b">{event.price} د.ك</td>
                              <td className="p-4 border-b">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditEvent(event)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <FaEdit className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(event.id)}
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
                            <td className="p-4 border-b">{events.reduce((sum, event) => sum + parseFloat(event.cost || 0), 0).toFixed(3)} د.ك</td>
                            <td className="p-4 border-b">{events.reduce((sum, event) => sum + parseFloat(event.price || 0), 0).toFixed(3)} د.ك</td>
                            <td className="p-4 border-b"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      لا توجد فعاليات محجوزة
                    </div>
                  )}
                </div>

                {/* قسم بيانات الدفع */}
                <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-lg font-semibold mb-6 flex items-center">
                    <FaMoneyBillWave className="text-green-600 mr-2" />
                    بيانات الدفع
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-gray-600 mb-2">الرقم الكودي للإيصال</label>
                      <input
                        type="text"
                        name="receiptCode"
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
                      <label className="block text-gray-600 mb-2">إجمالي سعر التكلفة (د.ك)*</label>
                      <input
                        type="number"
                        name="cost"
                        value={events.reduce((sum, event) => sum + parseFloat(event.cost || 0), 0).toFixed(3)}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                        readOnly
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-2">إجمالي سعر البيع (د.ك)*</label>
                      <input
                        type="number"
                        name="price"
                        value={events.reduce((sum, event) => sum + parseFloat(event.price || 0), 0).toFixed(3)}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                        readOnly
                        required
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

                  {/* أزرار الإجراءات */}
                  <div className="flex justify-end gap-2 mt-8">
                    <button
                      type="button"
                      onClick={() => navigate('/menu')}
                      className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition duration-200 flex items-center gap-2"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBooking}
                      className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading || events.length === 0 || !selectedCustomer}
                    >
                      {isLoading ? 'جاري الحفظ...' : 'حفظ الحجز'}
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintReceipt}
                      className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading || events.length === 0 || !selectedCustomer}
                    >
                      طباعة إيصال
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EventBookingForm
              onSave={handleEventBookingSave}
              onClose={() => setShowEventForm(false)}
              editingEvent={editingEvent}
            />
          )}
        </div>
      </main>
      {/* نافذة طباعة الإيصال */}
      {showPrintReceipt && bookingData && (
        <PrintReceipt 
          bookingData={bookingData} 
          onClose={() => {
            setShowPrintReceipt(false);
            // إذا تم الحفظ بالفعل، انتقل إلى الصفحة الرئيسية
            if (bookingData.id) {
              navigate('/menu');
            }
          }} 
        />
      )}
    </div>
  );
}
