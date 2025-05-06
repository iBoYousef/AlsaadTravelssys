import React, { useEffect, useState } from 'react';
import { 
  Alert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription, 
  CloseButton, 
  Box, 
  Button, 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Code,
  useDisclosure,
  VStack,
  Text
} from '@chakra-ui/react';
import { config } from '../../config/environment';

/**
 * مكون لمعالجة الأخطاء العامة في التطبيق
 * يعرض رسائل الخطأ بطريقة ودية للمستخدم ويسجل الأخطاء للمطورين
 */
const GlobalErrorHandler = () => {
  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // معالج الأخطاء العام
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('خطأ غير متوقع تم اكتشافه:', event.error);
      
      // تعيين معلومات الخطأ
      setError({
        message: event.error?.message || 'حدث خطأ غير متوقع',
        stack: event.error?.stack || '',
        source: event.filename || 'غير معروف',
        line: event.lineno || 'غير معروف',
        column: event.colno || 'غير معروف'
      });
      
      // فتح النافذة المنبثقة في حالة الخطأ
      onOpen();
      
      // منع السلوك الافتراضي للمتصفح
      event.preventDefault();
    };

    // تسجيل معالج الأخطاء
    window.addEventListener('error', handleGlobalError);
    
    // إزالة معالج الأخطاء عند تفكيك المكون
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, [onOpen]);

  // إعادة تحميل التطبيق
  const handleReload = () => {
    window.location.reload();
  };

  // العودة إلى الصفحة الرئيسية
  const handleGoHome = () => {
    window.location.href = '/';
    onClose();
  };

  // تسجيل الخروج
  const handleLogout = () => {
    // محاولة تسجيل الخروج
    try {
      // تنظيف التخزين المحلي
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.clear();
      
      // إعادة توجيه إلى صفحة تسجيل الدخول
      window.location.href = '/login';
    } catch (e) {
      console.error('فشل تسجيل الخروج:', e);
      window.location.reload();
    }
  };

  // عرض تفاصيل الخطأ للمطورين فقط
  const renderErrorDetails = () => {
    if (!config.isDevelopment && !config.isDebug) {
      return null;
    }

    return (
      <Box mt={4} p={3} bg="gray.50" borderRadius="md" fontSize="sm">
        <Text fontWeight="bold" mb={2}>معلومات الخطأ (للمطورين فقط):</Text>
        <VStack align="start" spacing={1}>
          <Text>المصدر: {error?.source}</Text>
          <Text>السطر: {error?.line}, العمود: {error?.column}</Text>
          <Code p={2} w="100%" overflowX="auto" colorScheme="red">
            {error?.stack || 'لا توجد معلومات إضافية'}
          </Code>
        </VStack>
      </Box>
    );
  };

  return (
    <>
      {/* نافذة الخطأ المنبثقة */}
      <Modal isOpen={isOpen && error} onClose={onClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg="red.500" color="white" borderTopRadius="md">
            حدث خطأ غير متوقع
          </ModalHeader>
          <ModalBody py={4}>
            <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={4}>
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={2} fontSize="lg">
                نعتذر عن هذا الخطأ
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                {error?.message || 'حدث خطأ غير متوقع في النظام. يرجى المحاولة مرة أخرى لاحقاً.'}
              </AlertDescription>
            </Alert>
            
            {renderErrorDetails()}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleReload}>
              إعادة تحميل
            </Button>
            <Button variant="ghost" mr={3} onClick={handleGoHome}>
              الصفحة الرئيسية
            </Button>
            <Button colorScheme="red" onClick={handleLogout}>
              تسجيل الخروج
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GlobalErrorHandler;
