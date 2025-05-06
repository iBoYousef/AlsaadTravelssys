import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Grid,
  GridItem,
  Flex,
  Text,
  Divider,
  VStack,
  HStack,
  Badge,
  useToast,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  Checkbox
} from '@chakra-ui/react';
import { FiCalendar, FiUser, FiDollarSign } from 'react-icons/fi';
import { customerService, tourPackageService } from '../../services/api';
import { formatAmount } from '../../utils/validationUtils';

/**
 * مكون نموذج حجز البرامج السياحية
 */
const TourBookingForm = ({ booking, onSubmit, onClose }) => {
  const toast = useToast();
  
  // حالة النموذج
  const [formData, setFormData] = useState({
    packageId: '',
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    travelDate: '',
    returnDate: '',
    travelers: 1,
    adults: 1,
    children: 0,
    totalAmount: 0,
    paidAmount: 0,
    notes: '',
    status: 'pending',
    isNewCustomer: false
  });
  
  // حالة الخطأ
  const [errors, setErrors] = useState({});
  
  // حالة التحميل
  const [loading, setLoading] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  // قوائم البيانات
  const [packages, setPackages] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  // تهيئة النموذج بالبيانات الحالية إذا كانت موجودة
  useEffect(() => {
    if (booking) {
      setFormData({
        packageId: booking.packageId || '',
        customerId: booking.customerId || '',
        customerName: booking.customerName || '',
        customerPhone: booking.customerPhone || '',
        customerEmail: booking.customerEmail || '',
        travelDate: booking.travelDate || '',
        returnDate: booking.returnDate || '',
        travelers: booking.travelers || 1,
        adults: booking.adults || 1,
        children: booking.children || 0,
        totalAmount: booking.totalAmount || 0,
        paidAmount: booking.paidAmount || 0,
        notes: booking.notes || '',
        status: booking.status || 'pending',
        isNewCustomer: false
      });
    }
  }, [booking]);
  
  // جلب قائمة البرامج السياحية
  useEffect(() => {
    const fetchPackages = async () => {
      setLoadingPackages(true);
      try {
        const data = await tourPackageService.getAllPackages();
        // فلترة البرامج النشطة فقط
        const activePackages = data.filter(pkg => pkg.active);
        setPackages(activePackages);
      } catch (error) {
        console.error('خطأ في جلب البرامج السياحية:', error);
        toast({
          title: 'خطأ في جلب البرامج السياحية',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoadingPackages(false);
      }
    };
    
    fetchPackages();
  }, [toast]);
  
  // جلب قائمة العملاء
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const data = await customerService.getAllCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('خطأ في جلب بيانات العملاء:', error);
        toast({
          title: 'خطأ في جلب بيانات العملاء',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoadingCustomers(false);
      }
    };
    
    fetchCustomers();
  }, [toast]);
  
  // جلب تفاصيل البرنامج السياحي عند اختياره
  useEffect(() => {
    const fetchPackageDetails = async () => {
      if (!formData.packageId) {
        setSelectedPackage(null);
        return;
      }
      
      const pkg = packages.find(p => p.id === formData.packageId);
      if (pkg) {
        setSelectedPackage(pkg);
        
        // تحديث المبلغ الإجمالي بناءً على عدد المسافرين وسعر البرنامج
        const price = pkg.discountPrice && pkg.discountPrice < pkg.price 
          ? pkg.discountPrice 
          : pkg.price;
        
        const totalAmount = price * formData.travelers;
        
        setFormData(prev => ({
          ...prev,
          totalAmount
        }));
      }
    };
    
    fetchPackageDetails();
  }, [formData.packageId, formData.travelers, packages]);
  
  // تحديث حقل في النموذج
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // مسح رسالة الخطأ عند تغيير القيمة
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // تحديث حقل رقمي في النموذج
  const handleNumberChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // تحديث عدد المسافرين الإجمالي عند تغيير عدد البالغين أو الأطفال
    if (name === 'adults' || name === 'children') {
      const adults = name === 'adults' ? value : formData.adults;
      const children = name === 'children' ? value : formData.children;
      const travelers = adults + children;
      
      setFormData(prev => ({
        ...prev,
        travelers
      }));
    }
    
    // مسح رسالة الخطأ عند تغيير القيمة
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // تبديل حالة العميل الجديد
  const handleToggleNewCustomer = () => {
    setFormData(prev => ({
      ...prev,
      isNewCustomer: !prev.isNewCustomer,
      customerId: !prev.isNewCustomer ? '' : prev.customerId
    }));
  };
  
  // تحديث بيانات العميل عند اختياره
  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    
    if (customerId === '') {
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: ''
      }));
      return;
    }
    
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name || '',
        customerPhone: customer.phone || '',
        customerEmail: customer.email || ''
      }));
    }
  };
  
  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.packageId) {
      newErrors.packageId = 'يرجى اختيار البرنامج السياحي';
    }
    
    if (!formData.isNewCustomer && !formData.customerId) {
      newErrors.customerId = 'يرجى اختيار العميل';
    }
    
    if (formData.isNewCustomer) {
      if (!formData.customerName) {
        newErrors.customerName = 'يرجى إدخال اسم العميل';
      }
      
      if (!formData.customerPhone) {
        newErrors.customerPhone = 'يرجى إدخال رقم هاتف العميل';
      }
    }
    
    if (!formData.travelDate) {
      newErrors.travelDate = 'يرجى تحديد تاريخ السفر';
    }
    
    if (formData.travelers < 1) {
      newErrors.travelers = 'يجب أن يكون عدد المسافرين 1 على الأقل';
    }
    
    if (formData.totalAmount <= 0) {
      newErrors.totalAmount = 'يجب أن يكون المبلغ الإجمالي أكبر من 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // إرسال النموذج
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى التحقق من البيانات المدخلة',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // إنشاء كائن البيانات للإرسال
      const bookingData = {
        ...formData,
        packageName: selectedPackage?.name || '',
        destination: selectedPackage?.destination || '',
        duration: selectedPackage?.duration || '',
      };
      
      // حذف الحقول غير المطلوبة
      delete bookingData.isNewCustomer;
      
      // إرسال البيانات
      await onSubmit(bookingData);
      
      toast({
        title: booking ? 'تم تحديث الحجز' : 'تم إنشاء الحجز',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error('خطأ في حفظ الحجز:', error);
      toast({
        title: 'خطأ في حفظ الحجز',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4">
        {/* اختيار البرنامج السياحي */}
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <FormControl isRequired isInvalid={errors.packageId}>
            <FormLabel>البرنامج السياحي</FormLabel>
            <Select
              name="packageId"
              value={formData.packageId}
              onChange={handleChange}
              placeholder="اختر البرنامج السياحي"
              isDisabled={loadingPackages}
            >
              {packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} - {pkg.destination} ({pkg.duration})
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.packageId}</FormErrorMessage>
          </FormControl>
        </GridItem>
        
        {/* معلومات البرنامج المختار */}
        {selectedPackage && (
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Box p="3" bg="blue.50" borderRadius="md" mb="4">
              <Flex justify="space-between" align="center">
                <VStack align="flex-start" spacing="1">
                  <Text fontWeight="bold">{selectedPackage.name}</Text>
                  <Text fontSize="sm">
                    {selectedPackage.destination} - {selectedPackage.duration}
                  </Text>
                </VStack>
                <VStack align="flex-end" spacing="1">
                  <Text fontWeight="bold">
                    {selectedPackage.discountPrice && selectedPackage.discountPrice < selectedPackage.price ? (
                      <>
                        <Text as="s" display="inline" color="gray.500" mr="2">
                          {formatAmount(selectedPackage.price)}
                        </Text>
                        {formatAmount(selectedPackage.discountPrice)}
                      </>
                    ) : (
                      formatAmount(selectedPackage.price)
                    )}
                  </Text>
                  <Badge colorScheme={selectedPackage.active ? 'green' : 'red'}>
                    {selectedPackage.active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </VStack>
              </Flex>
            </Box>
          </GridItem>
        )}
        
        {/* اختيار العميل أو إدخال بيانات عميل جديد */}
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Flex align="center" mb="2">
            <FormLabel mb="0" mr="2">بيانات العميل</FormLabel>
            <Checkbox
              isChecked={formData.isNewCustomer}
              onChange={handleToggleNewCustomer}
            >
              عميل جديد
            </Checkbox>
          </Flex>
          
          {!formData.isNewCustomer ? (
            <FormControl isRequired isInvalid={errors.customerId}>
              <Select
                name="customerId"
                value={formData.customerId}
                onChange={handleCustomerChange}
                placeholder="اختر العميل"
                isDisabled={loadingCustomers}
              >
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.customerId}</FormErrorMessage>
            </FormControl>
          ) : (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap="3">
              <FormControl isRequired isInvalid={errors.customerName}>
                <FormLabel>اسم العميل</FormLabel>
                <Input
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="أدخل اسم العميل"
                />
                <FormErrorMessage>{errors.customerName}</FormErrorMessage>
              </FormControl>
              
              <FormControl isRequired isInvalid={errors.customerPhone}>
                <FormLabel>رقم الهاتف</FormLabel>
                <Input
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  placeholder="أدخل رقم الهاتف"
                />
                <FormErrorMessage>{errors.customerPhone}</FormErrorMessage>
              </FormControl>
              
              <FormControl>
                <FormLabel>البريد الإلكتروني</FormLabel>
                <Input
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  placeholder="أدخل البريد الإلكتروني"
                  type="email"
                />
              </FormControl>
            </Grid>
          )}
        </GridItem>
        
        <Divider gridColumn={{ md: '1 / span 2' }} my="2" />
        
        {/* تفاصيل الرحلة */}
        <GridItem>
          <FormControl isRequired isInvalid={errors.travelDate}>
            <FormLabel>تاريخ السفر</FormLabel>
            <Input
              name="travelDate"
              value={formData.travelDate}
              onChange={handleChange}
              type="date"
            />
            <FormErrorMessage>{errors.travelDate}</FormErrorMessage>
          </FormControl>
        </GridItem>
        
        <GridItem>
          <FormControl>
            <FormLabel>تاريخ العودة</FormLabel>
            <Input
              name="returnDate"
              value={formData.returnDate}
              onChange={handleChange}
              type="date"
            />
          </FormControl>
        </GridItem>
        
        <GridItem>
          <FormControl isRequired isInvalid={errors.adults}>
            <FormLabel>عدد البالغين</FormLabel>
            <NumberInput
              min={1}
              value={formData.adults}
              onChange={(value) => handleNumberChange('adults', parseInt(value))}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormErrorMessage>{errors.adults}</FormErrorMessage>
          </FormControl>
        </GridItem>
        
        <GridItem>
          <FormControl>
            <FormLabel>عدد الأطفال</FormLabel>
            <NumberInput
              min={0}
              value={formData.children}
              onChange={(value) => handleNumberChange('children', parseInt(value))}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </GridItem>
        
        <GridItem>
          <FormControl isRequired isInvalid={errors.totalAmount}>
            <FormLabel>المبلغ الإجمالي</FormLabel>
            <InputGroup>
              <InputRightElement pointerEvents="none">
                <FiDollarSign color="gray.300" />
              </InputRightElement>
              <Input
                name="totalAmount"
                value={formData.totalAmount}
                onChange={(e) => handleNumberChange('totalAmount', parseFloat(e.target.value))}
                type="number"
                min="0"
                step="0.01"
              />
            </InputGroup>
            <FormErrorMessage>{errors.totalAmount}</FormErrorMessage>
          </FormControl>
        </GridItem>
        
        <GridItem>
          <FormControl>
            <FormLabel>المبلغ المدفوع</FormLabel>
            <InputGroup>
              <InputRightElement pointerEvents="none">
                <FiDollarSign color="gray.300" />
              </InputRightElement>
              <Input
                name="paidAmount"
                value={formData.paidAmount}
                onChange={(e) => handleNumberChange('paidAmount', parseFloat(e.target.value))}
                type="number"
                min="0"
                step="0.01"
              />
            </InputGroup>
          </FormControl>
        </GridItem>
        
        <GridItem>
          <FormControl>
            <FormLabel>حالة الحجز</FormLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="pending">قيد الانتظار</option>
              <option value="confirmed">مؤكد</option>
              <option value="cancelled">ملغي</option>
              <option value="completed">مكتمل</option>
            </Select>
          </FormControl>
        </GridItem>
        
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <FormControl>
            <FormLabel>ملاحظات</FormLabel>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="أدخل أي ملاحظات إضافية حول الحجز"
              rows={3}
            />
          </FormControl>
        </GridItem>
      </Grid>
      
      <Flex justify="flex-end" mt="6">
        <Button variant="outline" mr="3" onClick={onClose}>
          إلغاء
        </Button>
        <Button
          colorScheme="blue"
          type="submit"
          isLoading={loading}
          loadingText="جاري الحفظ..."
        >
          {booking ? 'تحديث الحجز' : 'إنشاء الحجز'}
        </Button>
      </Flex>
    </Box>
  );
};

export default TourBookingForm;
