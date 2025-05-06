import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import PageHeader from '../shared/PageHeader';
import { FaPlus, FaEdit, FaTrash, FaCar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CustomerSearch from '../shared/CustomerSearch';
import { getCurrentDate } from '../../utils/dateUtils';
import employeeService from '../../services/employeeService';
import VehicleBookingForm from './VehicleBookingForm';
import DateInput from '../shared/DateInput';
import { addRevenueForBooking, addInvoiceForBooking, addReceiptForBooking } from '../../services/accountingService';

export default function VehicleBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [editingVehicle, setEditingVehicle] = useState(null);
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
    const q = query(collection(db, 'vehicleBookings'), orderBy('createdAt', 'desc'));
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

  const handleDateChange = (date, field) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleVehicleBookingSave = (vehicleData) => {
    if (editingVehicle) {
      setVehicles(vehicles.map(vehicle => 
        vehicle.id === editingVehicle.id ? { ...vehicleData, id: editingVehicle.id } : vehicle
      ));
      setEditingVehicle(null);
      toast.success('تم تحديث حجز السيارة بنجاح');
    } else {
      const newVehicle = { ...vehicleData, id: Date.now() };
      setVehicles([...vehicles, newVehicle]);
      toast.success('تم إضافة حجز السيارة بنجاح');
    }
    setShowVehicleForm(false);
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowVehicleForm(true);
  };

  const handleDeleteVehicle = (vehicleId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      toast.success('تم حذف حجز السيارة بنجاح');
    }
  };

  const handleSaveBooking = async () => {
    if (!selectedCustomer) {
      toast.error('يجب اختيار عميل قبل حفظ الحجز');
      return;
    }

    if (vehicles.length === 0) {
      toast.error('يجب إضافة حجز مركبة واحدة على الأقل قبل الحفظ');
      return;
    }

    if (!paymentData.receiptNumber || !paymentData.price) {
      toast.error('يجب إدخال جميع بيانات الدفع المطلوبة');
      return;
    }

    // التحقق من صحة طريقة الدفع والحقول المرتبطة بها
    if (paymentData.paymentMethod === 'deferred' && !paymentData.deferredPaymentDate) {
      toast.error('يجب إدخال تاريخ الدفع الآجل');
      return;
    }

    if (paymentData.paymentMethod === 'installments') {
      if (!paymentData.firstInstallment || !paymentData.secondInstallment || !paymentData.thirdInstallment) {
        toast.error('يجب إدخال مبالغ جميع الدفعات');
        return;
      }
      
      // التحقق من أن مجموع الدفعات يساوي المبلغ الإجمالي
      const totalPrice = vehicles.reduce((sum, vehicle) => sum + parseFloat(vehicle.price || 0), 0);
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
      // حفظ الحجز في قاعدة البيانات
      const bookingDocRef = await addDoc(collection(db, 'vehicleBookings'), {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        vehicles,
        payment: paymentData,
        createdAt: new Date(),
        employeeId: user.id,
        employeeName: user.name
      });

      // إضافة إدخال إيراد تلقائي + فاتورة + سند قبض
      try {
        // تم استبدال الاستيراد الديناميكي باستيراد ثابت في الأعلى
        // const { addRevenueForBooking, addInvoiceForBooking, addReceiptForBooking } = await import('../../services/accountingService');
        await addRevenueForBooking(bookingDocRef.id, {
          amount: paymentData.price,
          bookingType: 'vehicle',
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
          await addInvoiceForBooking(bookingDocRef.id, {
            amount: paymentData.price,
            bookingType: 'vehicle',
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
          await addReceiptForBooking(bookingDocRef.id, {
            amount: paymentData.price,
            bookingType: 'vehicle',
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
    return vehicles.reduce((sum, vehicle) => sum + parseFloat(vehicle.price || 0), 0).toFixed(3);
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
              onChange={(value) => handleDateChange(value, 'deferredPaymentDate')}
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
      <PageHeader title="حجوزات السيارات" />
      
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
                setEditingVehicle(null);
                setShowVehicleForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedCustomer}
            >
              <FaPlus className="inline-block ml-2" />
              إضافة حجز مركبة
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              {/* قسم بيانات العميل */}
              <CustomerSearch 
                onSelect={setSelectedCustomer}
                selectedCustomer={selectedCustomer}
              />

              {/* قائمة حجوزات المركبات */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">المركبات المحجوزة</h2>
                {vehicles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-4 border-b">نوع المركبة</th>
                          <th className="p-4 border-b">الشركة</th>
                          <th className="p-4 border-b">المدينة</th>
                          <th className="p-4 border-b">تاريخ الاستلام</th>
                          <th className="p-4 border-b">تاريخ التسليم</th>
                          <th className="p-4 border-b">عدد الأيام</th>
                          <th className="p-4 border-b">سعر التكلفة</th>
                          <th className="p-4 border-b">سعر البيع</th>
                          <th className="p-4 border-b">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicles.map(vehicle => (
                          <tr key={vehicle.id} className="hover:bg-gray-50">
                            <td className="p-4 border-b">{vehicle.vehicleType}</td>
                            <td className="p-4 border-b">{vehicle.company}</td>
                            <td className="p-4 border-b">{vehicle.city}</td>
                            <td className="p-4 border-b">{vehicle.pickupDate}</td>
                            <td className="p-4 border-b">{vehicle.dropoffDate}</td>
                            <td className="p-4 border-b">{vehicle.numberOfDays}</td>
                            <td className="p-4 border-b">{vehicle.cost} د.ك</td>
                            <td className="p-4 border-b">{vehicle.price} د.ك</td>
                            <td className="p-4 border-b">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditVehicle(vehicle)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <FaEdit className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteVehicle(vehicle.id)}
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
                          <td colSpan="6" className="p-4 border-b text-left">المجموع:</td>
                          <td className="p-4 border-b">{vehicles.reduce((sum, vehicle) => sum + parseFloat(vehicle.cost || 0), 0).toFixed(3)} د.ك</td>
                          <td className="p-4 border-b">{vehicles.reduce((sum, vehicle) => sum + parseFloat(vehicle.price || 0), 0).toFixed(3)} د.ك</td>
                          <td className="p-4 border-b"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    لا توجد مركبات محجوزة
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
                      value={vehicles.reduce((sum, vehicle) => sum + parseFloat(vehicle.cost || 0), 0).toFixed(3)}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-2">إجمالي سعر البيع (د.ك)</label>
                    <input
                      type="number"
                      name="price"
                      value={vehicles.reduce((sum, vehicle) => sum + parseFloat(vehicle.price || 0), 0).toFixed(3)}
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
                    disabled={isLoading || !selectedCustomer || vehicles.length === 0}
                    className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'جاري الحفظ...' : 'حفظ الحجز'}
                  </button>
                  <button
                    onClick={() => {
                      // هنا يمكن إضافة منطق طباعة الإيصال
                      toast.info('سيتم تنفيذ طباعة الإيصال قريباً');
                    }}
                    disabled={isLoading || !selectedCustomer || vehicles.length === 0}
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

      {/* نموذج إضافة مركبة */}
      {showVehicleForm && (
        <VehicleBookingForm
          onSave={handleVehicleBookingSave}
          onClose={() => {
            setShowVehicleForm(false);
            setEditingVehicle(null);
          }}
          editingVehicle={editingVehicle}
        />
      )}
    </div>
  );
}
