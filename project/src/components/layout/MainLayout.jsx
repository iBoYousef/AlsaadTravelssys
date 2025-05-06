import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  useDisclosure,
  useColorModeValue,
  useColorMode,
  IconButton,
  HStack,
  VStack,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  Tooltip,
  Image
} from '@chakra-ui/react';
import {
  FiMenu,
  FiUser,
  FiBell,
  FiSettings,
  FiLogOut,
  FiMoon,
  FiSun
} from 'react-icons/fi';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/api';
import AlsaadButton from '../shared/AlsaadButton';

/**
 * القالب الرئيسي للتطبيق
 * يتضمن الشريط الجانبي وشريط التنقل العلوي ومنطقة المحتوى
 */
const MainLayout = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // ألوان حسب وضع الألوان
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // جلب عدد الإشعارات غير المقروءة
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user?.id) {
        try {
          const count = await notificationService.getUnreadCount(
            user.id,
            'employee'
          );
          setUnreadCount(count);
        } catch (error) {
          console.error('خطأ في جلب عدد الإشعارات غير المقروءة:', error);
        }
      }
    };

    fetchUnreadCount();
    // تحديث عدد الإشعارات كل دقيقة
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // تسجيل الخروج
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  // التنقل إلى صفحة الإشعارات
  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  // التنقل إلى صفحة الملف الشخصي
  const handleProfileClick = () => {
    navigate('/profile');
  };

  // التنقل إلى صفحة الإعدادات
  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.800')}>
      {/* الشريط الجانبي للشاشات الكبيرة */}
      <Sidebar
        onClose={onClose}
        display={{ base: 'none', md: 'block' }}
        position="fixed"
        currentPath={location.pathname}
      />

      {/* الشريط الجانبي للشاشات الصغيرة (درج) */}
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="xs"
      >
        <DrawerOverlay />
        <DrawerContent>
          <Sidebar onClose={onClose} currentPath={location.pathname} />
        </DrawerContent>
      </Drawer>

      {/* منطقة المحتوى الرئيسية */}
      <Box mr={{ base: 0, md: 60 }} transition=".3s ease">
        {/* شريط التنقل العلوي */}
        <Flex
          as="header"
          align="center"
          justify="space-between"
          w="full"
          px="4"
          h="16"
          bg={bgColor}
          borderBottomWidth="1px"
          borderColor={borderColor}
          boxShadow="sm"
          position="sticky"
          top="0"
          zIndex="1"
        >
          {/* زر القائمة للشاشات الصغيرة */}
          <AlsaadButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onOpen}
            variant="ghost"
            aria-label="فتح القائمة"
            leftIcon={<FiMenu />}
            size="sm"
          />

          {/* الشعار أو اسم التطبيق */}
          <Flex align="center" display={{ base: 'none', md: 'flex' }}>
            <Image 
              src="/images/logo-ar.svg" 
              alt="السعد للسياحة والسفر" 
              height="40px" 
              marginLeft="2"
            />
            <Text
              fontSize="xl"
              fontWeight="bold"
            >
              نظام السعد للسياحة والسفر
            </Text>
          </Flex>

          {/* أزرار وقائمة المستخدم */}
          <HStack spacing="4">
            {/* زر تبديل وضع الألوان */}
            <Tooltip label={colorMode === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}>
              <AlsaadButton
                aria-label="تبديل وضع الألوان"
                leftIcon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
                onClick={toggleColorMode}
                variant="ghost"
                size="sm"
              />
            </Tooltip>

            {/* زر الإشعارات */}
            <Tooltip label="الإشعارات">
              <Box position="relative">
                <AlsaadButton
                  aria-label="الإشعارات"
                  leftIcon={<FiBell />}
                  onClick={handleNotificationsClick}
                  variant="ghost"
                  size="sm"
                />
                {unreadCount > 0 && (
                  <Badge
                    colorScheme="red"
                    position="absolute"
                    top="-2px"
                    right="-2px"
                    borderRadius="full"
                    fontSize="xs"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Box>
            </Tooltip>

            {/* قائمة المستخدم */}
            <Menu>
              <MenuButton
                as={AlsaadButton}
                aria-label="خيارات المستخدم"
                leftIcon={<FiUser />}
                variant="ghost"
                size="sm"
              />
              <MenuList>
                <VStack align="start" px="3" py="2" mb="2">
                  <Text fontWeight="bold">
                    {user?.name || 'المستخدم'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {user?.email || 'user@example.com'}
                  </Text>
                </VStack>
                <MenuDivider />
                <MenuItem icon={<FiUser />} onClick={handleProfileClick}>
                  الملف الشخصي
                </MenuItem>
                <MenuItem icon={<FiSettings />} onClick={handleSettingsClick}>
                  الإعدادات
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                  تسجيل الخروج
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        {/* منطقة المحتوى */}
        <Box as="main" p="4">
          <Outlet />
        </Box>

        {/* تذييل الصفحة */}
        <Flex 
          as="footer" 
          justify="center" 
          align="center" 
          p={4} 
          borderTop="1px solid" 
          borderColor={borderColor}
          bg={bgColor}
          direction={{ base: "column", md: "row" }}
          spacing={4}
          mt="auto"
        >
          <Image 
            src="/images/logo-en.svg" 
            alt="Alsaad Travel & Tourism" 
            height="30px" 
            marginX={2}
          />
          <Text fontSize="sm" color="gray.500">
            {new Date().getFullYear()} السعد للسياحة والسفر. جميع الحقوق محفوظة
          </Text>
        </Flex>
      </Box>
    </Box>
  );
};

export default MainLayout;
