import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AutoLogoutProvider from '../auth/AutoLogoutProvider';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
  <AutoLogoutProvider timeout={30 * 60 * 1000}>
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* شريط التنقل العلوي */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/main-menu"
                className="flex items-center px-4 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <FaHome className="h-5 w-5 ml-2" />
                <span className="font-medium">برامج السعد</span>
              </Link>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 dark:text-gray-200 ml-4">
                {user.name} | {user.jobTitle}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 mr-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaSignOutAlt className="ml-2" />
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* المحتوى الرئيسي */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* إشعارات النظام */}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  </AutoLogoutProvider>
);
};

export default Layout;
