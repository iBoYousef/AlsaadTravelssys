import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
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
  InputGroup,
  InputRightAddon,
  useToast,
  HStack,
  VStack,
  Switch,
  FormHelperText,
  Image,
  IconButton,
  useColorModeValue
} from '@chakra-ui/react';
import { FiUpload, FiX, FiPlus, FiMinus } from 'react-icons/fi';
import { isValidAmount } from '../../utils/validationUtils';

/**
 * مكون نموذج البرنامج السياحي
 * يستخدم لإضافة برنامج جديد أو تعديل برنامج موجود
 */
const TourPackageForm = ({ tourPackage, onSubmit, onClose }) => {
  const initialRef = useRef();
  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  
  // حالة النموذج
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destination: '',
    duration: '',
    price: '',
    discountPrice: '',
    maxParticipants: 20,
    inclusions: [],
    exclusions: [],
    itinerary: [],
    imageUrl: '',
    galleryImages: [],
    active: true,
    featured: false,
    notes: ''
  });
  
  // حالة التحميل والأخطاء
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // قائمة الوجهات الشائعة
  const commonDestinations = [
    'مكة المكرمة',
    'المدينة المنورة',
    'جدة',
    'الرياض',
    'الطائف',
    'أبها',
    'الدمام',
    'دبي',
    'اسطنبول',
    'القاهرة',
    'شرم الشيخ',
    'لندن',
    'باريس',
    'كوالالمبور',
    'جزر المالديف'
  ];
  
  // قائمة المدد الشائعة
  const commonDurations = [
    'يوم واحد',
    'يومين',
    '3 أيام',
    '4 أيام',
    '5 أيام',
    'أسبوع',
    '10 أيام',
    'أسبوعين',
    'شهر'
  ];
  
  // تحميل بيانات البرنامج إذا كان في وضع التعديل
  useEffect(() => {
    if (tourPackage) {
      setFormData({
        name: tourPackage.name || '',
        description: tourPackage.description || '',
        destination: tourPackage.destination || '',
        duration: tourPackage.duration || '',
        price: tourPackage.price || '',
        discountPrice: tourPackage.discountPrice || '',
        maxParticipants: tourPackage.maxParticipants || 20,
        inclusions: tourPackage.inclusions || [],
        exclusions: tourPackage.exclusions || [],
        itinerary: tourPackage.itinerary || [],
        imageUrl: tourPackage.imageUrl || '',
        galleryImages: tourPackage.galleryImages || [],
        active: tourPackage.active !== undefined ? tourPackage.active : true,
        featured: tourPackage.featured || false,
        notes: tourPackage.notes || ''
      });
    }
  }, [tourPackage]);
  
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
  
  // تحديث قيمة منطقية
  const handleBooleanChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // إضافة عنصر إلى قائمة
  const handleAddListItem = (listName, item = '') => {
    if (listName === 'itinerary') {
      setFormData(prev => ({
        ...prev,
        [listName]: [...prev[listName], { title: '', description: '' }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [listName]: [...prev[listName], item]
      }));
    }
  };
  
  // تحديث عنصر في قائمة
  const handleUpdateListItem = (listName, index, value) => {
    const newList = [...formData[listName]];
    newList[index] = value;
    setFormData(prev => ({ ...prev, [listName]: newList }));
  };
  
  // تحديث عنصر في قائمة الجدول الزمني
  const handleUpdateItineraryItem = (index, field, value) => {
    const newItinerary = [...formData.itinerary];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    setFormData(prev => ({ ...prev, itinerary: newItinerary }));
  };
  
  // حذف عنصر من قائمة
  const handleRemoveListItem = (listName, index) => {
    const newList = formData[listName].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [listName]: newList }));
  };
  
  // تحديث صورة البرنامج
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // في تطبيق حقيقي، هنا سيتم رفع الصورة إلى خدمة تخزين مثل Firebase Storage
      // وللتبسيط، سنستخدم URL.createObjectURL لعرض الصورة محلياً
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, imageUrl }));
      
      if (errors.imageUrl) {
        setErrors(prev => ({ ...prev, imageUrl: '' }));
      }
    }
  };
  
  // إضافة صورة إلى معرض الصور
  const handleAddGalleryImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      // في تطبيق حقيقي، هنا سيتم رفع الصورة إلى خدمة تخزين مثل Firebase Storage
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        galleryImages: [...prev.galleryImages, imageUrl]
      }));
    }
  };
  
  // حذف صورة من معرض الصور
  const handleRemoveGalleryImage = (index) => {
    const newGallery = formData.galleryImages.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, galleryImages: newGallery }));
  };
  
  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'يرجى إدخال اسم البرنامج';
    }
    
    if (!formData.destination) {
      newErrors.destination = 'يرجى اختيار الوجهة';
    }
    
    if (!formData.duration) {
      newErrors.duration = 'يرجى إدخال مدة البرنامج';
    }
    
    if (!formData.price) {
      newErrors.price = 'يرجى إدخال سعر البرنامج';
    } else if (!isValidAmount(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'يرجى إدخال قيمة صحيحة للسعر';
    }
    
    if (formData.discountPrice && (!isValidAmount(formData.discountPrice) || parseFloat(formData.discountPrice) <= 0)) {
      newErrors.discountPrice = 'يرجى إدخال قيمة صحيحة للسعر بعد الخصم';
    }
    
    if (formData.discountPrice && parseFloat(formData.discountPrice) >= parseFloat(formData.price)) {
      newErrors.discountPrice = 'يجب أن يكون السعر بعد الخصم أقل من السعر الأصلي';
    }
    
    if (!formData.description) {
      newErrors.description = 'يرجى إدخال وصف البرنامج';
    }
    
    if (formData.itinerary.length === 0) {
      newErrors.itinerary = 'يرجى إضافة الجدول الزمني للبرنامج';
    } else {
      // التحقق من أن جميع عناصر الجدول الزمني تحتوي على عنوان
      const invalidItinerary = formData.itinerary.some(item => !item.title);
      if (invalidItinerary) {
        newErrors.itinerary = 'يرجى إدخال عنوان لكل يوم في الجدول الزمني';
      }
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
      // تحويل القيم العددية
      const packageData = {
        ...formData,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        maxParticipants: parseInt(formData.maxParticipants, 10)
      };
      
      await onSubmit(packageData);
      onClose();
    } catch (error) {
      console.error('خطأ في حفظ بيانات البرنامج السياحي:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing="6">
        {/* معلومات البرنامج الأساسية */}
        <Box>
          <Heading size="sm" mb="4">
            معلومات البرنامج الأساسية
          </Heading>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4">
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl isRequired isInvalid={!!errors.name}>
                <FormLabel>اسم البرنامج</FormLabel>
                <Input
                  ref={initialRef}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="أدخل اسم البرنامج السياحي"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.destination}>
                <FormLabel>الوجهة</FormLabel>
                <Select
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="اختر الوجهة"
                >
                  {commonDestinations.map(destination => (
                    <option key={destination} value={destination}>
                      {destination}
                    </option>
                  ))}
                  <option value="أخرى">أخرى</option>
                </Select>
                <FormErrorMessage>{errors.destination}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.duration}>
                <FormLabel>مدة البرنامج</FormLabel>
                <Select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="اختر المدة"
                >
                  {commonDurations.map(duration => (
                    <option key={duration} value={duration}>
                      {duration}
                    </option>
                  ))}
                  <option value="أخرى">أخرى</option>
                </Select>
                <FormErrorMessage>{errors.duration}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl isRequired isInvalid={!!errors.price}>
                <FormLabel>السعر</FormLabel>
                <InputGroup>
                  <Input
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="أدخل سعر البرنامج"
                  />
                  <InputRightAddon children="دينار كويتي" />
                </InputGroup>
                <FormErrorMessage>{errors.price}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl isInvalid={!!errors.discountPrice}>
                <FormLabel>السعر بعد الخصم (اختياري)</FormLabel>
                <InputGroup>
                  <Input
                    name="discountPrice"
                    type="number"
                    step="0.01"
                    value={formData.discountPrice}
                    onChange={handleChange}
                    placeholder="أدخل السعر بعد الخصم"
                  />
                  <InputRightAddon children="دينار كويتي" />
                </InputGroup>
                <FormErrorMessage>{errors.discountPrice}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>الحد الأقصى للمشاركين</FormLabel>
                <NumberInput
                  min={1}
                  max={100}
                  value={formData.maxParticipants}
                  onChange={(value) => handleNumberChange('maxParticipants', value)}
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
              <HStack spacing="6">
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="active" mb="0">
                    نشط
                  </FormLabel>
                  <Switch
                    id="active"
                    colorScheme="green"
                    isChecked={formData.active}
                    onChange={(e) => handleBooleanChange('active', e.target.checked)}
                  />
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="featured" mb="0">
                    مميز
                  </FormLabel>
                  <Switch
                    id="featured"
                    colorScheme="blue"
                    isChecked={formData.featured}
                    onChange={(e) => handleBooleanChange('featured', e.target.checked)}
                  />
                </FormControl>
              </HStack>
            </GridItem>
          </Grid>
        </Box>

        <Divider />

        {/* وصف البرنامج */}
        <Box>
          <Heading size="sm" mb="4">
            وصف البرنامج
          </Heading>
          
          <FormControl isRequired isInvalid={!!errors.description}>
            <FormLabel>الوصف</FormLabel>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="أدخل وصفاً تفصيلياً للبرنامج السياحي"
              rows={5}
            />
            <FormErrorMessage>{errors.description}</FormErrorMessage>
          </FormControl>
        </Box>

        <Divider />

        {/* الصور */}
        <Box>
          <Heading size="sm" mb="4">
            صور البرنامج
          </Heading>
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="6">
            <GridItem>
              <FormControl>
                <FormLabel>الصورة الرئيسية</FormLabel>
                <Flex direction="column" align="center">
                  {formData.imageUrl ? (
                    <Box position="relative" mb="3">
                      <Image
                        src={formData.imageUrl}
                        alt="صورة البرنامج"
                        maxH="200px"
                        borderRadius="md"
                      />
                      <IconButton
                        icon={<FiX />}
                        size="sm"
                        colorScheme="red"
                        aria-label="حذف الصورة"
                        position="absolute"
                        top="2"
                        right="2"
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      />
                    </Box>
                  ) : (
                    <Box
                      w="full"
                      h="200px"
                      bg={bgColor}
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mb="3"
                    >
                      <Text color="gray.500">لا توجد صورة</Text>
                    </Box>
                  )}
                  
                  <Button
                    leftIcon={<FiUpload />}
                    size="sm"
                    as="label"
                    htmlFor="image-upload"
                    cursor="pointer"
                  >
                    {formData.imageUrl ? 'تغيير الصورة' : 'إضافة صورة'}
                  </Button>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    display="none"
                  />
                </Flex>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>معرض الصور</FormLabel>
                <Grid
                  templateColumns="repeat(auto-fill, minmax(100px, 1fr))"
                  gap="2"
                  mb="3"
                >
                  {formData.galleryImages.map((image, index) => (
                    <Box key={index} position="relative">
                      <Image
                        src={image}
                        alt={`صورة ${index + 1}`}
                        h="100px"
                        w="100px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                      <IconButton
                        icon={<FiX />}
                        size="xs"
                        colorScheme="red"
                        aria-label="حذف الصورة"
                        position="absolute"
                        top="1"
                        right="1"
                        onClick={() => handleRemoveGalleryImage(index)}
                      />
                    </Box>
                  ))}
                  
                  <Box
                    as="label"
                    htmlFor="gallery-upload"
                    h="100px"
                    w="100px"
                    bg={bgColor}
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    border="2px dashed"
                    borderColor="gray.300"
                    _hover={{ borderColor: 'blue.500' }}
                  >
                    <FiPlus />
                  </Box>
                  <Input
                    id="gallery-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAddGalleryImage}
                    display="none"
                  />
                </Grid>
                <FormHelperText>يمكنك إضافة صور متعددة للبرنامج</FormHelperText>
              </FormControl>
            </GridItem>
          </Grid>
        </Box>

        <Divider />

        {/* ما يشمله البرنامج وما لا يشمله */}
        <Box>
          <Heading size="sm" mb="4">
            ما يشمله البرنامج وما لا يشمله
          </Heading>
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="6">
            <GridItem>
              <FormControl>
                <FormLabel>ما يشمله البرنامج</FormLabel>
                <VStack align="stretch" spacing="2">
                  {formData.inclusions.map((item, index) => (
                    <Flex key={index} gap="2">
                      <Input
                        value={item}
                        onChange={(e) => handleUpdateListItem('inclusions', index, e.target.value)}
                        placeholder="أدخل ما يشمله البرنامج"
                      />
                      <IconButton
                        icon={<FiMinus />}
                        colorScheme="red"
                        aria-label="حذف العنصر"
                        onClick={() => handleRemoveListItem('inclusions', index)}
                      />
                    </Flex>
                  ))}
                  
                  <Button
                    leftIcon={<FiPlus />}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddListItem('inclusions')}
                  >
                    إضافة عنصر
                  </Button>
                </VStack>
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>ما لا يشمله البرنامج</FormLabel>
                <VStack align="stretch" spacing="2">
                  {formData.exclusions.map((item, index) => (
                    <Flex key={index} gap="2">
                      <Input
                        value={item}
                        onChange={(e) => handleUpdateListItem('exclusions', index, e.target.value)}
                        placeholder="أدخل ما لا يشمله البرنامج"
                      />
                      <IconButton
                        icon={<FiMinus />}
                        colorScheme="red"
                        aria-label="حذف العنصر"
                        onClick={() => handleRemoveListItem('exclusions', index)}
                      />
                    </Flex>
                  ))}
                  
                  <Button
                    leftIcon={<FiPlus />}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddListItem('exclusions')}
                  >
                    إضافة عنصر
                  </Button>
                </VStack>
              </FormControl>
            </GridItem>
          </Grid>
        </Box>

        <Divider />

        {/* الجدول الزمني */}
        <Box>
          <Heading size="sm" mb="4">
            الجدول الزمني للبرنامج
          </Heading>
          
          <FormControl isInvalid={!!errors.itinerary}>
            <VStack align="stretch" spacing="4">
              {formData.itinerary.map((day, index) => (
                <Box
                  key={index}
                  p="4"
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={errors.itinerary ? 'red.300' : 'gray.200'}
                >
                  <Flex justify="space-between" align="center" mb="3">
                    <Text fontWeight="medium">اليوم {index + 1}</Text>
                    <IconButton
                      icon={<FiMinus />}
                      colorScheme="red"
                      size="sm"
                      aria-label="حذف اليوم"
                      onClick={() => handleRemoveListItem('itinerary', index)}
                    />
                  </Flex>
                  
                  <VStack align="stretch" spacing="3">
                    <FormControl isRequired>
                      <FormLabel fontSize="sm">العنوان</FormLabel>
                      <Input
                        value={day.title}
                        onChange={(e) => handleUpdateItineraryItem(index, 'title', e.target.value)}
                        placeholder="أدخل عنوان اليوم"
                        size="sm"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">الوصف</FormLabel>
                      <Textarea
                        value={day.description}
                        onChange={(e) => handleUpdateItineraryItem(index, 'description', e.target.value)}
                        placeholder="أدخل وصف تفصيلي لفعاليات اليوم"
                        size="sm"
                        rows={3}
                      />
                    </FormControl>
                  </VStack>
                </Box>
              ))}
              
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                variant="outline"
                onClick={() => handleAddListItem('itinerary')}
              >
                إضافة يوم جديد
              </Button>
            </VStack>
            <FormErrorMessage>{errors.itinerary}</FormErrorMessage>
          </FormControl>
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
            {tourPackage ? 'تحديث البرنامج' : 'إضافة البرنامج'}
          </Button>
        </Flex>
      </Stack>
    </form>
  );
};

export default TourPackageForm;
