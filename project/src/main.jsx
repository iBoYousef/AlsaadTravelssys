import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';
import ChakraProviderWrapper from './components/shared/ChakraProviderWrapper';
import ErrorBoundary from './components/shared/ErrorBoundary';

// تهيئة قاعدة البيانات وإنشاء المشرف الافتراضي
const initializeApp = async () => {
  try {
    // تحميل التطبيق
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <ChakraProviderWrapper>
            <AuthProvider> {/* UnifiedAuthContext */}
              <div dir="rtl">
                <App />
              </div>
            </AuthProvider>
          </ChakraProviderWrapper>
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('خطأ في تهيئة التطبيق:', error);
  }
};

initializeApp();
