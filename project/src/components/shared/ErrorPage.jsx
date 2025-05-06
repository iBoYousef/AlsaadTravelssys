import React from 'react';
import { useRouteError, Link } from 'react-router-dom';
import { Box, Heading, Text, Button, Flex, Icon } from '@chakra-ui/react';
import { FaExclamationTriangle, FaHome, FaArrowLeft } from 'react-icons/fa';

const ErrorPage = () => {
  const error = useRouteError();
  
  // تحديد نوع الخطأ ورسالة مناسبة
  let errorTitle = 'حدث خطأ غير متوقع';
  let errorMessage = 'نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى لاحقًا.';
  let errorCode = error?.status || error?.code || null;

  if (error?.status === 404) {
    errorTitle = 'الصفحة غير موجودة';
    errorMessage = 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.';
  } else if (error?.status === 403) {
    errorTitle = 'غير مصرح بالوصول';
    errorMessage = 'ليس لديك صلاحية للوصول إلى هذه الصفحة.';
  } else if (error?.message) {
    // إذا كانت الرسالة تشير لصلاحيات أو مشكلة واضحة
    if (error.message.includes('صلاحية') || error.message.includes('permission')) {
      errorTitle = 'صلاحيات غير كافية';
    }
    errorMessage = error.message;
  } else if (error?.code) {
    errorMessage = `رمز الخطأ: ${error.code}`;
  }

  return (
    <Box textAlign="center" py={10} px={6} height="100vh" display="flex" alignItems="center" justifyContent="center">
      <Box>
        <Icon as={FaExclamationTriangle} boxSize="50px" color="red.500" mb={4} />
        <Heading as="h2" size="xl" mt={6} mb={2} color="red.500">
          {errorTitle}
        </Heading>
        <Text color="gray.700" fontSize="lg" mb={3}>
          {errorMessage}
        </Text>
        {errorCode && (
          <Text color="gray.500" fontSize="md" mb={3}>كود الخطأ: {errorCode}</Text>
        )}
        {/* زر إعادة المحاولة */}
        <Button
          colorScheme="orange"
          variant="outline"
          mb={4}
          onClick={() => window.location.reload()}
        >
          إعادة المحاولة
        </Button>
        {/* معلومات تقنية للمطورين */}
        {process.env.NODE_ENV !== 'production' && error && (
          <Box 
            mt={4} 
            p={4} 
            bg="gray.100" 
            borderRadius="md" 
            textAlign="left" 
            fontFamily="monospace"
            fontSize="sm"
            mb={6}
          >
            <Text fontWeight="bold" mb={2}>معلومات تقنية (للمطورين فقط):</Text>
            <Text whiteSpace="pre-wrap">{error.stack || JSON.stringify(error, null, 2)}</Text>
          </Box>
        )}
        <Flex justifyContent="center" mt={6} gap={4}>
          <Button
            colorScheme="blue"
            leftIcon={<FaArrowLeft />}
            onClick={() => window.history.back()}
          >
            العودة للصفحة السابقة
          </Button>
          <Button
            as={Link}
            to="/main-menu"
            colorScheme="teal"
            leftIcon={<FaHome />}
          >
            الصفحة الرئيسية
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default ErrorPage;
