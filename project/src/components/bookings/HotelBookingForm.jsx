import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Stack,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  Textarea,
  InputGroup,
  InputRightAddon,
  useToast,
  HStack,
  VStack,
  Radio,
  RadioGroup
} from '@chakra-ui/react';
import { customerService } from '../../services/api';
import { isValidDate, formatDate } from '../../utils/validationUtils';

/**
 * مكون نموذج حجز الفنادق
 * يستخدم لإضافة حجز جديد أو تعديل حجز موجود
 */
const HotelBookingForm = ({ booking, onSubmit, onClose }) => {
  const initialRef = useRef();
  const toast = useToast();
  
  // حالة النموذج
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    hotelName: '',
    city: '',
    country: '',
    checkInDate: '',
    checkOutDate: '',
    roomType: 'standard', // standard, deluxe, suite
    numberOfRooms: 1,
    adults: 1,
    children: 0,
    mealPlan: 'breakfast', // breakfast, halfBoard, fullBoard, allInclusive
    specialRequests: '',
    totalAmount: '',
    paidAmount: '',
    paymentMethod: 'cash', // cash, card, transfer
    status: 'pending', // pending, confirmed, cancelled, completed
    notes: ''
  });
  
  // قائمة العملاء
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // جلب قائمة العملاء عند تحميل المكون
  useEffect(() => {
    const fetchCustomers = async () => {
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
      }
    };
    
    fetchCustomers();
  }, [toast]);
  
  // تحميل بيانات الحجز إذا كان في وضع التعديل
  useEffect(() => {
    if (booking) {
      // تنسيق التواريخ
      const checkInDate = booking.checkInDate
        ? formatDate(
            booking.checkInDate.seconds
              ? new Date(booking.checkInDate.seconds * 1000)
              : new Date(booking.checkInDate),
            'input'
          )
        : '';
      
      const checkOutDate = booking.checkOutDate
        ? formatDate(
            booking.checkOutDate.seconds
              ? new Date(booking.checkOutDate.seconds * 1000)
              : new Date(booking.checkOutDate),
            'input'
          )
        : '';
      
      setFormData({
        customerId: booking.customerId || '',
        customerName: booking.customerName || '',
        hotelName: booking.hotelName || '',
        city: booking.city || '',
        country: booking.country || '',
        checkInDate,
        checkOutDate,
        roomType: booking.roomType || 'standard',
        numberOfRooms: booking.numberOfRooms || 1,
        adults: booking.adults || 1,
        children: booking.children || 0,
        mealPlan: booking.mealPlan || 'breakfast',
        specialRequests: booking.specialRequests || '',
        totalAmount: booking.totalAmount || '',
        paidAmount: booking.paidAmount || '',
        paymentMethod: booking.paymentMethod || 'cash',
        status: booking.status || 'pending',
        notes: booking.notes || ''
      });
    }
  }, [booking]);
  
  // تحديث بيانات النموذج
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // مسح رسالة الخطأ عند تعديل الحقل
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // تحديث قيمة عددية
  const handleNumberChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // مسح رسالة الخطأ عند تعديل الحقل
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // تحديث اختيار العميل
  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    const selectedCustomer = customers.find(c => c.id === customerId);
    
    setFormData(prev => ({
      ...prev,
      customerId,
      customerName: selectedCustomer ? selectedCustomer.name : ''
    }));
    
    // مسح رسالة الخطأ
    if (errors.customerId) {
      setErrors(prev => ({ ...prev, customerId: '' }));
    }
  };
  
  // حساب عدد الليالي
  const calculateNights = () => {
    if (formData.checkInDate && formData.checkOutDate) {
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      
      if (isValidDate(checkIn) && isValidDate(checkOut)) {
        const diffTime = Math.abs(checkOut - checkIn);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      }
    }
    return 0;
  };
  
  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customerId) {
      newErrors.customerId = 'يرجى اختيار العميل';
    }
    
    if (!formData.hotelName) {
      newErrors.hotelName = 'يرجى إدخال اسم الفندق';
    }
    
    if (!formData.city) {
      newErrors.city = 'يرجى إدخال المدينة';
    }
    
    if (!formData.checkInDate) {
      newErrors.checkInDate = 'يرجى إدخال تاريخ الوصول';
    } else if (!isValidDate(formData.checkInDate)) {
      newErrors.checkInDate = 'تاريخ الوصول غير صالح';
    }
    
    if (!formData.checkOutDate) {
      newErrors.checkOutDate = 'يرجى إدخال تاريخ المغادرة';
    } else if (!isValidDate(formData.checkOutDate)) {
      newErrors.checkOutDate = 'تاريخ المغادرة غير صالح';
    } else if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
      newErrors.checkOutDate = 'يجب أن يكون تاريخ المغادرة بعد تاريخ الوصول';
    }
    
    if (!formData.totalAmount) {
      newErrors.totalAmount = 'يرجى إدخال إجمالي التكلفة';
    } else if (isNaN(formData.totalAmount) || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'يرجى إدخال قيمة صحيحة للتكلفة';
    }
    
    if (formData.paidAmount && (isNaN(formData.paidAmount) || parseFloat(formData.paidAmount) < 0)) {
      newErrors.paidAmount = 'يرجى إدخال قيمة صحيحة للمبلغ المدفوع';
    }
    
    if (formData.paidAmount && parseFloat(formData.paidAmount) > parseFloat(formData.totalAmount)) {
      newErrors.paidAmount = 'لا يمكن أن يكون المبلغ المدفوع أكبر من إجمالي التكلفة';
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
    
    setLoading(true);
    
    try {
      // تحويل التواريخ إلى كائنات Date
      const bookingData = {
        ...formData,
        checkInDate: new Date(formData.checkInDate),
        checkOutDate: new Date(formData.checkOutDate),
        numberOfRooms: parseInt(formData.numberOfRooms, 10),
        adults: parseInt(formData.adults, 10),
        children: parseInt(formData.children, 10),
        totalAmount: parseFloat(formData.totalAmount),
        paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : 0,
        nights: calculateNights()
      };
      
      await onSubmit(bookingData);
      onClose();
    } catch (error) {
      console.error('خطأ في حفظ بيانات الحجز:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing="6">
        {/* معلومات العميل */}
        <Box>
          <Heading size="sm" mb="4">
            معلومات العميل
          </Heading>
          <FormControl isRequired isInvalid={!!errors.customerId}>
            <FormLabel>العميل</FormLabel>
            <Select
              ref={initialRef}
              name="customerId"
              value={formData.customerId}
              onChange={handleCustomerChange}
              placeholder="اختر العميل"
            >
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.customerId}</FormErrorMessage>
          </FormControl>
        </Box>

        <Divider />

        {/* معلومات الفندق */}
        <Box>
          <Heading size="sm" mb="4">
            معلومات الفندق
          </Heading>
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4">
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.hotelName}>
                <FormLabel>اسم الفندق</FormLabel>
                <Input
                  name="hotelName"
                  value={formData.hotelName}
                  onChange={handleChange}
                  placeholder="أدخل اسم الفندق"
                />
                <FormErrorMessage>{errors.hotelName}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.city}>
                <FormLabel>المدينة</FormLabel>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="أدخل المدينة"
                />
                <FormErrorMessage>{errors.city}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>الدولة</FormLabel>
                <Input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="أدخل الدولة"
                />
              </FormControl>
            </GridItem>
          </Grid>
        </Box>

        <Divider />

        {/* معلومات الإقامة */}
        <Box>
          <Heading size="sm" mb="4">
            معلومات الإقامة
          </Heading>
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4">
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.checkInDate}>
                <FormLabel>تاريخ الوصول</FormLabel>
                <Input
                  name="checkInDate"
                  type="date"
                  value={formData.checkInDate}
                  onChange={handleChange}
                />
                <FormErrorMessage>{errors.checkInDate}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.checkOutDate}>
                <FormLabel>تاريخ المغادرة</FormLabel>
                <Input
                  name="checkOutDate"
                  type="date"
                  value={formData.checkOutDate}
                  onChange={handleChange}
                />
                <FormErrorMessage>{errors.checkOutDate}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>عدد الليالي</FormLabel>
                <Input
                  value={calculateNights()}
                  isReadOnly
                  bg="gray.50"
                />
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>نوع الغرفة</FormLabel>
                <Select
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleChange}
                >
                  <option value="standard">غرفة قياسية</option>
                  <option value="deluxe">غرفة ديلوكس</option>
                  <option value="suite">جناح</option>
                  <option value="family">غرفة عائلية</option>
                </Select>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>عدد الغرف</FormLabel>
                <NumberInput
                  min={1}
                  max={10}
                  value={formData.numberOfRooms}
                  onChange={(value) => handleNumberChange('numberOfRooms', value)}
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
              <FormControl>
                <FormLabel>نظام الوجبات</FormLabel>
                <Select
                  name="mealPlan"
                  value={formData.mealPlan}
                  onChange={handleChange}
                >
                  <option value="breakfast">إفطار فقط</option>
                  <option value="halfBoard">إفطار وعشاء</option>
                  <option value="fullBoard">إفطار وغداء وعشاء</option>
                  <option value="allInclusive">شامل جميع الوجبات</option>
                  <option value="roomOnly">بدون وجبات</option>
                </Select>
              </FormControl>
            </GridItem>
          </Grid>
        </Box>

        <Divider />

        {/* معلومات المسافرين */}
        <Box>
          <Heading size="sm" mb="4">
            عدد المسافرين
          </Heading>
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4">
            <GridItem>
              <FormControl>
                <FormLabel>بالغين</FormLabel>
                <NumberInput
                  min={1}
                  max={10}
                  value={formData.adults}
                  onChange={(value) => handleNumberChange('adults', value)}
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
              <FormControl>
                <FormLabel>أطفال (حتى 12 سنة)</FormLabel>
                <NumberInput
                  min={0}
                  max={6}
                  value={formData.children}
                  onChange={(value) => handleNumberChange('children', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </GridItem>
          </Grid>
        </Box>

        <Divider />

        {/* معلومات التكلفة */}
        <Box>
          <Heading size="sm" mb="4">
            معلومات التكلفة
          </Heading>
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4">
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.totalAmount}>
                <FormLabel>إجمالي التكلفة</FormLabel>
                <InputGroup>
                  <Input
                    name="totalAmount"
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    placeholder="أدخل إجمالي التكلفة"
                  />
                  <InputRightAddon children="ريال" />
                </InputGroup>
                <FormErrorMessage>{errors.totalAmount}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl isInvalid={!!errors.paidAmount}>
                <FormLabel>المبلغ المدفوع</FormLabel>
                <InputGroup>
                  <Input
                    name="paidAmount"
                    type="number"
                    step="0.01"
                    value={formData.paidAmount}
                    onChange={handleChange}
                    placeholder="أدخل المبلغ المدفوع"
                  />
                  <InputRightAddon children="ريال" />
                </InputGroup>
                <FormErrorMessage>{errors.paidAmount}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>طريقة الدفع</FormLabel>
                <Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  <option value="cash">نقداً</option>
                  <option value="card">بطاقة ائتمان</option>
                  <option value="transfer">تحويل بنكي</option>
                </Select>
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
                  <option value="pending">معلق</option>
                  <option value="confirmed">مؤكد</option>
                  <option value="cancelled">ملغي</option>
                  <option value="completed">مكتمل</option>
                </Select>
              </FormControl>
            </GridItem>
          </Grid>
        </Box>

        <Divider />

        {/* طلبات خاصة وملاحظات */}
        <Box>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(1, 1fr)' }} gap="4">
            <GridItem>
              <FormControl>
                <FormLabel>طلبات خاصة</FormLabel>
                <Textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  placeholder="أدخل أي طلبات خاصة (مثل: غرفة لغير المدخنين، سرير إضافي، إلخ)"
                  rows={2}
                />
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>ملاحظات</FormLabel>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="أدخل أي ملاحظات إضافية"
                  rows={2}
                />
              </FormControl>
            </GridItem>
          </Grid>
        </Box>

        {errors.submit && (
          <Text color="red.500" fontSize="sm">
            {errors.submit}
          </Text>
        )}

        <Flex justify="flex-end" mt="4">
          <Button variant="outline" mr="3" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            colorScheme="blue"
            type="submit"
            isLoading={loading}
            loadingText="جاري الحفظ..."
          >
            {booking ? 'تحديث الحجز' : 'إضافة الحجز'}
          </Button>
        </Flex>
      </Stack>
    </form>
  );
};

export default HotelBookingForm;
