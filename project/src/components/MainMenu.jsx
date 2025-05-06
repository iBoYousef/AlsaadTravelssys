import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaPlane, FaHotel, FaUsers, FaCog, FaCalendarAlt, 
  FaCar, FaPassport, FaFileInvoiceDollar, FaChartBar,
  FaUserTie, FaDatabase, FaStar, FaBell, FaGlobe, FaBook,
  FaMoneyBillWave, FaReceipt, FaCogs, FaUsersCog, FaHistory,
  FaCheckCircle
} from 'react-icons/fa';
import { Grid, Box, Flex, Spinner, Text, useColorModeValue, Heading, Container } from '@chakra-ui/react';
import AlsaadMenuCard from './shared/AlsaadMenuCard';
// import CreateTestUserButton from "./dev/CreateTestUserButton"; // ملف غير موجود - تم التعليق لمنع الخطأ

import MainMenuRedesigned from './MainMenuRedesigned';
const MainMenu = () => {
  return <MainMenuRedesigned />;

  const { user, canAccessSection } = useAuth();
  const [loading, setLoading] = useState(true);
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    if (user) {
      console.log('MainMenu: تم تحميل بيانات المستخدم:', { 
        uid: user.uid,
        role: user.role,
        isAdmin: user.isAdmin,
        permissions: user.permissions 
      });
      setLoading(false);
    } else {
      console.log('MainMenu: في انتظار بيانات المستخدم...');
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const safeCanAccessSection = (section) => {
    if (!user) {
      console.log('MainMenu: لا يوجد مستخدم مسجل الدخول');
      return false;
    }
    
    // التحقق من صلاحيات المسؤول أولاً
    if (user.isAdmin || user.role === 'admin' || user.jobTitle === 'مسؤول النظام') {
      console.log('MainMenu: المستخدم مسؤول، السماح بالوصول إلى القسم:', section);
      return true;
    }

    // قائمة أقسام المحاسبة
    const accountingSections = ['accounting', 'revenues', 'expenses', 'invoices', 'receipts', 'financial_reports'];
    
    // إذا كان القسم المطلوب هو أحد أقسام المحاسبة، نتحقق من صلاحية الوصول إلى قسم المحاسبة
    if (accountingSections.includes(section)) {
      try {
        if (typeof user.checkPermission === 'function' && 
            (user.checkPermission('accounting.view') || user.checkPermission('accounting'))) {
          console.log('MainMenu: المستخدم لديه صلاحية الوصول إلى قسم المحاسبة، السماح بالوصول إلى القسم:', section);
          return true;
        }
        
        if (typeof canAccessSection === 'function' && 
            (canAccessSection('accounting'))) {
          console.log('MainMenu: المستخدم لديه صلاحية الوصول إلى قسم المحاسبة، السماح بالوصول إلى القسم:', section);
          return true;
        }
      } catch (error) {
        console.error('MainMenu: خطأ في التحقق من صلاحيات الوصول إلى قسم المحاسبة:', error);
      }
    }

    try {
      const hasAccess = canAccessSection(section);
      console.log('MainMenu: نتيجة التحقق من الصلاحيات للقسم:', { section, hasAccess });
      return hasAccess;
    } catch (error) {
      console.error('MainMenu: خطأ في التحقق من صلاحيات الوصول:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" minH="100vh" bg={bgColor}>
        <Spinner size="xl" color="alsaad.500" thickness="4px" />
        <Text mr={4} fontSize="xl" color={textColor}>جاري تحميل القائمة...</Text>
      </Flex>
    );
  }

  const allMenuItems = [
    // إدارة العملاء
    {
      to: '/customers',
      icon: FaUsers,
      title: 'العملاء',
      description: 'إدارة بيانات العملاء والمرافقين',
      colorScheme: 'teal',
      section: 'customers'
    },
    // المحاسبة
    {
      to: '/revenues',
      icon: FaMoneyBillWave,
      title: 'الإيرادات',
      description: 'عرض وإدارة الإيرادات المالية',
      colorScheme: 'green',
      section: 'accounting'
    },
    {
      to: '/expenses',
      icon: FaChartBar,
      title: 'المصروفات',
      description: 'عرض وإدارة المصروفات المالية',
      colorScheme: 'red',
      section: 'accounting'
    },
    {
      to: '/invoices',
      icon: FaFileInvoiceDollar,
      title: 'الفواتير',
      description: 'إدارة الفواتير المالية',
      colorScheme: 'purple',
      section: 'accounting'
    },
    {
      to: '/receipts',
      icon: FaReceipt,
      title: 'سندات القبض',
      description: 'تسجيل ومتابعة سندات القبض',
      colorScheme: 'blue',
      section: 'accounting'
    },
    {
      to: '/companions',
      icon: FaUsers,
      title: 'المرافقين',
      description: 'إدارة بيانات المرافقين',
      colorScheme: 'cyan',
      section: 'companions'
    },
    // الحجوزات
    {
      to: '/flight-bookings',
      icon: FaPlane,
      title: 'حجوزات الطيران',
      description: 'إدارة حجوزات تذاكر الطيران',
      colorScheme: 'blue',
      section: 'flight_bookings'
    },
    {
      to: '/flight-bookings/history',
      icon: FaHistory,
      title: 'سجلات حجوزات الطيران',
      description: 'عرض سجلات وتاريخ حجوزات الطيران',
      colorScheme: 'blue',
      section: 'flight_bookings'
    },
    {
      to: '/hotel-bookings',
      icon: FaHotel,
      title: 'حجوزات الفنادق',
      description: 'إدارة حجوزات الفنادق والإقامة',
      colorScheme: 'teal',
      section: 'hotel_bookings'
    },
    {
      to: '/hotel-bookings/history',
      icon: FaHistory,
      title: 'سجلات حجوزات الفنادق',
      description: 'عرض سجلات وتاريخ حجوزات الفنادق',
      colorScheme: 'teal',
      section: 'hotel_bookings'
    },
    {
      to: '/vehicle-bookings',
      icon: FaCar,
      title: 'حجوزات السيارات',
      description: 'إدارة حجوزات تأجير السيارات',
      colorScheme: 'green',
      section: 'vehicle_bookings'
    },
    {
      to: '/vehicle-bookings/history',
      icon: FaHistory,
      title: 'سجلات حجوزات السيارات',
      description: 'عرض سجلات وتاريخ حجوزات السيارات',
      colorScheme: 'green',
      section: 'vehicle_bookings'
    },
    {
      to: '/tour-packages',
      icon: FaGlobe,
      title: 'البرامج السياحية',
      description: 'إدارة البرامج والعروض السياحية',
      colorScheme: 'purple',
      section: 'tour_packages'
    },
    {
      to: '/tour-bookings',
      icon: FaCalendarAlt,
      title: 'حجوزات البرامج السياحية',
      description: 'إدارة حجوزات البرامج السياحية',
      colorScheme: 'purple',
      section: 'tour_bookings'
    },
    {
      to: '/tour-bookings/history',
      icon: FaHistory,
      title: 'سجلات البرامج السياحية',
      description: 'عرض سجلات وتاريخ حجوزات البرامج السياحية',
      colorScheme: 'purple',
      section: 'tour_bookings'
    },
    {
      to: '/event-bookings',
      icon: FaStar,
      title: 'حجوزات الفعاليات',
      description: 'إدارة حجوزات الفعاليات والمناسبات',
      colorScheme: 'orange',
      section: 'event_bookings'
    },
    {
      to: '/event-bookings/history',
      icon: FaHistory,
      title: 'سجلات حجوزات الفعاليات',
      description: 'عرض سجلات وتاريخ حجوزات الفعاليات',
      colorScheme: 'orange',
      section: 'event_bookings'
    },
    {
      to: '/visa-applications',
      icon: FaPassport,
      title: 'طلبات التأشيرات',
      description: 'إدارة طلبات التأشيرات ومتابعتها',
      colorScheme: 'alsaad',
      section: 'visa_applications'
    },
    {
      to: '/visa-applications/history',
      icon: FaHistory,
      title: 'سجلات طلبات التأشيرات',
      description: 'عرض سجلات وتاريخ طلبات التأشيرات',
      colorScheme: 'alsaad',
      section: 'visa_applications'
    },
    // المالية
    {
      to: '/invoices',
      icon: FaFileInvoiceDollar,
      title: 'الفواتير',
      description: 'إدارة الفواتير وعرضها وطباعتها',
      colorScheme: 'green',
      section: 'invoices'
    },
    {
      to: '/invoices/history',
      icon: FaHistory,
      title: 'سجلات الفواتير',
      description: 'عرض سجلات وتاريخ الفواتير',
      colorScheme: 'green',
      section: 'invoices'
    },
    {
      to: '/receipts',
      icon: FaReceipt,
      title: 'سندات القبض',
      description: 'إدارة سندات القبض والمدفوعات',
      colorScheme: 'green',
      section: 'receipts'
    },
    {
      to: '/receipts/history',
      icon: FaHistory,
      title: 'سجلات سندات القبض',
      description: 'عرض سجلات وتاريخ سندات القبض',
      colorScheme: 'green',
      section: 'receipts'
    },
    {
      to: '/expenses',
      icon: FaMoneyBillWave,
      title: 'المصروفات',
      description: 'إدارة مصروفات الشركة',
      colorScheme: 'orange',
      section: 'expenses'
    },
    {
      to: '/expenses/history',
      icon: FaHistory,
      title: 'سجلات المصروفات',
      description: 'عرض سجلات وتاريخ المصروفات',
      colorScheme: 'orange',
      section: 'expenses'
    },
    {
      to: '/revenues',
      icon: FaChartBar,
      title: 'الإيرادات',
      description: 'تقارير وإحصائيات الإيرادات',
      colorScheme: 'blue',
      section: 'revenues'
    },
    // النظام
    {
      to: '/users',
      icon: FaUserTie,
      title: 'المستخدمين',
      description: 'إدارة مستخدمي النظام والصلاحيات',
      colorScheme: 'purple',
      section: 'users'
    },
    {
      to: '/settings',
      icon: FaCog,
      title: 'الإعدادات',
      description: 'إعدادات النظام والتكوين',
      colorScheme: 'alsaad',
      section: 'settings'
    },
    {
      to: '/data-migration',
      icon: FaDatabase,
      title: 'نقل البيانات',
      description: 'استيراد وتصدير بيانات النظام',
      colorScheme: 'teal',
      section: 'data_migration'
    },
    {
      to: '/notifications',
      icon: FaBell,
      title: 'الإشعارات',
      description: 'إدارة إشعارات النظام',
      colorScheme: 'orange',
      section: 'notifications'
    },
    {
      to: '/system-logs',
      icon: FaBook,
      title: 'سجلات النظام',
      description: 'عرض سجلات النظام والأحداث',
      colorScheme: 'alsaad',
      section: 'admin'
    },
    {
      to: '/system-checker',
      icon: FaCheckCircle,
      title: 'فحص النظام',
      description: 'التحقق من حالة وصلاحيات النظام',
      colorScheme: 'green',
      section: 'admin'
    },
    {
      to: '/data-seed',
      icon: FaDatabase,
      title: 'إدارة البيانات التجريبية',
      description: 'إضافة وحذف البيانات التجريبية للنظام',
      colorScheme: 'purple',
      section: 'admin'
    },
  ];

  // تصفية العناصر بناءً على صلاحيات المستخدم
  const filteredMenuItems = allMenuItems.filter(item => safeCanAccessSection(item.section));

  // تجميع العناصر حسب القسم
  const groupedItems = {
    customers: { title: 'إدارة العملاء', items: [] },
    bookings: { title: 'الحجوزات والسفر', items: [] },
    records: { title: 'السجلات والتاريخ', items: [] },
    finance: { title: 'المالية والمحاسبة', items: [] },
    system: { title: 'إدارة النظام', items: [] },
  };

  // تصنيف العناصر إلى مجموعات
  filteredMenuItems.forEach(item => {
    if (['customers', 'companions'].includes(item.section)) {
      groupedItems.customers.items.push(item);
    } else if (item.to.includes('/history') || item.title.includes('سجلات')) {
      groupedItems.records.items.push(item);
    } else if (['flight_bookings', 'hotel_bookings', 'vehicle_bookings', 'tour_packages', 'tour_bookings', 'event_bookings', 'visa_applications'].includes(item.section)) {
      groupedItems.bookings.items.push(item);
    } else if (['invoices', 'receipts', 'expenses', 'revenues'].includes(item.section)) {
      groupedItems.finance.items.push(item);
    } else {
      groupedItems.system.items.push(item);
    }
  });

  return (
    <Container maxW="6xl" py={8}>
      {/* تم إزالة زر إنشاء مستخدم تجريبي */}
      <Heading mb={8} color={textColor} textAlign="center" fontSize={{ base: '2xl', md: '3xl' }}>
        القائمة الرئيسية
      </Heading>

      {/* قسم المحاسبة الجديد */}
      <Box mb={10}>
        <Heading as="h2" size="lg" mb={4} color="alsaad.600">
          المحاسبة
        </Heading>
        <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }} gap={6}>
          <AlsaadMenuCard
            to="/accounting/journal-entries"
            icon={FaBook}
            title="القيود اليومية"
            description="إدخال القيود اليومية ومراجعتها"
            colorScheme="blue"
            section="accounting"
          />
          <AlsaadMenuCard
            to="/accounting/reports"
            icon={FaChartBar}
            title="التقارير المحاسبية"
            description="توليد تقارير الميزانية والحسابات"
            colorScheme="purple"
            section="accounting"
          />
        </Grid>
      </Box>
      {Object.entries(groupedItems).map(([key, group]) => (
        group.items.length > 0 && (
          <Box key={key} mb={10}>
            <Heading as="h2" size="lg" mb={4} color="alsaad.600">
              {group.title}
            </Heading>
            <Grid 
              templateColumns={{
                base: "repeat(1, 1fr)",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
                xl: "repeat(4, 1fr)"
              }}
              gap={6}
            >
              {group.items.map((item, index) => (
                <AlsaadMenuCard 
                  key={index} 
                  to={item.to} 
                  icon={item.icon} 
                  title={item.title} 
                  description={item.description} 
                  colorScheme={item.colorScheme}
                />
              ))}
            </Grid>
          </Box>
        )
      ))}
    </Container>
  );
};

export default MainMenu;