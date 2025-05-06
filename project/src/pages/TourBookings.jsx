import React, { useState, useEffect, useRef } from 'react';
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
  ModalBody,
  ModalCloseButton,
  useToast,
  Spinner,
  Center,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Grid,
  GridItem,
  Card,
  CardBody
} from '@chakra-ui/react';
import { FiPlus, FiDownload, FiRefreshCw, FiPrinter } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { tourBookingService, customerService, tourPackageService } from '../services/api';
import TourBookingTable from '../components/tours/TourBookingTable';
import TourBookingForm from '../components/tours/TourBookingForm';
import TourBookingFilters from '../components/tours/TourBookingFilters';
import BackButton from '../components/shared/BackButton';
import { formatAmount } from '../utils/validationUtils';
import { useActionLogger } from '../hooks/useActionLogger';

/**
 * صفحة إدارة حجوزات البرامج السياحية
 * تعرض قائمة الحجوزات وتتيح إضافة وتعديل وحذف الحجوزات
 */
const TourBookings = () => {
  const { user } = useAuth();
  const toast = useToast();
  
  // حالة الحجوزات
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // حالة البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    destination: 'all',
    packageId: 'all',
    customerId: 'all',
    fromDate: '',
    toDate: ''
  });
  
  // قوائم الفلاتر
  const [destinations, setDestinations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // حالة المودال
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  // مرجع للحجز المراد حذفه
  const bookingToDeleteRef = useRef(null);
  const cancelRef = useRef();
  
  // إحصائيات الحجوزات
  const [stats, setStats] = useState({
    total: 0,
    statusCounts: {},
    totalRevenue: 0
  });
  
  // هوكس
  const { logPageView, logCreate, logUpdate, logDelete, logSearch, logExport, logPrint, ACTION_CATEGORIES } = useActionLogger();

  // تسجيل عرض الصفحة عند التحميل
  useEffect(() => {
    logPageView('صفحة حجوزات البرامج السياحية', ACTION_CATEGORIES.BOOKING);
  }, [logPageView]);

  // جلب حجوزات البرامج السياحية
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await tourBookingService.getAllBookings();
      setBookings(data);
      setFilteredBookings(data);
      
      // جلب الإحصائيات
      const statsData = await tourBookingService.getBookingStats();
      setStats(statsData);
      
      // استخراج قائمة الوجهات الفريدة من الحجوزات
      const uniqueDestinations = [...new Set(data.map(booking => booking.destination))].filter(Boolean).sort();
      setDestinations(uniqueDestinations);
    } catch (error) {
      console.error('خطأ في جلب حجوزات البرامج السياحية:', error);
      setError('حدث خطأ أثناء جلب حجوزات البرامج السياحية. يرجى المحاولة مرة أخرى.');
      toast({
        title: 'خطأ في جلب البيانات',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // جلب قائمة البرامج السياحية
  const fetchPackages = async () => {
    try {
      const data = await tourPackageService.getAllPackages();
      setPackages(data);
    } catch (error) {
      console.error('خطأ في جلب البرامج السياحية:', error);
    }
  };
  
  // جلب قائمة العملاء
  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('خطأ في جلب بيانات العملاء:', error);
    }
  };
  
  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchBookings();
    fetchPackages();
    fetchCustomers();
  }, []);
  
  // تطبيق الفلاتر والبحث على الحجوزات
  useEffect(() => {
    if (!bookings.length) return;
    
    let result = [...bookings];
    
    // تطبيق البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(booking => 
        (booking.bookingNumber && booking.bookingNumber.toLowerCase().includes(searchLower)) ||
        (booking.customerName && booking.customerName.toLowerCase().includes(searchLower)) ||
        (booking.packageName && booking.packageName.toLowerCase().includes(searchLower)) ||
        (booking.destination && booking.destination.toLowerCase().includes(searchLower)) ||
        (booking.customerPhone && booking.customerPhone.includes(searchTerm))
      );
      
      // تسجيل حدث البحث
      logSearch(searchTerm, ACTION_CATEGORIES.BOOKING, { 
        resultsCount: result.length,
        totalCount: bookings.length
      });
    }
    
    // تطبيق فلتر الحالة
    if (filters.status && filters.status !== 'all') {
      result = result.filter(booking => booking.status === filters.status);
    }
    
    // تطبيق فلتر الوجهة
    if (filters.destination && filters.destination !== 'all') {
      result = result.filter(booking => booking.destination === filters.destination);
    }
    
    // تطبيق فلتر البرنامج
    if (filters.packageId && filters.packageId !== 'all') {
      result = result.filter(booking => booking.packageId === filters.packageId);
    }
    
    // تطبيق فلتر العميل
    if (filters.customerId && filters.customerId !== 'all') {
      result = result.filter(booking => booking.customerId === filters.customerId);
    }
    
    // تطبيق فلتر التاريخ
    if (filters.fromDate && filters.toDate) {
      const fromDate = new Date(filters.fromDate);
      const toDate = new Date(filters.toDate);
      
      result = result.filter(booking => {
        if (!booking.travelDate) return false;
        
        const travelDate = new Date(booking.travelDate);
        return travelDate >= fromDate && travelDate <= toDate;
      });
    }
    
    setFilteredBookings(result);
  }, [bookings, searchTerm, filters]);
  
  // فتح نموذج إضافة حجز جديد
  const handleAddBooking = () => {
    setSelectedBooking(null);
    onFormOpen();
  };
  
  // فتح نموذج تعديل حجز موجود
  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    onFormOpen();
  };
  
  // فتح مودال عرض تفاصيل الحجز
  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    onViewOpen();
  };
  
  // فتح مودال حذف حجز
  const handleDeleteClick = (booking) => {
    bookingToDeleteRef.current = booking;
    onDeleteOpen();
  };
  
  // تغيير حالة الحجز
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await tourBookingService.updateBookingStatus(bookingId, newStatus);
      
      // تحديث قائمة الحجوزات
      setBookings(prev => 
        prev.map(booking => booking.id === bookingId ? { ...booking, status: newStatus } : booking)
      );
      
      // تسجيل حدث تغيير حالة الحجز
      const booking = bookings.find(b => b.id === bookingId);
      logUpdate('حالة حجز برنامج سياحي', bookingId, ACTION_CATEGORIES.BOOKING, {
        bookingNumber: booking?.bookingNumber,
        customerName: booking?.customerName,
        oldStatus: booking?.status,
        newStatus: newStatus
      });
      
      toast({
        title: 'تم تحديث حالة الحجز',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('خطأ في تحديث حالة الحجز:', error);
      toast({
        title: 'خطأ في تحديث حالة الحجز',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // طباعة الحجز
  const handlePrintBooking = (booking) => {
    // تنفيذ منطق الطباعة هنا
    
    // تسجيل حدث طباعة الحجز
    logPrint('حجز برنامج سياحي', booking.id, ACTION_CATEGORIES.BOOKING, {
      bookingNumber: booking.bookingNumber || booking.id.substring(0, 8),
      customerName: booking.customerName
    });
    
    toast({
      title: 'جاري طباعة الحجز',
      description: `جاري طباعة تفاصيل الحجز رقم ${booking.bookingNumber || booking.id.substring(0, 8)}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // حذف حجز
  const handleDeleteConfirm = async () => {
    if (!bookingToDeleteRef.current) return;
    
    try {
      const bookingToDelete = bookingToDeleteRef.current;
      await tourBookingService.deleteBooking(bookingToDelete.id);
      
      setBookings(prev => prev.filter(booking => booking.id !== bookingToDelete.id));
      
      // تسجيل حدث حذف الحجز
      logDelete('حجز برنامج سياحي', bookingToDelete.id, ACTION_CATEGORIES.BOOKING, {
        bookingNumber: bookingToDelete.bookingNumber || bookingToDelete.id.substring(0, 8),
        customerName: bookingToDelete.customerName,
        packageName: bookingToDelete.packageName
      });
      
      toast({
        title: 'تم حذف الحجز',
        description: 'تم حذف الحجز بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('خطأ في حذف الحجز:', error);
      toast({
        title: 'خطأ في حذف الحجز',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      bookingToDeleteRef.current = null;
    }
  };
  
  // حفظ حجز جديد أو تحديث حجز موجود
  const handleSubmitBooking = async (bookingData) => {
    try {
      if (selectedBooking && selectedBooking.id) {
        // تحديث حجز موجود
        const updatedBooking = await tourBookingService.updateBooking(
          selectedBooking.id,
          bookingData
        );
        
        setBookings(prev => 
          prev.map(booking => booking.id === selectedBooking.id ? { ...updatedBooking, id: selectedBooking.id } : booking)
        );
        
        // تسجيل حدث تعديل الحجز
        logUpdate('حجز برنامج سياحي', selectedBooking.id, ACTION_CATEGORIES.BOOKING, {
          bookingNumber: selectedBooking.bookingNumber || selectedBooking.id.substring(0, 8),
          customerName: bookingData.customerName,
          packageName: bookingData.packageName
        });
        
        toast({
          title: 'تم تحديث الحجز',
          description: 'تم تحديث الحجز بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // إضافة حجز جديد
        const newBookingNumber = `TRB-${Date.now().toString().substring(5)}`;
        const newBooking = await tourBookingService.createBooking({
          ...bookingData,
          createdBy: user?.uid || 'unknown',
          bookingNumber: newBookingNumber
        });
        
        setBookings(prev => [newBooking, ...prev]);
        
        // تسجيل حدث إضافة الحجز
        logCreate('حجز برنامج سياحي', newBooking.id, ACTION_CATEGORIES.BOOKING, {
          bookingNumber: newBookingNumber,
          customerName: bookingData.customerName,
          packageName: bookingData.packageName
        });
        
        toast({
          title: 'تم إضافة الحجز',
          description: 'تم إضافة الحجز بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('خطأ في حفظ الحجز:', error);
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
      destination: 'all',
      packageId: 'all',
      customerId: 'all',
      fromDate: '',
      toDate: ''
    });
    setSearchTerm('');
  };
  
  // تطبيق الفلاتر
  const handleApplyFilters = () => {
    // الفلاتر تطبق تلقائيًا من خلال useEffect
  };
  
  // تصدير جميع الحجوزات إلى ملف Excel
  const handleExportToExcel = () => {
    // تنفيذ منطق التصدير هنا
    
    // تسجيل حدث تصدير البيانات
    logExport('حجوزات البرامج السياحية', 'Excel', ACTION_CATEGORIES.BOOKING, {
      count: filteredBookings.length,
      filters: filters
    });
    
    toast({
      title: 'جاري التصدير',
      description: 'جاري تصدير بيانات الحجوزات إلى ملف Excel',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  return (
    <Box p="4">
      <Flex justify="space-between" align="center" mb="6">
        <Box>
          <BackButton />
          <Heading size="lg">حجوزات البرامج السياحية</Heading>
        </Box>
        
        <HStack spacing="3">
          <Button
            leftIcon={<FiRefreshCw />}
            variant="outline"
            onClick={fetchBookings}
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
          
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleAddBooking}
          >
            حجز جديد
          </Button>
        </HStack>
      </Flex>
      
      {/* الإحصائيات */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap="4" mb="6">
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>إجمالي الحجوزات</StatLabel>
                <StatNumber>{stats.total}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>الحجوزات المؤكدة</StatLabel>
                <StatNumber>{stats.statusCounts?.confirmed || 0}</StatNumber>
                <StatHelpText>
                  {stats.total > 0 && (
                    <Text>
                      {(((stats.statusCounts?.confirmed || 0) / stats.total) * 100).toFixed(1)}%
                    </Text>
                  )}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>الحجوزات قيد الانتظار</StatLabel>
                <StatNumber>{stats.statusCounts?.pending || 0}</StatNumber>
                <StatHelpText>
                  {stats.total > 0 && (
                    <Text>
                      {(((stats.statusCounts?.pending || 0) / stats.total) * 100).toFixed(1)}%
                    </Text>
                  )}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>إجمالي الإيرادات</StatLabel>
                <StatNumber>{formatAmount(stats.totalRevenue)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
      
      {/* فلاتر البحث */}
      <TourBookingFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyFilters}
        destinations={destinations}
        packages={packages}
        customers={customers}
      />
      
      {/* جدول الحجوزات */}
      {loading ? (
        <Center p="8">
          <Spinner size="xl" color="blue.500" />
        </Center>
      ) : error ? (
        <Center p="8">
          <Text color="red.500">{error}</Text>
          <Button ml="4" onClick={fetchBookings}>
            إعادة المحاولة
          </Button>
        </Center>
      ) : (
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>جميع الحجوزات ({filteredBookings.length})</Tab>
            <Tab>
              قيد الانتظار (
              {filteredBookings.filter(booking => booking.status === 'pending').length})
            </Tab>
            <Tab>
              مؤكدة (
              {filteredBookings.filter(booking => booking.status === 'confirmed').length})
            </Tab>
            <Tab>
              مكتملة (
              {filteredBookings.filter(booking => booking.status === 'completed').length})
            </Tab>
            <Tab>
              ملغاة (
              {filteredBookings.filter(booking => booking.status === 'cancelled').length})
            </Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p="0" pt="4">
              <TourBookingTable
                bookings={filteredBookings}
                onView={handleViewBooking}
                onEdit={handleEditBooking}
                onDelete={handleDeleteClick}
                onUpdateStatus={handleUpdateStatus}
                onPrint={handlePrintBooking}
                isLoading={loading}
              />
            </TabPanel>
            
            <TabPanel p="0" pt="4">
              <TourBookingTable
                bookings={filteredBookings.filter(booking => booking.status === 'pending')}
                onView={handleViewBooking}
                onEdit={handleEditBooking}
                onDelete={handleDeleteClick}
                onUpdateStatus={handleUpdateStatus}
                onPrint={handlePrintBooking}
                isLoading={loading}
              />
            </TabPanel>
            
            <TabPanel p="0" pt="4">
              <TourBookingTable
                bookings={filteredBookings.filter(booking => booking.status === 'confirmed')}
                onView={handleViewBooking}
                onEdit={handleEditBooking}
                onDelete={handleDeleteClick}
                onUpdateStatus={handleUpdateStatus}
                onPrint={handlePrintBooking}
                isLoading={loading}
              />
            </TabPanel>
            
            <TabPanel p="0" pt="4">
              <TourBookingTable
                bookings={filteredBookings.filter(booking => booking.status === 'completed')}
                onView={handleViewBooking}
                onEdit={handleEditBooking}
                onDelete={handleDeleteClick}
                onUpdateStatus={handleUpdateStatus}
                onPrint={handlePrintBooking}
                isLoading={loading}
              />
            </TabPanel>
            
            <TabPanel p="0" pt="4">
              <TourBookingTable
                bookings={filteredBookings.filter(booking => booking.status === 'cancelled')}
                onView={handleViewBooking}
                onEdit={handleEditBooking}
                onDelete={handleDeleteClick}
                onUpdateStatus={handleUpdateStatus}
                onPrint={handlePrintBooking}
                isLoading={loading}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
      
      {/* مودال إضافة/تعديل حجز */}
      <Modal
        isOpen={isFormOpen}
        onClose={onFormClose}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>
            {selectedBooking && selectedBooking.id ? 'تعديل حجز' : 'إضافة حجز جديد'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            <TourBookingForm
              booking={selectedBooking}
              onSubmit={handleSubmitBooking}
              onClose={onFormClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* مودال تأكيد الحذف */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              تأكيد الحذف
            </AlertDialogHeader>

            <AlertDialogBody>
              هل أنت متأكد من رغبتك في حذف الحجز
              {bookingToDeleteRef.current && (
                <Text as="span" fontWeight="bold">
                  {' '}"{bookingToDeleteRef.current.bookingNumber || bookingToDeleteRef.current.id.substring(0, 8)}"
                </Text>
              )}؟
              <Text color="red.500" mt="2">
                لا يمكن التراجع عن هذا الإجراء.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} mr="3">
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* مودال عرض تفاصيل الحجز */}
      <Modal
        isOpen={isViewOpen}
        onClose={onViewClose}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxW="800px">
          <ModalHeader>
            تفاصيل الحجز{' '}
            {selectedBooking && (
              <Text as="span" fontWeight="bold">
                {selectedBooking.bookingNumber || selectedBooking.id.substring(0, 8)}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            {selectedBooking && (
              <Box>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4" mb="4">
                  <Box>
                    <Text fontWeight="bold">البرنامج السياحي:</Text>
                    <Text>{selectedBooking.packageName}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">الوجهة:</Text>
                    <Text>{selectedBooking.destination}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">العميل:</Text>
                    <Text>{selectedBooking.customerName}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">رقم الهاتف:</Text>
                    <Text>{selectedBooking.customerPhone}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">البريد الإلكتروني:</Text>
                    <Text>{selectedBooking.customerEmail || 'غير متوفر'}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">تاريخ الحجز:</Text>
                    <Text>
                      {selectedBooking.createdAt && selectedBooking.createdAt.toDate 
                        ? new Date(selectedBooking.createdAt.toDate()).toLocaleDateString() 
                        : 'غير متوفر'}
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">تاريخ السفر:</Text>
                    <Text>
                      {selectedBooking.travelDate 
                        ? new Date(selectedBooking.travelDate).toLocaleDateString() 
                        : 'غير متوفر'}
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">تاريخ العودة:</Text>
                    <Text>
                      {selectedBooking.returnDate 
                        ? new Date(selectedBooking.returnDate).toLocaleDateString() 
                        : 'غير متوفر'}
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">عدد المسافرين:</Text>
                    <Text>{selectedBooking.travelers || 1}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">البالغين:</Text>
                    <Text>{selectedBooking.adults || 1}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">الأطفال:</Text>
                    <Text>{selectedBooking.children || 0}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">المبلغ الإجمالي:</Text>
                    <Text>{formatAmount(selectedBooking.totalAmount)}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">المبلغ المدفوع:</Text>
                    <Text>{formatAmount(selectedBooking.paidAmount || 0)}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">المبلغ المتبقي:</Text>
                    <Text>{formatAmount((selectedBooking.totalAmount || 0) - (selectedBooking.paidAmount || 0))}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">الحالة:</Text>
                    <Badge
                      colorScheme={
                        selectedBooking.status === 'confirmed' ? 'green' :
                        selectedBooking.status === 'pending' ? 'yellow' :
                        selectedBooking.status === 'completed' ? 'blue' :
                        'red'
                      }
                    >
                      {selectedBooking.status === 'confirmed' ? 'مؤكد' :
                       selectedBooking.status === 'pending' ? 'قيد الانتظار' :
                       selectedBooking.status === 'completed' ? 'مكتمل' :
                       'ملغي'}
                    </Badge>
                  </Box>
                </Grid>
                
                {/* ملاحظات */}
                {selectedBooking.notes && (
                  <Box mb="4">
                    <Text fontWeight="bold" mb="2">ملاحظات:</Text>
                    <Text whiteSpace="pre-wrap">{selectedBooking.notes}</Text>
                  </Box>
                )}
                
                <Flex justify="flex-end" mt="4">
                  <Button
                    leftIcon={<FiPrinter />}
                    colorScheme="blue"
                    onClick={() => handlePrintBooking(selectedBooking)}
                    mr="2"
                  >
                    طباعة الحجز
                  </Button>
                  <Button
                    onClick={() => {
                      onViewClose();
                      handleEditBooking(selectedBooking);
                    }}
                  >
                    تعديل الحجز
                  </Button>
                </Flex>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TourBookings;
