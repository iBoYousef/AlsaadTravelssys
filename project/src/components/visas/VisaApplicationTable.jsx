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
  Spinner,
  HStack,
  Tag,
  TagLabel,
  TagLeftIcon
} from '@chakra-ui/react';
import {
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEye,
  FiFileText,
  FiPrinter,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import { formatDate, formatAmount } from '../../utils/validationUtils';

// مكون لعرض حالة طلب التأشيرة بألوان مختلفة
const StatusBadge = ({ status }) => {
  const statusMap = {
    pending: { color: 'yellow', label: 'قيد المعالجة', icon: FiClock },
    submitted: { color: 'blue', label: 'تم التقديم', icon: FiFileText },
    approved: { color: 'green', label: 'تمت الموافقة', icon: FiCheckCircle },
    rejected: { color: 'red', label: 'مرفوض', icon: FiXCircle },
    completed: { color: 'teal', label: 'مكتمل', icon: FiCheckCircle },
    cancelled: { color: 'gray', label: 'ملغي', icon: FiXCircle },
    urgent: { color: 'orange', label: 'عاجل', icon: FiAlertCircle }
  };

  const statusInfo = statusMap[status] || { color: 'gray', label: status, icon: FiFileText };

  return (
    <Tag size="md" colorScheme={statusInfo.color} borderRadius="full" variant="subtle">
      <TagLeftIcon as={statusInfo.icon} />
      <TagLabel>{statusInfo.label}</TagLabel>
    </Tag>
  );
};

/**
 * مكون جدول طلبات التأشيرات
 * يعرض قائمة طلبات التأشيرات مع خيارات التعديل والحذف والعرض
 */
const VisaApplicationTable = ({
  applications,
  loading,
  onViewApplication,
  onEditApplication,
  onDeleteApplication,
  onPrintApplication,
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

  // عرض رسالة عندما لا توجد طلبات
  if (!loading && (!applications || applications.length === 0)) {
    return (
      <Box textAlign="center" py="10" bg="gray.50" borderRadius="md">
        <Text fontSize="lg" mb="2">
          لا توجد طلبات تأشيرات
        </Text>
        <Text color="gray.500">
          لم يتم العثور على أي طلبات تأشيرات مطابقة للمعايير المحددة
        </Text>
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th cursor="pointer" onClick={() => handleSort('applicationNumber')}>
              رقم الطلب
              {sortField === 'applicationNumber' && (
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
            <Th>نوع التأشيرة</Th>
            <Th>الدولة</Th>
            <Th cursor="pointer" onClick={() => handleSort('submissionDate')}>
              تاريخ التقديم
              {sortField === 'submissionDate' && (
                <Text as="span" ml="1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </Th>
            <Th cursor="pointer" onClick={() => handleSort('status')}>
              الحالة
              {sortField === 'status' && (
                <Text as="span" ml="1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </Th>
            <Th isNumeric cursor="pointer" onClick={() => handleSort('totalFees')}>
              الرسوم
              {sortField === 'totalFees' && (
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
            applications.map((application) => (
              <Tr key={application.id}>
                <Td fontWeight="medium">{application.applicationNumber || application.id.slice(0, 8)}</Td>
                <Td>{application.customerName}</Td>
                <Td>
                  <HStack>
                    <Text>{application.visaType}</Text>
                    {application.isUrgent && (
                      <Badge colorScheme="red" variant="solid">
                        عاجل
                      </Badge>
                    )}
                  </HStack>
                </Td>
                <Td>{application.country}</Td>
                <Td>
                  {application.submissionDate
                    ? formatDate(
                        application.submissionDate.seconds
                          ? new Date(application.submissionDate.seconds * 1000)
                          : new Date(application.submissionDate)
                      )
                    : '-'}
                </Td>
                <Td>
                  <StatusBadge status={application.status} />
                </Td>
                <Td isNumeric>{formatAmount(application.totalFees)}</Td>
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
                      <MenuItem icon={<FiEye />} onClick={() => onViewApplication(application)}>
                        عرض التفاصيل
                      </MenuItem>
                      <MenuItem icon={<FiEdit />} onClick={() => onEditApplication(application)}>
                        تعديل
                      </MenuItem>
                      <MenuItem icon={<FiPrinter />} onClick={() => onPrintApplication(application)}>
                        طباعة الطلب
                      </MenuItem>
                      <MenuItem icon={<FiFileText />} onClick={() => console.log('المستندات', application.id)}>
                        المستندات
                      </MenuItem>
                      <MenuItem
                        icon={<FiTrash2 />}
                        color="red.500"
                        onClick={() => onDeleteApplication(application.id)}
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

export default VisaApplicationTable;
