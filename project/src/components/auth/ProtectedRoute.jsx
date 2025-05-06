import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast, Spinner, Flex, Text } from '@chakra-ui/react';

/**
 * مكون لحماية المسارات والتحقق من الصلاحيات
 * @param {Object} props - خصائص المكون
 * @param {React.ReactNode} props.children - المكونات الفرعية
 * @param {string} props.requiredRole - الدور المطلوب للوصول
 * @param {string} props.requiredPermission - الصلاحية المطلوبة للوصول
 * @param {string} props.requiredSection - القسم المطلوب للوصول
 * @param {Array<string>} props.allowedRoles - الأدوار المسموح لها بالوصول
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ children, requiredRole, requiredPermission, requiredSection, allowedRoles }) => {
  const { user, loading, checkPermission, canAccessSection } = useAuth();
  const location = useLocation();
  const toast = useToast();

  // التحقق من حالة التحميل
  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" height="100vh">
        <Spinner size="xl" color="blue.500" thickness="4px" speed="0.65s" />
        <Text mt={4} fontSize="lg">جاري التحميل...</Text>
      </Flex>
    );
  }

  // التحقق من تسجيل الدخول
  if (!user) {
    toast({
      title: 'تنبيه',
      description: 'يجب تسجيل الدخول للوصول إلى هذه الصفحة',
      status: 'error',
      duration: 3000,
      isClosable: true,
      position: 'top'
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // دالة آمنة للتحقق من الصلاحيات
  const safeCheckPermission = (permission) => {
    try {
      if (!user) return false;
      if (user.isAdmin) return true;
      if (typeof user.checkPermission === 'function') {
        return user.checkPermission(permission);
      }
      return checkPermission(permission);
    } catch (error) {
      console.error('ProtectedRoute: خطأ في التحقق من الصلاحيات:', error);
      return false;
    }
  };

  // دالة آمنة للتحقق من إمكانية الوصول إلى قسم
  const safeCanAccessSection = (section) => {
    try {
      if (!user) return false;
      if (user.isAdmin) return true;
      
      // قائمة أقسام المحاسبة
      const accountingSections = ['accounting', 'revenues', 'expenses', 'invoices', 'receipts', 'financial_reports'];
      
      // إذا كان القسم المطلوب هو أحد أقسام المحاسبة
      if (accountingSections.includes(section)) {
        console.log('ProtectedRoute: التحقق من صلاحية الوصول إلى قسم المحاسبة:', section);
        
        // التحقق من الدور
        if (user.role === 'accountant' || user.role === 'finance_manager') {
          console.log('ProtectedRoute: المستخدم لديه دور محاسب أو مدير مالي، السماح بالوصول إلى القسم:', section);
          return true;
        }
        
        // التحقق من وجود صلاحية المحاسبة
        if (user.permissions && Array.isArray(user.permissions)) {
          // التحقق من صلاحية المحاسبة العامة
          if (user.permissions.includes('accounting') || 
              user.permissions.includes('accounting.view') || 
              user.permissions.includes('finance')) {
            console.log('ProtectedRoute: المستخدم لديه صلاحية المحاسبة العامة، السماح بالوصول إلى القسم:', section);
            return true;
          }
          
          // التحقق من صلاحية القسم المحدد
          if (user.permissions.includes(section) || 
              user.permissions.includes(`${section}.view`)) {
            console.log('ProtectedRoute: المستخدم لديه صلاحية الوصول إلى القسم المحدد:', section);
            return true;
          }
        }
        
        // التحقق من وجود صلاحية المحاسبة كسلسلة (للتوافق مع النموذج القديم)
        if (typeof user.permissions === 'string') {
          if (user.permissions === 'accounting' || 
              user.permissions === 'accounting.view' || 
              user.permissions === 'finance' || 
              user.permissions === 'all') {
            console.log('ProtectedRoute: المستخدم لديه صلاحية المحاسبة العامة (نموذج قديم)، السماح بالوصول إلى القسم:', section);
            return true;
          }
        }
        
        // استخدام دالة checkPermission إذا كانت متاحة
        if (typeof checkPermission === 'function') {
          try {
            const hasAccess = checkPermission('accounting') || 
                             checkPermission('accounting.view') || 
                             checkPermission(section) || 
                             checkPermission(`${section}.view`);
            
            if (hasAccess) {
              console.log('ProtectedRoute: المستخدم لديه صلاحية الوصول باستخدام checkPermission، السماح بالوصول إلى القسم:', section);
              return true;
            }
          } catch (error) {
            console.error('ProtectedRoute: خطأ في استخدام checkPermission:', error);
          }
        }
        
        // استخدام دالة canAccessSection إذا كانت متاحة
        if (typeof canAccessSection === 'function') {
          try {
            const hasAccess = canAccessSection('accounting') || canAccessSection(section);
            
            if (hasAccess) {
              console.log('ProtectedRoute: المستخدم لديه صلاحية الوصول باستخدام canAccessSection، السماح بالوصول إلى القسم:', section);
              return true;
            }
          } catch (error) {
            console.error('ProtectedRoute: خطأ في استخدام canAccessSection:', error);
          }
        }
      }
      
      if (typeof user.canAccessSection === 'function') {
        return user.canAccessSection(section);
      }
      
      return typeof canAccessSection === 'function' ? canAccessSection(section) : false;
    } catch (error) {
      console.error('ProtectedRoute: خطأ في التحقق من إمكانية الوصول إلى قسم:', error);
      return false;
    }
  };

  // استخدام useMemo لتحسين الأداء وتجنب إعادة الحساب غير الضرورية
  const accessCheck = useMemo(() => {
    // التحقق من الدور المطلوب
    if (requiredRole) {
      if (user.role !== requiredRole && !user.isAdmin) {
        return false;
      }
    }

    // التحقق من الأدوار المسموح بها
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role) && !user.isAdmin) {
        return false;
      }
    }

    // التحقق من الصلاحية المطلوبة
    if (requiredPermission) {
      if (!safeCheckPermission(requiredPermission)) {
        return false;
      }
    }

    // التحقق من القسم المطلوب
    if (requiredSection) {
      if (!safeCanAccessSection(requiredSection)) {
        return false;
      }
    }

    // إذا وصلنا إلى هنا، فهذا يعني أن المستخدم لديه الصلاحيات المطلوبة
    return true;
  }, [user, requiredRole, requiredPermission, requiredSection, allowedRoles, safeCheckPermission, safeCanAccessSection]);

  // إذا لم يكن المستخدم لديه الصلاحيات المطلوبة، قم بإعادة توجيهه إلى الصفحة الرئيسية
  if (!accessCheck && (requiredRole || requiredPermission || requiredSection || (allowedRoles && allowedRoles.length > 0))) {
    toast({
      title: 'غير مصرح',
      description: 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
      status: 'error',
      duration: 3000,
      isClosable: true,
      position: 'top'
    });
    return <Navigate to="/main-menu" replace />;
  }

  // إذا وصلنا إلى هنا، فهذا يعني أن المستخدم لديه الصلاحيات المطلوبة
  return children;
};

export default ProtectedRoute;
