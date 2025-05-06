import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaArrowRight } from 'react-icons/fa';

export default function PageHeader({ title, showBackButton = true }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaArrowRight className="ml-2 -mr-0.5 h-4 w-4" />
                رجوع
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
          {user && (
            <div className="flex items-center">
              <span className="text-gray-700 ml-4">{user.role === 'admin' ? 'مشرف النظام' : 'موظف'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
