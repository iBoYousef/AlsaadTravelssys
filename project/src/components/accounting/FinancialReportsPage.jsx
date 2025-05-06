import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FaFilePdf, FaFileExcel, FaChartBar, FaChartPie, FaChartLine } from 'react-icons/fa';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import * as accountingService from '../../services/accountingService';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

// تسجيل جميع مكونات Chart.js
Chart.register(...registerables);

const FinancialReportsPage = () => {
  const { user } = useAuth();
  const isAccountingAdmin = user && (user.isAdmin === true || user.role === 'admin' || user.role === 'superadmin' || user.jobTitle === 'مسؤول النظام');
  console.log('FinancialReportsPage: بيانات المستخدم:', user, 'صلاحيات المحاسبة:', isAccountingAdmin);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    revenues: [],
    expenses: [],
    invoices: []
  });
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpense: 0,
    netProfit: 0,
    revenueByCategory: {},
    expenseByCategory: {},
    monthlyData: {}
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange, reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // جلب بيانات الإيرادات
      const revenuesQuery = query(
        collection(db, "revenues"),
        where("date", ">=", dateRange.startDate),
        where("date", "<=", dateRange.endDate),
        orderBy("date", "asc")
      );
      
      // جلب بيانات المصروفات
      const expensesQuery = query(
        collection(db, "expenses"),
        where("date", ">=", dateRange.startDate),
        where("date", "<=", dateRange.endDate),
        orderBy("date", "asc")
      );
      
      // جلب بيانات الفواتير
      const invoicesQuery = query(
        collection(db, "invoices"),
        where("date", ">=", dateRange.startDate),
        where("date", "<=", dateRange.endDate),
        orderBy("date", "asc")
      );

      // استخدام Promise.all مع معالجة الأخطاء لكل استعلام
      const [revenuesSnapshot, expensesSnapshot, invoicesSnapshot] = await Promise.all([
        getDocs(revenuesQuery).catch(err => {
          console.error("Error fetching revenues:", err);
          return { docs: [] };
        }),
        getDocs(expensesQuery).catch(err => {
          console.error("Error fetching expenses:", err);
          return { docs: [] };
        }),
        getDocs(invoicesQuery).catch(err => {
          console.error("Error fetching invoices:", err);
          return { docs: [] };
        })
      ]);
      
      const revenuesData = revenuesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const expensesData = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const invoicesData = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setReportData({
        revenues: revenuesData,
        expenses: expensesData,
        invoices: invoicesData
      });
      
      // حساب الملخص المالي
      calculateSummary(revenuesData, expensesData, invoicesData);
      
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("حدث خطأ أثناء تحميل بيانات التقرير: " + (error.message || "تعذر الاتصال بالخادم"));
      
      // تعيين بيانات فارغة في حالة الخطأ
      setReportData({
        revenues: [],
        expenses: [],
        invoices: []
      });
      
      // تعيين ملخص فارغ
      setSummary({
        totalRevenue: 0,
        totalExpense: 0,
        netProfit: 0,
        revenueByCategory: {},
        expenseByCategory: {},
        monthlyData: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (revenues, expenses, invoices) => {
    try {
      // حساب إجمالي الإيرادات والمصروفات
      const totalRevenue = revenues.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const totalExpense = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const netProfit = totalRevenue - totalExpense;
      
      // حساب الإيرادات حسب الفئة
      const revenueByCategory = revenues.reduce((categories, item) => {
        const category = item.serviceType || 'أخرى';
        categories[category] = (categories[category] || 0) + (parseFloat(item.amount) || 0);
        return categories;
      }, {});
      
      // حساب المصروفات حسب الفئة
      const expenseByCategory = expenses.reduce((categories, item) => {
        const category = item.category || 'أخرى';
        categories[category] = (categories[category] || 0) + (parseFloat(item.amount) || 0);
        return categories;
      }, {});
      
      // حساب البيانات الشهرية
      const monthlyData = {};
      
      // إضافة الإيرادات الشهرية
      revenues.forEach(item => {
        if (!item.date) return;
        const month = item.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expense: 0, profit: 0 };
        }
        monthlyData[month].revenue += (parseFloat(item.amount) || 0);
        monthlyData[month].profit = monthlyData[month].revenue - monthlyData[month].expense;
      });
      
      // إضافة المصروفات الشهرية
      expenses.forEach(item => {
        if (!item.date) return;
        const month = item.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expense: 0, profit: 0 };
        }
        monthlyData[month].expense += (parseFloat(item.amount) || 0);
        monthlyData[month].profit = monthlyData[month].revenue - monthlyData[month].expense;
      });
      
      setSummary({
        totalRevenue,
        totalExpense,
        netProfit,
        revenueByCategory,
        expenseByCategory,
        monthlyData
      });
    } catch (error) {
      console.error("Error calculating summary:", error);
      // تعيين ملخص فارغ في حالة الخطأ
      setSummary({
        totalRevenue: 0,
        totalExpense: 0,
        netProfit: 0,
        revenueByCategory: {},
        expenseByCategory: {},
        monthlyData: {}
      });
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const exportToPDF = () => {
    toast.info("جاري تطوير ميزة التصدير إلى PDF");
  };

  const exportToExcel = () => {
    toast.info("جاري تطوير ميزة التصدير إلى Excel");
  };

  // إعداد بيانات الرسم البياني للإيرادات والمصروفات
  const prepareBarChartData = () => {
    const labels = Object.keys(summary.monthlyData).sort();
    const revenueData = labels.map(month => summary.monthlyData[month].revenue);
    const expenseData = labels.map(month => summary.monthlyData[month].expense);
    const profitData = labels.map(month => summary.monthlyData[month].profit);
    
    return {
      labels: labels.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1);
        return date.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' });
      }),
      datasets: [
        {
          label: 'الإيرادات',
          data: revenueData,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        },
        {
          label: 'المصروفات',
          data: expenseData,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        },
        {
          label: 'صافي الربح',
          data: profitData,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1
        }
      ]
    };
  };

  // إعداد بيانات الرسم البياني الدائري للإيرادات حسب الفئة
  const prepareRevenuePieChartData = () => {
    const labels = Object.keys(summary.revenueByCategory);
    const data = Object.values(summary.revenueByCategory);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 205, 86, 0.7)',
            'rgba(201, 203, 207, 0.7)',
            'rgba(54, 162, 235, 0.4)',
            'rgba(75, 192, 192, 0.4)',
            'rgba(153, 102, 255, 0.4)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  // إعداد بيانات الرسم البياني الدائري للمصروفات حسب الفئة
  const prepareExpensePieChartData = () => {
    const labels = Object.keys(summary.expenseByCategory);
    const data = Object.values(summary.expenseByCategory);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(255, 205, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(201, 203, 207, 0.7)',
            'rgba(255, 99, 132, 0.4)',
            'rgba(255, 159, 64, 0.4)',
            'rgba(255, 205, 86, 0.4)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  // إعداد بيانات الرسم البياني الخطي للأرباح
  const prepareProfitLineChartData = () => {
    const labels = Object.keys(summary.monthlyData).sort();
    const profitData = labels.map(month => summary.monthlyData[month].profit);
    
    return {
      labels: labels.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1);
        return date.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' });
      }),
      datasets: [
        {
          label: 'صافي الربح',
          data: profitData,
          fill: false,
          backgroundColor: 'rgb(75, 192, 192)',
          borderColor: 'rgba(75, 192, 192, 0.8)',
          tension: 0.1
        }
      ]
    };
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">التقارير المالية - Al-Saad Travels and Tourism</h1>
      
      {/* أزرار التصدير */}
      <div className="flex justify-end mb-6 space-x-2">
        <button 
          onClick={exportToPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaFilePdf className="mr-2" /> تصدير PDF
        </button>
        <button 
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaFileExcel className="mr-2" /> تصدير Excel
        </button>
      </div>
      
      {/* اختيار نوع التقرير والفترة الزمنية */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">نوع التقرير</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="summary">ملخص مالي</option>
              <option value="revenue">تقرير الإيرادات</option>
              <option value="expense">تقرير المصروفات</option>
              <option value="profit">تقرير الأرباح</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">من تاريخ</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">إلى تاريخ</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">جاري التحميل...</span>
          </div>
        </div>
      ) : (
        <>
          {/* ملخص مالي */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">إجمالي الإيرادات</h3>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalRevenue)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">إجمالي المصروفات</h3>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">صافي الربح</h3>
              <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.netProfit)}
              </p>
            </div>
          </div>
          
          {/* الرسوم البيانية */}
          {reportType === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaChartBar className="mr-2" /> الإيرادات والمصروفات الشهرية
                </h3>
                <div className="h-80">
                  <Bar 
                    data={prepareBarChartData()} 
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
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaChartLine className="mr-2" /> تطور صافي الربح
                </h3>
                <div className="h-80">
                  <Line 
                    data={prepareProfitLineChartData()} 
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
              </div>
            </div>
          )}
          
          {(reportType === 'summary' || reportType === 'revenue') && (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaChartPie className="mr-2" /> توزيع الإيرادات حسب الفئة
              </h3>
              <div className="h-80">
                <Pie 
                  data={prepareRevenuePieChartData()} 
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
            </div>
          )}
          
          {(reportType === 'summary' || reportType === 'expense') && (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaChartPie className="mr-2" /> توزيع المصروفات حسب الفئة
              </h3>
              <div className="h-80">
                <Pie 
                  data={prepareExpensePieChartData()} 
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
            </div>
          )}
          
          {reportType === 'profit' && (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaChartLine className="mr-2" /> تطور صافي الربح
              </h3>
              <div className="h-80">
                <Line 
                  data={prepareProfitLineChartData()} 
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
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialReportsPage;
