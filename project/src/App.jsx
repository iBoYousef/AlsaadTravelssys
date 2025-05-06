import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/shared/Layout';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AutoLogoutProvider from './components/auth/AutoLogoutProvider';
import MainMenu from './components/MainMenu';
import { getAppMode, APP_MODES, setAppMode } from './utils/appMode';
import { Flex, Spinner, Text, ChakraProvider } from '@chakra-ui/react';
import ErrorPage from './components/shared/ErrorPage';
import GlobalErrorHandler from './components/shared/GlobalErrorHandler';
import { config } from './config/environment';

// استيراد الشاشات
import FlightBookingsPage from './components/flights/FlightBookingsPage';
import FlightBookingsHistory from './components/flights/FlightBookingsHistory';
import HotelBookingsPage from './components/hotels/HotelBookingsPage';
import HotelBookingsHistory from './components/hotels/HotelBookingsHistory';
import VehicleBookingsPage from './components/vehicles/VehicleBookingsPage';
import VehicleBookingsHistory from './components/vehicles/VehicleBookingsHistory';
import EventBookingsPage from './components/events/EventBookingsPage';
import EventBookingsHistory from './components/events/EventBookingsHistory';
import VisaBookingsPage from './components/visas/VisaBookingsPage';
import VisaBookingsHistory from './components/visas/VisaBookingsHistory';
import VisaReportsPage from './components/visas/VisaReportsPage';
import VisaApplications from './pages/VisaApplications';
import TourPackages from './pages/TourPackages';
import TourPackageReports from './pages/TourPackageReports';
import PublicTourPackages from './pages/PublicTourPackages';
import TourBookings from './pages/TourBookings';
import TourBookingReports from './pages/TourBookingReports';
import CustomerReports from './pages/CustomerReports';
import Notifications from './pages/Notifications';
import ReceiptRecordsPage from './components/receipts/ReceiptRecordsPage';
import ReportsPage from './components/reports/ReportsPage';
import EmployeesPage from './components/employees/EmployeesPage';
import EmployeeForm from './components/employees/EmployeeForm';
import Settings from './components/system/Settings';
import DataMigration from './components/system/DataMigration';
import CustomersPage from './components/customers/CustomersPage';
import CompanionsPage from './components/customers/CompanionsPage';
import AccountingDashboard from './components/accounting/AccountingDashboard';
import RevenuesPage from './components/accounting/RevenuesPage';
import ExpensesPage from './components/accounting/ExpensesPage';
import InvoicesPage from './components/accounting/InvoicesPage';
import FinancialReportsPage from './components/accounting/FinancialReportsPage';
import TestDataManager from './components/admin/TestDataManager';
import ResetAdmin from './components/admin/ResetAdmin';
import SystemLogsPage from './components/admin/SystemLogsPage';
import UsersPage from './components/users/UsersPage';
import UserForm from './components/users/UserForm';
import SystemCheckerPage from './components/system/SystemCheckerPage';
import DataSeedPage from './components/admin/DataSeedPage';
import AdminClearData from './pages/AdminClearData';

const App = () => {
  const { user, loading } = useAuth();

  // تعيين وضع التطبيق إلى وضع الإنتاج عند بدء التشغيل
  useEffect(() => {
    setAppMode(APP_MODES.PRODUCTION);
    console.log('App: تم تعيين وضع التطبيق إلى وضع الإنتاج');
  }, []);

  // عرض شاشة التحميل أثناء التحقق من حالة المصادقة
  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" height="100vh">
        <Spinner size="xl" color="blue.500" thickness="4px" speed="0.65s" />
        <Text mt={4} fontSize="lg">جاري التحميل...</Text>
      </Flex>
    );
  }

  // تكوين المسارات
  const router = createBrowserRouter([
    {
      path: '/login',
      element: !user ? <LoginPage /> : <Navigate to="/main-menu" replace />,
      errorElement: <ErrorPage />
    },
    {
      path: '/',
      element: user ? <Layout /> : <Navigate to="/login" replace />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: 'main-menu',
          element: <ProtectedRoute><MainMenu /></ProtectedRoute>
        },
        {
          path: '',
          element: <Navigate to="/main-menu" replace />
        },
        // حجوزات الطيران
        {
          path: 'flight-bookings',
          element: <ProtectedRoute requiredSection="flight_bookings"><FlightBookingsPage /></ProtectedRoute>
        },
        {
          path: 'flight-bookings/history',
          element: <ProtectedRoute requiredSection="flight_bookings"><FlightBookingsHistory /></ProtectedRoute>
        },
        // حجوزات الفنادق
        {
          path: 'hotel-bookings',
          element: <ProtectedRoute requiredSection="hotel_bookings"><HotelBookingsPage /></ProtectedRoute>
        },
        {
          path: 'hotel-bookings/history',
          element: <ProtectedRoute requiredSection="hotel_bookings"><HotelBookingsHistory /></ProtectedRoute>
        },
        // حجوزات المركبات
        {
          path: 'vehicle-bookings',
          element: <ProtectedRoute requiredSection="vehicle_bookings"><VehicleBookingsPage /></ProtectedRoute>
        },
        {
          path: 'vehicle-bookings/history',
          element: <ProtectedRoute requiredSection="vehicle_bookings"><VehicleBookingsHistory /></ProtectedRoute>
        },
        // حجوزات الفعاليات
        {
          path: 'event-bookings',
          element: <ProtectedRoute requiredSection="event_bookings"><EventBookingsPage /></ProtectedRoute>
        },
        {
          path: 'event-bookings/history',
          element: <ProtectedRoute requiredSection="event_bookings"><EventBookingsHistory /></ProtectedRoute>
        },
        // التأشيرات
        {
          path: 'visa-bookings',
          element: <ProtectedRoute requiredSection="visa_bookings"><VisaBookingsPage /></ProtectedRoute>
        },
        {
          path: 'visa-bookings/history',
          element: <ProtectedRoute requiredSection="visa_bookings"><VisaBookingsHistory /></ProtectedRoute>
        },
        {
          path: 'visa-reports',
          element: <ProtectedRoute requiredSection="visa_reports"><VisaReportsPage /></ProtectedRoute>
        },
        {
          path: 'visa-applications',
          element: <ProtectedRoute requiredSection="visa_applications"><VisaApplications /></ProtectedRoute>
        },
        // البرامج السياحية
        {
          path: 'tour-packages',
          element: <ProtectedRoute requiredSection="tour_packages"><TourPackages /></ProtectedRoute>
        },
        {
          path: 'tour-package-reports',
          element: <ProtectedRoute requiredSection="tour_package_reports"><TourPackageReports /></ProtectedRoute>
        },
        {
          path: 'public-tour-packages',
          element: <ProtectedRoute requiredSection="public_tour_packages"><PublicTourPackages /></ProtectedRoute>
        },
        {
          path: 'tour-bookings',
          element: <ProtectedRoute requiredSection="tour_bookings"><TourBookings /></ProtectedRoute>
        },
        {
          path: 'tour-booking-reports',
          element: <ProtectedRoute requiredSection="tour_booking_reports"><TourBookingReports /></ProtectedRoute>
        },
        // العملاء
        {
          path: 'customers',
          element: <ProtectedRoute requiredSection="customers"><CustomersPage /></ProtectedRoute>
        },
        {
          path: 'customers/:customerId/companions',
          element: <ProtectedRoute requiredSection="customers"><CompanionsPage /></ProtectedRoute>
        },
        {
          path: 'customer-reports',
          element: <ProtectedRoute requiredSection="customer_reports"><CustomerReports /></ProtectedRoute>
        },
        // الإشعارات
        {
          path: 'notifications',
          element: <ProtectedRoute requiredSection="notifications"><Notifications /></ProtectedRoute>
        },
        // الإيصالات
        {
          path: 'receipts',
          element: <ProtectedRoute requiredSection="accounting"><ReceiptRecordsPage /></ProtectedRoute>
        },
        // التقارير
        {
          path: 'reports',
          element: <ProtectedRoute requiredSection="reports"><ReportsPage /></ProtectedRoute>
        },
        // الموظفين
        {
          path: 'employees',
          element: <ProtectedRoute requiredSection="employees"><EmployeesPage /></ProtectedRoute>
        },
        {
          path: 'employees/add',
          element: <ProtectedRoute requiredSection="employees"><EmployeeForm /></ProtectedRoute>
        },
        {
          path: 'employees/edit/:id',
          element: <ProtectedRoute requiredSection="employees"><EmployeeForm /></ProtectedRoute>
        },
        // المستخدمين
        {
          path: 'users',
          element: <ProtectedRoute requiredSection="users"><UsersPage /></ProtectedRoute>
        },
        {
          path: 'users/new',
          element: <ProtectedRoute requiredSection="users"><UserForm /></ProtectedRoute>
        },
        {
          path: 'users/edit/:id',
          element: <ProtectedRoute requiredSection="users"><UserForm /></ProtectedRoute>
        },
        // المحاسبة
        {
          path: 'accounting',
          element: <ProtectedRoute requiredSection="accounting"><AccountingDashboard /></ProtectedRoute>
        },
        {
          path: 'revenues',
          element: <ProtectedRoute requiredSection="accounting"><RevenuesPage /></ProtectedRoute>
        },
        {
          path: 'expenses',
          element: <ProtectedRoute requiredSection="accounting"><ExpensesPage /></ProtectedRoute>
        },
        {
          path: 'invoices',
          element: <ProtectedRoute requiredSection="accounting"><InvoicesPage /></ProtectedRoute>
        },
        {
          path: 'financial-reports',
          element: <ProtectedRoute requiredSection="accounting"><FinancialReportsPage /></ProtectedRoute>
        },
        // إعدادات النظام
        {
          path: 'settings',
          element: <ProtectedRoute requiredSection="settings"><Settings /></ProtectedRoute>
        },
        {
          path: 'data-migration',
          element: <ProtectedRoute requiredSection="data_migration"><DataMigration /></ProtectedRoute>
        },
        // أدوات المطور
        {
          path: 'test-data-manager',
          element: <ProtectedRoute requiredSection="admin"><TestDataManager /></ProtectedRoute>
        },
        {
          path: 'reset-admin',
          element: <ProtectedRoute requiredSection="admin"><ResetAdmin /></ProtectedRoute>
        },
        {
          path: 'system-logs',
          element: <ProtectedRoute requiredSection="admin"><SystemLogsPage /></ProtectedRoute>
        },
        {
          path: 'admin-clear-data',
          element: <ProtectedRoute requiredSection="admin"><AdminClearData /></ProtectedRoute>
        },
        {
          path: 'system-checker',
          element: <ProtectedRoute requiredSection="admin"><SystemCheckerPage /></ProtectedRoute>
        },
        {
          path: 'data-seed',
          element: <ProtectedRoute requiredSection="admin"><DataSeedPage /></ProtectedRoute>
        },
        // مسار للتعامل مع جميع المسارات غير الموجودة داخل المنطقة المحمية
        {
          path: '*',
          element: <ErrorPage />
        }
      ]
    },
  ],
  {
    future: {
      v7_startTransition: true
    }
  }
);

return (
  <ChakraProvider>
    {/* إضافة معالج الأخطاء العام */}
    <GlobalErrorHandler />
    <RouterProvider router={router} />
  </ChakraProvider>
);

}

export default App;
