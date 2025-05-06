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
import { hotelService, customerService } from '../services/api';
import HotelBookingTable from '../components/bookings/HotelBookingTable';
import HotelBookingForm from '../components/bookings/HotelBookingForm';
import HotelBookingFilters from '../components/bookings/HotelBookingFilters';
import BackButton from '../components/shared/BackButton';

/**
 * صفحة إدارة حجوزات الفنادق
 * تتيح عرض وإضافة وتعديل وحذف حجوزات الفنادق
 */
const HotelBookings = () => {
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
    city: '',
    roomType: 'all',
    startDate: '',
    endDate: ''
  });
  
  // قائمة المدن المتاحة
  const [cities, setCities] = useState([]);
  
  // حالة الترتيب
  const [sortField, setSortField] = useState('checkInDate');
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
  
  // جلب حجوزات الفنادق
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await hotelService.getAllBookings();
      setBookings(data);
      
      // استخراج قائمة المدن المتاحة
      const uniqueCities = [...new Set(data.map(booking => booking.city).filter(Boolean))];
      setCities(uniqueCities);
    } catch (error) {
      console.error('خطأ في جلب حجوزات الفنادق:', error);
      toast({
        title: 'خطأ في جلب حجوزات الفنادق',
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
          booking.hotelName?.toLowerCase().includes(term) ||
          booking.city?.toLowerCase().includes(term)
      );
    }
    
    // تصفية حسب الحالة
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }
    
    // تصفية حسب المدينة
    if (filters.city) {
      filtered = filtered.filter(booking => booking.city === filters.city);
    }
    
    // تصفية حسب نوع الغرفة
    if (filters.roomType && filters.roomType !== 'all') {
      filtered = filtered.filter(booking => booking.roomType === filters.roomType);
    }
    
    // تصفية حسب نطاق التاريخ
    if (filters.dateRange && filters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const getCheckInDate = (booking) => {
        if (!booking.checkInDate) return null;
        return booking.checkInDate.seconds
          ? new Date(booking.checkInDate.seconds * 1000)
          : new Date(booking.checkInDate);
      };
      
      const getCheckOutDate = (booking) => {
        if (!booking.checkOutDate) return null;
        return booking.checkOutDate.seconds
          ? new Date(booking.checkOutDate.seconds * 1000)
          : new Date(booking.checkOutDate);
      };
      
      switch (filters.dateRange) {
        case 'upcoming': {
          filtered = filtered.filter(booking => {
            const checkInDate = getCheckInDate(booking);
            return checkInDate && checkInDate >= today;
          });
          break;
        }
        case 'today': {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          filtered = filtered.filter(booking => {
            const checkInDate = getCheckInDate(booking);
            return checkInDate && checkInDate >= today && checkInDate < tomorrow;
          });
          break;
        }
        case 'week': {
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          
          filtered = filtered.filter(booking => {
            const checkInDate = getCheckInDate(booking);
            return checkInDate && checkInDate >= weekStart && checkInDate < weekEnd;
          });
          break;
        }
        case 'month': {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          
          filtered = filtered.filter(booking => {
            const checkInDate = getCheckInDate(booking);
            return checkInDate && checkInDate >= monthStart && checkInDate <= monthEnd;
          });
          break;
        }
        case 'custom': {
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            
            filtered = filtered.filter(booking => {
              const checkInDate = getCheckInDate(booking);
              return checkInDate && checkInDate >= startDate;
            });
          }
          
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            
            filtered = filtered.filter(booking => {
              const checkInDate = getCheckInDate(booking);
              return checkInDate && checkInDate <= endDate;
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
      if (sortField === 'checkInDate' || sortField === 'checkOutDate' || sortField === 'createdAt') {
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
      city: '',
      roomType: 'all',
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
      await hotelService.deleteBooking(deleteBookingId);
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
        const updatedBooking = await hotelService.updateBooking(selectedBooking.id, bookingData);
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
        const newBooking = await hotelService.createBooking(bookingData);
        setBookings(prev => [newBooking, ...prev]);
        
        // إضافة المدينة إلى قائمة المدن إذا لم تكن موجودة
        if (bookingData.city && !cities.includes(bookingData.city)) {
          setCities(prev => [...prev, bookingData.city]);
        }
        
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
  
  // طباعة قسيمة الحجز
  const handlePrintVoucher = (booking) => {
    // هنا يمكن إضافة منطق طباعة قسيمة الحجز
    console.log('طباعة قسيمة للحجز:', booking.id);
    toast({
      title: 'جاري طباعة قسيمة الحجز',
      description: `قسيمة الحجز في فندق ${booking.hotelName}`,
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
          <Heading size="lg">إدارة حجوزات الفنادق</Heading>
        </Box>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleAddBooking}>
          إضافة حجز جديد
        </Button>
      </Flex>
      
      {/* شريط البحث والفلترة */}
      <HotelBookingFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyFilters}
        cities={cities}
      />
      
      {/* جدول الحجوزات */}
      <HotelBookingTable
        bookings={filteredBookings}
        loading={loading}
        onViewBooking={handleEditBooking} // استخدام نفس النموذج للعرض والتعديل
        onEditBooking={handleEditBooking}
        onDeleteBooking={handleDeleteClick}
        onPrintVoucher={handlePrintVoucher}
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
            <HotelBookingForm
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

export default HotelBookings;
