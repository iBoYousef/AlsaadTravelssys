import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { 
  FaReceipt, 
  FaSearch, 
  FaTrash,
  FaPrint,
  FaSpinner,
  FaArrowLeft
} from 'react-icons/fa';
import { getReceipts, deleteReceipt } from '../../services/accountingService';

export default function ReceiptRecordsPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const response = await getReceipts({ user });
      
      if (response && response.success && Array.isArray(response.data)) {
        setReceipts(response.data);
      } else {
        setReceipts([]);
        toast({
          title: 'فشل في تحميل الإيصالات',
          description: response?.error || 'لم يتم العثور على بيانات صالحة',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل الإيصالات:', error);
      toast({
        title: 'حدث خطأ في تحميل الإيصالات',
        description: error.message || 'تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإيصال؟')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await deleteReceipt(id, { user });
      
      if (response && response.success) {
        toast({
          title: 'تم الحذف بنجاح',
          description: 'تم حذف الإيصال بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadReceipts();
      } else {
        toast({
          title: 'فشل في حذف الإيصال',
          description: response?.error || 'حدث خطأ أثناء محاولة حذف الإيصال',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('خطأ في حذف الإيصال:', error);
      toast({
        title: 'حدث خطأ في حذف الإيصال',
        description: error.message || 'تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = (receipt) => {
    // TODO: تنفيذ وظيفة الطباعة
    toast({
      title: 'سيتم تنفيذ وظيفة الطباعة قريباً',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const filteredReceipts = Array.isArray(receipts) ? receipts.filter(receipt => {
    if (!receipt) return false;
    const searchRegex = new RegExp(searchTerm, 'i');
    return (
      searchRegex.test(receipt.receiptNumber || '') ||
      searchRegex.test(receipt.customerName || '') ||
      searchRegex.test((receipt.amount || '').toString()) ||
      searchRegex.test(receipt.description || '')
    );
  }) : [];

  const sortedReceipts = [...filteredReceipts].sort((a, b) => {
    if (!a || !b) return 0;
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <Flex align="center" justify="center" minH="100vh">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.xl" p={4}>
      {/* رأس الصفحة */}
      <Flex justify="space-between" align="center" mb={6} bg="white" p={4} rounded="md" shadow="sm">
        <Button leftIcon={<FaArrowLeft />} onClick={() => navigate(-1)}>
          رجوع
        </Button>
        <Box>
          <Text fontSize="lg" fontWeight="bold">{user?.displayName}</Text>
          <Text color="gray.600">{user?.role === 'admin' ? 'مسؤول النظام' : 'موظف'}</Text>
        </Box>
      </Flex>

      {/* عنوان الصفحة وشريط البحث */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" display="flex" alignItems="center" gap={2}>
          <FaReceipt />
          سجل الإيصالات
        </Heading>
        <InputGroup maxW="300px">
          <Input
            placeholder="بحث..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <InputRightElement>
            <FaSearch color="gray.300" />
          </InputRightElement>
        </InputGroup>
      </Flex>

      {/* جدول الإيصالات */}
      <Box bg="white" rounded="md" shadow="sm" overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th cursor="pointer" onClick={() => handleSort('receiptNumber')}>
                رقم الإيصال
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('customerName')}>
                اسم العميل
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('amount')}>
                المبلغ
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('date')}>
                تاريخ الإنشاء
              </Th>
              <Th>الإجراءات</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedReceipts.length > 0 ? (
              sortedReceipts.map((receipt) => (
                <Tr key={receipt.id}>
                  <Td>{receipt.receiptNumber}</Td>
                  <Td>{receipt.customerName || 'غير محدد'}</Td>
                  <Td>{receipt.amount ? `${receipt.amount} د.ك` : '-'}</Td>
                  <Td>{receipt.date || '-'}</Td>
                  <Td>
                    <Flex gap={2}>
                      <IconButton
                        icon={<FaPrint />}
                        aria-label="طباعة"
                        colorScheme="blue"
                        onClick={() => handlePrint(receipt)}
                      />
                      {user?.isAdmin && (
                        <IconButton
                          icon={<FaTrash />}
                          aria-label="حذف"
                          colorScheme="red"
                          isLoading={isDeleting}
                          onClick={() => handleDelete(receipt.id)}
                        />
                      )}
                    </Flex>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={5} textAlign="center" py={4}>
                  لا توجد إيصالات متاحة
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </Container>
  );
}
