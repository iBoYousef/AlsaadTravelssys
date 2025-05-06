import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import PageHeader from '../shared/PageHeader';
import { FaPlus, FaEdit, FaTrash, FaPlane } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CustomerSearch from '../shared/CustomerSearch';
import { getCurrentDate } from '../../utils/dateUtils';
import employeeService from '../../services/employeeService';
import FlightBookingForm from './FlightBookingForm';
import DateInput from '../shared/DateInput';
import { addRevenueForBooking, addInvoiceForBooking, addReceiptForBooking } from '../../services/accountingService';
import { useActionLogger } from '../../hooks/useActionLogger';

export default function FlightBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [flights, setFlights] = useState([]);
  const [editingFlight, setEditingFlight] = useState(null);
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
  const { logPageView, logCreate, logDelete, logUpdate, ACTION_CATEGORIES, logAction, ACTION_TYPES } = useActionLogger();

  // تسجيل عرض الصفحة عند التحميل
  useEffect(() => {
    logPageView('حجوزات الطيران', ACTION_CATEGORIES.FLIGHT);
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

  useEffect(() => {
    const q = query(collection(db, 'flightBookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(bookingsData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // تحديث إجمالي السعر في بيانات الدفع عند تغيير الرحلات
    const totalPrice = flights.reduce((sum, flight) => sum + parseFloat(flight.price || 0), 0).toFixed(3);
    setPaymentData(prev => ({
      ...prev,
      price: totalPrice
    }));
  }, [flights]);

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFlightBookingSave = (bookingData) => {
    if (editingFlight) {
      setFlights(prev => prev.map(f => f.id === editingFlight.id ? { ...bookingData, id: editingFlight.id } : f));
      setEditingFlight(null);
      toast.success('تم تعديل حجز الطيران بنجاح');
      logUpdate('حجز طيران مؤقت', editingFlight.id, ACTION_CATEGORIES.FLIGHT, bookingData);
    } else {
      const newFlight = { ...bookingData, id: Date.now() };
      setFlights(prev => [...prev, newFlight]);
      toast.success('تم إضافة حجز الطيران بنجاح');
      logCreate('حجز طيران مؤقت', newFlight.id, ACTION_CATEGORIES.FLIGHT, bookingData);
    }
    setShowFlightForm(false);
  };

  const handleDeleteFlight = (flightId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
      const flightToDelete = flights.find(f => f.id === flightId);
      setFlights(prev => prev.filter(f => f.id !== flightId));
      toast.success('تم حذف حجز الطيران بنجاح');
      logDelete('حجز طيران مؤقت', flightId, ACTION_CATEGORIES.FLIGHT, flightToDelete);
    }
  };

  const handleEditFlight = (flight) => {
    setEditingFlight(flight);
    setShowFlightForm(true);
    logAction(ACTION_TYPES.VIEW, `تم فتح نموذج تعديل حجز طيران`, ACTION_CATEGORIES.FLIGHT, { flightId: flight.id });
  };

  const deleteFlightBooking = async (id) => {
    try {
      const bookingRef = doc(db, 'flightBookings', id);
      const bookingDoc = await getDoc(bookingRef);
      const bookingData = bookingDoc.data();
      
      await deleteDoc(bookingRef);
      
      // تسجيل حدث الحذف
      logDelete('حجز طيران', id, ACTION_CATEGORIES.FLIGHT, {
        customerName: bookingData?.customerName,
        flights: bookingData?.flights
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting flight booking:', error);
      throw error;
    }
  };

  const handleSaveBooking = async () => {
    if (!selectedCustomer?.id || !selectedCustomer?.name) {
      toast.error('يجب اختيار عميل قبل حفظ الحجز');
      return;
    }

    if (flights.length === 0) {
      toast.error('يجب إضافة رحلة طيران واحدة على الأقل قبل الحفظ');
      return;
    }

    // التحقق من رقم الإيصال
    if (!paymentData.receiptNumber?.trim()) {
      toast.error('يجب إدخال رقم الإيصال');
      return;
    }

    // التحقق من طريقة الدفع والحقول المرتبطة بها
    if (paymentData.paymentMethod === 'deferred' && !paymentData.deferredPaymentDate) {
      toast.error('يجب إدخال تاريخ الدفع الآجل');
      return;
    }

    if (paymentData.paymentMethod === 'installments') {
      if (!paymentData.firstInstallment || !paymentData.secondInstallment || !paymentData.thirdInstallment) {
        toast.error('يجب إدخال مبالغ جميع الدفعات');
        return;
      }
      
      const totalPrice = parseFloat(paymentData.price);
      const totalInstallments = 
        parseFloat(paymentData.firstInstallment || 0) + 
        parseFloat(paymentData.secondInstallment || 0) + 
        parseFloat(paymentData.thirdInstallment || 0);
      
      if (Math.abs(totalPrice - totalInstallments) > 0.001) {
        toast.error('مجموع الدفعات يجب أن يساوي إجمالي سعر البيع');
        return;
      }
    }

    setIsLoading(true);
    try {
      // التأكد من وجود جميع البيانات المطلوبة
      const bookingData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone || '',
        flights: flights.map(flight => ({
          ...flight,
          departureDate: flight.departureDate || '',
          returnDate: flight.returnDate || '',
          price: parseFloat(flight.price) || 0,
          cost: parseFloat(flight.cost) || 0
        })),
        payment: {
          ...paymentData,
          price: parseFloat(paymentData.price) || 0,
          firstInstallment: parseFloat(paymentData.firstInstallment || 0),
          secondInstallment: parseFloat(paymentData.secondInstallment || 0),
          thirdInstallment: parseFloat(paymentData.thirdInstallment || 0)
        },
        createdAt: new Date(),
        employeeId: user?.id || '',
        employeeName: user?.name || ''
      };

      // حفظ الحجز في قاعدة البيانات
      const docRef = await addDoc(collection(db, 'flightBookings'), bookingData);

      // إضافة الإيراد المحاسبي
      try {
        // تم استبدال الاستيراد الديناميكي باستيراد ثابت في الأعلى
        // const { addRevenueForBooking, addInvoiceForBooking, addReceiptForBooking } = await import('../../services/accountingService');
        await addRevenueForBooking(docRef.id, {
          amount: paymentData.price,
          bookingType: 'flight',
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          paymentMethod: paymentData.paymentMethod,
          receiptNumber: paymentData.receiptNumber,
          createdBy: user?.id || '',
          createdByName: user?.name || '',
          createdAt: new Date(),
        });
        toast.success('تم حفظ الحجز وإضافة الإيراد بنجاح');

        // إضافة الفاتورة
        try {
          await addInvoiceForBooking(docRef.id, {
            amount: paymentData.price,
            bookingType: 'flight',
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            paymentMethod: paymentData.paymentMethod,
            receiptNumber: paymentData.receiptNumber,
            createdBy: user?.id || '',
            createdByName: user?.name || '',
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
            bookingType: 'flight',
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            paymentMethod: paymentData.paymentMethod,
            receiptNumber: paymentData.receiptNumber,
            createdBy: user?.id || '',
            createdByName: user?.name || '',
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

      // تسجيل حدث الإضافة
      logCreate('حجز طيران', docRef.id, ACTION_CATEGORIES.FLIGHT, {
        customerName: selectedCustomer.name,
        flightsCount: flights.length,
        totalPrice: paymentData.price
      });

      navigate('/menu');
    } catch (error) {
      console.error('خطأ في حفظ الحجز:', error);
      toast.error('حدث خطأ أثناء حفظ الحجز');
    } finally {
      setIsLoading(false);
    }
  };

  // الحصول على إجمالي سعر البيع
  const getTotalPrice = () => {
    return flights.reduce((sum, flight) => sum + parseFloat(flight.price || 0), 0).toFixed(3);
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
              onChange={handleDateChange}
              name="deferredPaymentDate"
              required={false}
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

  const handleCustomerSelect = (customer) => {
    if (customer) {
      setSelectedCustomer({
        id: customer.id,
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        nationality: customer.nationality || '',
        passportNumber: customer.passportNumber || ''
      });
      
      // جلب بيانات العميل من قاعدة البيانات بشكل كامل
      const fetchFullCustomerData = async () => {
        try {
          const customerRef = doc(db, 'customers', customer.id);
          const customerDoc = await getDoc(customerRef);
          
          if (customerDoc.exists()) {
            const fullCustomerData = customerDoc.data();
            setSelectedCustomer(prevData => ({
              ...prevData,
              ...fullCustomerData
            }));
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات العميل الكاملة:', error);
        }
      };
      
      fetchFullCustomerData();
    } else {
      setSelectedCustomer(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <PageHeader title="حجوزات الرحلات الجوية" />
      
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
                setEditingFlight(null);
                setShowFlightForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedCustomer}
            >
              <FaPlus className="inline-block ml-2" />
              إضافة حجز طيران
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              {/* قسم بيانات العميل */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">بيانات العميل</h2>
                <CustomerSearch 
                  onSelect={handleCustomerSelect}
                  selectedCustomer={selectedCustomer}
                />
                {selectedCustomer && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">العميل المحدد: {selectedCustomer.name}</p>
                    {selectedCustomer.phone && <p className="text-gray-600">رقم الهاتف: {selectedCustomer.phone}</p>}
                    {selectedCustomer.email && <p className="text-gray-600">البريد الإلكتروني: {selectedCustomer.email}</p>}
                    {selectedCustomer.nationality && <p className="text-gray-600">الجنسية: {selectedCustomer.nationality}</p>}
                    {selectedCustomer.passportNumber && <p className="text-gray-600">رقم الجواز: {selectedCustomer.passportNumber}</p>}
                  </div>
                )}
              </div>

              {/* قائمة رحلات الطيران */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">رحلات الطيران المحجوزة</h2>
                {flights.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-4 border-b">رقم الرحلة</th>
                          <th className="p-4 border-b">اسم شركة الطيران</th>
                          <th className="p-4 border-b">من</th>
                          <th className="p-4 border-b">إلى</th>
                          <th className="p-4 border-b">تاريخ المغادرة</th>
                          <th className="p-4 border-b">وقت المغادرة</th>
                          <th className="p-4 border-b">تاريخ العودة</th>
                          <th className="p-4 border-b">سعر التكلفة</th>
                          <th className="p-4 border-b">سعر البيع</th>
                          <th className="p-4 border-b">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flights.map(flight => (
                          <tr key={flight.id} className="hover:bg-gray-50">
                            <td className="p-4 border-b">{flight.flightNumber}</td>
                            <td className="p-4 border-b">{flight.airline}</td>
                            <td className="p-4 border-b">{flight.origin}</td>
                            <td className="p-4 border-b">{flight.destination}</td>
                            <td className="p-4 border-b">{flight.departureDate}</td>
                            <td className="p-4 border-b">{flight.departureTime}</td>
                            <td className="p-4 border-b">{flight.returnDate || '-'}</td>
                            <td className="p-4 border-b">{flight.cost} د.ك</td>
                            <td className="p-4 border-b">{flight.price} د.ك</td>
                            <td className="p-4 border-b">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditFlight(flight)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <FaEdit className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFlight(flight.id)}
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
                          <td className="p-4 border-b">{flights.reduce((sum, flight) => sum + parseFloat(flight.cost || 0), 0).toFixed(3)} د.ك</td>
                          <td className="p-4 border-b">{flights.reduce((sum, flight) => sum + parseFloat(flight.price || 0), 0).toFixed(3)} د.ك</td>
                          <td className="p-4 border-b"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    لا توجد رحلات طيران محجوزة
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
                      value={flights.reduce((sum, flight) => sum + parseFloat(flight.cost || 0), 0).toFixed(3)}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-2">إجمالي سعر البيع (د.ك)</label>
                    <input
                      type="number"
                      name="price"
                      value={flights.reduce((sum, flight) => sum + parseFloat(flight.price || 0), 0).toFixed(3)}
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
                    disabled={isLoading || !selectedCustomer || flights.length === 0}
                    className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'جاري الحفظ...' : 'حفظ الحجز'}
                  </button>
                  <button
                    onClick={() => {
                      // هنا يمكن إضافة منطق طباعة الإيصال
                      toast.info('سيتم تنفيذ طباعة الإيصال قريباً');
                    }}
                    disabled={isLoading || !selectedCustomer || flights.length === 0}
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

      {/* نموذج إضافة رحلة طيران */}
      {showFlightForm && (
        <FlightBookingForm
          onSave={handleFlightBookingSave}
          onClose={() => {
            setShowFlightForm(false);
            setEditingFlight(null);
          }}
          editingFlight={editingFlight}
        />
      )}
    </div>
  );
}
