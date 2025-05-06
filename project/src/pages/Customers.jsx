import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Heading,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Stack,
  Badge,
  Text,
  useToast,
  Spinner,
  Select,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import {
  FiSearch,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiEye,
  FiFileText,
  FiPhone,
  FiMail
} from 'react-icons/fi';
import { customerService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSystemLog } from '../hooks/useSystemLog';
import { isValidEmail, isValidPhone, formatDate } from '../utils/validationUtils';
import { getRequiredCustomerFields } from '../utils/requiredCustomerFields';
import BackButton from '../components/shared/BackButton';

/**
 * نموذج إضافة/تعديل عميل
 */
const CustomerForm = ({ customer, onSubmit, onClose, requiredFieldsSettings }) => {
  const initialRef = useRef();
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '', // الرقم المدني
    email: '',
    phone: '',
    nationality: '',
    passportNumber: '',
    address: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // تحميل بيانات العميل إذا كان في وضع التعديل
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        idNumber: customer.idNumber || '',
        email: customer.email || '',
        phone: customer.phone || '',
        nationality: customer.nationality || '',
        passportNumber: customer.passportNumber || '',
        address: customer.address || '',
        notes: customer.notes || ''
      });
    }
  }, [customer]);

  // تحديث بيانات النموذج
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // مسح رسالة الخطأ عند تعديل الحقل
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};
    // جلب الحقول الإجبارية من الإعدادات أو الافتراضي
    const requiredFields = getRequiredCustomerFields(requiredFieldsSettings);
    requiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        switch(field) {
          case 'name': newErrors.name = 'اسم العميل مطلوب'; break;
          case 'idNumber': newErrors.idNumber = 'الرقم المدني مطلوب'; break;
          case 'passportNumber': newErrors.passportNumber = 'رقم الجواز مطلوب'; break;
          case 'phone': newErrors.phone = 'رقم الهاتف مطلوب'; break;
          case 'email': newErrors.email = 'البريد الإلكتروني مطلوب'; break;
          case 'nationality': newErrors.nationality = 'الجنسية مطلوبة'; break;
          case 'address': newErrors.address = 'العنوان مطلوب'; break;
          case 'notes': newErrors.notes = 'الملاحظات مطلوبة'; break;
          default: newErrors[field] = 'هذا الحقل مطلوب';
        }
      }
    });
    // تحقق إضافي لصحة البريد والهاتف
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }
    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'رقم الهاتف غير صالح';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // إرسال النموذج
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('خطأ في حفظ بيانات العميل:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing="4">
        {/* حقل الرقم المدني */}
        <FormControl isRequired isInvalid={!!errors.idNumber}>
          <FormLabel>الرقم المدني</FormLabel>
          <Input
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            placeholder="أدخل الرقم المدني"
            dir="ltr"
          />
          <FormErrorMessage>{errors.idNumber}</FormErrorMessage>
        </FormControl>
        {/* اسم العميل */}
        <FormControl isRequired isInvalid={!!errors.name}>
          <FormLabel>اسم العميل</FormLabel>
          <Input
            ref={initialRef}
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="أدخل اسم العميل"
          />
          <FormErrorMessage>{errors.name}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.phone}>
          <FormLabel>رقم الهاتف</FormLabel>
          <Input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="أدخل رقم الهاتف"
            dir="ltr"
          />
          <FormErrorMessage>{errors.phone}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.email}>
          <FormLabel>البريد الإلكتروني</FormLabel>
          <Input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="أدخل البريد الإلكتروني"
            dir="ltr"
          />
          <FormErrorMessage>{errors.email}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.nationality}>
          <FormLabel>الجنسية</FormLabel>
          <Input
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            placeholder="أدخل الجنسية"
          />
          <FormErrorMessage>{errors.nationality}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.passportNumber}>
          <FormLabel>رقم جواز السفر</FormLabel>
          <Input
            name="passportNumber"
            value={formData.passportNumber}
            onChange={handleChange}
            placeholder="أدخل رقم جواز السفر"
            dir="ltr"
          />
          <FormErrorMessage>{errors.passportNumber}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.address}>
          <FormLabel>العنوان</FormLabel>
          <Input
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="أدخل العنوان"
          />
          <FormErrorMessage>{errors.address}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.notes}>
          <FormLabel>ملاحظات</FormLabel>
          <Input
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="أدخل ملاحظات إضافية"
          />
          <FormErrorMessage>{errors.notes}</FormErrorMessage>
        </FormControl>

        {errors.submit && (
          <Text color="red.500" fontSize="sm">
            {errors.submit}
          </Text>
        )}
      </Stack>

      <Flex justify="flex-end" mt="6">
        <Button variant="outline" mr="3" onClick={onClose}>
          إلغاء
        </Button>
        <Button
          colorScheme="blue"
          type="submit"
          isLoading={isSubmitting}
          loadingText="جاري الحفظ..."
        >
          {customer ? 'تحديث' : 'إضافة'}
        </Button>
      </Flex>
    </form>
  );
};

/**
 * صفحة إدارة العملاء
 */
const Customers = () => {
  // إعدادات الحقول الإجبارية للعملاء
  const [requiredFieldsSettings, setRequiredFieldsSettings] = useState(null);

  // تحميل الإعدادات من localStorage
  useEffect(() => {
    const savedFields = localStorage.getItem('requiredCustomerFields');
    if (savedFields) {
      setRequiredFieldsSettings({ requiredCustomerFields: JSON.parse(savedFields) });
    } else {
      setRequiredFieldsSettings(null);
    }
  }, []);
  const { user, hasPermission } = useAuth();
  const { logAction } = useSystemLog();

  // تحديد صلاحية الحذف بناءً على الدور أو الصلاحيات
  const canDeleteCustomer = () => {
    if (!user) return false;
    // السماح فقط لمسؤول النظام أو المدير التنفيذي أو المدير العام
    return (
      user.role === 'admin' ||
      user.role === 'executive_manager' ||
      user.role === 'general_manager' ||
      user.isAdmin === true ||
      user.jobTitle === 'مسؤول النظام'
    );
  };

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState(null);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const toast = useToast();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef();

  // جلب بيانات العملاء عند تحميل الصفحة
  useEffect(() => {
    fetchCustomers();
  }, []);

  // تصفية العملاء عند تغيير مصطلح البحث
  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers, sortField, sortDirection]);

  // جلب بيانات العملاء
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('خطأ في جلب بيانات العملاء:', error);
      toast({
        title: 'خطأ في جلب بيانات العملاء',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // تصفية العملاء حسب مصطلح البحث
  const filterCustomers = () => {
    let filtered = [...customers];
    
    // تصفية حسب مصطلح البحث
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        customer =>
          customer.name?.toLowerCase().includes(term) ||
          customer.phone?.toLowerCase().includes(term) ||
          customer.email?.toLowerCase().includes(term) ||
          customer.passportNumber?.toLowerCase().includes(term)
      );
    }
    
    // ترتيب النتائج
    filtered.sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      // معالجة خاصة للتواريخ
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        valueA = valueA?.seconds ? new Date(valueA.seconds * 1000) : new Date(0);
        valueB = valueB?.seconds ? new Date(valueB.seconds * 1000) : new Date(0);
      }
      
      // معالجة القيم النصية
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
      }
      if (typeof valueB === 'string') {
        valueB = valueB.toLowerCase();
      }
      
      // الترتيب
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredCustomers(filtered);
  };

  // تغيير ترتيب العملاء
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // فتح نموذج إضافة عميل جديد
  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    onFormOpen();
  };

  // فتح نموذج تعديل عميل
  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    onFormOpen();
  };

  // فتح مربع حوار حذف عميل
  const handleDeleteClick = (customerId) => {
    setDeleteCustomerId(customerId);
    onDeleteOpen();
  };

  // حذف عميل
  const handleDeleteCustomer = async () => {
    try {
      await customerService.deleteCustomer(deleteCustomerId);
      setCustomers(prev => prev.filter(customer => customer.id !== deleteCustomerId));
      // تسجيل حدث الحذف في السجل
      await logAction('delete', `حذف عميل (ID: ${deleteCustomerId})`);
      toast({
        title: 'تم حذف العميل بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('خطأ في حذف العميل:', error);
      toast({
        title: 'خطأ في حذف العميل',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      setDeleteCustomerId(null);
    }
  };


  // حفظ بيانات العميل (إضافة/تعديل)
  const handleSubmitCustomer = async (formData) => {
    try {
      if (selectedCustomer) {
        // تعديل عميل موجود
        const updatedCustomer = await customerService.updateCustomer(selectedCustomer.id, formData);
        setCustomers(prev =>
          prev.map(customer =>
            customer.id === selectedCustomer.id ? { ...customer, ...updatedCustomer } : customer
          )
        );
        toast({
          title: 'تم تحديث بيانات العميل بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // إضافة عميل جديد
        const newCustomer = await customerService.createCustomer(formData);
        setCustomers(prev => [newCustomer, ...prev]);
        toast({
          title: 'تم إضافة العميل بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      return true;
    } catch (error) {
      console.error('خطأ في حفظ بيانات العميل:', error);
      toast({
        title: 'خطأ في حفظ بيانات العميل',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="6">
        <Box>
          <BackButton />
          <Heading size="lg">إدارة العملاء</Heading>
        </Box>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleAddCustomer}>
          إضافة عميل
        </Button>
      </Flex>

      {/* شريط البحث والفلترة */}
      <Flex mb="4" gap="4" flexWrap="wrap">
        <InputGroup maxW={{ base: 'full', md: '300px' }}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="بحث عن عميل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        <Select
          maxW={{ base: 'full', md: '200px' }}
          value={`${sortField}:${sortDirection}`}
          onChange={(e) => {
            const [field, direction] = e.target.value.split(':');
            setSortField(field);
            setSortDirection(direction);
          }}
        >
          <option value="name:asc">الاسم (تصاعدي)</option>
          <option value="name:desc">الاسم (تنازلي)</option>
          <option value="createdAt:desc">تاريخ الإضافة (الأحدث)</option>
          <option value="createdAt:asc">تاريخ الإضافة (الأقدم)</option>
        </Select>
      </Flex>

      {/* جدول العملاء */}
      {loading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" />
        </Flex>
      ) : filteredCustomers.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          h="200px"
          bg="gray.50"
          borderRadius="md"
          p="4"
        >
          <Text fontSize="lg" mb="2">
            لا يوجد عملاء
          </Text>
          <Text color="gray.500" mb="4">
            {searchTerm ? 'لا توجد نتائج مطابقة لبحثك' : 'قم بإضافة عملاء جدد للبدء'}
          </Text>
          {!searchTerm && (
            <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleAddCustomer}>
              إضافة عميل
            </Button>
          )}
        </Flex>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th cursor="pointer" onClick={() => handleSort('name')}>
                  الاسم
                  {sortField === 'name' && (
                    <Text as="span" ml="1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </Text>
                  )}
                </Th>
                <Th>رقم الهاتف</Th>
                <Th>البريد الإلكتروني</Th>
                <Th>الجنسية</Th>
                <Th cursor="pointer" onClick={() => handleSort('createdAt')}>
                  تاريخ الإضافة
                  {sortField === 'createdAt' && (
                    <Text as="span" ml="1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </Text>
                  )}
                </Th>
                <Th>الإجراءات</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredCustomers.map((customer) => (
                <Tr key={customer.id}>
                  <Td fontWeight="medium">{customer.name}</Td>
                  <Td>
                    <Flex align="center">
                      <IconButton
                        aria-label="اتصال"
                        icon={<FiPhone />}
                        size="sm"
                        variant="ghost"
                        mr="2"
                        as="a"
                        href={`tel:${customer.phone}`}
                      />
                      <Text dir="ltr">{customer.phone}</Text>
                    </Flex>
                  </Td>
                  <Td>
                    {customer.email ? (
                      <Flex align="center">
                        <IconButton
                          aria-label="إرسال بريد"
                          icon={<FiMail />}
                          size="sm"
                          variant="ghost"
                          mr="2"
                          as="a"
                          href={`mailto:${customer.email}`}
                        />
                        <Text dir="ltr">{customer.email}</Text>
                      </Flex>
                    ) : (
                      <Text color="gray.500">-</Text>
                    )}
                  </Td>
                  <Td>{customer.nationality || <Text color="gray.500">-</Text>}</Td>
                  <Td>
                    {customer.createdAt ? (
                      formatDate(new Date(customer.createdAt.seconds * 1000), 'short')
                    ) : (
                      <Text color="gray.500">-</Text>
                    )}
                  </Td>
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
                        <MenuItem icon={<FiEye />} onClick={() => console.log('عرض العميل', customer.id)}>
                          عرض التفاصيل
                        </MenuItem>
                        {canDeleteCustomer() ? (
                          <MenuItem
                            icon={<FiTrash2 />}
                            color="red.500"
                            onClick={() => handleDeleteClick(customer.id)}
                          >
                            حذف
                          </MenuItem>
                        ) : null}
                        <MenuItem icon={<FiEdit />} onClick={() => handleEditCustomer(customer)}>
                          تعديل
                        </MenuItem>
                        <MenuItem icon={<FiFileText />} onClick={() => console.log('حجوزات العميل', customer.id)}>
                          عرض الحجوزات
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* نموذج إضافة/تعديل عميل */}
      {isFormOpen && (
        <Modal isOpen={isFormOpen} onClose={onFormClose} initialFocusRef={cancelRef} size="lg" isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{selectedCustomer ? 'تعديل بيانات عميل' : 'إضافة عميل جديد'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <CustomerForm
                customer={selectedCustomer}
                onSubmit={handleSubmitCustomer}
                onClose={onFormClose}
                requiredFieldsSettings={requiredFieldsSettings}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* مربع حوار تأكيد الحذف */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              حذف العميل
            </AlertDialogHeader>

            <AlertDialogBody>
              هل أنت متأكد من رغبتك في حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={handleDeleteCustomer} mr={3}>
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default Customers;
