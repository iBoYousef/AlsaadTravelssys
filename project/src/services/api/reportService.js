import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import firebaseServices from '../../firebase';
import customerService from './customerService';
import flightService from './flightService';
import hotelService from './hotelService';
import visaService from './visaService';

const { db } = firebaseServices;

/**
 * خدمة إدارة التقارير
 * توفر واجهة موحدة لإنشاء وعرض التقارير المختلفة في النظام
 */
class ReportService {
  /**
   * إنشاء تقرير مبيعات
   * @param {Object} filters - معايير التصفية
   * @returns {Promise<Object>} - بيانات التقرير
   */
  async generateSalesReport(filters = {}) {
    try {
      // تحويل التواريخ إلى كائنات Timestamp
      const startDate = filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
      
      // الحصول على بيانات الحجوزات
      const [flightBookings, hotelBookings, visaApplications] = await Promise.all([
        this._getFlightBookings(startDate, endDate),
        this._getHotelBookings(startDate, endDate),
        this._getVisaApplications(startDate, endDate)
      ]);
      
      // حساب الإحصائيات
      const flightStats = this._calculateBookingStats(flightBookings);
      const hotelStats = this._calculateBookingStats(hotelBookings);
      const visaStats = this._calculateVisaStats(visaApplications);
      
      // إجمالي المبيعات
      const totalSales = flightStats.totalRevenue + hotelStats.totalRevenue + visaStats.totalRevenue;
      const totalCost = flightStats.totalCost + hotelStats.totalCost + visaStats.totalCost;
      const totalProfit = flightStats.totalProfit + hotelStats.totalProfit + visaStats.totalProfit;
      
      // توزيع المبيعات حسب النوع
      const salesDistribution = {
        flights: {
          count: flightBookings.length,
          revenue: flightStats.totalRevenue,
          percentage: totalSales > 0 ? (flightStats.totalRevenue / totalSales) * 100 : 0
        },
        hotels: {
          count: hotelBookings.length,
          revenue: hotelStats.totalRevenue,
          percentage: totalSales > 0 ? (hotelStats.totalRevenue / totalSales) * 100 : 0
        },
        visas: {
          count: visaApplications.length,
          revenue: visaStats.totalRevenue,
          percentage: totalSales > 0 ? (visaStats.totalRevenue / totalSales) * 100 : 0
        }
      };
      
      // توزيع المبيعات حسب الشهر (إذا كانت الفترة أكثر من شهر)
      const monthlySales = this._calculateMonthlySales([...flightBookings, ...hotelBookings, ...visaApplications]);
      
      return {
        period: {
          startDate,
          endDate
        },
        summary: {
          totalSales,
          totalCost,
          totalProfit,
          profitMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
          totalBookings: flightBookings.length + hotelBookings.length + visaApplications.length
        },
        salesDistribution,
        monthlySales,
        details: {
          flights: flightStats,
          hotels: hotelStats,
          visas: visaStats
        }
      };
    } catch (error) {
      console.error('خطأ في إنشاء تقرير المبيعات:', error);
      throw error;
    }
  }

  /**
   * إنشاء تقرير العملاء
   * @param {Object} filters - معايير التصفية
   * @returns {Promise<Object>} - بيانات التقرير
   */
  async generateCustomerReport(filters = {}) {
    try {
      // الحصول على بيانات العملاء
      const customers = await customerService.getAllCustomers(1000);
      
      // الحصول على بيانات الحجوزات
      const [flightBookings, hotelBookings, visaApplications] = await Promise.all([
        this._getFlightBookings(),
        this._getHotelBookings(),
        this._getVisaApplications()
      ]);
      
      // تجميع بيانات العملاء مع حجوزاتهم
      const customerData = customers.map(customer => {
        const customerFlights = flightBookings.filter(booking => booking.customerId === customer.id);
        const customerHotels = hotelBookings.filter(booking => booking.customerId === customer.id);
        const customerVisas = visaApplications.filter(application => application.customerId === customer.id);
        
        const totalSpent = this._calculateCustomerSpending(customerFlights, customerHotels, customerVisas);
        
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          bookings: {
            flights: customerFlights.length,
            hotels: customerHotels.length,
            visas: customerVisas.length,
            total: customerFlights.length + customerHotels.length + customerVisas.length
          },
          spending: totalSpent,
          lastActivity: this._getLastActivity(customerFlights, customerHotels, customerVisas)
        };
      });
      
      // ترتيب العملاء حسب الإنفاق
      customerData.sort((a, b) => b.spending - a.spending);
      
      // تحليل بيانات العملاء
      const topCustomers = customerData.slice(0, 10);
      const inactiveCustomers = customerData.filter(customer => {
        const lastActivity = new Date(customer.lastActivity);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return lastActivity < threeMonthsAgo;
      });
      
      // حساب متوسط الإنفاق لكل عميل
      const totalCustomers = customerData.length;
      const totalSpending = customerData.reduce((sum, customer) => sum + customer.spending, 0);
      const averageSpending = totalCustomers > 0 ? totalSpending / totalCustomers : 0;
      
      return {
        summary: {
          totalCustomers,
          totalSpending,
          averageSpending,
          activeCustomers: customerData.length - inactiveCustomers.length,
          inactiveCustomers: inactiveCustomers.length
        },
        topCustomers,
        customerSegments: this._segmentCustomers(customerData),
        inactiveCustomers: inactiveCustomers.slice(0, 20)
      };
    } catch (error) {
      console.error('خطأ في إنشاء تقرير العملاء:', error);
      throw error;
    }
  }

  /**
   * إنشاء تقرير الموظفين
   * @param {Object} filters - معايير التصفية
   * @returns {Promise<Object>} - بيانات التقرير
   */
  async generateEmployeeReport(filters = {}) {
    try {
      // تحويل التواريخ إلى كائنات Timestamp
      const startDate = filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
      
      // الحصول على بيانات الحجوزات
      const [flightBookings, hotelBookings, visaApplications] = await Promise.all([
        this._getFlightBookings(startDate, endDate),
        this._getHotelBookings(startDate, endDate),
        this._getVisaApplications(startDate, endDate)
      ]);
      
      // تجميع البيانات حسب الموظف
      const employeePerformance = {};
      
      // تجميع بيانات حجوزات الطيران
      flightBookings.forEach(booking => {
        if (!booking.employeeId) return;
        
        if (!employeePerformance[booking.employeeId]) {
          employeePerformance[booking.employeeId] = {
            employeeId: booking.employeeId,
            employeeName: booking.employeeName || 'غير معروف',
            bookings: { flights: 0, hotels: 0, visas: 0, total: 0 },
            revenue: { flights: 0, hotels: 0, visas: 0, total: 0 },
            profit: { flights: 0, hotels: 0, visas: 0, total: 0 }
          };
        }
        
        const price = parseFloat(booking.payment?.price || 0);
        const cost = parseFloat(booking.cost || 0);
        const profit = price - cost;
        
        employeePerformance[booking.employeeId].bookings.flights++;
        employeePerformance[booking.employeeId].bookings.total++;
        employeePerformance[booking.employeeId].revenue.flights += price;
        employeePerformance[booking.employeeId].revenue.total += price;
        employeePerformance[booking.employeeId].profit.flights += profit;
        employeePerformance[booking.employeeId].profit.total += profit;
      });
      
      // تجميع بيانات حجوزات الفنادق
      hotelBookings.forEach(booking => {
        if (!booking.employeeId) return;
        
        if (!employeePerformance[booking.employeeId]) {
          employeePerformance[booking.employeeId] = {
            employeeId: booking.employeeId,
            employeeName: booking.employeeName || 'غير معروف',
            bookings: { flights: 0, hotels: 0, visas: 0, total: 0 },
            revenue: { flights: 0, hotels: 0, visas: 0, total: 0 },
            profit: { flights: 0, hotels: 0, visas: 0, total: 0 }
          };
        }
        
        const price = parseFloat(booking.payment?.price || 0);
        const cost = parseFloat(booking.cost || 0);
        const profit = price - cost;
        
        employeePerformance[booking.employeeId].bookings.hotels++;
        employeePerformance[booking.employeeId].bookings.total++;
        employeePerformance[booking.employeeId].revenue.hotels += price;
        employeePerformance[booking.employeeId].revenue.total += price;
        employeePerformance[booking.employeeId].profit.hotels += profit;
        employeePerformance[booking.employeeId].profit.total += profit;
      });
      
      // تجميع بيانات طلبات التأشيرات
      visaApplications.forEach(application => {
        if (!application.employeeId) return;
        
        if (!employeePerformance[application.employeeId]) {
          employeePerformance[application.employeeId] = {
            employeeId: application.employeeId,
            employeeName: application.employeeName || 'غير معروف',
            bookings: { flights: 0, hotels: 0, visas: 0, total: 0 },
            revenue: { flights: 0, hotels: 0, visas: 0, total: 0 },
            profit: { flights: 0, hotels: 0, visas: 0, total: 0 }
          };
        }
        
        const price = parseFloat(application.payment?.price || 0);
        const cost = parseFloat(application.cost || 0);
        const profit = price - cost;
        
        employeePerformance[application.employeeId].bookings.visas++;
        employeePerformance[application.employeeId].bookings.total++;
        employeePerformance[application.employeeId].revenue.visas += price;
        employeePerformance[application.employeeId].revenue.total += price;
        employeePerformance[application.employeeId].profit.visas += profit;
        employeePerformance[application.employeeId].profit.total += profit;
      });
      
      // تحويل البيانات إلى مصفوفة
      const performanceArray = Object.values(employeePerformance);
      
      // ترتيب الموظفين حسب الإيرادات
      performanceArray.sort((a, b) => b.revenue.total - a.revenue.total);
      
      return {
        period: {
          startDate,
          endDate
        },
        summary: {
          totalEmployees: performanceArray.length,
          totalBookings: flightBookings.length + hotelBookings.length + visaApplications.length,
          totalRevenue: performanceArray.reduce((sum, emp) => sum + emp.revenue.total, 0),
          totalProfit: performanceArray.reduce((sum, emp) => sum + emp.profit.total, 0)
        },
        topPerformers: performanceArray.slice(0, 5),
        employeePerformance: performanceArray
      };
    } catch (error) {
      console.error('خطأ في إنشاء تقرير الموظفين:', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات العملاء
   * @param {Object} options - خيارات الاستعلام
   * @returns {Promise<Object>} - إحصائيات العملاء
   */
  async getCustomerStatistics(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // جلب جميع العملاء
      const allCustomers = await customerService.getAllCustomers(1000);
      
      // تحديد العملاء الجدد في الفترة المحددة
      const newCustomers = allCustomers.filter(customer => {
        const createdAt = customer.createdAt?.seconds 
          ? new Date(customer.createdAt.seconds * 1000) 
          : new Date(customer.createdAt);
        
        return createdAt >= startDate && createdAt <= endDate;
      });
      
      // جلب جميع الحجوزات
      const [flightBookings, hotelBookings, visaApplications, tourBookings] = await Promise.all([
        this._getFlightBookings(),
        this._getHotelBookings(),
        this._getVisaApplications(),
        this._getTourBookings()
      ]);
      
      // تجميع كل الحجوزات
      const allBookings = [
        ...flightBookings,
        ...hotelBookings,
        ...visaApplications,
        ...tourBookings
      ];
      
      // تحديد الحجوزات في الفترة المحددة
      const bookingsInPeriod = allBookings.filter(booking => {
        const bookingDate = booking.createdAt?.seconds 
          ? new Date(booking.createdAt.seconds * 1000) 
          : new Date(booking.createdAt);
        
        return bookingDate >= startDate && bookingDate <= endDate;
      });
      
      // حساب العملاء النشطين (الذين لديهم حجز واحد على الأقل في الفترة المحددة)
      const activeCustomerIds = new Set(bookingsInPeriod.map(booking => booking.customerId));
      const activeCustomers = activeCustomerIds.size;
      
      // حساب العملاء المتكررين والعملاء لمرة واحدة
      const bookingsByCustomer = {};
      allBookings.forEach(booking => {
        if (booking.customerId) {
          bookingsByCustomer[booking.customerId] = (bookingsByCustomer[booking.customerId] || 0) + 1;
        }
      });
      
      const repeatCustomers = Object.values(bookingsByCustomer).filter(count => count > 1).length;
      const oneTimeCustomers = Object.values(bookingsByCustomer).filter(count => count === 1).length;
      
      // حساب متوسط عدد الحجوزات لكل عميل
      const totalBookings = Object.values(bookingsByCustomer).reduce((sum, count) => sum + count, 0);
      const bookingFrequency = Object.keys(bookingsByCustomer).length > 0 
        ? totalBookings / Object.keys(bookingsByCustomer).length 
        : 0;
      
      // حساب متوسط قيمة العميل
      const totalRevenue = allBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      const averageCustomerValue = Object.keys(bookingsByCustomer).length > 0 
        ? totalRevenue / Object.keys(bookingsByCustomer).length 
        : 0;
      
      // حساب نسبة النمو
      // نفترض أن لدينا بيانات الفترة السابقة (يمكن تعديل هذا لاحقًا)
      const customerGrowth = allCustomers.length > 0 
        ? (newCustomers.length / allCustomers.length) * 100 
        : 0;
      
      // نسبة التغير في متوسط قيمة العميل (نفترض قيمة افتراضية للتوضيح)
      const avgValueGrowth = 5.2;
      
      return {
        totalCustomers: allCustomers.length,
        newCustomers: newCustomers.length,
        activeCustomers,
        averageCustomerValue,
        customerGrowth,
        avgValueGrowth,
        bookingFrequency,
        repeatCustomers,
        oneTimeCustomers,
        repeatCustomersPercentage: Object.keys(bookingsByCustomer).length > 0 
          ? (repeatCustomers / Object.keys(bookingsByCustomer).length) * 100 
          : 0,
        oneTimeCustomersPercentage: Object.keys(bookingsByCustomer).length > 0 
          ? (oneTimeCustomers / Object.keys(bookingsByCustomer).length) * 100 
          : 0
      };
    } catch (error) {
      console.error('خطأ في جلب إحصائيات العملاء:', error);
      throw error;
    }
  }

  /**
   * الحصول على أفضل العملاء
   * @param {Object} options - خيارات الاستعلام
   * @returns {Promise<Array>} - قائمة أفضل العملاء
   */
  async getTopCustomers(options = {}) {
    try {
      const { startDate, endDate, limit = 10 } = options;
      
      // جلب جميع العملاء
      const allCustomers = await customerService.getAllCustomers(1000);
      
      // جلب جميع الحجوزات
      const [flightBookings, hotelBookings, visaApplications, tourBookings] = await Promise.all([
        this._getFlightBookings(startDate, endDate),
        this._getHotelBookings(startDate, endDate),
        this._getVisaApplications(startDate, endDate),
        this._getTourBookings(startDate, endDate)
      ]);
      
      // تجميع كل الحجوزات
      const allBookings = [
        ...flightBookings,
        ...hotelBookings,
        ...visaApplications,
        ...tourBookings
      ];
      
      // تجميع بيانات العملاء مع حجوزاتهم
      const customerData = allCustomers.map(customer => {
        const customerBookings = allBookings.filter(booking => booking.customerId === customer.id);
        
        // حساب إجمالي الإنفاق
        const totalSpent = customerBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
        
        // تحديد تاريخ آخر حجز
        let lastBookingDate = null;
        if (customerBookings.length > 0) {
          const sortedBookings = [...customerBookings].sort((a, b) => {
            const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
            const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt);
            return dateB - dateA;
          });
          
          lastBookingDate = sortedBookings[0].createdAt?.seconds 
            ? new Date(sortedBookings[0].createdAt.seconds * 1000) 
            : new Date(sortedBookings[0].createdAt);
        }
        
        // تحديد ما إذا كان العميل نشطًا (لديه حجز في آخر 3 أشهر)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const isActive = lastBookingDate ? lastBookingDate >= threeMonthsAgo : false;
        
        return {
          id: customer.id,
          name: customer.name || customer.fullName,
          email: customer.email,
          phone: customer.phone,
          bookingsCount: customerBookings.length,
          totalSpent,
          lastBookingDate,
          isActive
        };
      });
      
      // ترتيب العملاء حسب الإنفاق وإرجاع أفضل العملاء
      return customerData
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);
    } catch (error) {
      console.error('خطأ في جلب أفضل العملاء:', error);
      throw error;
    }
  }

  /**
   * الحصول على تقسيم العملاء
   * @returns {Promise<Object>} - بيانات تقسيم العملاء
   */
  async getCustomerSegmentation() {
    try {
      // جلب جميع العملاء
      const allCustomers = await customerService.getAllCustomers(1000);
      
      // جلب جميع الحجوزات
      const [flightBookings, hotelBookings, visaApplications, tourBookings] = await Promise.all([
        this._getFlightBookings(),
        this._getHotelBookings(),
        this._getVisaApplications(),
        this._getTourBookings()
      ]);
      
      // تجميع كل الحجوزات
      const allBookings = [
        ...flightBookings,
        ...hotelBookings,
        ...visaApplications,
        ...tourBookings
      ];
      
      // تجميع بيانات الحجوزات حسب العميل
      const bookingsByCustomer = {};
      const spendingByCustomer = {};
      
      allBookings.forEach(booking => {
        if (booking.customerId) {
          bookingsByCustomer[booking.customerId] = (bookingsByCustomer[booking.customerId] || 0) + 1;
          spendingByCustomer[booking.customerId] = (spendingByCustomer[booking.customerId] || 0) + (booking.totalAmount || 0);
        }
      });
      
      // تحديد تاريخ آخر حجز لكل عميل
      const lastBookingByCustomer = {};
      
      allCustomers.forEach(customer => {
        const customerBookings = allBookings.filter(booking => booking.customerId === customer.id);
        
        if (customerBookings.length > 0) {
          const sortedBookings = [...customerBookings].sort((a, b) => {
            const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
            const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt);
            return dateB - dateA;
          });
          
          lastBookingByCustomer[customer.id] = sortedBookings[0].createdAt?.seconds 
            ? new Date(sortedBookings[0].createdAt.seconds * 1000) 
            : new Date(sortedBookings[0].createdAt);
        }
      });
      
      // تقسيم العملاء إلى فئات
      const segments = [
        { name: 'عملاء VIP', count: 0 },
        { name: 'عملاء متكررون', count: 0 },
        { name: 'عملاء جدد', count: 0 },
        { name: 'عملاء غير نشطين', count: 0 },
        { name: 'عملاء لمرة واحدة', count: 0 }
      ];
      
      // تحديد فترات زمنية للتصنيف
      const now = new Date();
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      
      allCustomers.forEach(customer => {
        const bookingsCount = bookingsByCustomer[customer.id] || 0;
        const totalSpent = spendingByCustomer[customer.id] || 0;
        const lastBookingDate = lastBookingByCustomer[customer.id];
        
        // تصنيف العملاء
        if (bookingsCount >= 5 && totalSpent >= 10000) {
          // عملاء VIP
          segments[0].count++;
        } else if (bookingsCount > 1) {
          if (lastBookingDate && lastBookingDate >= threeMonthsAgo) {
            // عملاء متكررون نشطون
            segments[1].count++;
          } else {
            // عملاء غير نشطين
            segments[3].count++;
          }
        } else if (bookingsCount === 1) {
          if (lastBookingDate && lastBookingDate >= threeMonthsAgo) {
            // عملاء جدد
            segments[2].count++;
          } else {
            // عملاء لمرة واحدة
            segments[4].count++;
          }
        } else {
          // عملاء بدون حجوزات (محتملون)
          // يمكن إضافة فئة جديدة إذا لزم الأمر
        }
      });
      
      return { segments };
    } catch (error) {
      console.error('خطأ في جلب بيانات تقسيم العملاء:', error);
      throw error;
    }
  }

  /**
   * الحصول على بيانات الحجوزات حسب نوع العميل
   * @param {Object} options - خيارات الاستعلام
   * @returns {Promise<Array>} - بيانات الحجوزات حسب نوع العميل
   */
  async getBookingsByCustomerType(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // جلب جميع الحجوزات
      const [flightBookings, hotelBookings, visaApplications, tourBookings] = await Promise.all([
        this._getFlightBookings(startDate, endDate),
        this._getHotelBookings(startDate, endDate),
        this._getVisaApplications(startDate, endDate),
        this._getTourBookings(startDate, endDate)
      ]);
      
      // تجميع كل الحجوزات
      const allBookings = [
        ...flightBookings.map(b => ({ ...b, type: 'flight' })),
        ...hotelBookings.map(b => ({ ...b, type: 'hotel' })),
        ...visaApplications.map(b => ({ ...b, type: 'visa' })),
        ...tourBookings.map(b => ({ ...b, type: 'tour' }))
      ];
      
      // جلب جميع العملاء
      const allCustomers = await customerService.getAllCustomers(1000);
      
      // تجميع بيانات الحجوزات حسب نوع العميل
      const bookingsByType = {
        individual: { count: 0, revenue: 0 },
        corporate: { count: 0, revenue: 0 },
        family: { count: 0, revenue: 0 },
        other: { count: 0, revenue: 0 }
      };
      
      // تصنيف الحجوزات حسب نوع العميل
      allBookings.forEach(booking => {
        if (!booking.customerId) return;
        
        const customer = allCustomers.find(c => c.id === booking.customerId);
        if (!customer) return;
        
        const customerType = customer.type || 'individual';
        const amount = booking.totalAmount || 0;
        
        switch (customerType) {
          case 'individual':
          case 'corporate':
          case 'family':
            bookingsByType[customerType].count++;
            bookingsByType[customerType].revenue += amount;
            break;
          default:
            bookingsByType.other.count++;
            bookingsByType.other.revenue += amount;
        }
      });
      
      // تحويل البيانات إلى مصفوفة
      return Object.entries(bookingsByType).map(([type, data]) => ({
        type,
        count: data.count,
        revenue: data.revenue
      }));
    } catch (error) {
      console.error('خطأ في جلب بيانات الحجوزات حسب نوع العميل:', error);
      throw error;
    }
  }

  /**
   * الحصول على حجوزات البرامج السياحية
   * @param {Date} startDate - تاريخ البداية
   * @param {Date} endDate - تاريخ النهاية
   * @returns {Promise<Array>} - قائمة الحجوزات
   */
  async _getTourBookings(startDate, endDate) {
    try {
      let q = collection(db, 'tourBookings');
      
      if (startDate && endDate) {
        q = query(
          q,
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate)
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('خطأ في جلب حجوزات البرامج السياحية:', error);
      return [];
    }
  }

  // دوال مساعدة خاصة
  
  /**
   * الحصول على حجوزات الطيران
   * @param {Date} startDate - تاريخ البداية
   * @param {Date} endDate - تاريخ النهاية
   * @returns {Promise<Array>} - قائمة الحجوزات
   */
  async _getFlightBookings(startDate = null, endDate = null) {
    const filters = {};
    
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    
    return flightService.searchBookings(filters);
  }

  /**
   * الحصول على حجوزات الفنادق
   * @param {Date} startDate - تاريخ البداية
   * @param {Date} endDate - تاريخ النهاية
   * @returns {Promise<Array>} - قائمة الحجوزات
   */
  async _getHotelBookings(startDate = null, endDate = null) {
    const filters = {};
    
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    
    return hotelService.searchBookings(filters);
  }

  /**
   * الحصول على طلبات التأشيرات
   * @param {Date} startDate - تاريخ البداية
   * @param {Date} endDate - تاريخ النهاية
   * @returns {Promise<Array>} - قائمة الطلبات
   */
  async _getVisaApplications(startDate = null, endDate = null) {
    const filters = {};
    
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    
    return visaService.searchVisaApplications(filters);
  }

  /**
   * حساب إحصائيات الحجوزات
   * @param {Array} bookings - قائمة الحجوزات
   * @returns {Object} - الإحصائيات
   */
  _calculateBookingStats(bookings) {
    const stats = {
      totalBookings: bookings.length,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      statusCounts: {},
      paymentMethodCounts: {}
    };
    
    bookings.forEach(booking => {
      // حساب المبالغ
      const price = parseFloat(booking.payment?.price || 0);
      const cost = parseFloat(booking.cost || 0);
      
      stats.totalRevenue += price;
      stats.totalCost += cost;
      
      // عد الحالات
      if (booking.status) {
        stats.statusCounts[booking.status] = (stats.statusCounts[booking.status] || 0) + 1;
      }
      
      // عد طرق الدفع
      if (booking.payment?.method) {
        stats.paymentMethodCounts[booking.payment.method] = (stats.paymentMethodCounts[booking.payment.method] || 0) + 1;
      }
    });
    
    // حساب الربح الإجمالي
    stats.totalProfit = stats.totalRevenue - stats.totalCost;
    
    return stats;
  }

  /**
   * حساب إحصائيات طلبات التأشيرات
   * @param {Array} applications - قائمة الطلبات
   * @returns {Object} - الإحصائيات
   */
  _calculateVisaStats(applications) {
    const stats = {
      totalApplications: applications.length,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      statusCounts: {},
      countryStats: {}
    };
    
    applications.forEach(application => {
      // حساب المبالغ
      const price = parseFloat(application.payment?.price || 0);
      const cost = parseFloat(application.cost || 0);
      
      stats.totalRevenue += price;
      stats.totalCost += cost;
      
      // عد الحالات
      if (application.status) {
        stats.statusCounts[application.status] = (stats.statusCounts[application.status] || 0) + 1;
      }
      
      // إحصائيات الدول
      if (application.country) {
        stats.countryStats[application.country] = (stats.countryStats[application.country] || 0) + 1;
      }
    });
    
    // حساب الربح الإجمالي
    stats.totalProfit = stats.totalRevenue - stats.totalCost;
    
    return stats;
  }

  /**
   * حساب المبيعات الشهرية
   * @param {Array} bookings - قائمة الحجوزات
   * @returns {Object} - المبيعات الشهرية
   */
  _calculateMonthlySales(bookings) {
    const monthlySales = {};
    
    bookings.forEach(booking => {
      const createdAt = booking.createdAt ? 
        (booking.createdAt instanceof Timestamp ? booking.createdAt.toDate() : new Date(booking.createdAt)) : 
        new Date();
      
      const yearMonth = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlySales[yearMonth]) {
        monthlySales[yearMonth] = {
          month: yearMonth,
          count: 0,
          revenue: 0,
          profit: 0
        };
      }
      
      const price = parseFloat(booking.payment?.price || 0);
      const cost = parseFloat(booking.cost || 0);
      const profit = price - cost;
      
      monthlySales[yearMonth].count++;
      monthlySales[yearMonth].revenue += price;
      monthlySales[yearMonth].profit += profit;
    });
    
    // تحويل إلى مصفوفة وترتيب حسب الشهر
    return Object.values(monthlySales).sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * حساب إنفاق العميل
   * @param {Array} flights - حجوزات الطيران
   * @param {Array} hotels - حجوزات الفنادق
   * @param {Array} visas - طلبات التأشيرات
   * @returns {number} - إجمالي الإنفاق
   */
  _calculateCustomerSpending(flights, hotels, visas) {
    let totalSpent = 0;
    
    // حساب إنفاق حجوزات الطيران
    flights.forEach(booking => {
      totalSpent += parseFloat(booking.payment?.price || 0);
    });
    
    // حساب إنفاق حجوزات الفنادق
    hotels.forEach(booking => {
      totalSpent += parseFloat(booking.payment?.price || 0);
    });
    
    // حساب إنفاق طلبات التأشيرات
    visas.forEach(application => {
      totalSpent += parseFloat(application.payment?.price || 0);
    });
    
    return totalSpent;
  }

  /**
   * الحصول على آخر نشاط للعميل
   * @param {Array} flights - حجوزات الطيران
   * @param {Array} hotels - حجوزات الفنادق
   * @param {Array} visas - طلبات التأشيرات
   * @returns {Date} - تاريخ آخر نشاط
   */
  _getLastActivity(flights, hotels, visas) {
    const dates = [];
    
    // جمع تواريخ حجوزات الطيران
    flights.forEach(booking => {
      if (booking.createdAt) {
        dates.push(booking.createdAt instanceof Timestamp ? booking.createdAt.toDate() : new Date(booking.createdAt));
      }
    });
    
    // جمع تواريخ حجوزات الفنادق
    hotels.forEach(booking => {
      if (booking.createdAt) {
        dates.push(booking.createdAt instanceof Timestamp ? booking.createdAt.toDate() : new Date(booking.createdAt));
      }
    });
    
    // جمع تواريخ طلبات التأشيرات
    visas.forEach(application => {
      if (application.createdAt) {
        dates.push(application.createdAt instanceof Timestamp ? application.createdAt.toDate() : new Date(application.createdAt));
      }
    });
    
    // إذا لم تكن هناك تواريخ، نعيد تاريخ اليوم
    if (dates.length === 0) {
      return new Date();
    }
    
    // ترتيب التواريخ تنازليًا والحصول على أحدث تاريخ
    dates.sort((a, b) => b - a);
    return dates[0];
  }

  /**
   * تقسيم العملاء إلى شرائح
   * @param {Array} customers - قائمة العملاء
   * @returns {Object} - شرائح العملاء
   */
  _segmentCustomers(customers) {
    // تحديد عتبات الشرائح
    const highValueThreshold = 5000; // العملاء ذوو القيمة العالية
    const mediumValueThreshold = 1000; // العملاء ذوو القيمة المتوسطة
    
    // تقسيم العملاء
    const segments = {
      highValue: customers.filter(customer => customer.spending >= highValueThreshold),
      mediumValue: customers.filter(customer => customer.spending >= mediumValueThreshold && customer.spending < highValueThreshold),
      lowValue: customers.filter(customer => customer.spending < mediumValueThreshold)
    };
    
    // حساب النسب المئوية
    const totalCustomers = customers.length;
    
    return {
      highValue: {
        count: segments.highValue.length,
        percentage: totalCustomers > 0 ? (segments.highValue.length / totalCustomers) * 100 : 0,
        totalSpending: segments.highValue.reduce((sum, customer) => sum + customer.spending, 0)
      },
      mediumValue: {
        count: segments.mediumValue.length,
        percentage: totalCustomers > 0 ? (segments.mediumValue.length / totalCustomers) * 100 : 0,
        totalSpending: segments.mediumValue.reduce((sum, customer) => sum + customer.spending, 0)
      },
      lowValue: {
        count: segments.lowValue.length,
        percentage: totalCustomers > 0 ? (segments.lowValue.length / totalCustomers) * 100 : 0,
        totalSpending: segments.lowValue.reduce((sum, customer) => sum + customer.spending, 0)
      }
    };
  }
}

// إنشاء نسخة واحدة من الخدمة للاستخدام في جميع أنحاء التطبيق
const reportService = new ReportService();

export default reportService;
