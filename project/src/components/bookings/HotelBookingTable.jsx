import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Text,
  Flex,
  Box,
  Tooltip,
  Spinner
} from '@chakra-ui/react';
import {
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEye,
  FiFileText,
  FiPrinter
} from 'react-icons/fi';
import { formatDate, formatAmount } from '../../utils/validationUtils';

// مكون لعرض حالة الحجز بألوان مختلفة
const StatusBadge = ({ status }) => {
  const statusMap = {
    confirmed: { color: 'green', label: 'مؤكد' },
    pending: { color: 'yellow', label: 'معلق' },
    cancelled: { color: 'red', label: 'ملغي' },
    completed: { color: 'blue', label: 'مكتمل' }
  };

  const statusInfo = statusMap[status] || { color: 'gray', label: status };

  return (
    <Badge colorScheme={statusInfo.color} borderRadius="full" px="2">
      {statusInfo.label}
    </Badge>
  );
};

/**
 * مكون جدول حجوزات الفنادق
 * يعرض قائمة الحجوزات مع خيارات التعديل والحذف والعرض
 */
const HotelBookingTable = ({
  bookings,
  loading,
  onViewBooking,
  onEditBooking,
  onDeleteBooking,
  onPrintVoucher,
  sortField,
  sortDirection,
  onSort
}) => {
  // التعامل مع النقر على رأس العمود للترتيب
  const handleSort = (field) => {
    if (onSort) {
      onSort(field);
    }
  };

  // عرض رسالة عندما لا توجد حجوزات
  if (!loading && (!bookings || bookings.length === 0)) {
    return (
      <Box textAlign="center" py="10" bg="gray.50" borderRadius="md">
        <Text fontSize="lg" mb="2">
          لا توجد حجوزات
        </Text>
        <Text color="gray.500">
          لم يتم العثور على أي حجوزات فنادق مطابقة للمعايير المحددة
        </Text>
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th cursor="pointer" onClick={() => handleSort('bookingNumber')}>
              رقم الحجز
              {sortField === 'bookingNumber' && (
                <Text as="span" ml="1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </Th>
            <Th cursor="pointer" onClick={() => handleSort('customerName')}>
              العميل
              {sortField === 'customerName' && (
                <Text as="span" ml="1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </Th>
            <Th>اسم الفندق</Th>
            <Th cursor="pointer" onClick={() => handleSort('checkInDate')}>
              تاريخ الوصول
              {sortField === 'checkInDate' && (
                <Text as="span" ml="1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </Th>
            <Th cursor="pointer" onClick={() => handleSort('checkOutDate')}>
              تاريخ المغادرة
              {sortField === 'checkOutDate' && (
                <Text as="span" ml="1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </Th>
            <Th>المدينة</Th>
            <Th cursor="pointer" onClick={() => handleSort('status')}>
              الحالة
              {sortField === 'status' && (
                <Text as="span" ml="1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </Th>
            <Th isNumeric cursor="pointer" onClick={() => handleSort('totalAmount')}>
              التكلفة
              {sortField === 'totalAmount' && (
                <Text as="span" ml="1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </Th>
            <Th>الإجراءات</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <Tr>
              <Td colSpan={9} textAlign="center" py="8">
                <Spinner size="xl" />
              </Td>
            </Tr>
          ) : (
            bookings.map((booking) => (
              <Tr key={booking.id}>
                <Td fontWeight="medium">{booking.bookingNumber || booking.id.slice(0, 8)}</Td>
                <Td>{booking.customerName}</Td>
                <Td>{booking.hotelName}</Td>
                <Td>
                  {booking.checkInDate
                    ? formatDate(
                        booking.checkInDate.seconds
                          ? new Date(booking.checkInDate.seconds * 1000)
                          : new Date(booking.checkInDate)
                      )
                    : '-'}
                </Td>
                <Td>
                  {booking.checkOutDate
                    ? formatDate(
                        booking.checkOutDate.seconds
                          ? new Date(booking.checkOutDate.seconds * 1000)
                          : new Date(booking.checkOutDate)
                      )
                    : '-'}
                </Td>
                <Td>{booking.city || '-'}</Td>
                <Td>
                  <StatusBadge status={booking.status} />
                </Td>
                <Td isNumeric>{formatAmount(booking.totalAmount)}</Td>
                <Td>
                  <Menu>
                    <Tooltip label="خيارات">
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                      />
                    </Tooltip>
                    <MenuList>
                      <MenuItem icon={<FiEye />} onClick={() => onViewBooking(booking)}>
                        عرض التفاصيل
                      </MenuItem>
                      <MenuItem icon={<FiEdit />} onClick={() => onEditBooking(booking)}>
                        تعديل
                      </MenuItem>
                      <MenuItem icon={<FiPrinter />} onClick={() => onPrintVoucher(booking)}>
                        طباعة القسيمة
                      </MenuItem>
                      <MenuItem icon={<FiFileText />} onClick={() => console.log('المستندات', booking.id)}>
                        المستندات
                      </MenuItem>
                      <MenuItem
                        icon={<FiTrash2 />}
                        color="red.500"
                        onClick={() => onDeleteBooking(booking.id)}
                      >
                        حذف
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Box>
  );
};

export default HotelBookingTable;
