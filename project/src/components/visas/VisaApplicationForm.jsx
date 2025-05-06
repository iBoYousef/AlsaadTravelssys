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
  Switch,
  FormHelperText
} from '@chakra-ui/react';
import { customerService } from '../../services/api';
import { isValidDate, formatDate, isValidPassportNumber } from '../../utils/validationUtils';

// قائمة أنواع التأشيرات
const visaTypes = [
  { value: 'tourist', label: 'سياحية' },
  { value: 'business', label: 'عمل' },
  { value: 'visit', label: 'زيارة' },
  { value: 'umrah', label: 'عمرة' },
  { value: 'hajj', label: 'حج' },
  { value: 'student', label: 'دراسية' },
  { value: 'medical', label: 'علاجية' },
  { value: 'transit', label: 'ترانزيت' },
  { value: 'work', label: 'إقامة عمل' },
  { value: 'family', label: 'لم شمل عائلي' }
];

// قائمة الدول الشائعة
const commonCountries = [
  'المملكة العربية السعودية',
  'الإمارات العربية المتحدة',
  'الكويت',
  'قطر',
  'البحرين',
  'عمان',
  'مصر',
  'الأردن',
  'لبنان',
  'تركيا',
  'ماليزيا',
  'بريطانيا',
  'الولايات المتحدة الأمريكية',
  'كندا',
  'أستراليا',
  'دول شنغن الأوروبية'
];

/**
 * مكون نموذج طلب التأشيرة
 * يستخدم لإضافة طلب جديد أو تعديل طلب موجود
 */
const VisaApplicationForm = ({ application, onSubmit, onClose }) => {
  const initialRef = useRef();
  const toast = useToast();
  
  // حالة النموذج
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    passportNumber: '',
    nationality: '',
    visaType: '',
    country: '',
    duration: '',
    entries: 'single', // single, multiple
    submissionDate: formatDate(new Date(), 'input'),
    expectedProcessingTime: '14', // بالأيام
    isUrgent: false,
    requiredDocuments: [],
    totalFees: '',
    paidAmount: '',
    paymentMethod: 'cash', // cash, card, transfer
    status: 'pending', // pending, submitted, approved, rejected, completed, cancelled
    notes: ''
  });
  
  // قائمة العملاء
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // قائمة المستندات المطلوبة
  const [availableDocuments, setAvailableDocuments] = useState([
    { id: 'passport', label: 'جواز السفر', required: true },
    { id: 'photo', label: 'صور شخصية', required: true },
    { id: 'id', label: 'بطاقة الهوية', required: false },
    { id: 'bankStatement', label: 'كشف حساب بنكي', required: false },
    { id: 'invitation', label: 'خطاب دعوة', required: false },
    { id: 'tickets', label: 'حجز تذاكر الطيران', required: false },
    { id: 'hotelReservation', label: 'حجز فندق', required: false },
    { id: 'travelInsurance', label: 'تأمين سفر', required: false },
    { id: 'employmentLetter', label: 'خطاب من جهة العمل', required: false },
    { id: 'marriageCertificate', label: 'شهادة زواج', required: false }
  ]);
  
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
  
  // تحميل بيانات الطلب إذا كان في وضع التعديل
  useEffect(() => {
    if (application) {
      // تنسيق التاريخ
      const submissionDate = application.submissionDate
        ? formatDate(
            application.submissionDate.seconds
              ? new Date(application.submissionDate.seconds * 1000)
              : new Date(application.submissionDate),
            'input'
          )
        : formatDate(new Date(), 'input');
      
      setFormData({
        customerId: application.customerId || '',
        customerName: application.customerName || '',
        passportNumber: application.passportNumber || '',
        nationality: application.nationality || '',
        visaType: application.visaType || '',
        country: application.country || '',
        duration: application.duration || '',
        entries: application.entries || 'single',
        submissionDate,
        expectedProcessingTime: application.expectedProcessingTime || '14',
        isUrgent: application.isUrgent || false,
        requiredDocuments: application.requiredDocuments || [],
        totalFees: application.totalFees || '',
        paidAmount: application.paidAmount || '',
        paymentMethod: application.paymentMethod || 'cash',
        status: application.status || 'pending',
        notes: application.notes || ''
      });
    }
  }, [application]);
  
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
    
    if (selectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: selectedCustomer.name,
        passportNumber: selectedCustomer.passportNumber || '',
        nationality: selectedCustomer.nationality || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: ''
      }));
    }
    
    // مسح رسالة الخطأ
    if (errors.customerId) {
      setErrors(prev => ({ ...prev, customerId: '' }));
    }
  };
  
  // تحديث قائمة المستندات المطلوبة
  const handleDocumentChange = (documentId, isChecked) => {
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        requiredDocuments: [...prev.requiredDocuments, documentId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        requiredDocuments: prev.requiredDocuments.filter(id => id !== documentId)
      }));
    }
  };
  
  // تحديث حالة الطلب العاجل
  const handleUrgentChange = (e) => {
    const isUrgent = e.target.checked;
    setFormData(prev => ({ ...prev, isUrgent }));
    
    // تعديل وقت المعالجة المتوقع إذا كان الطلب عاجلاً
    if (isUrgent && (!formData.expectedProcessingTime || parseInt(formData.expectedProcessingTime) > 7)) {
      setFormData(prev => ({ ...prev, expectedProcessingTime: '7' }));
    }
  };
  
  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customerId) {
      newErrors.customerId = 'يرجى اختيار العميل';
    }
    
    if (!formData.passportNumber) {
      newErrors.passportNumber = 'يرجى إدخال رقم جواز السفر';
    } else if (!isValidPassportNumber(formData.passportNumber)) {
      newErrors.passportNumber = 'رقم جواز السفر غير صالح';
    }
    
    if (!formData.nationality) {
      newErrors.nationality = 'يرجى إدخال الجنسية';
    }
    
    if (!formData.visaType) {
      newErrors.visaType = 'يرجى اختيار نوع التأشيرة';
    }
    
    if (!formData.country) {
      newErrors.country = 'يرجى اختيار الدولة';
    }
    
    if (!formData.duration) {
      newErrors.duration = 'يرجى إدخال مدة التأشيرة';
    }
    
    if (!formData.submissionDate) {
      newErrors.submissionDate = 'يرجى إدخال تاريخ التقديم';
    } else if (!isValidDate(formData.submissionDate)) {
      newErrors.submissionDate = 'تاريخ التقديم غير صالح';
    }
    
    if (!formData.totalFees) {
      newErrors.totalFees = 'يرجى إدخال إجمالي الرسوم';
    } else if (isNaN(formData.totalFees) || parseFloat(formData.totalFees) <= 0) {
      newErrors.totalFees = 'يرجى إدخال قيمة صحيحة للرسوم';
    }
    
    if (formData.paidAmount && (isNaN(formData.paidAmount) || parseFloat(formData.paidAmount) < 0)) {
      newErrors.paidAmount = 'يرجى إدخال قيمة صحيحة للمبلغ المدفوع';
    }
    
    if (formData.paidAmount && parseFloat(formData.paidAmount) > parseFloat(formData.totalFees)) {
      newErrors.paidAmount = 'لا يمكن أن يكون المبلغ المدفوع أكبر من إجمالي الرسوم';
    }
    
    // التحقق من وجود المستندات المطلوبة الإلزامية
    const requiredDocIds = availableDocuments
      .filter(doc => doc.required)
      .map(doc => doc.id);
    
    const missingRequiredDocs = requiredDocIds.filter(
      docId => !formData.requiredDocuments.includes(docId)
    );
    
    if (missingRequiredDocs.length > 0) {
      newErrors.requiredDocuments = 'يرجى تحديد جميع المستندات المطلوبة الإلزامية';
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
      // تحويل التاريخ إلى كائن Date
      const applicationData = {
        ...formData,
        submissionDate: new Date(formData.submissionDate),
        expectedProcessingTime: parseInt(formData.expectedProcessingTime, 10),
        totalFees: parseFloat(formData.totalFees),
        paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : 0
      };
      
      await onSubmit(applicationData);
      onClose();
    } catch (error) {
      console.error('خطأ في حفظ بيانات طلب التأشيرة:', error);
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
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4">
            <GridItem colSpan={{ base: 1, md: 2 }}>
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
            </GridItem>
            
            <GridItem>
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
            </GridItem>
            
            <GridItem>
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
            </GridItem>
          </Grid>
        </Box>

        <Divider />

        {/* معلومات التأشيرة */}
        <Box>
          <Heading size="sm" mb="4">
            معلومات التأشيرة
          </Heading>
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4">
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.visaType}>
                <FormLabel>نوع التأشيرة</FormLabel>
                <Select
                  name="visaType"
                  value={formData.visaType}
                  onChange={handleChange}
                  placeholder="اختر نوع التأشيرة"
                >
                  {visaTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.visaType}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.country}>
                <FormLabel>الدولة</FormLabel>
                <Select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="اختر الدولة"
                >
                  {commonCountries.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.country}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.duration}>
                <FormLabel>مدة التأشيرة</FormLabel>
                <Input
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="مثال: 30 يوم، 3 أشهر، سنة"
                />
                <FormErrorMessage>{errors.duration}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>نوع الدخول</FormLabel>
                <RadioGroup
                  name="entries"
                  value={formData.entries}
                  onChange={(value) => setFormData(prev => ({ ...prev, entries: value }))}
                >
                  <HStack spacing="6">
                    <Radio value="single">دخول مرة واحدة</Radio>
                    <Radio value="multiple">دخول متعدد</Radio>
                  </HStack>
                </RadioGroup>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.submissionDate}>
                <FormLabel>تاريخ التقديم</FormLabel>
                <Input
                  name="submissionDate"
                  type="date"
                  value={formData.submissionDate}
                  onChange={handleChange}
                />
                <FormErrorMessage>{errors.submissionDate}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>وقت المعالجة المتوقع (بالأيام)</FormLabel>
                <NumberInput
                  min={1}
                  max={90}
                  value={formData.expectedProcessingTime}
                  onChange={(value) => handleNumberChange('expectedProcessingTime', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </GridItem>
            
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="isUrgent" mb="0">
                  طلب عاجل
                </FormLabel>
                <Switch
                  id="isUrgent"
                  colorScheme="red"
                  isChecked={formData.isUrgent}
                  onChange={handleUrgentChange}
                />
                {formData.isUrgent && (
                  <Text fontSize="sm" color="red.500" ml="2">
                    سيتم تطبيق رسوم إضافية للطلبات العاجلة
                  </Text>
                )}
              </FormControl>
            </GridItem>
          </Grid>
        </Box>

        <Divider />

        {/* المستندات المطلوبة */}
        <Box>
          <Heading size="sm" mb="4">
            المستندات المطلوبة
          </Heading>
          
          {errors.requiredDocuments && (
            <Text color="red.500" fontSize="sm" mb="2">
              {errors.requiredDocuments}
            </Text>
          )}
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="3">
            {availableDocuments.map(doc => (
              <GridItem key={doc.id}>
                <FormControl>
                  <Checkbox
                    isChecked={formData.requiredDocuments.includes(doc.id)}
                    onChange={(e) => handleDocumentChange(doc.id, e.target.checked)}
                    colorScheme="blue"
                    isRequired={doc.required}
                  >
                    {doc.label}
                    {doc.required && (
                      <Text as="span" color="red.500" ml="1">
                        *
                      </Text>
                    )}
                  </Checkbox>
                </FormControl>
              </GridItem>
            ))}
          </Grid>
        </Box>

        <Divider />

        {/* معلومات الرسوم */}
        <Box>
          <Heading size="sm" mb="4">
            معلومات الرسوم
          </Heading>
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4">
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.totalFees}>
                <FormLabel>إجمالي الرسوم</FormLabel>
                <InputGroup>
                  <Input
                    name="totalFees"
                    type="number"
                    step="0.01"
                    value={formData.totalFees}
                    onChange={handleChange}
                    placeholder="أدخل إجمالي الرسوم"
                  />
                  <InputRightAddon children="ريال" />
                </InputGroup>
                <FormErrorMessage>{errors.totalFees}</FormErrorMessage>
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
                <FormLabel>حالة الطلب</FormLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="pending">قيد المعالجة</option>
                  <option value="submitted">تم التقديم</option>
                  <option value="approved">تمت الموافقة</option>
                  <option value="rejected">مرفوض</option>
                  <option value="completed">مكتمل</option>
                  <option value="cancelled">ملغي</option>
                </Select>
              </FormControl>
            </GridItem>
          </Grid>
        </Box>

        <Divider />

        {/* ملاحظات */}
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
            {application ? 'تحديث الطلب' : 'إضافة الطلب'}
          </Button>
        </Flex>
      </Stack>
    </form>
  );
};

export default VisaApplicationForm;
