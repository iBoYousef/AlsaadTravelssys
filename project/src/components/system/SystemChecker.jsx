import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useActionLogger } from '../../hooks/useActionLogger';
import { toast } from 'react-toastify';
import { 
  Box, 
  VStack, 
  HStack, 
  Heading, 
  Text, 
  Button, 
  Badge, 
  Progress, 
  Divider,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Flex
} from '@chakra-ui/react';
import { 
  FaPlane, 
  FaHotel, 
  FaUsers, 
  FaCog, 
  FaCalendarAlt, 
  FaCar, 
  FaPassport, 
  FaFileInvoiceDollar, 
  FaChartBar,
  FaUserTie, 
  FaDatabase, 
  FaStar, 
  FaBell, 
  FaGlobe, 
  FaBook,
  FaMoneyBillWave, 
  FaReceipt, 
  FaCheck, 
  FaTimes
} from 'react-icons/fa';

const SystemChecker = () => {
  const navigate = useNavigate();
  const { user, canAccessSection, checkPermission } = useAuth();
  const { logAction, ACTION_TYPES, ACTION_CATEGORIES } = useActionLogger();
  const [checkResults, setCheckResults] = useState({});
  const [progress, setProgress] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [allChecksComplete, setAllChecksComplete] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // تعريف جميع الأقسام التي يجب فحصها
  const sectionsToCheck = [
    { 
      id: 'customers', 
      name: 'العملاء', 
      path: '/customers', 
      icon: FaUsers, 
      description: 'إدارة بيانات العملاء والمرافقين'
    },
    { 
      id: 'flight_bookings', 
      name: 'حجوزات الطيران', 
      path: '/flight-bookings', 
      icon: FaPlane, 
      description: 'إدارة حجوزات تذاكر الطيران'
    },
    { 
      id: 'hotel_bookings', 
      name: 'حجوزات الفنادق', 
      path: '/hotel-bookings', 
      icon: FaHotel, 
      description: 'إدارة حجوزات الفنادق والإقامة'
    },
    { 
      id: 'car_rentals', 
      name: 'تأجير السيارات', 
      path: '/car-rentals', 
      icon: FaCar, 
      description: 'إدارة حجوزات تأجير السيارات'
    },
    { 
      id: 'visa_applications', 
      name: 'طلبات التأشيرات', 
      path: '/visa-applications', 
      icon: FaPassport, 
      description: 'إدارة طلبات التأشيرات ومتابعتها'
    },
    { 
      id: 'tour_packages', 
      name: 'البرامج السياحية', 
      path: '/tour-packages', 
      icon: FaGlobe, 
      description: 'إدارة البرامج والعروض السياحية'
    },
    { 
      id: 'tour_bookings', 
      name: 'حجوزات البرامج السياحية', 
      path: '/tour-bookings', 
      icon: FaCalendarAlt, 
      description: 'إدارة حجوزات البرامج السياحية'
    },
    { 
      id: 'event_bookings', 
      name: 'حجوزات الفعاليات', 
      path: '/event-bookings', 
      icon: FaStar, 
      description: 'إدارة حجوزات الفعاليات والمناسبات'
    },
    { 
      id: 'invoices', 
      name: 'الفواتير', 
      path: '/invoices', 
      icon: FaFileInvoiceDollar, 
      description: 'إدارة الفواتير وعرضها وطباعتها'
    },
    { 
      id: 'receipts', 
      name: 'سندات القبض', 
      path: '/receipts', 
      icon: FaReceipt, 
      description: 'إدارة سندات القبض والمدفوعات'
    },
    { 
      id: 'expenses', 
      name: 'المصروفات', 
      path: '/expenses', 
      icon: FaMoneyBillWave, 
      description: 'إدارة مصروفات الشركة'
    },
    { 
      id: 'revenues', 
      name: 'الإيرادات', 
      path: '/revenues', 
      icon: FaChartBar, 
      description: 'تقارير وإحصائيات الإيرادات'
    },
    { 
      id: 'users', 
      name: 'المستخدمين', 
      path: '/users', 
      icon: FaUserTie, 
      description: 'إدارة مستخدمي النظام والصلاحيات'
    },
    { 
      id: 'settings', 
      name: 'الإعدادات', 
      path: '/settings', 
      icon: FaCog, 
      description: 'إعدادات النظام والتكوين'
    },
    { 
      id: 'data_migration', 
      name: 'نقل البيانات', 
      path: '/data-migration', 
      icon: FaDatabase, 
      description: 'استيراد وتصدير بيانات النظام'
    },
    { 
      id: 'notifications', 
      name: 'الإشعارات', 
      path: '/notifications', 
      icon: FaBell, 
      description: 'إدارة إشعارات النظام'
    },
    { 
      id: 'system_logs', 
      name: 'سجلات النظام', 
      path: '/system-logs', 
      icon: FaBook, 
      description: 'عرض سجلات النظام والأحداث'
    }
  ];

  // فحص صلاحيات المستخدم للوصول إلى قسم معين
  const checkUserPermission = (sectionId) => {
    if (!user) {
      return false;
    }
    
    // التحقق من صلاحيات المسؤول أولاً
    if (user.isAdmin || user.role === 'admin' || user.jobTitle === 'مسؤول النظام') {
      return true;
    }

    try {
      return canAccessSection(sectionId);
    } catch (error) {
      console.error('خطأ في التحقق من صلاحيات الوصول:', error);
      return false;
    }
  };

  // فحص إمكانية الوصول إلى مسار معين
  const checkRouteAccess = async (section) => {
    try {
      // هنا يمكن إضافة منطق للتحقق من إمكانية الوصول إلى المسار
      // مثلاً التحقق من وجود المكون أو الصفحة المطلوبة
      
      // للتبسيط، سنفترض أن المسار متاح إذا كان المستخدم لديه صلاحية الوصول
      const hasAccess = checkUserPermission(section.id);
      
      return {
        id: section.id,
        name: section.name,
        path: section.path,
        accessible: hasAccess,
        error: hasAccess ? null : 'لا توجد صلاحية للوصول'
      };
    } catch (error) {
      console.error(`خطأ في فحص المسار ${section.path}:`, error);
      return {
        id: section.id,
        name: section.name,
        path: section.path,
        accessible: false,
        error: error.message
      };
    }
  };

  // بدء عملية فحص النظام
  const startSystemCheck = async () => {
    setIsChecking(true);
    setAllChecksComplete(false);
    setCheckResults({});
    setProgress(0);
    
    logAction(ACTION_TYPES.INFO, 'بدء فحص النظام', ACTION_CATEGORIES.SYSTEM, {
      timestamp: new Date().toISOString(),
      user: user?.name || 'غير معروف'
    });

    const totalSections = sectionsToCheck.length;
    let completedChecks = 0;

    // فحص كل قسم على حدة
    for (const section of sectionsToCheck) {
      const result = await checkRouteAccess(section);
      
      setCheckResults(prev => ({
        ...prev,
        [section.id]: result
      }));
      
      completedChecks++;
      setProgress(Math.floor((completedChecks / totalSections) * 100));
      
      // تأخير قصير لإظهار تقدم الفحص بشكل أفضل
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsChecking(false);
    setAllChecksComplete(true);
    
    logAction(ACTION_TYPES.SUCCESS, 'اكتمال فحص النظام', ACTION_CATEGORIES.SYSTEM, {
      timestamp: new Date().toISOString(),
      user: user?.name || 'غير معروف',
      results: Object.values(checkResults).filter(r => !r.accessible).length
    });

    toast.success('تم اكتمال فحص النظام بنجاح');
  };

  // التنقل إلى قسم معين
  const navigateToSection = (path) => {
    navigate(path);
    toast.info(`جاري الانتقال إلى ${path}`);
  };

  useEffect(() => {
    // يمكن إضافة منطق هنا للتحقق من حالة النظام عند تحميل المكون
  }, []);

  return (
    <Box p={5}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl" textAlign="center" mb={4}>
          فحص نظام السعد للسياحة والسفر
        </Heading>
        
        <Box bg={bgColor} p={5} borderRadius="md" boxShadow="md" borderWidth="1px" borderColor={borderColor}>
          <VStack spacing={4} align="stretch">
            <Heading as="h2" size="md">
              حالة الفحص
            </Heading>
            
            <Progress value={progress} colorScheme="green" size="md" borderRadius="md" />
            
            <HStack justify="space-between">
              <Text>{progress}% مكتمل</Text>
              <Button 
                colorScheme="blue" 
                onClick={startSystemCheck} 
                isLoading={isChecking}
                loadingText="جاري الفحص..."
                disabled={isChecking}
              >
                بدء فحص النظام
              </Button>
            </HStack>
          </VStack>
        </Box>
        
        {allChecksComplete && (
          <Box bg={bgColor} p={5} borderRadius="md" boxShadow="md" borderWidth="1px" borderColor={borderColor}>
            <VStack spacing={4} align="stretch">
              <Heading as="h2" size="md">
                ملخص نتائج الفحص
              </Heading>
              
              <HStack>
                <Badge colorScheme="green" p={2} borderRadius="md">
                  {Object.values(checkResults).filter(r => r.accessible).length} أقسام متاحة
                </Badge>
                <Badge colorScheme="red" p={2} borderRadius="md">
                  {Object.values(checkResults).filter(r => !r.accessible).length} أقسام غير متاحة
                </Badge>
              </HStack>
              
              <Divider />
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {sectionsToCheck.map(section => {
                  const result = checkResults[section.id];
                  if (!result) return null;
                  
                  return (
                    <Box 
                      key={section.id}
                      p={4}
                      borderWidth="1px"
                      borderRadius="md"
                      borderColor={result.accessible ? 'green.200' : 'red.200'}
                      bg={result.accessible ? 'green.50' : 'red.50'}
                    >
                      <Flex justify="space-between" align="center">
                        <HStack>
                          <Icon as={section.icon} boxSize={6} color={result.accessible ? 'green.500' : 'red.500'} />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">{section.name}</Text>
                            <Text fontSize="sm" color="gray.600">{section.path}</Text>
                          </VStack>
                        </HStack>
                        
                        <HStack>
                          {result.accessible ? (
                            <Icon as={FaCheck} color="green.500" />
                          ) : (
                            <Icon as={FaTimes} color="red.500" />
                          )}
                          
                          {result.accessible && (
                            <Button 
                              size="sm" 
                              colorScheme="blue" 
                              onClick={() => navigateToSection(section.path)}
                            >
                              انتقال
                            </Button>
                          )}
                        </HStack>
                      </Flex>
                      
                      {result.error && (
                        <Text fontSize="sm" color="red.500" mt={2}>
                          {result.error}
                        </Text>
                      )}
                    </Box>
                  );
                })}
              </SimpleGrid>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default SystemChecker;
