import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import {
  FaUsers, FaPlane, FaHotel, FaCar, FaCalendarAlt, FaHistory,
  FaGlobe, FaStar, FaPassport, FaFileInvoiceDollar, FaChartBar,
  FaMoneyBillWave, FaReceipt, FaUserTie, FaCog, FaDatabase, FaBell, FaBook, FaCheckCircle, FaUserCircle
} from 'react-icons/fa';
import {
  Box, Flex, VStack, HStack, Text, Icon, useColorModeValue, Heading, Divider, Tooltip, Fade, ScaleFade, SimpleGrid, Button
} from '@chakra-ui/react';

const sections = [
  { key: 'customers', label: 'العملاء', icon: FaUsers, color: 'teal.500' },
  { key: 'flight_bookings', label: 'حجوزات الطيران', icon: FaPlane, color: 'blue.500' },
  { key: 'hotel_bookings', label: 'حجوزات الفنادق', icon: FaHotel, color: 'purple.500' },
  { key: 'vehicle_bookings', label: 'حجوزات السيارات', icon: FaCar, color: 'orange.400' },
  { key: 'tour_packages', label: 'البرامج السياحية', icon: FaGlobe, color: 'cyan.500' },
  { key: 'event_bookings', label: 'حجوزات الفعاليات', icon: FaStar, color: 'yellow.500' },
  { key: 'visa_applications', label: 'طلبات التأشيرات', icon: FaPassport, color: 'pink.500' },
  { key: 'invoices', label: 'الفواتير', icon: FaFileInvoiceDollar, color: 'green.500' },
  { key: 'revenues', label: 'الإيرادات', icon: FaMoneyBillWave, color: 'green.400' },
  { key: 'expenses', label: 'المصروفات', icon: FaChartBar, color: 'red.400' },
  { key: 'receipts', label: 'سندات القبض', icon: FaReceipt, color: 'blue.400' },
  { key: 'users', label: 'المستخدمين', icon: FaUserTie, color: 'purple.600' },
  { key: 'settings', label: 'الإعدادات', icon: FaCog, color: 'gray.500' },
  { key: 'data_migration', label: 'نقل البيانات', icon: FaDatabase, color: 'teal.700' },
  { key: 'notifications', label: 'الإشعارات', icon: FaBell, color: 'orange.500' },
  { key: 'system_logs', label: 'سجلات النظام', icon: FaBook, color: 'alsaad.600' },
  { key: 'system_checker', label: 'فحص النظام', icon: FaCheckCircle, color: 'green.600' },
];

// دالة تعيد مسار كل قسم بناءً على المفتاح
const getSectionRoute = (key) => {
  switch (key) {
    case 'customers': return '/customers';
    case 'flight_bookings': return '/flight-bookings';
    case 'hotel_bookings': return '/hotel-bookings';
    case 'vehicle_bookings': return '/vehicle-bookings';
    case 'tour_packages': return '/tour-packages';
    case 'event_bookings': return '/event-bookings';
    case 'visa_applications': return '/visa-applications';
    case 'invoices': return '/invoices';
    case 'revenues': return '/revenues';
    case 'expenses': return '/expenses';
    case 'receipts': return '/receipts';
    case 'users': return '/users';
    case 'settings': return '/settings';
    case 'data_migration': return '/data-migration';
    case 'notifications': return '/notifications';
    case 'system_logs': return '/system-logs';
    case 'system_checker': return '/system-checker';
    default: return '/';
  }
};

export default function MainMenuRedesigned() {
  const navigate = useNavigate();
  const today = format(new Date(), 'EEEE, d MMMM yyyy', { locale: undefined });

  // وصف مختصر لكل قسم
  const sectionDescriptions = {
    customers: 'إدارة بيانات العملاء والتواصل معهم',
    flight_bookings: 'حجز وإدارة تذاكر الطيران',
    hotel_bookings: 'حجز وتنظيم الإقامة في الفنادق',
    vehicle_bookings: 'إدارة حجوزات السيارات والتنقل',
    tour_packages: 'تصميم وبيع البرامج السياحية',
    event_bookings: 'تنظيم وحجز الفعاليات والرحلات',
    visa_applications: 'تقديم ومتابعة طلبات التأشيرات',
    invoices: 'إصدار الفواتير ومتابعتها',
    revenues: 'عرض الإيرادات المالية',
    expenses: 'تسجيل ومتابعة المصروفات',
    receipts: 'إدارة سندات القبض',
    users: 'إدارة المستخدمين والصلاحيات',
    settings: 'إعدادات النظام والتخصيص',
    data_migration: 'نقل واستيراد البيانات',
    notifications: 'مركز الإشعارات والتنبيهات',
    system_logs: 'سجلات النظام والأحداث',
    system_checker: 'فحص صحة النظام',
  };

  // دالة تعيد مسار كل قسم بناءً على المفتاح
  const getSectionRoute = (key) => {
    switch (key) {
      case 'customers': return '/customers';
      case 'flight_bookings': return '/flight-bookings';
      case 'hotel_bookings': return '/hotel-bookings';
      case 'vehicle_bookings': return '/vehicle-bookings';
      case 'tour_packages': return '/tour-packages';
      case 'event_bookings': return '/event-bookings';
      case 'visa_applications': return '/visa-applications';
      case 'invoices': return '/invoices';
      case 'revenues': return '/revenues';
      case 'expenses': return '/expenses';
      case 'receipts': return '/receipts';
      case 'users': return '/users';
      case 'settings': return '/settings';
      case 'data_migration': return '/data-migration';
      case 'notifications': return '/notifications';
      case 'system_logs': return '/system-logs';
      case 'system_checker': return '/system-checker';
      default: return '/';
    }
  };

  // AppBar احترافي
  const AppBar = () => (
    <Flex as="header" w="100%" px={{base:4, md:12}} py={3} align="center" justify="space-between" bg="white" boxShadow="sm" position="sticky" top={0} zIndex={99} borderBottom="1.5px solid #e3f0fa" dir="rtl">
      <HStack spacing={3}>
        <Box boxSize={12} bgGradient="linear(to-br, #38bdf8, #0ea5e9)" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" boxShadow="lg">
          <Icon as={FaPlane} boxSize={8} color="white" />
        </Box>
        <Heading size="lg" color="sky.700" fontWeight="bold" letterSpacing="wide">السعد للسياحة والسفر</Heading>
      </HStack>
      <HStack spacing={5}>
        <Icon as={FaBell} boxSize={7} color="sky.500" cursor="pointer" _hover={{color:'blue.400'}} title="الإشعارات" />
        <Icon as={FaUserCircle} boxSize={8} color="gray.400" cursor="pointer" _hover={{color:'sky.500'}} title="الملف الشخصي" />
      </HStack>
    </Flex>
  );

  // رأس ترحيبي ولوحة ملخص
  const DashboardHeader = () => (
    <Box w="100%" py={6} px={{base:4, md:12}} bgGradient="linear(to-r, #e0f2fe, #f8fafc)" borderRadius="2xl" mb={6} dir="rtl">
      <Heading size="lg" color="sky.700" mb={2} fontWeight="bold">مرحباً بك في نظام السعد للسياحة والسفر</Heading>
      <Text color="gray.600" fontSize="lg" mb={1}>اليوم: {today}</Text>
      <HStack spacing={8} mt={2}>
        <Text color="sky.700" fontWeight="semibold">عدد المهام المعلقة: <b>3</b></Text>
        <Text color="blue.700" fontWeight="semibold">حجوزات بانتظار التأكيد: <b>5</b></Text>
      </HStack>
    </Box>
  );

  // شبكة جميع الأقسام
  const SectionsGrid = () => (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6} w="100%" dir="rtl">
      {sections.map(section => (
        <Box
          key={section.key}
          bg="white"
          borderRadius="2xl"
          boxShadow="md"
          p={6}
          display="flex"
          flexDirection="column"
          alignItems="center"
          transition="transform 0.18s, box-shadow 0.18s"
          _hover={{ boxShadow: 'xl', transform: 'translateY(-4px) scale(1.03)', cursor: 'pointer', bg: 'blue.50' }}
          onClick={() => navigate(getSectionRoute(section.key))}
        >
          <Box w={16} h={16} display="flex" alignItems="center" justifyContent="center" borderRadius="full" bgGradient={`linear(to-br, #38bdf8, #0ea5e9)`} mb={4} boxShadow="lg">
            <Icon as={section.icon} boxSize={9} color="white" />
          </Box>
          <Text fontSize="xl" fontWeight="bold" color={section.color} mb={2}>{section.label}</Text>
          <Text color="gray.600" fontSize="md" textAlign="center" minH="48px">{sectionDescriptions[section.key]}</Text>
        </Box>
      ))}
    </SimpleGrid>
  );

  // واجهة الشاشة الرئيسية
  return (
    <Box minH="100vh" bgGradient="linear(to-b, #f0f9ff 0%, #e0f2fe 100%)" w="100%" dir="rtl" pb={10}>
      <AppBar />
      <Box maxW="1400px" mx="auto" mt={4}>
        <DashboardHeader />
        <SectionsGrid />
      </Box>
    </Box>
  );
}
