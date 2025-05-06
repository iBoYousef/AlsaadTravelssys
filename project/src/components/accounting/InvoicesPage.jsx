import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Text,
  useDisclosure,
  VStack,
  IconButton,
  Heading,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Spinner,
  Badge
} from '@chakra-ui/react';
import { formatCurrency } from '../../utils/formatters';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaArrowRight, FaUser, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import CustomerSearch from '../shared/CustomerSearch';
import DirectDeleteButton from '../shared/DirectDeleteButton';
import { paymentMethods, getPaymentMethodLabel, validatePaymentMethod } from '../../constants/paymentMethods';
import * as accountingService from '../../services/accountingService';

import { getInvoices } from '../../services/accountingService';

const InvoicesPage = () => {
  const { user } = useAuth();

  // فحص صلاحيات المستخدم
  const isAccountingAdmin = user && (user.isAdmin === true || user.role === 'admin' || user.role === 'superadmin' || user.jobTitle === 'مسؤول النظام');

  console.log('InvoicesPage: بيانات المستخدم:', user, 'صلاحيات المحاسبة:', isAccountingAdmin);
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    type: ''
  });
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    customerName: '',
    customerPhone: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    status: 'pending',
    type: 'customer',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentMethod: 'cash',
    installments: [],
    notes: ''
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // خيارات حالة الفاتورة
  const invoiceStatuses = [
    { value: 'pending', label: 'معلقة' },
    { value: 'paid', label: 'مدفوعة' },
    { value: 'partial', label: 'مدفوعة جزئياً' },
    { value: 'cancelled', label: 'ملغاة' }
  ];

  // خيارات نوع الفاتورة
  const invoiceTypes = [
    { value: 'customer', label: 'فاتورة عميل' },
    { value: 'supplier', label: 'فاتورة مورد' }
  ];

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await getInvoices({ user, ...filters });
      
      if (response && response.success && Array.isArray(response.data)) {
        // تطبيق البحث النصي
        const filteredInvoices = searchTerm 
          ? response.data.filter(invoice => 
              invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              invoice.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : response.data;
        
        setInvoices(filteredInvoices);
      } else {
        setInvoices([]);
        console.error("Error fetching invoices:", response?.error || "Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    
    // إعادة حساب المجموع للعنصر
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    // إعادة حساب المجموع الكلي
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (formData.tax / 100);
    const discountAmount = formData.discount;
    const total = subtotal + taxAmount - discountAmount;
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      total
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      // toast.error("يجب أن تحتوي الفاتورة على عنصر واحد على الأقل");
      return;
    }
    
    const updatedItems = formData.items.filter((_, i) => i !== index);
    
    // إعادة حساب المجموع الكلي
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (formData.tax / 100);
    const discountAmount = formData.discount;
    const total = subtotal + taxAmount - discountAmount;
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      total
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      type: ''
    });
    setSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingInvoice) {
        // تحديث فاتورة موجودة
        const response = await updateInvoice(editingInvoice.id, { ...formData, user });
        if (response.success) {
          setShowForm(false);
          setEditingInvoice(null);
          fetchInvoices();
        }
      } else {
        // إضافة فاتورة جديدة
        const response = await addInvoice({ ...formData, user });
        if (response.success) {
          setShowForm(false);
          fetchInvoices();
        }
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        const response = await accountingService.deleteInvoice(id);
        if (response.success) {
          fetchInvoices();
        }
      } catch (error) {
        console.error("Error deleting invoice:", error);
      }
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone || '',
      items: invoice.items,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total: invoice.total,
      status: invoice.status,
      type: invoice.type,
      date: invoice.date,
      dueDate: invoice.dueDate || '',
      paymentMethod: invoice.paymentMethod || 'cash',
      installments: invoice.installments || [],
      notes: invoice.notes || ''
    });
    onOpen();
    setShowForm(true);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerName: `${customer.nameAr1} ${customer.nameAr2} ${customer.nameAr3}`,
      customerPhone: customer.phoneNumber
    }));
  };

  const resetForm = () => {
    setFormData({
      invoiceNumber: '',
      customerName: '',
      customerPhone: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      status: 'pending',
      type: 'customer',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      paymentMethod: 'cash',
      installments: [],
      notes: ''
    });
    setSelectedCustomer(null);
  };

  const handleNewInvoice = () => {
    setEditingInvoice(null);
    resetForm();
    onOpen();
  };

  const handlePaymentMethodChange = (e) => {
    const method = e.target.value;
    setFormData(prev => {
      const newData = {
        ...prev,
        paymentMethod: method,
        dueDate: method === 'credit' ? prev.dueDate : '',
        installments: method === 'installments' ? [
          { amount: 0, dueDate: '' },
          { amount: 0, dueDate: '' },
          { amount: 0, dueDate: '' },
          { amount: 0, dueDate: '' }
        ] : []
      };
      return newData;
    });
  };

  const handleInstallmentChange = (index, field, value) => {
    setFormData(prev => {
      const newInstallments = [...prev.installments];
      newInstallments[index] = {
        ...newInstallments[index],
        [field]: value
      };
      return {
        ...prev,
        installments: newInstallments
      };
    });
  };

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

      {/* عنوان الصفحة وأزرار التحكم */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" display="flex" alignItems="center" gap={2}>
          <FaPlus />
          إنشاء فاتورة جديدة
        </Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleNewInvoice}>
          فاتورة جديدة
        </Button>
      </Flex>

      {/* نموذج إنشاء/تعديل الفاتورة */}
      <Drawer isOpen={isOpen} placement="right" size="xl" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            {editingInvoice ? 'تعديل الفاتورة' : 'إنشاء فاتورة جديدة'}
          </DrawerHeader>

          <DrawerBody>
            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                {/* معلومات العميل */}
                <Box>
                  <Heading size="md" mb={4}>معلومات العميل</Heading>
                  <CustomerSearch
                    onSelect={(customer) => {
                      setSelectedCustomer(customer);
                      setFormData(prev => ({
                        ...prev,
                        customerName: customer.name,
                        customerPhone: customer.phone
                      }));
                    }}
                  />
                  {!selectedCustomer && (
                    <Alert status="warning" mt={2}>
                      <AlertIcon />
                      يجب اختيار عميل مسجل قبل إنشاء الفاتورة
                    </Alert>
                  )}
                </Box>

                {/* معلومات الفاتورة */}
                <Box>
                  <Heading size="md" mb={4}>معلومات الفاتورة</Heading>
                  <FormControl isRequired>
                    <FormLabel>رقم الفاتورة</FormLabel>
                    <Input
                      name="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={handleInputChange}
                    />
                  </FormControl>

                  <FormControl mt={4} isRequired>
                    <FormLabel>تاريخ الفاتورة</FormLabel>
                    <Input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                    />
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel>نوع الفاتورة</FormLabel>
                    <Select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                    >
                      {invoiceTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel>حالة الفاتورة</FormLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      {invoiceStatuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel>طريقة الدفع</FormLabel>
                    <Select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handlePaymentMethodChange}
                    >
                      {paymentMethods.map(method => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {/* حقول إضافية حسب طريقة الدفع */}
                  {formData.paymentMethod === 'credit' && (
                    <FormControl mt={4} isRequired>
                      <FormLabel>تاريخ الاستحقاق</FormLabel>
                      <Input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                  )}

                  {formData.paymentMethod === 'installments' && (
                    <Box mt={4}>
                      <Heading size="sm" mb={2}>الأقساط</Heading>
                      {formData.installments.map((installment, index) => (
                        <HStack key={index} mt={2}>
                          <FormControl>
                            <FormLabel>المبلغ (د.ك)</FormLabel>
                            <Input
                              type="number"
                              value={installment.amount}
                              onChange={(e) => handleInstallmentChange(index, 'amount', parseFloat(e.target.value))}
                              step="0.001"
                              min="0"
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>تاريخ الاستحقاق</FormLabel>
                            <Input
                              type="date"
                              value={installment.dueDate}
                              onChange={(e) => handleInstallmentChange(index, 'dueDate', e.target.value)}
                            />
                          </FormControl>
                        </HStack>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* عناصر الفاتورة */}
                <Box>
                  <Heading size="md" mb={4}>عناصر الفاتورة</Heading>
                  {formData.items.map((item, index) => (
                    <HStack key={index} mt={2}>
                      <FormControl>
                        <FormLabel>الوصف</FormLabel>
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>الكمية</FormLabel>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>السعر (د.ك)</FormLabel>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                          step="0.001"
                          min="0"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>المجموع (د.ك)</FormLabel>
                        <Input
                          value={formatCurrency(item.total)}
                          isReadOnly
                        />
                      </FormControl>
                      <IconButton
                        aria-label="حذف العنصر"
                        icon={<FaTrash />}
                        colorScheme="red"
                        onClick={() => removeItem(index)}
                      />
                    </HStack>
                  ))}
                  <Button mt={2} onClick={addItem}>إضافة عنصر</Button>
                </Box>

                {/* المجاميع والضرائب */}
                <Box>
                  <Heading size="md" mb={4}>المجاميع</Heading>
                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel>المجموع الفرعي (د.ك)</FormLabel>
                      <Input
                        value={formatCurrency(formData.subtotal)}
                        isReadOnly
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>الضريبة (%)</FormLabel>
                      <Input
                        type="number"
                        name="tax"
                        value={formData.tax}
                        onChange={handleInputChange}
                        step="0.001"
                        min="0"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>الخصم (د.ك)</FormLabel>
                      <Input
                        type="number"
                        name="discount"
                        value={formData.discount}
                        onChange={handleInputChange}
                        step="0.001"
                        min="0"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>المجموع النهائي (د.ك)</FormLabel>
                      <Input
                        value={formatCurrency(formData.total)}
                        isReadOnly
                      />
                    </FormControl>
                  </HStack>
                </Box>

                {/* الملاحظات */}
                <FormControl>
                  <FormLabel>ملاحظات</FormLabel>
                  <Input
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </FormControl>

                {/* أزرار الحفظ والإلغاء */}
                <HStack spacing={4}>
                  <Button colorScheme="blue" type="submit" isDisabled={!selectedCustomer}>
                    {editingInvoice ? 'تحديث الفاتورة' : 'إنشاء الفاتورة'}
                  </Button>
                  <Button onClick={onClose}>إلغاء</Button>
                </HStack>
              </VStack>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* قائمة الفواتير */}
      <Box bg="white" rounded="md" shadow="sm" p={4}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">قائمة الفواتير</Heading>
          
          {/* فلاتر البحث */}
          <HStack spacing={4}>
            <FormControl maxW="200px">
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FormControl>
            
            <FormControl maxW="150px">
              <Input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                placeholder="من تاريخ"
              />
            </FormControl>
            
            <FormControl maxW="150px">
              <Input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                placeholder="إلى تاريخ"
              />
            </FormControl>
            
            <FormControl maxW="150px">
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">كل الحالات</option>
                {invoiceStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl maxW="150px">
              <Select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">كل الأنواع</option>
                {invoiceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <Button
              colorScheme="gray"
              onClick={resetFilters}
            >
              إعادة تعيين
            </Button>
          </HStack>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" h="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>رقم الفاتورة</Th>
                <Th>العميل</Th>
                <Th>التاريخ</Th>
                <Th>المبلغ</Th>
                <Th>طريقة الدفع</Th>
                <Th>الحالة</Th>
                <Th>الإجراءات</Th>
              </Tr>
            </Thead>
            <Tbody>
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <Tr key={invoice.id}>
                    <Td>{invoice.invoiceNumber}</Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{invoice.customerName}</Text>
                        <Text fontSize="sm" color="gray.600">{invoice.customerPhone}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text>{invoice.date}</Text>
                        {invoice.dueDate && (
                          <Text fontSize="sm" color="gray.600">
                            تاريخ الاستحقاق: {invoice.dueDate}
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td isNumeric>
                      <VStack align="end" spacing={0}>
                        <Text fontWeight="bold">{formatCurrency(invoice.total)}</Text>
                        {invoice.paymentMethod === 'installments' && (
                          <Text fontSize="sm" color="gray.600">
                            {invoice.installments.length} أقساط
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-full"
                          title="تعديل"
                        >
                          <FaEdit size={18} />
                        </button>
                        {isAccountingAdmin && (
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            className="text-red-600 hover:text-red-900 bg-red-100 p-2 rounded-full"
                            title="حذف"
                          >
                            <FaTrash size={18} />
                          </button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={7} className="text-center py-8">
                    لا توجد فواتير متطابقة مع معايير البحث
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        )}
      </Box>
    </Container>
  );
};

export default InvoicesPage;
