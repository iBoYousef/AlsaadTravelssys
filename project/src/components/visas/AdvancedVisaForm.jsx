import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Checkbox,
  Stack,
  HStack,
  VStack,
  Heading,
  Text,
  Divider,
  useToast,
  FormErrorMessage,
  SimpleGrid,
  Flex,
  IconButton,
  Badge,
  Tooltip,
  InputGroup,
  InputRightElement,
  useColorModeValue
} from '@chakra-ui/react';
import { FiSave, FiX, FiPlus, FiTrash2, FiUpload, FiInfo, FiCalendar } from 'react-icons/fi';
import { customerService, visaService } from '../../services/api';

/**
 * نموذج متقدم لطلب التأشيرة
 * يتضمن معلومات مفصلة عن طلب التأشيرة والمستندات المطلوبة
 */
const AdvancedVisaForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const toast = useToast();
  const formBg = useColorModeValue('white', 'gray.800');
  
  // حالة النموذج
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    visaType: '',
    country: '',
    purpose: 'tourism',
    entryType: 'single',
    duration: 30,
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    birthDate: '',
    nationality: '',
    gender: '',
    maritalStatus: '',
    profession: '',
    employerName: '',
    employerAddress: '',
    residenceAddress: '',
    contactPhone: '',
    contactEmail: '',
    emergencyContact: '',
    travelDate: '',
    returnDate: '',
    hotelReservation: false,
    flightReservation: false,
    travelInsurance: false,
    bankStatement: false,
    invitationLetter: false,
    previousVisas: [],
    notes: '',
    status: 'pending',
    isUrgent: false,
    totalAmount: 0,
    paidAmount: 0,
    assignedTo: '',
    documents: [],
    ...initialData
  });
  
  // حالة التحقق من الصحة
  const [errors, setErrors] = useState({});
  
  // حالة تحميل البيانات
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [visaTypes, setVisaTypes] = useState([]);
  
  // جلب بيانات العملاء والدول وأنواع التأشيرات
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // جلب قائمة العملاء
        const customersData = await customerService.getAllCustomers();
        setCustomers(customersData);
        
        // قائمة الدول (يمكن استبدالها بقائمة من API)
        setCountries([
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
          'المملكة المتحدة',
          'الولايات المتحدة الأمريكية',
          'كندا',
          'أستراليا',
          'دول شنغن'
        ]);
        
        // قائمة أنواع التأشيرات
        setVisaTypes([
          { id: 'tourist', name: 'سياحية' },
          { id: 'business', name: 'عمل' },
          { id: 'visit', name: 'زيارة' },
          { id: 'umrah', name: 'عمرة' },
          { id: 'hajj', name: 'حج' },
          { id: 'student', name: 'دراسية' },
          { id: 'medical', name: 'علاجية' },
          { id: 'transit', name: 'ترانزيت' },
          { id: 'work', name: 'عمل دائم' },
          { id: 'family', name: 'لم شمل عائلي' }
        ]);
      } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        toast({
          title: 'خطأ في جلب البيانات',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // تحديث بيانات العميل عند اختياره
  useEffect(() => {
    if (formData.customerId) {
      const selectedCustomer = customers.find(c => c.id === formData.customerId);
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customerName: selectedCustomer.name || selectedCustomer.fullName,
          contactPhone: selectedCustomer.phone || prev.contactPhone,
          contactEmail: selectedCustomer.email || prev.contactEmail,
          nationality: selectedCustomer.nationality || prev.nationality,
          birthDate: selectedCustomer.birthDate || prev.birthDate,
          gender: selectedCustomer.gender || prev.gender,
          passportNumber: selectedCustomer.passportNumber || prev.passportNumber,
          passportExpiryDate: selectedCustomer.passportExpiryDate || prev.passportExpiryDate
        }));
      }
    }
  }, [formData.customerId, customers]);
  
  // التعامل مع تغيير قيم الحقول
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // مسح الخطأ عند تعديل الحقل
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // إضافة تأشيرة سابقة
  const addPreviousVisa = () => {
    setFormData(prev => ({
      ...prev,
      previousVisas: [
        ...prev.previousVisas,
        { country: '', issueDate: '', expiryDate: '', type: '' }
      ]
    }));
  };
  
  // تحديث بيانات تأشيرة سابقة
  const updatePreviousVisa = (index, field, value) => {
    const updatedVisas = [...formData.previousVisas];
    updatedVisas[index] = { ...updatedVisas[index], [field]: value };
    
    setFormData(prev => ({
      ...prev,
      previousVisas: updatedVisas
    }));
  };
  
  // حذف تأشيرة سابقة
  const removePreviousVisa = (index) => {
    const updatedVisas = formData.previousVisas.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      previousVisas: updatedVisas
    }));
  };
  
  // إضافة مستند
  const addDocument = () => {
    setFormData(prev => ({
      ...prev,
      documents: [
        ...prev.documents,
        { name: '', type: 'passport', status: 'pending', notes: '' }
      ]
    }));
  };
  
  // تحديث بيانات مستند
  const updateDocument = (index, field, value) => {
    const updatedDocuments = [...formData.documents];
    updatedDocuments[index] = { ...updatedDocuments[index], [field]: value };
    
    setFormData(prev => ({
      ...prev,
      documents: updatedDocuments
    }));
  };
  
  // حذف مستند
  const removeDocument = (index) => {
    const updatedDocuments = formData.documents.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      documents: updatedDocuments
    }));
  };
  
  // التحقق من صحة النموذج
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customerId) {
      newErrors.customerId = 'يرجى اختيار العميل';
    }
    
    if (!formData.visaType) {
      newErrors.visaType = 'يرجى اختيار نوع التأشيرة';
    }
    
    if (!formData.country) {
      newErrors.country = 'يرجى اختيار الدولة';
    }
    
    if (!formData.passportNumber) {
      newErrors.passportNumber = 'يرجى إدخال رقم جواز السفر';
    }
    
    if (!formData.passportExpiryDate) {
      newErrors.passportExpiryDate = 'يرجى إدخال تاريخ انتهاء جواز السفر';
    } else {
      const expiryDate = new Date(formData.passportExpiryDate);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
      if (expiryDate < sixMonthsFromNow) {
        newErrors.passportExpiryDate = 'يجب أن يكون جواز السفر صالحًا لمدة 6 أشهر على الأقل';
      }
    }
    
    if (!formData.travelDate) {
      newErrors.travelDate = 'يرجى إدخال تاريخ السفر';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // إرسال النموذج
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'خطأ في النموذج',
        description: 'يرجى التحقق من جميع الحقول المطلوبة',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // استدعاء دالة الإرسال
      await onSubmit(formData);
      
      toast({
        title: 'تم حفظ الطلب بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('خطأ في حفظ طلب التأشيرة:', error);
      toast({
        title: 'خطأ في حفظ الطلب',
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
    <Box as="form" onSubmit={handleSubmit} bg={formBg} p="6" borderRadius="md" shadow="md">
      <VStack spacing="6" align="stretch">
        <Heading size="md">طلب تأشيرة جديد</Heading>
        
        {/* معلومات العميل */}
        <Box>
          <Heading size="sm" mb="4">معلومات العميل</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
            <FormControl isRequired isInvalid={!!errors.customerId}>
              <FormLabel>العميل</FormLabel>
              <Select
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                placeholder="اختر العميل"
                isDisabled={loading}
              >
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name || customer.fullName}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.customerId}</FormErrorMessage>
            </FormControl>
            
            <FormControl>
              <FormLabel>رقم الهاتف</FormLabel>
              <Input
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                isDisabled={loading}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>البريد الإلكتروني</FormLabel>
              <Input
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                type="email"
                isDisabled={loading}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>جهة الاتصال في حالات الطوارئ</FormLabel>
              <Input
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                isDisabled={loading}
              />
            </FormControl>
          </SimpleGrid>
        </Box>
        
        <Divider />
        
        {/* معلومات التأشيرة */}
        <Box>
          <Heading size="sm" mb="4">معلومات التأشيرة</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing="4">
            <FormControl isRequired isInvalid={!!errors.country}>
              <FormLabel>الدولة</FormLabel>
              <Select
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="اختر الدولة"
                isDisabled={loading}
              >
                {countries.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.country}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.visaType}>
              <FormLabel>نوع التأشيرة</FormLabel>
              <Select
                name="visaType"
                value={formData.visaType}
                onChange={handleChange}
                placeholder="اختر نوع التأشيرة"
                isDisabled={loading}
              >
                {visaTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.visaType}</FormErrorMessage>
            </FormControl>
            
            <FormControl>
              <FormLabel>الغرض من السفر</FormLabel>
              <Select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                isDisabled={loading}
              >
                <option value="tourism">سياحة</option>
                <option value="business">عمل</option>
                <option value="visit">زيارة</option>
                <option value="medical">علاج</option>
                <option value="study">دراسة</option>
                <option value="umrah">عمرة</option>
                <option value="hajj">حج</option>
                <option value="other">أخرى</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>نوع الدخول</FormLabel>
              <Select
                name="entryType"
                value={formData.entryType}
                onChange={handleChange}
                isDisabled={loading}
              >
                <option value="single">مرة واحدة</option>
                <option value="multiple">متعدد</option>
                <option value="transit">ترانزيت</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>مدة الإقامة (بالأيام)</FormLabel>
              <Input
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                type="number"
                min="1"
                isDisabled={loading}
              />
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.travelDate}>
              <FormLabel>تاريخ السفر</FormLabel>
              <Input
                name="travelDate"
                value={formData.travelDate}
                onChange={handleChange}
                type="date"
                isDisabled={loading}
              />
              <FormErrorMessage>{errors.travelDate}</FormErrorMessage>
            </FormControl>
            
            <FormControl>
              <FormLabel>تاريخ العودة</FormLabel>
              <Input
                name="returnDate"
                value={formData.returnDate}
                onChange={handleChange}
                type="date"
                isDisabled={loading}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>حالة الطلب</FormLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                isDisabled={loading}
              >
                <option value="pending">قيد الانتظار</option>
                <option value="in_progress">قيد المعالجة</option>
                <option value="submitted">تم التقديم</option>
                <option value="approved">تمت الموافقة</option>
                <option value="rejected">مرفوض</option>
                <option value="completed">مكتمل</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>المبلغ الإجمالي</FormLabel>
              <InputGroup>
                <Input
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  isDisabled={loading}
                />
                <InputRightElement>
                  <Text fontSize="sm">ر.س</Text>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel>المبلغ المدفوع</FormLabel>
              <InputGroup>
                <Input
                  name="paidAmount"
                  value={formData.paidAmount}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  max={formData.totalAmount}
                  isDisabled={loading}
                />
                <InputRightElement>
                  <Text fontSize="sm">ر.س</Text>
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </SimpleGrid>
          
          <HStack mt="4">
            <Checkbox
              name="isUrgent"
              isChecked={formData.isUrgent}
              onChange={handleChange}
              isDisabled={loading}
            >
              طلب عاجل
            </Checkbox>
            
            <Checkbox
              name="hotelReservation"
              isChecked={formData.hotelReservation}
              onChange={handleChange}
              isDisabled={loading}
            >
              حجز فندق
            </Checkbox>
            
            <Checkbox
              name="flightReservation"
              isChecked={formData.flightReservation}
              onChange={handleChange}
              isDisabled={loading}
            >
              حجز طيران
            </Checkbox>
            
            <Checkbox
              name="travelInsurance"
              isChecked={formData.travelInsurance}
              onChange={handleChange}
              isDisabled={loading}
            >
              تأمين سفر
            </Checkbox>
          </HStack>
        </Box>
        
        <Divider />
        
        {/* معلومات جواز السفر */}
        <Box>
          <Heading size="sm" mb="4">معلومات جواز السفر</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
            <FormControl isRequired isInvalid={!!errors.passportNumber}>
              <FormLabel>رقم جواز السفر</FormLabel>
              <Input
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleChange}
                isDisabled={loading}
              />
              <FormErrorMessage>{errors.passportNumber}</FormErrorMessage>
            </FormControl>
            
            <FormControl>
              <FormLabel>تاريخ الإصدار</FormLabel>
              <Input
                name="passportIssueDate"
                value={formData.passportIssueDate}
                onChange={handleChange}
                type="date"
                isDisabled={loading}
              />
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.passportExpiryDate}>
              <FormLabel>تاريخ الانتهاء</FormLabel>
              <Input
                name="passportExpiryDate"
                value={formData.passportExpiryDate}
                onChange={handleChange}
                type="date"
                isDisabled={loading}
              />
              <FormErrorMessage>{errors.passportExpiryDate}</FormErrorMessage>
            </FormControl>
            
            <FormControl>
              <FormLabel>الجنسية</FormLabel>
              <Input
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                isDisabled={loading}
              />
            </FormControl>
          </SimpleGrid>
        </Box>
        
        <Divider />
        
        {/* المستندات المطلوبة */}
        <Box>
          <Flex justify="space-between" align="center" mb="4">
            <Heading size="sm">المستندات المطلوبة</Heading>
            <Button
              leftIcon={<FiPlus />}
              size="sm"
              onClick={addDocument}
              isDisabled={loading}
            >
              إضافة مستند
            </Button>
          </Flex>
          
          {formData.documents.length === 0 ? (
            <Text color="gray.500" textAlign="center" py="4">
              لا توجد مستندات مضافة
            </Text>
          ) : (
            <VStack spacing="3" align="stretch">
              {formData.documents.map((doc, index) => (
                <Flex key={index} borderWidth="1px" borderRadius="md" p="3" align="center">
                  <Box flex="1">
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing="3">
                      <FormControl>
                        <FormLabel fontSize="sm">اسم المستند</FormLabel>
                        <Input
                          size="sm"
                          value={doc.name}
                          onChange={(e) => updateDocument(index, 'name', e.target.value)}
                          isDisabled={loading}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="sm">نوع المستند</FormLabel>
                        <Select
                          size="sm"
                          value={doc.type}
                          onChange={(e) => updateDocument(index, 'type', e.target.value)}
                          isDisabled={loading}
                        >
                          <option value="passport">جواز سفر</option>
                          <option value="id">بطاقة هوية</option>
                          <option value="photo">صورة شخصية</option>
                          <option value="bank_statement">كشف حساب بنكي</option>
                          <option value="invitation">خطاب دعوة</option>
                          <option value="hotel_reservation">حجز فندق</option>
                          <option value="flight_reservation">حجز طيران</option>
                          <option value="insurance">تأمين سفر</option>
                          <option value="other">أخرى</option>
                        </Select>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="sm">الحالة</FormLabel>
                        <Select
                          size="sm"
                          value={doc.status}
                          onChange={(e) => updateDocument(index, 'status', e.target.value)}
                          isDisabled={loading}
                        >
                          <option value="pending">مطلوب</option>
                          <option value="received">تم الاستلام</option>
                          <option value="approved">تمت الموافقة</option>
                          <option value="rejected">مرفوض</option>
                        </Select>
                      </FormControl>
                    </SimpleGrid>
                  </Box>
                  
                  <IconButton
                    icon={<FiTrash2 />}
                    aria-label="حذف المستند"
                    variant="ghost"
                    colorScheme="red"
                    size="sm"
                    ml="2"
                    onClick={() => removeDocument(index)}
                    isDisabled={loading}
                  />
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
        
        <Divider />
        
        {/* تأشيرات سابقة */}
        <Box>
          <Flex justify="space-between" align="center" mb="4">
            <Heading size="sm">تأشيرات سابقة</Heading>
            <Button
              leftIcon={<FiPlus />}
              size="sm"
              onClick={addPreviousVisa}
              isDisabled={loading}
            >
              إضافة تأشيرة سابقة
            </Button>
          </Flex>
          
          {formData.previousVisas.length === 0 ? (
            <Text color="gray.500" textAlign="center" py="4">
              لا توجد تأشيرات سابقة مضافة
            </Text>
          ) : (
            <VStack spacing="3" align="stretch">
              {formData.previousVisas.map((visa, index) => (
                <Flex key={index} borderWidth="1px" borderRadius="md" p="3" align="center">
                  <Box flex="1">
                    <SimpleGrid columns={{ base: 1, md: 4 }} spacing="3">
                      <FormControl>
                        <FormLabel fontSize="sm">الدولة</FormLabel>
                        <Input
                          size="sm"
                          value={visa.country}
                          onChange={(e) => updatePreviousVisa(index, 'country', e.target.value)}
                          isDisabled={loading}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="sm">تاريخ الإصدار</FormLabel>
                        <Input
                          size="sm"
                          type="date"
                          value={visa.issueDate}
                          onChange={(e) => updatePreviousVisa(index, 'issueDate', e.target.value)}
                          isDisabled={loading}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="sm">تاريخ الانتهاء</FormLabel>
                        <Input
                          size="sm"
                          type="date"
                          value={visa.expiryDate}
                          onChange={(e) => updatePreviousVisa(index, 'expiryDate', e.target.value)}
                          isDisabled={loading}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="sm">نوع التأشيرة</FormLabel>
                        <Input
                          size="sm"
                          value={visa.type}
                          onChange={(e) => updatePreviousVisa(index, 'type', e.target.value)}
                          isDisabled={loading}
                        />
                      </FormControl>
                    </SimpleGrid>
                  </Box>
                  
                  <IconButton
                    icon={<FiTrash2 />}
                    aria-label="حذف التأشيرة"
                    variant="ghost"
                    colorScheme="red"
                    size="sm"
                    ml="2"
                    onClick={() => removePreviousVisa(index)}
                    isDisabled={loading}
                  />
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
        
        <Divider />
        
        {/* ملاحظات إضافية */}
        <FormControl>
          <FormLabel>ملاحظات إضافية</FormLabel>
          <Textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            isDisabled={loading}
          />
        </FormControl>
        
        {/* أزرار التحكم */}
        <Flex justify="flex-end" mt="4">
          <Button
            variant="outline"
            mr="4"
            onClick={onCancel}
            isDisabled={loading}
            leftIcon={<FiX />}
          >
            إلغاء
          </Button>
          
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={loading}
            leftIcon={<FiSave />}
          >
            حفظ الطلب
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default AdvancedVisaForm;
