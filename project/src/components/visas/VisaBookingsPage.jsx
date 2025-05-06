import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaPassport, FaPlus, FaEdit, FaTrash, FaSearch, FaFileExport, FaUser, FaPrint, FaFilter, FaSort, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import PageHeader from '../shared/PageHeader';
import CustomerSearch from '../shared/CustomerSearch';
import VisaBookingForm from './VisaBookingForm';
import VisaReceipt from './VisaReceipt';
import { useReactToPrint } from 'react-to-print';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { getCurrentDate } from '../../utils/dateUtils';
import employeeService from '../../services/employeeService';
import { createFilteredQuery, isTestData } from '../../utils/dataFilters';
import { Badge } from '@chakra-ui/react';
import { addRevenueForBooking, addInvoiceForBooking, addReceiptForBooking } from '../../services/accountingService';
import { useActionLogger } from '../../hooks/useActionLogger';

export default function VisaBookingsPage() {
  const [visaBookings, setVisaBookings] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
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
  const [visas, setVisas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState({
    startDate: '',
    endDate: ''
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedBookingForPrint, setSelectedBookingForPrint] = useState(null);
  const receiptRef = useRef();
  const { logPageView, logCreate, logUpdate, logDelete, logSearch, logPrint, logExport, ACTION_CATEGORIES } = useActionLogger();

  // تسجيل عرض الصفحة عند التحميل
  useEffect(() => {
    logPageView('حجوزات التأشيرات', ACTION_CATEGORIES.VISA);
  }, [logPageView]);

  useEffect(() => {
    // استخدام الاستعلام المصفى بناءً على وضع التطبيق
    const q = createFilteredQuery('visaBookings');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVisaBookings(bookingsData);
      setIsLoading(false);
    }, (error) => {
      console.error('خطأ في جلب حجوزات التأشيرات:', error);
      toast.error('حدث خطأ أثناء جلب الحجوزات');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // جلب رقم الإيصال التلقائي عند تحميل الصفحة
    const fetchNextReceiptNumber = async () => {
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
    
    fetchNextReceiptNumber();
  }, []);

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

  const handleAddBooking = () => {
    if (!selectedCustomer) {
      toast.error('يرجى اختيار العميل أولاً');
      return;
    }
    setEditingBooking(null);
    setShowForm(true);
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setShowForm(true);
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'visaBookings', id));
      toast.success('تم حذف الحجز بنجاح');
      logDelete('حجز تأشيرة', ACTION_CATEGORIES.VISA);
    } catch (error) {
      console.error('Error deleting visa booking:', error);
      toast.error('حدث خطأ أثناء حذف الحجز');
    }
  };

  const handleVisaBookingSave = (visaData) => {
    if (editingBooking) {
      setVisas(prev => prev.map(v => v.id === editingBooking.id ? { ...visaData, id: editingBooking.id } : v));
      setEditingBooking(null);
      toast.success('تم تعديل التأشيرة بنجاح');
      logUpdate('حجز تأشيرة', ACTION_CATEGORIES.VISA);
    } else {
      setVisas(prev => [...prev, { ...visaData, id: Date.now() }]);
      toast.success('تم إضافة التأشيرة بنجاح');
      logCreate('حجز تأشيرة', ACTION_CATEGORIES.VISA);
    }
    setShowForm(false);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBooking(null);
  };

  const handleDeleteVisa = (visaId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه التأشيرة؟')) {
      setVisas(prev => prev.filter(v => v.id !== visaId));
      toast.success('تم حذف التأشيرة بنجاح');
      logDelete('تأشيرة', ACTION_CATEGORIES.VISA);
    }
  };

  const handleEditVisa = (visa) => {
    setEditingBooking(visa);
    setShowForm(true);
  };

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

  const handleSaveBooking = async () => {
    if (!selectedCustomer?.id || !selectedCustomer?.name) {
      toast.error('يجب اختيار عميل قبل حفظ الحجز');
      return;
    }

    if (visas.length === 0) {
      toast.error('يجب إضافة تأشيرة واحدة على الأقل قبل الحفظ');
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
      if (!paymentData.firstInstallment) {
        toast.error('يجب إدخال قيمة القسط الأول');
        return;
      }
    }

    try {
      // حساب إجمالي التكلفة والسعر
      const totalCost = visas.reduce((sum, visa) => sum + parseFloat(visa.cost || 0), 0);
      const totalPrice = visas.reduce((sum, visa) => sum + parseFloat(visa.price || 0), 0);

      // إنشاء بيانات الحجز
      const bookingData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone || '',
        customerEmail: selectedCustomer.email || '',
        customerNationality: selectedCustomer.nationality || '',
        customerPassportNumber: selectedCustomer.passportNumber || '',
        visas: visas,
        payment: {
          ...paymentData,
          totalCost,
          totalPrice
        },
        createdBy: user?.uid || '',
        createdByName: user?.displayName || '',
        createdAt: serverTimestamp(),
        status: 'pending'
      };

      // حفظ الحجز في قاعدة البيانات
      const docRef = await addDoc(collection(db, 'visaBookings'), bookingData);

      // إضافة الإيراد المحاسبي + الفاتورة + سند القبض
      try {
        // تم استبدال الاستيراد الديناميكي باستيراد ثابت في الأعلى
        // const { addRevenueForBooking, addInvoiceForBooking, addReceiptForBooking } = await import('../../services/accountingService');
        await addRevenueForBooking(docRef.id, {
          amount: paymentData.price,
          bookingType: 'visa',
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          paymentMethod: paymentData.paymentMethod,
          receiptNumber: paymentData.receiptNumber,
          createdBy: user?.uid || '',
          createdByName: user?.displayName || '',
          createdAt: new Date(),
        });
        toast.success('تم حفظ الحجز وإضافة الإيراد بنجاح');

        // إضافة الفاتورة
        try {
          await addInvoiceForBooking(docRef.id, {
            amount: paymentData.price,
            bookingType: 'visa',
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            paymentMethod: paymentData.paymentMethod,
            receiptNumber: paymentData.receiptNumber,
            createdBy: user?.uid || '',
            createdByName: user?.displayName || '',
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
            bookingType: 'visa',
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            paymentMethod: paymentData.paymentMethod,
            receiptNumber: paymentData.receiptNumber,
            createdBy: user?.uid || '',
            createdByName: user?.displayName || '',
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

      // إعادة تعيين النموذج
      setVisas([]);
      setSelectedCustomer(null);
      setPaymentData({
        receiptCode: paymentData.receiptCode,
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

      logCreate('حجز تأشيرة', ACTION_CATEGORIES.VISA);
    } catch (error) {
      console.error('Error saving visa booking:', error);
      toast.error('حدث خطأ أثناء حفظ الحجز');
    }
  };

  // دالة لتصفية الحجوزات بناءً على المعايير المحددة
  const getFilteredBookings = () => {
    return visaBookings.filter(booking => {
      // تصفية حسب كلمة البحث
      const searchMatch = 
        searchTerm === '' || 
        booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerPhone?.includes(searchTerm) ||
        booking.payment?.receiptNumber?.includes(searchTerm) ||
        booking.visas?.some(visa => 
          visa.visaType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          visa.country?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // تصفية حسب الحالة
      const statusMatch = 
        filterStatus === 'all' || 
        booking.status === filterStatus;
      
      // تصفية حسب التاريخ
      let dateMatch = true;
      if (filterDate.startDate && filterDate.endDate && booking.createdAt) {
        const bookingDate = booking.createdAt.toDate();
        const startDate = new Date(filterDate.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(filterDate.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        dateMatch = bookingDate >= startDate && bookingDate <= endDate;
      }
      
      return searchMatch && statusMatch && dateMatch;
    });
  };
  
  // دالة لترتيب الحجوزات
  const getSortedBookings = (bookings) => {
    return [...bookings].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'customer') {
        const nameA = a.customerName || '';
        const nameB = b.customerName || '';
        return sortOrder === 'asc' 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      } else if (sortBy === 'price') {
        const priceA = a.visas?.reduce((sum, visa) => sum + parseFloat(visa.price || 0), 0) || 0;
        const priceB = b.visas?.reduce((sum, visa) => sum + parseFloat(visa.price || 0), 0) || 0;
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      }
      return 0;
    });
  };
  
  // الحصول على الحجوزات المصفاة والمرتبة
  const filteredAndSortedBookings = getSortedBookings(getFilteredBookings());
  
  // دالة لتغيير معيار الترتيب
  const handleSortChange = (criteria) => {
    if (sortBy === criteria) {
      // إذا كان نفس المعيار، قم بتبديل الترتيب
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // إذا كان معيار مختلف، قم بتعيين المعيار الجديد والترتيب التنازلي كافتراضي
      setSortBy(criteria);
      setSortOrder('desc');
    }
  };
  
  // دالة لتغيير فلتر التاريخ
  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterDate({
      ...filterDate,
      [name]: value
    });
  };
  
  // دالة لإعادة تعيين جميع الفلاتر
  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterDate({
      startDate: '',
      endDate: ''
    });
    setSortBy('date');
    setSortOrder('desc');
    logSearch('حجوزات تأشيرات', ACTION_CATEGORIES.VISA);
  };

  // وظيفة طباعة الإيصال
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: 'إيصال حجز تأشيرة',
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        resolve();
      });
    },
    onAfterPrint: () => {
      toast.success('تم طباعة الإيصال بنجاح');
      setSelectedBookingForPrint(null);
      logPrint('إيصال حجز تأشيرة', ACTION_CATEGORIES.VISA);
    }
  });
  
  // وظيفة لعرض وطباعة الإيصال
  const handlePrintReceipt = async (bookingId) => {
    try {
      const bookingDoc = await getDoc(doc(db, 'visaBookings', bookingId));
      if (bookingDoc.exists()) {
        const bookingData = { id: bookingDoc.id, ...bookingDoc.data() };
        
        // جلب بيانات العميل إذا كانت متوفرة
        let customerData = { name: bookingData.customerName, phone: bookingData.customerPhone };
        if (bookingData.customerId) {
          const customerDoc = await getDoc(doc(db, 'customers', bookingData.customerId));
          if (customerDoc.exists()) {
            customerData = { id: customerDoc.id, ...customerDoc.data() };
          }
        }
        
        setSelectedBookingForPrint({
          booking: bookingData,
          customer: customerData,
          visas: bookingData.visas || []
        });
        
        // تأخير قليل للتأكد من تحديث المكون قبل الطباعة
        setTimeout(() => {
          handlePrint();
        }, 100);
      } else {
        toast.error('لم يتم العثور على بيانات الحجز');
      }
    } catch (error) {
      console.error('Error fetching booking for print:', error);
      toast.error('حدث خطأ أثناء تحضير الإيصال للطباعة');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="حجوزات التأشيرات"
        icon={<FaPassport className="text-2xl" />}
      />

      {/* بحث العملاء */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaUser className="ml-2" />
          اختيار العميل
        </h2>
        <CustomerSearch onSelect={handleCustomerSelect} />

        {selectedCustomer && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">بيانات العميل المحدد:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <span className="font-semibold">الاسم:</span> {selectedCustomer.name}
              </div>
              <div>
                <span className="font-semibold">رقم الهاتف:</span> {selectedCustomer.phone || 'غير متوفر'}
              </div>
              <div>
                <span className="font-semibold">البريد الإلكتروني:</span> {selectedCustomer.email || 'غير متوفر'}
              </div>
              <div>
                <span className="font-semibold">الجنسية:</span> {selectedCustomer.nationality || 'غير متوفر'}
              </div>
              <div>
                <span className="font-semibold">رقم الجواز:</span> {selectedCustomer.passportNumber || 'غير متوفر'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* قسم التأشيرات */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FaPassport className="ml-2" />
            التأشيرات
          </h2>
          <button
            onClick={handleAddBooking}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
            disabled={!selectedCustomer}
          >
            <FaPlus className="ml-2" />
            إضافة تأشيرة
          </button>
        </div>

        {visas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-right">نوع التأشيرة</th>
                  <th className="py-3 px-4 text-right">الدولة</th>
                  <th className="py-3 px-4 text-right">المدة</th>
                  <th className="py-3 px-4 text-right">التكلفة</th>
                  <th className="py-3 px-4 text-right">السعر</th>
                  <th className="py-3 px-4 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {visas.map((visa) => (
                  <tr key={visa.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{visa.visaType}</td>
                    <td className="py-3 px-4">{visa.country}</td>
                    <td className="py-3 px-4">{visa.duration}</td>
                    <td className="py-3 px-4">{formatCurrency(visa.cost)}</td>
                    <td className="py-3 px-4">{formatCurrency(visa.price)}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => handleEditVisa(visa)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteVisa(visa.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan="3" className="py-3 px-4 text-left">الإجمالي</td>
                  <td className="py-3 px-4">
                    {formatCurrency(visas.reduce((sum, visa) => sum + parseFloat(visa.cost || 0), 0))}
                  </td>
                  <td className="py-3 px-4">
                    {formatCurrency(visas.reduce((sum, visa) => sum + parseFloat(visa.price || 0), 0))}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {selectedCustomer ? 'لم يتم إضافة أي تأشيرات بعد' : 'يرجى اختيار العميل أولاً ثم إضافة التأشيرات'}
          </div>
        )}

        {visas.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">تفاصيل الدفع</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-600 mb-2">رقم الإيصال التلقائي</label>
                <input
                  type="text"
                  name="receiptCode"
                  value={paymentData.receiptCode}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                  disabled
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-600 mb-2">طريقة الدفع*</label>
                <select
                  name="paymentMethod"
                  value={paymentData.paymentMethod}
                  onChange={handlePaymentChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="knet">كي نت</option>
                  <option value="cash">نقدي</option>
                  <option value="visa">فيزا</option>
                  <option value="mastercard">ماستر كارد</option>
                  <option value="deferred">آجل</option>
                  <option value="installments">أقساط</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 mb-2">تاريخ الدفع</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={paymentData.paymentDate}
                  onChange={handleDateChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {paymentData.paymentMethod === 'deferred' && (
              <div className="mb-6">
                <label className="block text-gray-600 mb-2">تاريخ الدفع الآجل*</label>
                <input
                  type="date"
                  name="deferredPaymentDate"
                  value={paymentData.deferredPaymentDate}
                  onChange={handleDateChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
            
            {paymentData.paymentMethod === 'installments' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-gray-600 mb-2">الدفعة الأولى*</label>
                  <input
                    type="number"
                    step="0.001"
                    name="firstInstallment"
                    value={paymentData.firstInstallment}
                    onChange={handlePaymentChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">الدفعة الثانية</label>
                  <input
                    type="number"
                    step="0.001"
                    name="secondInstallment"
                    value={paymentData.secondInstallment}
                    onChange={handlePaymentChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">الدفعة الثالثة</label>
                  <input
                    type="number"
                    step="0.001"
                    name="thirdInstallment"
                    value={paymentData.thirdInstallment}
                    onChange={handlePaymentChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">ملاحظات</label>
              <textarea
                name="notes"
                value={paymentData.notes}
                onChange={handlePaymentChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
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
                className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || visas.length === 0 || !selectedCustomer}
              >
                {isLoading ? 'جاري الحفظ...' : 'حفظ الحجز'}
              </button>
              <button
                onClick={() => {
                  // هنا يمكن إضافة منطق طباعة الإيصال
                  toast.info('سيتم تنفيذ طباعة الإيصال قريباً');
                }}
                disabled={isLoading || visas.length === 0 || !selectedCustomer}
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                طباعة إيصال
              </button>
            </div>
          </div>
        )}
      </div>

      {/* قائمة الحجوزات السابقة */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FaPassport className="ml-2" />
            الحجوزات السابقة
          </h2>
          <div className="flex items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="بحث..."
                className="border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="ml-4 w-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">الكل</option>
              <option value="pending">قيد الانتظار</option>
              <option value="completed">مكتمل</option>
            </select>
            <div className="ml-4 flex items-center">
              <label className="mr-2">من:</label>
              <input
                type="date"
                name="startDate"
                value={filterDate.startDate}
                onChange={handleDateFilterChange}
                className="w-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="ml-4 flex items-center">
              <label className="mr-2">إلى:</label>
              <input
                type="date"
                name="endDate"
                value={filterDate.endDate}
                onChange={handleDateFilterChange}
                className="w-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={resetFilters}
              className="ml-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              إعادة تعيين
            </button>
            <button
              className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPrint className="mr-2" />
              طباعة
            </button>
            <button
              className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaFilter className="mr-2" />
              تصفية
            </button>
            <button
              className="ml-4 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <FaSort className="mr-2" />
              ترتيب
            </button>
            <button
              className="ml-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FaSortAmountDown className="mr-2" />
              ترتيب تصاعدي
            </button>
            <button
              className="ml-4 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <FaSortAmountUp className="mr-2" />
              ترتيب تنازلي
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : filteredAndSortedBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-right">رقم الإيصال</th>
                  <th className="py-3 px-4 text-right">اسم العميل</th>
                  <th className="py-3 px-4 text-right">رقم الهاتف</th>
                  <th className="py-3 px-4 text-right">عدد التأشيرات</th>
                  <th className="py-3 px-4 text-right">المبلغ الإجمالي</th>
                  <th className="py-3 px-4 text-right">تاريخ الحجز</th>
                  <th className="py-3 px-4 text-right">الحالة</th>
                  <th className="py-3 px-4 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedBookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{booking.payment?.receiptNumber || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="font-semibold">{booking.customerName}</span>
                        {/* عرض شارة للبيانات التجريبية */}
                        {isTestData(booking) && (
                          <Badge ml={2} colorScheme="purple">تجريبي</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">{booking.customerPhone || '-'}</td>
                    <td className="py-3 px-4">{booking.visas?.length || 0}</td>
                    <td className="py-3 px-4">{formatCurrency(booking.payment?.totalPrice || 0)}</td>
                    <td className="py-3 px-4">
                      {booking.createdAt ? new Date(booking.createdAt.toDate()).toLocaleDateString('ar-EG') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status === 'completed' ? 'مكتمل' :
                         booking.status === 'pending' ? 'قيد الانتظار' :
                         booking.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => handleEditBooking(booking)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(booking.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaPrint />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            لا توجد حجوزات تأشيرات
          </div>
        )}
      </div>

      {/* نموذج إضافة/تعديل التأشيرة */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <VisaBookingForm
            onSave={handleVisaBookingSave}
            initialData={editingBooking}
            onClose={handleCloseForm}
          />
        </div>
      )}

      {/* نموذج طباعة الإيصال */}
      {selectedBookingForPrint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <VisaReceipt
            ref={receiptRef}
            booking={selectedBookingForPrint.booking}
            customer={selectedBookingForPrint.customer}
            visas={selectedBookingForPrint.visas}
          />
        </div>
      )}
    </div>
  );
}
