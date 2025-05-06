import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Flex, Text, VStack, Icon, Tooltip, Divider } from '@chakra-ui/react';
import { 
  FiHome, 
  FiUsers, 
  FiCalendar, 
  FiPlane, 
  FiCreditCard, 
  FiFileText, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiChevronDown, 
  FiChevronUp, 
  FiHotel, 
  FiTruck, 
  FiBarChart2, 
  FiUserPlus,
  FiGlobe,
  FiStar,
  FiLayers,
  FiShield,
  FiHelpCircle,
  FiDatabase
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

// قائمة عناصر التنقل
const navItems = [
  { name: 'الرئيسية', icon: FiHome, path: '/dashboard', permission: 'dashboard' },
  { name: 'العملاء', icon: FiUsers, path: '/customers', permission: 'customers' },
  { 
    name: 'حجوزات الطيران', 
    icon: FiPlane, 
    path: '/flights', 
    permission: 'flights',
    subItems: [
      { name: 'الحجوزات الجديدة', path: '/flight-bookings' },
      { name: 'سجل الحجوزات', path: '/flight-bookings/history' }
    ]
  },
  { 
    name: 'حجوزات الفنادق', 
    icon: FiHotel, 
    path: '/hotels', 
    permission: 'hotels',
    subItems: [
      { name: 'الحجوزات الجديدة', path: '/hotel-bookings' },
      { name: 'سجل الحجوزات', path: '/hotel-bookings/history' }
    ]
  },
  { 
    name: 'التأشيرات', 
    icon: FiGlobe, 
    path: '/visas', 
    permission: 'visas',
    subItems: [
      { name: 'حجوزات التأشيرات', path: '/visa-bookings' },
      { name: 'سجل الحجوزات', path: '/visa-bookings/history' },
      { name: 'طلبات التأشيرات', path: '/visa-applications' },
      { name: 'تقارير التأشيرات', path: '/visa-bookings/reports' }
    ]
  },
  { 
    name: 'البرامج السياحية', 
    icon: FiStar, 
    path: '/tours', 
    permission: 'tours',
    subItems: [
      { name: 'إدارة البرامج', path: '/tour-packages' },
      { name: 'تقارير البرامج', path: '/tour-packages/reports' },
      { name: 'عرض البرامج للعملاء', path: '/tour-packages/public' },
      { name: 'حجوزات البرامج', path: '/tour-bookings' },
      { name: 'تقارير الحجوزات', path: '/tour-bookings/reports' },
    ]
  },
  { name: 'المدفوعات', icon: FiCreditCard, path: '/payments', permission: 'payments' },
  { name: 'التقارير', icon: FiBarChart2, path: '/reports', permission: 'reports' },
  { name: 'المستخدمين', icon: FiUsers, path: '/users', permission: 'users' },
  { name: 'المستندات', icon: FiLayers, path: '/documents', permission: 'documents' },
  { 
    name: 'الإعدادات', 
    icon: FiSettings, 
    path: '/settings', 
    permission: 'settings',
    subItems: [
      { name: 'نقل البيانات', path: '/data-migration' },
    ]
  },
];

// قائمة عناصر التنقل السفلية
const bottomNavItems = [
  { name: 'المساعدة', icon: FiHelpCircle, path: '/help' },
  { name: 'الأمان', icon: FiShield, path: '/security' },
];

/**
 * مكون الشريط الجانبي
 * @param {Object} props - خصائص المكون
 * @param {Function} props.onClose - دالة إغلاق الشريط الجانبي (للشاشات الصغيرة)
 * @param {string} props.currentPath - المسار الحالي
 */
const Sidebar = ({ onClose, currentPath, ...rest }) => {
  const { user, canAccessSection } = useAuth();
  
  return (
    <Box
      bg={useColorModeValue('white', 'gray.900')}
      borderLeft="1px"
      borderLeftColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      {/* رأس الشريط الجانبي */}
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontWeight="bold">
          وكالة السفر
        </Text>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>

      {/* معلومات المستخدم */}
      <Box px="4" py="2" mb="4">
        <Text fontSize="sm" fontWeight="medium" color="gray.500">
          مرحباً،
        </Text>
        <Text fontSize="md" fontWeight="bold">
          {user?.name || 'المستخدم'}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {user?.role || 'موظف'}
        </Text>
      </Box>

      <Divider mb="4" />

      {/* قائمة عناصر التنقل */}
      <VStack spacing="1" align="stretch" px="4">
        {navItems.map((item) => {
          // التحقق من صلاحية الوصول للقسم
          if (item.permission && !canAccessSection(item.permission)) {
            return null;
          }

          // التحقق من المسار الحالي
          const isActive = currentPath === item.path || 
                          (item.subItems && item.subItems.some(subItem => currentPath === subItem.path));
          
          // إذا كان للعنصر قائمة فرعية
          if (item.subItems) {
            return (
              <Box key={item.name}>
                <Flex
                  align="center"
                  p="3"
                  mx="1"
                  borderRadius="lg"
                  role="group"
                  cursor="pointer"
                  bg={isActive ? 'blue.400' : 'transparent'}
                  color={isActive ? 'white' : 'inherit'}
                  _hover={{
                    bg: isActive ? 'blue.500' : useColorModeValue('gray.100', 'gray.700'),
                  }}
                  fontWeight={isActive ? 'bold' : 'normal'}
                >
                  <Icon
                    mr="3"
                    fontSize="16"
                    as={item.icon}
                  />
                  <Text fontSize="sm">{item.name}</Text>
                </Flex>
                
                {/* القائمة الفرعية */}
                <VStack align="stretch" pl="10" mt="1" spacing="1">
                  {item.subItems.map(subItem => {
                    const isSubActive = currentPath === subItem.path;
                    
                    return (
                      <Link
                        key={subItem.name}
                        as={Link}
                        to={subItem.path}
                        style={{ textDecoration: 'none' }}
                        _focus={{ boxShadow: 'none' }}
                      >
                        <Flex
                          align="center"
                          p="2"
                          borderRadius="md"
                          role="group"
                          cursor="pointer"
                          bg={isSubActive ? 'blue.300' : 'transparent'}
                          color={isSubActive ? 'white' : 'inherit'}
                          _hover={{
                            bg: isSubActive ? 'blue.400' : useColorModeValue('gray.100', 'gray.700'),
                          }}
                          fontWeight={isSubActive ? 'bold' : 'normal'}
                        >
                          <Text fontSize="xs">{subItem.name}</Text>
                        </Flex>
                      </Link>
                    );
                  })}
                </VStack>
              </Box>
            );
          }
          
          return (
            <Tooltip key={item.name} label={item.name} placement="left" hasArrow>
              <Link
                as={Link}
                to={item.path}
                style={{ textDecoration: 'none' }}
                _focus={{ boxShadow: 'none' }}
              >
                <Flex
                  align="center"
                  p="3"
                  mx="1"
                  borderRadius="lg"
                  role="group"
                  cursor="pointer"
                  bg={isActive ? 'blue.400' : 'transparent'}
                  color={isActive ? 'white' : 'inherit'}
                  _hover={{
                    bg: isActive ? 'blue.500' : useColorModeValue('gray.100', 'gray.700'),
                  }}
                  fontWeight={isActive ? 'bold' : 'normal'}
                >
                  <Icon
                    mr="3"
                    fontSize="16"
                    as={item.icon}
                  />
                  <Text fontSize="sm">{item.name}</Text>
                </Flex>
              </Link>
            </Tooltip>
          );
        })}
      </VStack>

      <Box position="absolute" bottom="0" w="full" pb="4">
        <Divider mb="4" />
        <VStack spacing="1" align="stretch" px="4">
          {bottomNavItems.map((item) => (
            <Tooltip key={item.name} label={item.name} placement="left" hasArrow>
              <Link
                as={Link}
                to={item.path}
                style={{ textDecoration: 'none' }}
                _focus={{ boxShadow: 'none' }}
              >
                <Flex
                  align="center"
                  p="3"
                  mx="1"
                  borderRadius="lg"
                  role="group"
                  cursor="pointer"
                  _hover={{
                    bg: useColorModeValue('gray.100', 'gray.700'),
                  }}
                >
                  <Icon
                    mr="3"
                    fontSize="16"
                    as={item.icon}
                  />
                  <Text fontSize="sm">{item.name}</Text>
                </Flex>
              </Link>
            </Tooltip>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};

export default Sidebar;
