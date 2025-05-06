import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaPlane, FaUser, FaCalendar, FaMoneyBillWave, FaSearch, FaFilePdf, FaTimes, FaSort, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import PageHeader from '../shared/PageHeader';
import { toast } from 'react-toastify';
import DateInput from '../shared/DateInput';
import { format } from 'date-fns';
import ar from 'date-fns/locale/ar';
import { useAuth } from '../../contexts/AuthContext';

export default function FlightBookingsHistory() {
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
        const bookingsRef = collection(db, 'flightBookings');
        const q = query(bookingsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const bookingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));

        console.log('Fetched bookings:', bookingsData); // للتأكد من جلب البيانات
        
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
      // تطبيق الفلاتر
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

      // تطبيق الترتيب
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
        <PageHeader title="سجل حجوزات تذاكر الطيران" />

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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-600 mb-2 text-sm">اسم العميل</label>
              <div className="relative">
                <FaUser className="absolute top-3 right-3 text-gray-400" />
                <input
                  type="text"
                  name="customerName"
                  value={filters.customerName}
                  onChange={handleFilterChange}
                  className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="ابحث باسم العميل..."
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-2 text-sm">من تاريخ</label>
              <div className="relative">
                <FaCalendar className="absolute top-3 right-3 text-gray-400" />
                <DateInput
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-2 text-sm">إلى تاريخ</label>
              <div className="relative">
                <FaCalendar className="absolute top-3 right-3 text-gray-400" />
                <DateInput
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-2 text-sm">طريقة الدفع</label>
              <div className="relative">
                <FaMoneyBillWave className="absolute top-3 right-3 text-gray-400" />
                <select
                  name="paymentMethod"
                  value={filters.paymentMethod}
                  onChange={handleFilterChange}
                  className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none"
                >
                  <option value="">الكل</option>
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

            <div>
              <label className="block text-gray-600 mb-2 text-sm">الحد الأدنى للمبلغ</label>
              <div className="relative">
                <span className="absolute top-3 right-3 text-gray-400 text-sm">د.ك</span>
                <input
                  type="number"
                  name="minAmount"
                  value={filters.minAmount}
                  onChange={handleFilterChange}
                  className="w-full p-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="0.000"
                  step="0.001"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-2 text-sm">الحد الأقصى للمبلغ</label>
              <div className="relative">
                <span className="absolute top-3 right-3 text-gray-400 text-sm">د.ك</span>
                <input
                  type="number"
                  name="maxAmount"
                  value={filters.maxAmount}
                  onChange={handleFilterChange}
                  className="w-full p-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="0.000"
                  step="0.001"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-2 text-sm">ترتيب حسب</label>
              <div className="relative">
                <FaSort className="absolute top-3 right-3 text-gray-400" />
                <select
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                  className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none"
                >
                  <option value="date">التاريخ</option>
                  <option value="amount">المبلغ</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-2 text-sm">اتجاه الترتيب</label>
              <div className="relative">
                {filters.sortOrder === 'desc' ? (
                  <FaSortAmountDown className="absolute top-3 right-3 text-gray-400" />
                ) : (
                  <FaSortAmountUp className="absolute top-3 right-3 text-gray-400" />
                )}
                <select
                  name="sortOrder"
                  value={filters.sortOrder}
                  onChange={handleFilterChange}
                  className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none"
                >
                  <option value="desc">تنازلي</option>
                  <option value="asc">تصاعدي</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* قسم الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-opacity-90 text-sm">إجمالي الحجوزات</p>
                <h3 className="text-2xl font-bold mt-1">{filteredBookings.length}</h3>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <FaPlane className="text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-opacity-90 text-sm">إجمالي المبالغ</p>
                <h3 className="text-2xl font-bold mt-1">{getTotalAmount()} د.ك</h3>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <FaMoneyBillWave className="text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-opacity-90 text-sm">عدد العملاء</p>
                <h3 className="text-2xl font-bold mt-1">{getUniqueCustomers()}</h3>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <FaUser className="text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* جدول الحجوزات */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">قائمة الحجوزات</h2>
            {loading || isFiltering ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FaSearch className="text-2xl text-gray-400" />
                </div>
                <p className="text-gray-600">لا توجد حجوزات متطابقة مع معايير البحث</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        رقم الإيصال
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        اسم العميل
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ الحجز
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        عدد الرحلات
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المبلغ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        طريقة الدفع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الموظف
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        خيارات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.payment?.receiptNumber || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(booking.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.flights?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {parseFloat(booking.payment?.price || 0).toFixed(3)} د.ك
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.payment?.paymentMethod === 'cash' && 'نقداً'}
                          {booking.payment?.paymentMethod === 'knet' && 'كي نت'}
                          {booking.payment?.paymentMethod === 'visa' && 'فيزا'}
                          {booking.payment?.paymentMethod === 'mastercard' && 'ماستر كارد'}
                          {booking.payment?.paymentMethod === 'tabby' && 'تابي'}
                          {booking.payment?.paymentMethod === 'deferred' && 'آجل'}
                          {booking.payment?.paymentMethod === 'installments' && 'دفعات'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.employeeName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => {/* TODO: تنفيذ طباعة الإيصال */}}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-150"
                            title="طباعة الإيصال"
                          >
                            <FaFilePdf className="text-lg" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
