import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Heading,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Spinner,
  Text
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { flightService, customerService } from '../services/api';
import FlightBookingTable from '../components/bookings/FlightBookingTable';
import FlightBookingForm from '../components/bookings/FlightBookingForm';
import FlightBookingFilters from '../components/bookings/FlightBookingFilters';
import BackButton from '../components/shared/BackButton';

/**
 * صفحة إدارة حجوزات الطيران
 * تتيح عرض وإضافة وتعديل وحذف حجوزات الطيران
 */
const FlightBookings = () => {
  // حالة الحجوزات
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [deleteBookingId, setDeleteBookingId] = useState(null);
  
  // حالة البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    airline: '',
    startDate: '',
    endDate: ''
  });
  
  // حالة الترتيب
  const [sortField, setSortField] = useState('departureDate');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // مراجع وحالة النوافذ المنبثقة
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef();
  const toast = useToast();
  
  // جلب الحجوزات عند تحميل الصفحة
  useEffect(() => {
    fetchBookings();
  }, []);
  
  // تصفية الحجوزات عند تغيير مصطلح البحث أو الفلاتر
  useEffect(() => {
    filterBookings();
  }, [searchTerm, filters, bookings, sortField, sortDirection]);
  
  // جلب حجوزات الطيران
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await flightService.getAllBookings();
      setBookings(data);
    } catch (error) {
      console.error('خطأ في جلب حجوزات الطيران:', error);
      toast({
        title: 'خطأ في جلب حجوزات الطيران',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // تصفية الحجوزات حسب مصطلح البحث والفلاتر
  const filterBookings = () => {
    let filtered = [...bookings];
    
    // تصفية حسب مصطلح البحث
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        booking =>
          booking.customerName?.toLowerCase().includes(term) ||
          booking.bookingNumber?.toLowerCase().includes(term) ||
          booking.origin?.toLowerCase().includes(term) ||
          booking.destination?.toLowerCase().includes(term) ||
          booking.airline?.toLowerCase().includes(term) ||
          booking.flightNumber?.toLowerCase().includes(term)
      );
    }
    
    // تصفية حسب الحالة
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }
    
    // تصفية حسب شركة الطيران
    if (filters.airline) {
      filtered = filtered.filter(booking => booking.airline === filters.airline);
    }
    
    // تصفية حسب نطاق التاريخ
    if (filters.dateRange && filters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const getDateFromBooking = (booking) => {
        if (!booking.departureDate) return null;
        return booking.departureDate.seconds
          ? new Date(booking.departureDate.seconds * 1000)
          : new Date(booking.departureDate);
      };
      
      switch (filters.dateRange) {
        case 'today': {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          filtered = filtered.filter(booking => {
            const date = getDateFromBooking(booking);
            return date && date >= today && date < tomorrow;
          });
          break;
        }
        case 'week': {
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          
          filtered = filtered.filter(booking => {
            const date = getDateFromBooking(booking);
            return date && date >= weekStart && date < weekEnd;
          });
          break;
        }
        case 'month': {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          
          filtered = filtered.filter(booking => {
            const date = getDateFromBooking(booking);
            return date && date >= monthStart && date <= monthEnd;
          });
          break;
        }
        case 'custom': {
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            
            filtered = filtered.filter(booking => {
              const date = getDateFromBooking(booking);
              return date && date >= startDate;
            });
          }
          
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            
            filtered = filtered.filter(booking => {
              const date = getDateFromBooking(booking);
              return date && date <= endDate;
            });
          }
          break;
        }
      }
    }
    
    // ترتيب النتائج
    filtered.sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      // معالجة خاصة للتواريخ
      if (sortField === 'departureDate' || sortField === 'returnDate' || sortField === 'createdAt') {
        valueA = valueA?.seconds ? new Date(valueA.seconds * 1000) : new Date(valueA || 0);
        valueB = valueB?.seconds ? new Date(valueB.seconds * 1000) : new Date(valueB || 0);
      }
      
      // معالجة القيم النصية
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
      }
      if (typeof valueB === 'string') {
        valueB = valueB.toLowerCase();
      }
      
      // معالجة القيم العددية
      if (sortField === 'totalAmount' || sortField === 'paidAmount') {
        valueA = parseFloat(valueA || 0);
        valueB = parseFloat(valueB || 0);
      }
      
      // الترتيب
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredBookings(filtered);
  };
  
  // تغيير ترتيب الحجوزات
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // تحديث مصطلح البحث
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };
  
  // تحديث الفلاتر
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // إعادة ضبط الفلاتر
  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      dateRange: 'all',
      airline: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
  };
  
  // تطبيق الفلاتر
  const handleApplyFilters = () => {
    filterBookings();
  };
  
  // فتح نموذج إضافة حجز جديد
  const handleAddBooking = () => {
    setSelectedBooking(null);
    onFormOpen();
  };
  
  // فتح نموذج تعديل حجز
  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    onFormOpen();
  };
  
  // فتح مربع حوار حذف حجز
  const handleDeleteClick = (bookingId) => {
    setDeleteBookingId(bookingId);
    onDeleteOpen();
  };
  
  // حذف حجز
  const handleDeleteBooking = async () => {
    try {
      await flightService.deleteBooking(deleteBookingId);
      setBookings(prev => prev.filter(booking => booking.id !== deleteBookingId));
      toast({
        title: 'تم حذف الحجز بنجاح',
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
      setDeleteBookingId(null);
    }
  };
  
  // حفظ بيانات الحجز (إضافة/تعديل)
  const handleSubmitBooking = async (formData) => {
    try {
      // جلب بيانات العميل
      const customer = await customerService.getCustomer(formData.customerId);
      
      // إضافة اسم العميل إلى بيانات الحجز
      const bookingData = {
        ...formData,
        customerName: customer.name
      };
      
      if (selectedBooking) {
        // تعديل حجز موجود
        const updatedBooking = await flightService.updateBooking(selectedBooking.id, bookingData);
        setBookings(prev =>
          prev.map(booking =>
            booking.id === selectedBooking.id ? { ...booking, ...updatedBooking } : booking
          )
        );
        toast({
          title: 'تم تحديث بيانات الحجز بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // إضافة حجز جديد
        const newBooking = await flightService.createBooking(bookingData);
        setBookings(prev => [newBooking, ...prev]);
        toast({
          title: 'تم إضافة الحجز بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      return true;
    } catch (error) {
      console.error('خطأ في حفظ بيانات الحجز:', error);
      toast({
        title: 'خطأ في حفظ بيانات الحجز',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };
  
  // طباعة تذكرة
  const handlePrintTicket = (booking) => {
    // هنا يمكن إضافة منطق طباعة التذكرة
    console.log('طباعة تذكرة للحجز:', booking.id);
    toast({
      title: 'جاري طباعة التذكرة',
      description: `تذكرة الحجز رقم ${booking.bookingNumber || booking.id.slice(0, 8)}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  return (
    <Box>
      <Flex justify="space-between" align="center" mb="6">
        <Box>
          <BackButton />
          <Heading size="lg">إدارة حجوزات الطيران</Heading>
        </Box>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleAddBooking}>
          إضافة حجز جديد
        </Button>
      </Flex>
      
      {/* شريط البحث والفلترة */}
      <FlightBookingFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyFilters}
      />
      
      {/* جدول الحجوزات */}
      <FlightBookingTable
        bookings={filteredBookings}
        loading={loading}
        onViewBooking={handleEditBooking} // استخدام نفس النموذج للعرض والتعديل
        onEditBooking={handleEditBooking}
        onDeleteBooking={handleDeleteClick}
        onPrintTicket={handlePrintTicket}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
      
      {/* نموذج إضافة/تعديل حجز */}
      <Modal
        isOpen={isFormOpen}
        onClose={onFormClose}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedBooking ? 'تعديل بيانات الحجز' : 'إضافة حجز جديد'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            <FlightBookingForm
              booking={selectedBooking}
              onSubmit={handleSubmitBooking}
              onClose={onFormClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* مربع حوار تأكيد الحذف */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              حذف الحجز
            </AlertDialogHeader>
            
            <AlertDialogBody>
              هل أنت متأكد من رغبتك في حذف هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogBody>
            
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={handleDeleteBooking} mr={3}>
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default FlightBookings;
