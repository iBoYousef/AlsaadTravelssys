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
  RadioGroup,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { FiPlus, FiMinus, FiCalendar, FiUser, FiDollarSign } from 'react-icons/fi';
import { customerService } from '../../services/api';
import { isValidDate, formatDate } from '../../utils/validationUtils';

/**
 * مكون نموذج حجز الطيران
 * يستخدم لإضافة حجز جديد أو تعديل حجز موجود
 */
const FlightBookingForm = ({ booking, onSubmit, onClose }) => {
  const initialRef = useRef();
  const toast = useToast();
  
  // حالة النموذج
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    bookingType: 'oneWay', // oneWay, roundTrip
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    airline: '',
    flightNumber: '',
    travelClass: 'economy', // economy, business, first
    adults: 1,
    children: 0,
    infants: 0,
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
      const departureDate = booking.departureDate
        ? formatDate(
            booking.departureDate.seconds
              ? new Date(booking.departureDate.seconds * 1000)
              : new Date(booking.departureDate),
            'input'
          )
        : '';
      
      const returnDate = booking.returnDate
        ? formatDate(
            booking.returnDate.seconds
              ? new Date(booking.returnDate.seconds * 1000)
              : new Date(booking.returnDate),
            'input'
          )
        : '';
      
      setFormData({
        customerId: booking.customerId || '',
        customerName: booking.customerName || '',
        bookingType: booking.returnDate ? 'roundTrip' : 'oneWay',
        origin: booking.origin || '',
        destination: booking.destination || '',
        departureDate,
        returnDate,
        airline: booking.airline || '',
        flightNumber: booking.flightNumber || '',
        travelClass: booking.travelClass || 'economy',
        adults: booking.adults || 1,
        children: booking.children || 0,
        infants: booking.infants || 0,
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
  
  // تحديث نوع الحجز (ذهاب فقط / ذهاب وعودة)
  const handleBookingTypeChange = (value) => {
    setFormData(prev => ({
      ...prev,
      bookingType: value,
      // إذا كان الحجز ذهاب فقط، نمسح تاريخ العودة
      returnDate: value === 'oneWay' ? '' : prev.returnDate
    }));
  };
  
  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customerId) {
      newErrors.customerId = 'يرجى اختيار العميل';
    }
    
    if (!formData.origin) {
      newErrors.origin = 'يرجى إدخال مطار المغادرة';
    }
    
    if (!formData.destination) {
      newErrors.destination = 'يرجى إدخال مطار الوصول';
    }
    
    if (!formData.departureDate) {
      newErrors.departureDate = 'يرجى إدخال تاريخ المغادرة';
    } else if (!isValidDate(formData.departureDate)) {
      newErrors.departureDate = 'تاريخ المغادرة غير صالح';
    }
    
    if (formData.bookingType === 'roundTrip') {
      if (!formData.returnDate) {
        newErrors.returnDate = 'يرجى إدخال تاريخ العودة';
      } else if (!isValidDate(formData.returnDate)) {
        newErrors.returnDate = 'تاريخ العودة غير صالح';
      } else if (new Date(formData.returnDate) < new Date(formData.departureDate)) {
        newErrors.returnDate = 'يجب أن يكون تاريخ العودة بعد تاريخ المغادرة';
      }
    }
    
    if (!formData.airline) {
      newErrors.airline = 'يرجى إدخال اسم شركة الطيران';
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
        departureDate: new Date(formData.departureDate),
        returnDate: formData.returnDate ? new Date(formData.returnDate) : null,
        adults: parseInt(formData.adults, 10),
        children: parseInt(formData.children, 10),
        infants: parseInt(formData.infants, 10),
        totalAmount: parseFloat(formData.totalAmount),
        paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : 0
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

        {/* معلومات الرحلة */}
        <Box>
          <Heading size="sm" mb="4">
            معلومات الرحلة
          </Heading>
          
          <FormControl mb="4">
            <FormLabel>نوع الرحلة</FormLabel>
            <RadioGroup
              value={formData.bookingType}
              onChange={handleBookingTypeChange}
            >
              <HStack spacing="6">
                <Radio value="oneWay">ذهاب فقط</Radio>
                <Radio value="roundTrip">ذهاب وعودة</Radio>
              </HStack>
            </RadioGroup>
          </FormControl>
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4">
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.origin}>
                <FormLabel>مطار المغادرة</FormLabel>
                <Input
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  placeholder="أدخل مطار المغادرة"
                />
                <FormErrorMessage>{errors.origin}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.destination}>
                <FormLabel>مطار الوصول</FormLabel>
                <Input
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="أدخل مطار الوصول"
                />
                <FormErrorMessage>{errors.destination}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.departureDate}>
                <FormLabel>تاريخ المغادرة</FormLabel>
                <Input
                  name="departureDate"
                  type="date"
                  value={formData.departureDate}
                  onChange={handleChange}
                />
                <FormErrorMessage>{errors.departureDate}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            {formData.bookingType === 'roundTrip' && (
              <GridItem>
                <FormControl isRequired={formData.bookingType === 'roundTrip'} isInvalid={!!errors.returnDate}>
                  <FormLabel>تاريخ العودة</FormLabel>
                  <Input
                    name="returnDate"
                    type="date"
                    value={formData.returnDate}
                    onChange={handleChange}
                  />
                  <FormErrorMessage>{errors.returnDate}</FormErrorMessage>
                </FormControl>
              </GridItem>
            )}
            
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.airline}>
                <FormLabel>شركة الطيران</FormLabel>
                <Input
                  name="airline"
                  value={formData.airline}
                  onChange={handleChange}
                  placeholder="أدخل اسم شركة الطيران"
                />
                <FormErrorMessage>{errors.airline}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>رقم الرحلة</FormLabel>
                <Input
                  name="flightNumber"
                  value={formData.flightNumber}
                  onChange={handleChange}
                  placeholder="أدخل رقم الرحلة"
                />
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>درجة السفر</FormLabel>
                <Select
                  name="travelClass"
                  value={formData.travelClass}
                  onChange={handleChange}
                >
                  <option value="economy">درجة سياحية</option>
                  <option value="business">درجة رجال الأعمال</option>
                  <option value="first">الدرجة الأولى</option>
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
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap="4">
            <GridItem>
              <FormControl>
                <FormLabel>بالغين</FormLabel>
                <NumberInput
                  min={1}
                  max={9}
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
                <FormLabel>أطفال (2-12 سنة)</FormLabel>
                <NumberInput
                  min={0}
                  max={9}
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
            
            <GridItem>
              <FormControl>
                <FormLabel>رضع (أقل من سنتين)</FormLabel>
                <NumberInput
                  min={0}
                  max={4}
                  value={formData.infants}
                  onChange={(value) => handleNumberChange('infants', value)}
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

        {/* ملاحظات إضافية */}
        <Box>
          <FormControl>
            <FormLabel>ملاحظات</FormLabel>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="أدخل أي ملاحظات إضافية"
              rows={3}
            />
          </FormControl>
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

export default FlightBookingForm;
