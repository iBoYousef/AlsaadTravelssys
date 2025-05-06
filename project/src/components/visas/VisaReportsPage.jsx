import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaPassport, FaSearch, FaFileExport, FaCalendarAlt, FaPrint, FaFilePdf } from 'react-icons/fa';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import PageHeader from '../shared/PageHeader';
import { formatCurrency } from '../../utils/formatters';
import DateInput from '../shared/DateInput';
import { useReactToPrint } from 'react-to-print';

export default function VisaReportsPage() {
  const [visaBookings, setVisaBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    visaType: '',
    country: '',
    paymentMethod: '',
    status: ''
  });
  const [summary, setSummary] = useState({
    totalBookings: 0,
    totalVisas: 0,
    totalCost: 0,
    totalPrice: 0,
    totalProfit: 0
  });
  const reportRef = React.useRef();

  useEffect(() => {
    // تعيين التاريخ الافتراضي (الشهر الحالي)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setFilters({
      ...filters,
      startDate: firstDayOfMonth.toISOString().split('T')[0],
      endDate: lastDayOfMonth.toISOString().split('T')[0]
    });
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleDateChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      let q = query(collection(db, 'visaBookings'), orderBy('createdAt', 'desc'));
      
      // إضافة فلاتر التاريخ إذا تم تحديدها
      if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        q = query(
          q,
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          where('createdAt', '<=', Timestamp.fromDate(endDate))
        );
      }
      
      const querySnapshot = await getDocs(q);
      let bookings = [];
      
      querySnapshot.forEach((doc) => {
        const bookingData = { id: doc.id, ...doc.data() };
        
        // تطبيق الفلاتر الإضافية على النتائج
        let matchesFilters = true;
        
        if (filters.visaType && bookingData.visas) {
          const hasVisaType = bookingData.visas.some(visa => 
            visa.visaType === filters.visaType
          );
          if (!hasVisaType) matchesFilters = false;
        }
        
        if (filters.country && bookingData.visas) {
          const hasCountry = bookingData.visas.some(visa => 
            visa.country === filters.country
          );
          if (!hasCountry) matchesFilters = false;
        }
        
        if (filters.paymentMethod && bookingData.payment) {
          if (bookingData.payment.paymentMethod !== filters.paymentMethod) {
            matchesFilters = false;
          }
        }
        
        if (filters.status) {
          if (bookingData.status !== filters.status) {
            matchesFilters = false;
          }
        }
        
        if (matchesFilters) {
          bookings.push(bookingData);
        }
      });
      
      setVisaBookings(bookings);
      calculateSummary(bookings);
    } catch (error) {
      console.error('Error fetching visa bookings for report:', error);
      toast.error('حدث خطأ أثناء جلب بيانات التقرير');
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateSummary = (bookings) => {
    let totalBookings = bookings.length;
    let totalVisas = 0;
    let totalCost = 0;
    let totalPrice = 0;
    
    bookings.forEach(booking => {
      if (booking.visas && Array.isArray(booking.visas)) {
        totalVisas += booking.visas.length;
        
        booking.visas.forEach(visa => {
          totalCost += parseFloat(visa.cost || 0);
          totalPrice += parseFloat(visa.price || 0);
        });
      }
    });
    
    setSummary({
      totalBookings,
      totalVisas,
      totalCost,
      totalPrice,
      totalProfit: totalPrice - totalCost
    });
  };
  
  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: 'تقرير التأشيرات',
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        resolve();
      });
    },
    onAfterPrint: () => {
      toast.success('تم طباعة التقرير بنجاح');
    }
  });
  
  const exportToPDF = () => {
    handlePrint();
  };
  
  const exportToExcel = () => {
    // تنفيذ التصدير إلى إكسل (يمكن استخدام مكتبة مثل xlsx)
    toast.info('جاري تطوير هذه الميزة');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="تقارير التأشيرات"
        icon={<FaPassport className="text-2xl" />}
      />
      
      {/* فلاتر التقرير */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaSearch className="ml-2" />
          فلاتر التقرير
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-gray-600 mb-2">من تاريخ</label>
            <DateInput
              name="startDate"
              value={filters.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-2">إلى تاريخ</label>
            <DateInput
              name="endDate"
              value={filters.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-2">نوع التأشيرة</label>
            <select
              name="visaType"
              value={filters.visaType}
              onChange={handleFilterChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الأنواع</option>
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-gray-600 mb-2">الدولة</label>
            <select
              name="country"
              value={filters.country}
              onChange={handleFilterChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الدول</option>
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
            </select>
          </div>
          <div>
            <label className="block text-gray-600 mb-2">طريقة الدفع</label>
            <select
              name="paymentMethod"
              value={filters.paymentMethod}
              onChange={handleFilterChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الطرق</option>
              <option value="knet">كي نت</option>
              <option value="cash">نقدي</option>
              <option value="visa">فيزا</option>
              <option value="mastercard">ماستر كارد</option>
              <option value="deferred">آجل</option>
              <option value="installments">أقساط</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-600 mb-2">الحالة</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-center mt-4">
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            disabled={isLoading}
          >
            <FaSearch className="ml-2" />
            {isLoading ? 'جاري البحث...' : 'عرض التقرير'}
          </button>
        </div>
      </div>
      
      {/* نتائج التقرير */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6" ref={reportRef}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <FaPassport className="ml-2" />
            نتائج التقرير
          </h2>
          <div className="flex space-x-2 rtl:space-x-reverse">
            <button
              onClick={handlePrint}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <FaPrint className="ml-2" />
              طباعة
            </button>
            <button
              onClick={exportToPDF}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <FaFilePdf className="ml-2" />
              PDF
            </button>
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <FaFileExport className="ml-2" />
              Excel
            </button>
          </div>
        </div>
        
        <div className="print-section">
          <div className="text-center mb-6 print-header">
            <h1 className="text-2xl font-bold">شركة السعد للسياحة والسفر</h1>
            <p className="text-lg">تقرير التأشيرات</p>
            <p className="text-gray-600">
              الفترة من: {filters.startDate ? new Date(filters.startDate).toLocaleDateString('ar-EG') : '-'} 
              إلى: {filters.endDate ? new Date(filters.endDate).toLocaleDateString('ar-EG') : '-'}
            </p>
          </div>
          
          {/* ملخص التقرير */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-gray-600 mb-1">عدد الحجوزات</p>
              <p className="text-xl font-bold">{summary.totalBookings}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-gray-600 mb-1">عدد التأشيرات</p>
              <p className="text-xl font-bold">{summary.totalVisas}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-gray-600 mb-1">إجمالي التكلفة</p>
              <p className="text-xl font-bold">{formatCurrency(summary.totalCost)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-gray-600 mb-1">إجمالي المبيعات</p>
              <p className="text-xl font-bold">{formatCurrency(summary.totalPrice)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-gray-600 mb-1">صافي الربح</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(summary.totalProfit)}</p>
            </div>
          </div>
          
          {/* جدول التأشيرات */}
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : visaBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-right">رقم الإيصال</th>
                    <th className="py-3 px-4 text-right">اسم العميل</th>
                    <th className="py-3 px-4 text-right">تاريخ الحجز</th>
                    <th className="py-3 px-4 text-right">نوع التأشيرة</th>
                    <th className="py-3 px-4 text-right">الدولة</th>
                    <th className="py-3 px-4 text-right">طريقة الدفع</th>
                    <th className="py-3 px-4 text-right">التكلفة</th>
                    <th className="py-3 px-4 text-right">السعر</th>
                    <th className="py-3 px-4 text-right">الربح</th>
                  </tr>
                </thead>
                <tbody>
                  {visaBookings.map((booking) => (
                    booking.visas && booking.visas.map((visa, visaIndex) => (
                      <tr key={`${booking.id}-${visaIndex}`} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{booking.payment?.receiptNumber || '-'}</td>
                        <td className="py-3 px-4">{booking.customerName}</td>
                        <td className="py-3 px-4">
                          {booking.createdAt ? new Date(booking.createdAt.toDate()).toLocaleDateString('ar-EG') : '-'}
                        </td>
                        <td className="py-3 px-4">{visa.visaType}</td>
                        <td className="py-3 px-4">{visa.country}</td>
                        <td className="py-3 px-4">
                          {booking.payment?.paymentMethod === 'knet' ? 'كي نت' :
                           booking.payment?.paymentMethod === 'cash' ? 'نقدي' :
                           booking.payment?.paymentMethod === 'visa' ? 'فيزا' :
                           booking.payment?.paymentMethod === 'mastercard' ? 'ماستر كارد' :
                           booking.payment?.paymentMethod === 'deferred' ? 'آجل' :
                           booking.payment?.paymentMethod === 'installments' ? 'أقساط' :
                           booking.payment?.paymentMethod || '-'}
                        </td>
                        <td className="py-3 px-4">{formatCurrency(visa.cost)}</td>
                        <td className="py-3 px-4">{formatCurrency(visa.price)}</td>
                        <td className="py-3 px-4 text-green-600">
                          {formatCurrency(parseFloat(visa.price || 0) - parseFloat(visa.cost || 0))}
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد بيانات متطابقة مع معايير البحث
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-header {
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
}
