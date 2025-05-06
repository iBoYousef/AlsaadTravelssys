import React, { useState, useEffect } from 'react';
import { FaChartBar, FaSpinner, FaPlane, FaHotel, FaCalendarAlt, FaCar, FaPassport } from 'react-icons/fa';
import { toast } from 'react-toastify';
import FlightBookingsHistory from '../flights/FlightBookingsHistory';
import HotelBookingsHistory from '../hotels/HotelBookingsHistory';
import EventBookingsHistory from '../events/EventBookingsHistory';
import VehicleBookingsHistory from '../vehicles/VehicleBookingsHistory';
import VisaBookingsHistory from '../visas/VisaBookingsHistory';
import BackButton from '../shared/BackButton';
import { useActionLogger } from '../../hooks/useActionLogger';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeSection, setActiveSection] = useState('weekly-reports');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const { logPageView, logAction, logExport, ACTION_TYPES, ACTION_CATEGORIES } = useActionLogger();

  // تسجيل عرض الصفحة عند التحميل
  useEffect(() => {
    logPageView('صفحة التقارير', ACTION_CATEGORIES.REPORT);
  }, [logPageView]);

  const reports = [
    { id: 'weekly-bookings', title: 'تقرير الحجوزات الأسبوعي', icon: FaChartBar },
    { id: 'weekly-revenue', title: 'تقرير الإيرادات الأسبوعي', icon: FaChartBar },
    { id: 'weekly-services', title: 'تقرير الخدمات الأسبوعي', icon: FaChartBar }
  ];

  const bookingHistorySections = [
    { id: 'flights', title: 'سجل حجوزات الطيران', icon: FaPlane, component: FlightBookingsHistory },
    { id: 'hotels', title: 'سجل حجوزات الفنادق', icon: FaHotel, component: HotelBookingsHistory },
    { id: 'events', title: 'سجل حجوزات الفعاليات', icon: FaCalendarAlt, component: EventBookingsHistory },
    { id: 'vehicles', title: 'سجل حجوزات المركبات', icon: FaCar, component: VehicleBookingsHistory },
    { id: 'visas', title: 'سجل حجوزات التأشيرات', icon: FaPassport, component: VisaBookingsHistory }
  ];

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast.error('الرجاء اختيار نوع التقرير');
      return;
    }

    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('الرجاء تحديد نطاق التاريخ');
      return;
    }

    try {
      setLoading(true);
      // TODO: تنفيذ توليد التقرير
      
      // تسجيل حدث توليد التقرير
      logAction(ACTION_TYPES.VIEW, `تم توليد تقرير ${getReportTitle(selectedReport)}`, ACTION_CATEGORIES.REPORT, {
        reportType: selectedReport,
        dateRange: dateRange
      });
      
      toast.info('سيتم تنفيذ توليد التقارير قريباً');
    } catch (error) {
      console.error('خطأ في توليد التقرير:', error);
      toast.error('حدث خطأ في توليد التقرير');
      
      // تسجيل حدث الخطأ
      logAction(ACTION_TYPES.ERROR, `خطأ في توليد تقرير ${getReportTitle(selectedReport)}`, ACTION_CATEGORIES.REPORT, {
        reportType: selectedReport,
        dateRange: dateRange,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getReportTitle = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    return report ? report.title : reportId;
  };

  const handleExportData = (format) => {
    try {
      // TODO: تنفيذ تصدير البيانات
      
      // تسجيل حدث تصدير البيانات
      logExport(
        activeSection === 'weekly-reports' 
          ? `تقرير ${getReportTitle(selectedReport)}` 
          : `سجل ${getBookingSectionTitle(activeSection)}`,
        format,
        ACTION_CATEGORIES.REPORT,
        {
          section: activeSection,
          dateRange: dateRange
        }
      );
      
      toast.success(`تم تصدير البيانات بصيغة ${format} بنجاح`);
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
      toast.error('حدث خطأ في تصدير البيانات');
      
      // تسجيل حدث الخطأ
      logAction(ACTION_TYPES.ERROR, `خطأ في تصدير البيانات بصيغة ${format}`, ACTION_CATEGORIES.REPORT, {
        section: activeSection,
        dateRange: dateRange,
        error: error.message
      });
    }
  };

  const getBookingSectionTitle = (sectionId) => {
    const section = bookingHistorySections.find(s => s.id === sectionId);
    return section ? section.title : sectionId;
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    
    // تسجيل حدث تغيير القسم
    logAction(ACTION_TYPES.VIEW, `تم الانتقال إلى قسم ${section === 'weekly-reports' ? 'التقارير الأسبوعية' : getBookingSectionTitle(section)}`, ACTION_CATEGORIES.REPORT);
  };

  const renderWeeklyReports = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نوع التقرير
          </label>
          <select
            value={selectedReport || ''}
            onChange={(e) => setSelectedReport(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">اختر نوع التقرير</option>
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              من تاريخ
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerateReport}
        disabled={loading}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {loading ? (
          <>
            <FaSpinner className="animate-spin" />
            <span>جاري توليد التقرير...</span>
          </>
        ) : (
          <>
            <FaChartBar />
            <span>توليد التقرير</span>
          </>
        )}
      </button>
    </div>
  );

  const renderContent = () => {
    if (activeSection === 'weekly-reports') {
      return renderWeeklyReports();
    }

    const SelectedComponent = bookingHistorySections.find(
      section => section.id === activeSection
    )?.component;

    return SelectedComponent ? <SelectedComponent /> : null;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">التقارير والإحصائيات</h1>
      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 rtl:space-x-reverse" aria-label="Tabs">
            <button
              onClick={() => handleSectionChange('weekly-reports')}
              className={`${
                activeSection === 'weekly-reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <FaChartBar />
              <span>التقارير الأسبوعية</span>
            </button>
            {bookingHistorySections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <section.icon />
                <span>{section.title}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow mb-6">
        {renderContent()}
      </div>
    </div>
  );
}
