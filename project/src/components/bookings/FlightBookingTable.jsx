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
 * مكون جدول حجوزات الطيران
 * يعرض قائمة الحجوزات مع خيارات التعديل والحذف والعرض
 */
const FlightBookingTable = ({
  bookings,
  loading,
  onViewBooking,
  onEditBooking,
  onDeleteBooking,
  onPrintTicket,
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
          لم يتم العثور على أي حجوزات طيران مطابقة للمعايير المحددة
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
            <Th cursor="pointer" onClick={() => handleSort('departureDate')}>
              تاريخ السفر
              {sortField === 'departureDate' && (
                <Text as="span" ml="1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </Th>
            <Th>خط السير</Th>
            <Th>شركة الطيران</Th>
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
              <Td colSpan={8} textAlign="center" py="8">
                <Spinner size="xl" />
              </Td>
            </Tr>
          ) : (
            bookings.map((booking) => (
              <Tr key={booking.id}>
                <Td fontWeight="medium">{booking.bookingNumber || booking.id.slice(0, 8)}</Td>
                <Td>{booking.customerName}</Td>
                <Td>
                  {booking.departureDate
                    ? formatDate(
                        booking.departureDate.seconds
                          ? new Date(booking.departureDate.seconds * 1000)
                          : new Date(booking.departureDate)
                      )
                    : '-'}
                </Td>
                <Td>
                  <Flex direction="column">
                    <Text fontWeight="medium">
                      {booking.origin} → {booking.destination}
                    </Text>
                    {booking.returnDate && (
                      <Text fontSize="sm" color="gray.600">
                        ذهاب وعودة
                      </Text>
                    )}
                  </Flex>
                </Td>
                <Td>{booking.airline || '-'}</Td>
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
                      <MenuItem icon={<FiPrinter />} onClick={() => onPrintTicket(booking)}>
                        طباعة التذكرة
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

export default FlightBookingTable;
