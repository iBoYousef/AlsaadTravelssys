import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useToast,
  Spinner,
  Center,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  useBreakpointValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  SimpleGrid,
  Card,
  CardBody,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { FiPlus, FiDownload, FiMoreVertical, FiPrinter, FiRefreshCw, FiFilter, FiAlertCircle, FiCalendar, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { visaService, customerService } from '../services/api';
import VisaApplicationTable from '../components/visas/VisaApplicationTable';
import VisaApplicationForm from '../components/visas/VisaApplicationForm';
import AdvancedVisaForm from '../components/visas/AdvancedVisaForm';
import VisaApplicationFilters from '../components/visas/VisaApplicationFilters';
import BackButton from '../components/shared/BackButton';
import { formatDate } from '../utils/validationUtils';

/**
 * صفحة إدارة طلبات التأشيرات
 * تعرض قائمة طلبات التأشيرات وتتيح إضافة وتعديل وحذف الطلبات
 * تم تحديثها لتشمل النموذج المتقدم وإحصائيات إضافية
 */
const VisaApplications = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // حالة الطلبات
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // حالة البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    visaType: 'all',
    country: '',
    dateRange: 'all',
    startDate: '',
    endDate: '',
    isUrgent: false
  });
  
  // قائمة الدول المتاحة
  const [countries, setCountries] = useState([]);
  
  // إحصائيات التأشيرات
  const [visaStats, setVisaStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    urgent: 0,
    expiringThisMonth: 0
  });
  
  // حالة المودال
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isAdvancedFormOpen, onOpen: onAdvancedFormOpen, onClose: onAdvancedFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  // مرجع للطلب المراد حذفه
  const applicationToDeleteRef = useRef(null);
  
  // جلب طلبات التأشيرات
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await visaService.getAllVisaApplications();
      setApplications(data);
      setFilteredApplications(data);
      
      // استخراج قائمة الدول الفريقة من الطلبات
      const uniqueCountries = [...new Set(data.map(app => app.country))].filter(Boolean).sort();
      setCountries(uniqueCountries);
      
      // حساب الإحصائيات
      calculateVisaStats(data);
    } catch (error) {
      console.error('خطأ في جلب طلبات التأشيرات:', error);
      setError('حدث خطأ أثناء جلب طلبات التأشيرات. يرجى المحاولة مرة أخرى.');
      toast({
        title: 'خطأ في جلب البيانات',
        description: error.message || 'حدث خطأ غير معروف',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  // حساب إحصائيات التأشيرات
  const calculateVisaStats = useCallback((visaData) => {
    const stats = {
      total: visaData.length,
      pending: visaData.filter(app => app.status === 'pending').length,
      approved: visaData.filter(app => app.status === 'approved').length,
      rejected: visaData.filter(app => app.status === 'rejected').length,
      completed: visaData.filter(app => app.status === 'completed').length,
      urgent: visaData.filter(app => app.isUrgent).length,
      expiringThisMonth: 0
    };
    
    // حساب التأشيرات التي تنتهي هذا الشهر
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    stats.expiringThisMonth = visaData.filter(app => {
      if (!app.expiryDate) return false;
      
      const expiryDate = app.expiryDate.seconds 
        ? new Date(app.expiryDate.seconds * 1000) 
        : new Date(app.expiryDate);
      
      return expiryDate <= endOfMonth && expiryDate >= today;
    }).length;
    
    setVisaStats(stats);
  }, []);
  
  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);
  
  // تطبيق الفلاتر والبحث على الطلبات
  useEffect(() => {
    if (!applications.length) return;
    
    let result = [...applications];
    
    // تطبيق البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(app => 
        (app.customerName && app.customerName.toLowerCase().includes(searchLower)) ||
        (app.passportNumber && app.passportNumber.toLowerCase().includes(searchLower)) ||
        (app.country && app.country.toLowerCase().includes(searchLower))
      );
    }
    
    // تطبيق فلتر الحالة
    if (filters.status && filters.status !== 'all') {
      result = result.filter(app => app.status === filters.status);
    }
    
    // تطبيق فلتر نوع التأشيرة
    if (filters.visaType && filters.visaType !== 'all') {
      result = result.filter(app => app.visaType === filters.visaType);
    }
    
    // تطبيق فلتر الدولة
    if (filters.country) {
      result = result.filter(app => app.country === filters.country);
    }
    
    // تطبيق فلتر الطلبات العاجلة
    if (filters.isUrgent) {
      result = result.filter(app => app.isUrgent);
    }
    
    // تطبيق فلتر التاريخ
    if (filters.dateRange && filters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const getDateFromTimestamp = (timestamp) => {
        if (!timestamp) return null;
        return timestamp.seconds 
          ? new Date(timestamp.seconds * 1000) 
          : new Date(timestamp);
      };
      
      if (filters.dateRange === 'today') {
        result = result.filter(app => {
          const submissionDate = getDateFromTimestamp(app.submissionDate);
          if (!submissionDate) return false;
          
          submissionDate.setHours(0, 0, 0, 0);
          return submissionDate.getTime() === today.getTime();
        });
      } else if (filters.dateRange === 'week') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        result = result.filter(app => {
          const submissionDate = getDateFromTimestamp(app.submissionDate);
          if (!submissionDate) return false;
          
          submissionDate.setHours(0, 0, 0, 0);
          return submissionDate >= weekStart && submissionDate <= today;
        });
      } else if (filters.dateRange === 'month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        result = result.filter(app => {
          const submissionDate = getDateFromTimestamp(app.submissionDate);
          if (!submissionDate) return false;
          
          submissionDate.setHours(0, 0, 0, 0);
          return submissionDate >= monthStart && submissionDate <= today;
        });
      } else if (filters.dateRange === 'custom' && filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        let endDate;
        if (filters.endDate) {
          endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
        }
        
        result = result.filter(app => {
          const submissionDate = getDateFromTimestamp(app.submissionDate);
          if (!submissionDate) return false;
          
          return submissionDate >= startDate && submissionDate <= endDate;
        });
      }
    }
    
    setFilteredApplications(result);
  }, [applications, searchTerm, filters]);
  
  // فتح نموذج إضافة طلب جديد
  const handleAddApplication = () => {
    setSelectedApplication(null);
    onFormOpen();
  };
  
  // فتح نموذج إضافة طلب متقدم جديد
  const handleAddAdvancedApplication = () => {
    setSelectedApplication(null);
    onAdvancedFormOpen();
  };
  
  // فتح نموذج تعديل طلب موجود
  const handleEditApplication = (application) => {
    setSelectedApplication(application);
    
    // اختيار النموذج المناسب بناءً على تعقيد البيانات
    if (application.documents?.length > 0 || application.previousVisas?.length > 0) {
      onAdvancedFormOpen();
    } else {
      onFormOpen();
    }
  };
  
  // فتح مودال حذف طلب
  const handleDeleteClick = (application) => {
    applicationToDeleteRef.current = application;
    onDeleteOpen();
  };
  
  // حذف طلب
  const handleDeleteConfirm = async () => {
    if (!applicationToDeleteRef.current) return;
    
    try {
      await visaService.deleteVisaApplication(applicationToDeleteRef.current.id);
      
      setApplications(prev => prev.filter(app => app.id !== applicationToDeleteRef.current.id));
      
      toast({
        title: 'تم حذف الطلب',
        description: 'تم حذف طلب التأشيرة بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('خطأ في حذف الطلب:', error);
      toast({
        title: 'خطأ في حذف الطلب',
        description: error.message || 'حدث خطأ غير معروف',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      applicationToDeleteRef.current = null;
    }
  };
  
  // حفظ طلب جديد أو تحديث طلب موجود
  const handleSubmitApplication = async (applicationData) => {
    try {
      if (selectedApplication) {
        // تحديث طلب موجود
        const updatedApplication = await visaService.updateVisaApplication(
          selectedApplication.id,
          applicationData
        );
        
        setApplications(prev => 
          prev.map(app => app.id === selectedApplication.id ? updatedApplication : app)
        );
        
        toast({
          title: 'تم تحديث الطلب',
          description: 'تم تحديث طلب التأشيرة بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // إضافة طلب جديد
        const newApplication = await visaService.createVisaApplication({
          ...applicationData,
          createdAt: new Date(),
          createdBy: user?.uid || 'unknown'
        });
        
        setApplications(prev => [newApplication, ...prev]);
        
        toast({
          title: 'تم إضافة الطلب',
          description: 'تم إضافة طلب التأشيرة بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // إغلاق النموذج المناسب
      if (isFormOpen) onFormClose();
      if (isAdvancedFormOpen) onAdvancedFormClose();
      
      return true;
    } catch (error) {
      console.error('خطأ في حفظ الطلب:', error);
      throw error;
    }
  };
  
  // تحديث فلتر معين
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // إعادة ضبط جميع الفلاتر
  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      visaType: 'all',
      country: '',
      dateRange: 'all',
      startDate: '',
      endDate: '',
      isUrgent: false
    });
    setSearchTerm('');
  };
  
  // تطبيق الفلاتر
  const handleApplyFilters = () => {
    // الفلاتر تطبق تلقائيًا من خلال useEffect
  };
  
  // طباعة طلب
  const handlePrintApplication = (application) => {
    // تنفيذ منطق الطباعة هنا
    console.log('طباعة الطلب:', application);
    toast({
      title: 'جاري الطباعة',
      description: `جاري طباعة طلب التأشيرة لـ ${application.customerName}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // تصدير جميع الطلبات إلى ملف Excel
  const handleExportToExcel = () => {
    // تنفيذ منطق التصدير هنا
    toast({
      title: 'جاري التصدير',
      description: 'جاري تصدير بيانات طلبات التأشيرات إلى ملف Excel',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // عرض حالة الطلب كشارة ملونة
  const renderStatusBadge = (status) => {
    const statusMap = {
      pending: { color: 'yellow', label: 'قيد المعالجة' },
      submitted: { color: 'blue', label: 'تم التقديم' },
      approved: { color: 'green', label: 'تمت الموافقة' },
      rejected: { color: 'red', label: 'مرفوض' },
      completed: { color: 'teal', label: 'مكتمل' },
      cancelled: { color: 'gray', label: 'ملغي' }
    };
    
    const statusInfo = statusMap[status] || { color: 'gray', label: status };
    
    return (
      <Badge colorScheme={statusInfo.color} borderRadius="full" px="2">
        {statusInfo.label}
      </Badge>
    );
  };
  
  // عرض نوع التأشيرة بشكل مناسب
  const getVisaTypeLabel = (visaType) => {
    const visaTypes = {
      tourist: 'سياحية',
      business: 'عمل',
      visit: 'زيارة',
      umrah: 'عمرة',
      hajj: 'حج',
      student: 'دراسية',
      medical: 'علاجية',
      transit: 'ترانزيت',
      work: 'إقامة عمل',
      family: 'لم شمل عائلي'
    };
    
    return visaTypes[visaType] || visaType;
  };
  
  return (
    <Box p="4">
      <Flex justify="space-between" align="center" mb="6">
        <Box>
          <BackButton />
          <Heading size="lg">طلبات التأشيرات</Heading>
        </Box>
        
        <HStack spacing="3">
          <Button
            leftIcon={<FiRefreshCw />}
            variant="outline"
            onClick={fetchApplications}
            isLoading={loading}
            loadingText="جاري التحديث..."
          >
            تحديث
          </Button>
          
          <Button
            leftIcon={<FiDownload />}
            variant="outline"
            onClick={handleExportToExcel}
          >
            تصدير
          </Button>
          
          <Menu>
            <MenuButton as={Button} colorScheme="blue" leftIcon={<FiPlus />}>
              طلب جديد
            </MenuButton>
            <MenuList>
              <MenuItem onClick={handleAddApplication}>نموذج أساسي</MenuItem>
              <MenuItem onClick={handleAddAdvancedApplication}>نموذج متقدم</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
      
      {/* لوحة الإحصائيات */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing="4" mb="6">
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>إجمالي الطلبات</StatLabel>
              <StatNumber>{visaStats.total}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>قيد المعالجة</StatLabel>
              <StatNumber>{visaStats.pending}</StatNumber>
              <StatHelpText>
                {visaStats.total > 0 ? 
                  `${Math.round((visaStats.pending / visaStats.total) * 100)}%` : 
                  '0%'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>تمت الموافقة</StatLabel>
              <StatNumber>{visaStats.approved}</StatNumber>
              <StatHelpText>
                {visaStats.total > 0 ? 
                  `${Math.round((visaStats.approved / visaStats.total) * 100)}%` : 
                  '0%'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>طلبات عاجلة</StatLabel>
              <StatNumber>{visaStats.urgent}</StatNumber>
              <StatHelpText color={visaStats.urgent > 0 ? "red.500" : "green.500"}>
                {visaStats.urgent > 0 ? <FiAlertCircle /> : <FiCheck />}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* تنبيه بالتأشيرات المنتهية قريبًا */}
      {visaStats.expiringThisMonth > 0 && (
        <Alert status="warning" mb="6" borderRadius="md">
          <AlertIcon />
          <AlertTitle>تنبيه!</AlertTitle>
          <AlertDescription>
            يوجد {visaStats.expiringThisMonth} تأشيرة ستنتهي خلال هذا الشهر. يرجى مراجعتها.
          </AlertDescription>
        </Alert>
      )}
      
      <VisaApplicationFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyFilters}
        countries={countries}
      />
      
      {loading ? (
        <Center p="8">
          <Spinner size="xl" color="blue.500" />
        </Center>
      ) : error ? (
        <Center p="8">
          <Text color="red.500">{error}</Text>
          <Button ml="4" onClick={fetchApplications}>
            إعادة المحاولة
          </Button>
        </Center>
      ) : (
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>جميع الطلبات ({filteredApplications.length})</Tab>
            <Tab>
              قيد المعالجة (
              {filteredApplications.filter(app => app.status === 'pending').length})
            </Tab>
            <Tab>
              تم التقديم (
              {filteredApplications.filter(app => app.status === 'submitted').length})
            </Tab>
            <Tab>
              تمت الموافقة (
              {filteredApplications.filter(app => app.status === 'approved').length})
            </Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p="0" pt="4">
              <VisaApplicationTable
                applications={filteredApplications}
                onEdit={handleEditApplication}
                onDelete={handleDeleteClick}
                onPrint={handlePrintApplication}
                renderStatusBadge={renderStatusBadge}
                getVisaTypeLabel={getVisaTypeLabel}
              />
            </TabPanel>
            
            <TabPanel p="0" pt="4">
              <VisaApplicationTable
                applications={filteredApplications.filter(app => app.status === 'pending')}
                onEdit={handleEditApplication}
                onDelete={handleDeleteClick}
                onPrint={handlePrintApplication}
                renderStatusBadge={renderStatusBadge}
                getVisaTypeLabel={getVisaTypeLabel}
              />
            </TabPanel>
            
            <TabPanel p="0" pt="4">
              <VisaApplicationTable
                applications={filteredApplications.filter(app => app.status === 'submitted')}
                onEdit={handleEditApplication}
                onDelete={handleDeleteClick}
                onPrint={handlePrintApplication}
                renderStatusBadge={renderStatusBadge}
                getVisaTypeLabel={getVisaTypeLabel}
              />
            </TabPanel>
            
            <TabPanel p="0" pt="4">
              <VisaApplicationTable
                applications={filteredApplications.filter(app => app.status === 'approved')}
                onEdit={handleEditApplication}
                onDelete={handleDeleteClick}
                onPrint={handlePrintApplication}
                renderStatusBadge={renderStatusBadge}
                getVisaTypeLabel={getVisaTypeLabel}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
      
      {/* مودال النموذج الأساسي */}
      <Modal
        isOpen={isFormOpen}
        onClose={onFormClose}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>
            {selectedApplication ? 'تعديل طلب تأشيرة' : 'إضافة طلب تأشيرة جديد'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            <VisaApplicationForm
              application={selectedApplication}
              onSubmit={handleSubmitApplication}
              onClose={onFormClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* مودال النموذج المتقدم */}
      <Modal
        isOpen={isAdvancedFormOpen}
        onClose={onAdvancedFormClose}
        size="full"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedApplication ? 'تعديل طلب تأشيرة (نموذج متقدم)' : 'إضافة طلب تأشيرة جديد (نموذج متقدم)'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            <AdvancedVisaForm
              initialData={selectedApplication || {}}
              onSubmit={handleSubmitApplication}
              onCancel={onAdvancedFormClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* مودال تأكيد الحذف */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>تأكيد الحذف</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            <Text>
              هل أنت متأكد من رغبتك في حذف طلب التأشيرة
              {applicationToDeleteRef.current && (
                <Text as="span" fontWeight="bold">
                  {' '}
                  لـ {applicationToDeleteRef.current.customerName}
                </Text>
              )}؟
            </Text>
          </ModalBody>
          <Flex justify="flex-end" p="3">
            <Button variant="outline" mr="3" onClick={onDeleteClose}>
              إلغاء
            </Button>
            <Button colorScheme="red" onClick={handleDeleteConfirm}>
              حذف
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default VisaApplications;
