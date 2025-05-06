import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaPassport, FaUser, FaCalendar, FaMoneyBillWave, FaSearch, FaFilePdf, FaTimes, FaSort, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import PageHeader from '../shared/PageHeader';
import { toast } from 'react-toastify';
import DateInput from '../shared/DateInput';
import { format } from 'date-fns';
import ar from 'date-fns/locale/ar';
import { useAuth } from '../../contexts/AuthContext';

export default function VisaBookingsHistory() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    customerName: '',
    startDate: '',
    endDate: '',
    paymentMethod: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const bookingsRef = collection(db, 'visaBookings');
        const q = query(bookingsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const bookingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        
        setBookings(bookingsData);
        setFilteredBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('حدث خطأ أثناء جلب الحجوزات');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      customerName: '',
      startDate: '',
      endDate: '',
      paymentMethod: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setFilteredBookings(bookings);
  };

  const applyFilters = () => {
    setIsFiltering(true);
    let filtered = [...bookings];

    try {
      if (filters.customerName) {
        const searchTerm = filters.customerName.toLowerCase().trim();
        filtered = filtered.filter(booking => 
          booking.customerName?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(booking => 
          booking.createdAt >= startDate
        );
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(booking => 
          booking.createdAt <= endDate
        );
      }

      if (filters.paymentMethod) {
        filtered = filtered.filter(booking => 
          booking.payment?.paymentMethod === filters.paymentMethod
        );
      }

      if (filters.minAmount) {
        filtered = filtered.filter(booking => 
          parseFloat(booking.payment?.price || 0) >= parseFloat(filters.minAmount)
        );
      }

      if (filters.maxAmount) {
        filtered = filtered.filter(booking => 
          parseFloat(booking.payment?.price || 0) <= parseFloat(filters.maxAmount)
        );
      }

      filtered.sort((a, b) => {
        if (filters.sortBy === 'date') {
          return filters.sortOrder === 'desc' 
            ? (b.createdAt || 0) - (a.createdAt || 0)
            : (a.createdAt || 0) - (b.createdAt || 0);
        } else if (filters.sortBy === 'amount') {
          const aPrice = parseFloat(a.payment?.price || 0);
          const bPrice = parseFloat(b.payment?.price || 0);
          return filters.sortOrder === 'desc' ? bPrice - aPrice : aPrice - bPrice;
        }
        return 0;
      });

      setFilteredBookings(filtered);
      const resultsCount = filtered.length;
      toast.info(`تم العثور على ${resultsCount} حجز${resultsCount !== 1 ? 'وزات' : ''}`);
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('حدث خطأ أثناء تطبيق الفلاتر');
    } finally {
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (bookings.length > 0) {
        applyFilters();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, bookings]);

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ar });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const getTotalAmount = () => {
    return filteredBookings.reduce((total, booking) => 
      total + parseFloat(booking.payment?.price || 0), 0
    ).toFixed(3);
  };

  const getUniqueCustomers = () => {
    return new Set(filteredBookings.map(booking => booking.customerName)).size;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <PageHeader title="سجل حجوزات التأشيرات" />

        {/* قسم الفلترة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center text-gray-800">
              <FaSearch className="ml-2 text-blue-500" />
              فلترة الحجوزات
            </h2>
            <button
              onClick={clearFilters}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FaTimes className="ml-2" />
              <span>مسح الفلاتر</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل</label>
              <input
                type="text"
                name="customerName"
                value={filters.customerName}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-md"
                placeholder="ابحث باسم العميل..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
              <DateInput
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full"
                required={false}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
              <DateInput
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full"
                required={false}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
              <select
                name="paymentMethod"
                value={filters.paymentMethod}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">الكل</option>
                <option value="cash">نقدي</option>
                <option value="card">بطاقة</option>
                <option value="transfer">تحويل</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى للمبلغ</label>
              <input
                type="number"
                name="minAmount"
                value={filters.minAmount}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-md"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأعلى للمبلغ</label>
              <input
                type="number"
                name="maxAmount"
                value={filters.maxAmount}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-md"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* ملخص الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الحجوزات</p>
                <p className="text-2xl font-bold">{filteredBookings.length}</p>
              </div>
              <FaPassport className="text-3xl text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المبالغ</p>
                <p className="text-2xl font-bold">{getTotalAmount()} د.ك</p>
              </div>
              <FaMoneyBillWave className="text-3xl text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">عدد العملاء</p>
                <p className="text-2xl font-bold">{getUniqueCustomers()}</p>
              </div>
              <FaUser className="text-3xl text-purple-500" />
            </div>
          </div>
        </div>

        {/* جدول الحجوزات */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الحجز
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم العميل
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع التأشيرة
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الحجز
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    طريقة الدفع
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">جاري التحميل...</td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">لا توجد حجوزات</td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.visaType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(booking.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.payment?.price} د.ك
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.payment?.paymentMethod === 'cash' && 'نقدي'}
                        {booking.payment?.paymentMethod === 'card' && 'بطاقة'}
                        {booking.payment?.paymentMethod === 'transfer' && 'تحويل'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
