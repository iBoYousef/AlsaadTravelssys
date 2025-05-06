import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Text,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Tooltip,
  Checkbox,
  Flex,
  Heading,
  Image,
  Divider,
  useColorModeValue,
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSignInAlt, FaKey } from 'react-icons/fa';
import firebaseServices from '../../firebase';
import AlsaadButton from '../shared/AlsaadButton';

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      const employeeId = formData.username.trim();
      
      // التحقق من أن اسم المستخدم غير فارغ
      if (!employeeId) {
        throw new Error('الرجاء إدخال رقم وظيفي أو اسم مستخدم صحيح');
      }

      // التحقق من أن كلمة المرور غير فارغة
      if (!formData.password) {
        throw new Error('الرجاء إدخال كلمة المرور');
      }

      if (rememberMe) {
        localStorage.setItem('alsaad_remembered_username', employeeId);
      } else {
        localStorage.removeItem('alsaad_remembered_username');
      }

      await signIn(employeeId, formData.password);
      
      // تأخير أطول لضمان تحديث حالة المستخدم قبل التوجيه
      setTimeout(() => {
        navigate('/main-menu', { replace: true });
      }, 500);
    } catch (error) {
      console.error('LoginPage: خطأ في تسجيل الدخول:', error);
      setLoginError(error.message || 'حدث خطأ أثناء محاولة تسجيل الدخول');
      setIsLoading(false);
    }
  };

  // دالة للتعامل مع نسيان كلمة المرور
  const handleForgotPassword = () => {
    // فتح النافذة المنبثقة لإعادة تعيين كلمة المرور
    setResetEmail(formData.username); // استخدام رقم الموظف المدخل في نموذج تسجيل الدخول
    setResetSuccess(false);
    setResetError('');
    onOpen();
  };

  // دالة لإرسال طلب إعادة تعيين كلمة المرور
  const handleResetPassword = async () => {
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail.trim())) {
      setResetError('يرجى إدخال بريد إلكتروني صالح');
      return;
    }

    setIsResetting(true);
    setResetError('');
    setResetSuccess(false);

    try {
      const result = await firebaseServices.resetPassword(resetEmail.trim());
      
      if (result.success) {
        setResetSuccess(true);
        setResetError('');
        // لا نغلق النافذة المنبثقة لكي يرى المستخدم رسالة النجاح
      } else {
        setResetError(result.error || 'حدث خطأ أثناء محاولة إعادة تعيين كلمة المرور');
        setResetSuccess(false);
      }
    } catch (error) {
      console.error('LoginPage: خطأ في إعادة تعيين كلمة المرور:', error);
      setResetError(error.message || 'حدث خطأ غير متوقع أثناء محاولة إعادة تعيين كلمة المرور');
      setResetSuccess(false);
    } finally {
      setIsResetting(false);
    }
  };

  // دالة لإغلاق نافذة إعادة تعيين كلمة المرور
  const handleCloseResetModal = () => {
    onClose();
    // إعادة تعيين الحالة بعد فترة قصيرة لتجنب التأثيرات المرئية أثناء الإغلاق
    setTimeout(() => {
      setResetEmail('');
      setResetSuccess(false);
      setResetError('');
    }, 300);
  };

  // ألوان متغيرة حسب وضع السمة (فاتح/داكن)
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const primaryColor = useColorModeValue('blue.500', 'blue.300');

  // التحقق من وجود بيانات محفوظة سابقاً
  useEffect(() => {
    try {
      const savedUsername = localStorage.getItem('alsaad_remembered_username');
      if (savedUsername) {
        setFormData(prev => ({ ...prev, username: savedUsername }));
        setRememberMe(true);
      }
    } catch (error) {
      console.warn('LoginPage: خطأ في قراءة البيانات المحفوظة:', error);
    }
  }, []);

  // إذا كان المستخدم مسجل الدخول بالفعل، توجيهه إلى القائمة الرئيسية
  if (user) {
    return <Navigate to="/main-menu" replace />;
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={useColorModeValue('gray.50', 'gray.900')}
      dir="rtl"
    >
      <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
        <Box
          py="8"
          px={{ base: '4', md: '10' }}
          bg={bgColor}
          boxShadow={{ base: 'none', sm: 'xl' }}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <VStack spacing="8">
            {/* شعار الشركة والعنوان */}
            <VStack spacing="3">
              <Image 
                src="/images/logo-ar.svg" 
                alt="السعد للسياحة والسفر" 
                height="100px" 
                width="auto"
              />
              <Heading
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="bold"
                textAlign="center"
                color={primaryColor}
              >
                نظام السعد للسياحة والسفر
              </Heading>
              <Text color={textColor} fontSize="md" textAlign="center">
                يرجى تسجيل الدخول للوصول إلى لوحة التحكم
              </Text>
            </VStack>

            {/* عرض رسالة الخطأ إذا وجدت */}
            {loginError && (
              <Alert status="error" variant="left-accent" borderRadius="md">
                <AlertIcon />
                <AlertTitle mr={2}>خطأ في تسجيل الدخول!</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
                <CloseButton 
                  position="absolute" 
                  right="8px" 
                  top="8px" 
                  onClick={() => setLoginError('')}
                />
              </Alert>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <VStack spacing="5" align="stretch">
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">رقم الموظف</FormLabel>
                  <InputGroup size="md">
                    <InputLeftElement pointerEvents="none">
                      <FaEnvelope color="gray" />
                    </InputLeftElement>
                    <Input
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      name="username"
                      dir="ltr"
                      borderRadius="md"
                      focusBorderColor={primaryColor}
                      bg={useColorModeValue('white', 'gray.700')}
                      placeholder="أدخل رقم الموظف أو admin"
                      autoComplete="username"
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">كلمة المرور</FormLabel>
                  <InputGroup size="md">
                    <InputLeftElement pointerEvents="none">
                      <FaLock color="gray" />
                    </InputLeftElement>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="أدخل كلمة المرور"
                      value={formData.password}
                      onChange={handleChange}
                      name="password"
                      dir="ltr"
                      borderRadius="md"
                      focusBorderColor={primaryColor}
                      bg={useColorModeValue('white', 'gray.700')}
                    />
                    <InputRightElement>
                      <Tooltip label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>
                        <IconButton
                          aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                          icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                          size="sm"
                        />
                      </Tooltip>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Flex justify="space-between" align="center">
                  <Checkbox
                    colorScheme="blue"
                    isChecked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  >
                    <Text fontSize="sm">تذكرني</Text>
                  </Checkbox>
                  <Button
                    variant="link"
                    colorScheme="blue"
                    size="sm"
                    onClick={handleForgotPassword}
                  >
                    نسيت كلمة المرور؟
                  </Button>
                </Flex>

                <AlsaadButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  loadingText="جاري تسجيل الدخول..."
                  leftIcon={<FaSignInAlt />}
                  showLogo={true}
                  logoPosition="right"
                  w="100%"
                >
                  تسجيل الدخول
                </AlsaadButton>
              </VStack>
            </form>

            <Text fontSize="xs" color="gray.500" textAlign="center">
              {new Date().getFullYear()} نظام السعد للسياحة والسفر. جميع الحقوق محفوظة.
            </Text>
          </VStack>
        </Box>
      </Container>

      {/* نافذة منبثقة لإعادة تعيين كلمة المرور */}
      <Modal isOpen={isOpen} onClose={handleCloseResetModal} isCentered dir="rtl">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader color={primaryColor}>إعادة تعيين كلمة المرور</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {resetSuccess ? (
              <Alert status="success" variant="left-accent" borderRadius="md" mb={4}>
                <AlertIcon />
                <Box>
                  <AlertTitle>تم إرسال رابط إعادة التعيين!</AlertTitle>
                  <AlertDescription>
                    تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك واتباع التعليمات.
                  </AlertDescription>
                </Box>
              </Alert>
            ) : (
              <>
                <Text mb={4}>
                  أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور الخاصة بك.
                </Text>
                {resetError && (
                  <Alert status="error" variant="left-accent" borderRadius="md" mb={4}>
                    <AlertIcon />
                    <Box>
                      <AlertTitle>خطأ!</AlertTitle>
                      <AlertDescription>{resetError}</AlertDescription>
                    </Box>
                  </Alert>
                )}
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">البريد الإلكتروني</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FaEnvelope color="gray" />
                    </InputLeftElement>
                    <Input
                      type="email"
                      placeholder="أدخل بريدك الإلكتروني"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      dir="ltr"
                      borderRadius="md"
                      focusBorderColor={primaryColor}
                    />
                  </InputGroup>
                </FormControl>
              </>
            )}
          </ModalBody>

          <ModalFooter>
            {resetSuccess ? (
              <Button colorScheme="blue" mr={3} onClick={handleCloseResetModal}>
                إغلاق
              </Button>
            ) : (
              <>
                <Button colorScheme="blue" mr={3} onClick={handleResetPassword} isLoading={isResetting} leftIcon={<FaKey />}>
                  إرسال رابط إعادة التعيين
                </Button>
                <Button variant="ghost" onClick={handleCloseResetModal}>
                  إلغاء
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
