import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  HStack,
  Text,
  Box,
  Spinner,
  Center,
  Flex
} from '@chakra-ui/react';
import { FiMoreVertical, FiEye, FiEdit, FiTrash2, FiCheck, FiX, FiPrinter } from 'react-icons/fi';
import { formatAmount, formatDate } from '../../utils/validationUtils';

/**
 * مكون جدول حجوزات البرامج السياحية
 */
const TourBookingTable = ({ 
  bookings, 
  onView, 
  onEdit, 
  onDelete, 
  onUpdateStatus,
  onPrint,
  isLoading 
}) => {
  // تحديد لون الحالة
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'confirmed':
        return 'green';
      case 'cancelled':
        return 'red';
      case 'completed':
        return 'blue';
      default:
        return 'gray';
    }
  };
  
  // تحديد نص الحالة
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'confirmed':
        return 'مؤكد';
      case 'cancelled':
        return 'ملغي';
      case 'completed':
        return 'مكتمل';
      default:
        return 'غير معروف';
    }
  };
  
  if (isLoading) {
    return (
      <Center p="8">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }
  
  if (!bookings || bookings.length === 0) {
    return (
      <Center p="8">
        <Text>لا توجد حجوزات للعرض</Text>
      </Center>
    );
  }
  
  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>رقم الحجز</Th>
            <Th>العميل</Th>
            <Th>البرنامج</Th>
            <Th>تاريخ الحجز</Th>
            <Th>تاريخ السفر</Th>
            <Th>عدد المسافرين</Th>
            <Th>المبلغ الإجمالي</Th>
            <Th>الحالة</Th>
            <Th>الإجراءات</Th>
          </Tr>
        </Thead>
        <Tbody>
          {bookings.map((booking) => (
            <Tr key={booking.id}>
              <Td>{booking.bookingNumber || booking.id.substring(0, 8)}</Td>
              <Td>
                <Text fontWeight="medium">{booking.customerName}</Text>
                <Text fontSize="sm" color="gray.600">{booking.customerPhone}</Text>
              </Td>
              <Td>
                <Text fontWeight="medium">{booking.packageName}</Text>
                <Text fontSize="sm" color="gray.600">{booking.destination}</Text>
              </Td>
              <Td>{booking.createdAt ? formatDate(booking.createdAt.toDate()) : '-'}</Td>
              <Td>{booking.travelDate ? formatDate(new Date(booking.travelDate)) : '-'}</Td>
              <Td>{booking.travelers || 1}</Td>
              <Td>{formatAmount(booking.totalAmount)}</Td>
              <Td>
                <Badge colorScheme={getStatusColor(booking.status)}>
                  {getStatusText(booking.status)}
                </Badge>
              </Td>
              <Td>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem icon={<FiEye />} onClick={() => onView(booking)}>
                      عرض التفاصيل
                    </MenuItem>
                    <MenuItem icon={<FiEdit />} onClick={() => onEdit(booking)}>
                      تعديل الحجز
                    </MenuItem>
                    <MenuItem icon={<FiPrinter />} onClick={() => onPrint(booking)}>
                      طباعة الحجز
                    </MenuItem>
                    
                    {booking.status === 'pending' && (
                      <MenuItem 
                        icon={<FiCheck />} 
                        onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                      >
                        تأكيد الحجز
                      </MenuItem>
                    )}
                    
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <MenuItem 
                        icon={<FiX />} 
                        onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                      >
                        إلغاء الحجز
                      </MenuItem>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <MenuItem 
                        icon={<FiCheck />} 
                        onClick={() => onUpdateStatus(booking.id, 'completed')}
                      >
                        إكمال الحجز
                      </MenuItem>
                    )}
                    
                    <MenuItem 
                      icon={<FiTrash2 />} 
                      onClick={() => onDelete(booking)}
                      color="red.500"
                    >
                      حذف الحجز
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default TourBookingTable;
