import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { FaMoneyBillWave, FaChartLine, FaFileInvoiceDollar, FaCalendarAlt } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/formatters';
import BackButton from '../shared/BackButton';
import { useAuth } from '../../contexts/AuthContext';

// تسجيل مكونات ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AccountingDashboard = () => {
  const { user } = useAuth();
  const isAccountingAdmin = user && (user.isAdmin === true || user.role === 'admin' || user.role === 'superadmin' || user.jobTitle === 'مسؤول النظام');
  console.log('AccountingDashboard: بيانات المستخدم:', user, 'صلاحيات المحاسبة:', isAccountingAdmin);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [revenueByType, setRevenueByType] = useState(null);
  const [expenseByType, setExpenseByType] = useState(null);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingInvoices: 0,
    paidInvoices: 0
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // ألوان للرسوم البيانية
  const chartColors = {
    revenue: 'rgba(54, 162, 235, 0.5)',
    expense: 'rgba(255, 99, 132, 0.5)',
    profit: 'rgba(75, 192, 192, 0.5)',
    flight: 'rgba(54, 162, 235, 0.7)',
    hotel: 'rgba(75, 192, 192, 0.7)',
    visa: 'rgba(255, 206, 86, 0.7)',
    vehicle: 'rgba(153, 102, 255, 0.7)',
    event: 'rgba(255, 159, 64, 0.7)',
    other: 'rgba(201, 203, 207, 0.7)',
    salary: 'rgba(255, 99, 132, 0.7)',
    rent: 'rgba(54, 162, 235, 0.7)',
    utilities: 'rgba(255, 206, 86, 0.7)',
    supplies: 'rgba(75, 192, 192, 0.7)',
    marketing: 'rgba(153, 102, 255, 0.7)',
    otherExpense: 'rgba(255, 159, 64, 0.7)'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchFinancialData();
      } catch (error) {
        console.error("Error fetching financial data:", error);
        toast.error("حدث خطأ أثناء تحميل البيانات المالية");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const fetchFinancialData = async () => {
    try {
      // جلب بيانات الإيرادات
      const revenueQuery = query(
        collection(db, "revenues"),
        where("date", ">=", dateRange.startDate),
        where("date", "<=", dateRange.endDate),
        orderBy("date", "asc")
      );
      
      // جلب بيانات المصروفات
      const expenseQuery = query(
        collection(db, "expenses"),
        where("date", ">=", dateRange.startDate),
        where("date", "<=", dateRange.endDate),
        orderBy("date", "asc")
      );
      
      // جلب بيانات الفواتير
      const invoiceQuery = query(
        collection(db, "invoices"),
        where("date", ">=", dateRange.startDate),
        where("date", "<=", dateRange.endDate)
      );

      const [revenueSnapshot, expenseSnapshot, invoiceSnapshot] = await Promise.all([
        getDocs(revenueQuery).catch(err => {
          console.error("Error fetching revenues:", err);
          return { docs: [] };
        }),
        getDocs(expenseQuery).catch(err => {
          console.error("Error fetching expenses:", err);
          return { docs: [] };
        }),
        getDocs(invoiceQuery).catch(err => {
          console.error("Error fetching invoices:", err);
          return { docs: [] };
        })
      ]);

      // معالجة بيانات الإيرادات
      const revenues = revenueSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date
      }));

      // معالجة بيانات المصروفات
      const expenses = expenseSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date
      }));

      // معالجة بيانات الفواتير
      const invoices = invoiceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date
      }));

      // حساب الإحصائيات
      const totalRevenue = revenues.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;

      setSummary({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingInvoices,
        paidInvoices
      });

      // إعداد بيانات الرسوم البيانية
      prepareChartData(revenues, expenses);
    } catch (error) {
      console.error("Error in fetchFinancialData:", error);
      toast.error("حدث خطأ أثناء تحميل البيانات المالية. يرجى المحاولة مرة أخرى.");
      
      // تعيين بيانات فارغة في حالة الخطأ
      setSummary({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        pendingInvoices: 0,
        paidInvoices: 0
      });
      
      // تعيين بيانات رسوم بيانية فارغة
      setRevenueData(null);
      setExpenseData(null);
      setProfitData(null);
      setRevenueByType(null);
      setExpenseByType(null);
    }
  };

  const prepareChartData = (revenues, expenses) => {
    // تجميع البيانات حسب التاريخ
    const revenueByDate = groupByDate(revenues);
    const expenseByDate = groupByDate(expenses);
    
    // تجميع البيانات حسب النوع
    const revenueByServiceType = groupByType(revenues, 'serviceType');
    const expenseByCategory = groupByType(expenses, 'category');

    // إعداد بيانات الرسم البياني للإيرادات والمصروفات
    const dates = [...new Set([...Object.keys(revenueByDate), ...Object.keys(expenseByDate)])].sort();
    
    const revenueValues = dates.map(date => revenueByDate[date] || 0);
    const expenseValues = dates.map(date => expenseByDate[date] || 0);
    const profitValues = dates.map((date, index) => revenueValues[index] - expenseValues[index]);

    setRevenueData({
      labels: dates,
      datasets: [{
        label: 'الإيرادات',
        data: revenueValues,
        backgroundColor: chartColors.revenue,
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    });

    setExpenseData({
      labels: dates,
      datasets: [{
        label: 'المصروفات',
        data: expenseValues,
        backgroundColor: chartColors.expense,
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    });

    setProfitData({
      labels: dates,
      datasets: [{
        label: 'صافي الربح',
        data: profitValues,
        backgroundColor: chartColors.profit,
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    });

    // إعداد بيانات الرسم البياني الدائري للإيرادات حسب النوع
    setRevenueByType({
      labels: Object.keys(revenueByServiceType),
      datasets: [{
        data: Object.values(revenueByServiceType),
        backgroundColor: [
          chartColors.flight,
          chartColors.hotel,
          chartColors.visa,
          chartColors.vehicle,
          chartColors.event,
          chartColors.other
        ]
      }]
    });

    // إعداد بيانات الرسم البياني الدائري للمصروفات حسب النوع
    setExpenseByType({
      labels: Object.keys(expenseByCategory),
      datasets: [{
        data: Object.values(expenseByCategory),
        backgroundColor: [
          chartColors.salary,
          chartColors.rent,
          chartColors.utilities,
          chartColors.supplies,
          chartColors.marketing,
          chartColors.otherExpense
        ]
      }]
    });
  };

  // تجميع البيانات حسب التاريخ
  const groupByDate = (items) => {
    return items.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += parseFloat(item.amount) || 0;
      return acc;
    }, {});
  };

  // تجميع البيانات حسب النوع
  const groupByType = (items, typeField) => {
    return items.reduce((acc, item) => {
      const type = item[typeField] || 'أخرى';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += parseFloat(item.amount) || 0;
      return acc;
    }, {});
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <BackButton />
        <h1 className="text-2xl font-bold mb-2">لوحة تحكم الحسابات - Al-Saad Travels and Tourism</h1>
        <p className="text-gray-600">نظرة عامة على الأداء المالي والإحصائيات</p>
      </div>
      
      {/* فلتر التاريخ */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap justify-between items-center">
          <h2 className="text-lg font-semibold mb-2">تصفية حسب التاريخ</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="p-2 border rounded"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* ملخص الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <FaMoneyBillWave className="text-blue-500 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">إجمالي الإيرادات</p>
            <p className="text-xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <FaMoneyBillWave className="text-red-500 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">إجمالي المصروفات</p>
            <p className="text-xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <FaChartLine className="text-green-500 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">صافي الربح</p>
            <p className="text-xl font-bold">{formatCurrency(summary.netProfit)}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <FaFileInvoiceDollar className="text-yellow-500 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">فواتير معلقة</p>
            <p className="text-xl font-bold">{summary.pendingInvoices}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <FaFileInvoiceDollar className="text-purple-500 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">فواتير مدفوعة</p>
            <p className="text-xl font-bold">{summary.paidInvoices}</p>
          </div>
        </div>
      </div>
      
      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* رسم بياني للإيرادات */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">الإيرادات</h2>
          {revenueData ? (
            <div className="h-64">
              <Bar 
                data={revenueData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500">لا توجد بيانات متاحة</p>
          )}
        </div>
        
        {/* رسم بياني للمصروفات */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">المصروفات</h2>
          {expenseData ? (
            <div className="h-64">
              <Bar 
                data={expenseData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500">لا توجد بيانات متاحة</p>
          )}
        </div>
        
        {/* رسم بياني للأرباح */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">صافي الربح</h2>
          {profitData ? (
            <div className="h-64">
              <Line 
                data={profitData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500">لا توجد بيانات متاحة</p>
          )}
        </div>
        
        {/* رسم بياني دائري للإيرادات حسب النوع */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">الإيرادات حسب النوع</h2>
          {revenueByType ? (
            <div className="h-64 flex justify-center">
              <Pie 
                data={revenueByType} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                    title: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500">لا توجد بيانات متاحة</p>
          )}
        </div>
      </div>
      
      {/* روابط سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/revenues" className="bg-white p-4 rounded-lg shadow hover:bg-blue-50 transition-colors">
          <h3 className="text-lg font-semibold mb-2 text-blue-600">إدارة الإيرادات</h3>
          <p className="text-gray-600">تسجيل وإدارة جميع الإيرادات والمبيعات</p>
        </Link>
        
        <Link to="/expenses" className="bg-white p-4 rounded-lg shadow hover:bg-blue-50 transition-colors">
          <h3 className="text-lg font-semibold mb-2 text-red-600">إدارة المصروفات</h3>
          <p className="text-gray-600">تسجيل وإدارة جميع المصروفات التشغيلية</p>
        </Link>
        
        <Link to="/invoices" className="bg-white p-4 rounded-lg shadow hover:bg-blue-50 transition-colors">
          <h3 className="text-lg font-semibold mb-2 text-purple-600">إدارة الفواتير</h3>
          <p className="text-gray-600">إنشاء وإدارة الفواتير للعملاء والموردين</p>
        </Link>
      </div>
    </div>
  );
};

export default AccountingDashboard;
