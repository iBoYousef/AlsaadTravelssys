import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Image,
  Button,
  Badge,
  Flex,
  HStack,
  VStack,
  Divider,
  Input,
  Select,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  InputGroup,
  InputLeftElement,
  Spinner,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  ListIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { FiSearch, FiFilter, FiCheck, FiX, FiCalendar, FiMapPin, FiClock, FiDollarSign, FiStar } from 'react-icons/fi';
import { tourPackageService } from '../services/api';
import { formatAmount, formatDate } from '../utils/validationUtils';

/**
 * صفحة عرض البرامج السياحية للعملاء
 * تعرض البرامج المتاحة بطريقة جذابة مع إمكانية البحث والفلترة
 */
const PublicTourPackages = () => {
  // حالة البيانات
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // حالة البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    destination: 'all',
    duration: 'all',
    priceRange: [0, 10000],
    featured: false
  });
  
  // قوائم الفلاتر
  const [destinations, setDestinations] = useState([]);
  const [durations, setDurations] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  
  // حالة المودال
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
  
  // الألوان
  const cardBg = useColorModeValue('white', 'gray.700');
  const priceBg = useColorModeValue('blue.50', 'blue.900');
  const toast = useToast();
  
  // جلب البرامج السياحية
  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await tourPackageService.getAllPackages();
      
      // فلترة البرامج النشطة فقط
      const activePackages = data.filter(pkg => pkg.active);
      
      setPackages(activePackages);
      setFilteredPackages(activePackages);
      
      // استخراج قائمة الوجهات الفريدة من البرامج
      const uniqueDestinations = [...new Set(activePackages.map(pkg => pkg.destination))].filter(Boolean).sort();
      setDestinations(uniqueDestinations);
      
      // استخراج قائمة المدد الفريدة من البرامج
      const uniqueDurations = [...new Set(activePackages.map(pkg => pkg.duration))].filter(Boolean).sort();
      setDurations(uniqueDurations);
      
      // تحديد الحد الأدنى والأقصى للسعر
      if (activePackages.length > 0) {
        const prices = activePackages.map(pkg => pkg.price).filter(price => !isNaN(price));
        if (prices.length > 0) {
          const min = Math.floor(Math.min(...prices));
          const max = Math.ceil(Math.max(...prices));
          setMinPrice(min);
          setMaxPrice(max);
          setFilters(prev => ({
            ...prev,
            priceRange: [min, max]
          }));
        }
      }
    } catch (error) {
      console.error('خطأ في جلب البرامج السياحية:', error);
      setError('حدث خطأ أثناء جلب البرامج السياحية. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };
  
  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchPackages();
  }, []);
  
  // تطبيق الفلاتر والبحث على البرامج
  useEffect(() => {
    if (!packages.length) return;
    
    let result = [...packages];
    
    // تطبيق البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(pkg => 
        (pkg.name && pkg.name.toLowerCase().includes(searchLower)) ||
        (pkg.destination && pkg.destination.toLowerCase().includes(searchLower)) ||
        (pkg.description && pkg.description.toLowerCase().includes(searchLower))
      );
    }
    
    // تطبيق فلتر الوجهة
    if (filters.destination && filters.destination !== 'all') {
      result = result.filter(pkg => pkg.destination === filters.destination);
    }
    
    // تطبيق فلتر المدة
    if (filters.duration && filters.duration !== 'all') {
      result = result.filter(pkg => pkg.duration === filters.duration);
    }
    
    // تطبيق فلتر السعر
    if (filters.priceRange) {
      result = result.filter(pkg => 
        pkg.price >= filters.priceRange[0] && pkg.price <= filters.priceRange[1]
      );
    }
    
    // تطبيق فلتر البرامج المميزة
    if (filters.featured) {
      result = result.filter(pkg => pkg.featured);
    }
    
    setFilteredPackages(result);
  }, [packages, searchTerm, filters]);
  
  // فتح مودال تفاصيل البرنامج
  const handleViewPackage = (tourPackage) => {
    setSelectedPackage(tourPackage);
    onDetailOpen();
  };
  
  // طلب حجز البرنامج
  const handleBookPackage = (tourPackage) => {
    // يمكن هنا توجيه المستخدم إلى صفحة الحجز أو فتح نموذج الحجز
    toast({
      title: 'طلب حجز',
      description: `تم إرسال طلب حجز برنامج "${tourPackage.name}" بنجاح. سيتم التواصل معك قريبًا.`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };
  
  // تحديث فلتر معين
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // إعادة ضبط جميع الفلاتر
  const handleResetFilters = () => {
    setFilters({
      destination: 'all',
      duration: 'all',
      priceRange: [minPrice, maxPrice],
      featured: false
    });
    setSearchTerm('');
  };
  
  // تطبيق الفلاتر
  const handleApplyFilters = () => {
    onFilterClose();
  };
  
  return (
    <Box p="4">
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        justify="space-between" 
        align={{ base: 'flex-start', md: 'center' }} 
        mb="6"
      >
        <Heading size="lg" mb={{ base: 4, md: 0 }}>البرامج السياحية</Heading>
        
        <HStack spacing="3">
          <InputGroup maxW="300px">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="ابحث عن برنامج سياحي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          <Button
            leftIcon={<FiFilter />}
            variant="outline"
            onClick={onFilterOpen}
          >
            فلترة
          </Button>
        </HStack>
      </Flex>
      
      {loading ? (
        <Center p="8">
          <Spinner size="xl" color="blue.500" />
        </Center>
      ) : error ? (
        <Center p="8">
          <Text color="red.500">{error}</Text>
          <Button ml="4" onClick={fetchPackages}>
            إعادة المحاولة
          </Button>
        </Center>
      ) : filteredPackages.length === 0 ? (
        <Center p="8" flexDirection="column">
          <Text fontSize="xl" mb="4">لا توجد برامج سياحية متطابقة مع معايير البحث</Text>
          <Button onClick={handleResetFilters}>إعادة ضبط الفلاتر</Button>
        </Center>
      ) : (
        <Grid 
          templateColumns={{ 
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(4, 1fr)'
          }} 
          gap="6"
        >
          {filteredPackages.map(tourPackage => (
            <GridItem key={tourPackage.id}>
              <Card 
                h="100%" 
                bg={cardBg} 
                boxShadow="md" 
                borderRadius="lg" 
                overflow="hidden"
                transition="transform 0.3s"
                _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
              >
                {/* صورة البرنامج */}
                <Box position="relative">
                  <Image
                    src={tourPackage.imageUrl || 'https://via.placeholder.com/400x200?text=صورة+البرنامج'}
                    alt={tourPackage.name}
                    objectFit="cover"
                    h="200px"
                    w="100%"
                  />
                  
                  {/* شارات */}
                  <HStack position="absolute" top="2" right="2" spacing="2">
                    {tourPackage.featured && (
                      <Badge colorScheme="yellow" fontSize="0.8em" p="1">
                        <Flex align="center">
                          <FiStar style={{ marginLeft: '4px' }} />
                          مميز
                        </Flex>
                      </Badge>
                    )}
                    
                    {tourPackage.discountPrice && tourPackage.discountPrice < tourPackage.price && (
                      <Badge colorScheme="red" fontSize="0.8em" p="1">
                        خصم {Math.round((1 - tourPackage.discountPrice / tourPackage.price) * 100)}%
                      </Badge>
                    )}
                  </HStack>
                </Box>
                
                <CardBody p="4">
                  <VStack align="flex-start" spacing="2">
                    <Heading size="md" noOfLines={1}>{tourPackage.name}</Heading>
                    
                    <Flex align="center">
                      <FiMapPin style={{ marginLeft: '8px' }} />
                      <Text>{tourPackage.destination}</Text>
                    </Flex>
                    
                    <Flex align="center">
                      <FiClock style={{ marginLeft: '8px' }} />
                      <Text>{tourPackage.duration}</Text>
                    </Flex>
                    
                    <Text noOfLines={2} fontSize="sm" color="gray.600">
                      {tourPackage.description}
                    </Text>
                  </VStack>
                </CardBody>
                
                <CardFooter 
                  p="4" 
                  borderTop="1px" 
                  borderColor="gray.200"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    {tourPackage.discountPrice && tourPackage.discountPrice < tourPackage.price ? (
                      <VStack align="flex-start" spacing="0">
                        <Text as="s" fontSize="sm" color="gray.500">
                          {formatAmount(tourPackage.price)}
                        </Text>
                        <Text fontWeight="bold" fontSize="xl" color="blue.600">
                          {formatAmount(tourPackage.discountPrice)}
                        </Text>
                      </VStack>
                    ) : (
                      <Text fontWeight="bold" fontSize="xl" color="blue.600">
                        {formatAmount(tourPackage.price)}
                      </Text>
                    )}
                  </Box>
                  
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => handleViewPackage(tourPackage)}
                  >
                    عرض التفاصيل
                  </Button>
                </CardFooter>
              </Card>
            </GridItem>
          ))}
        </Grid>
      )}
      
      {/* مودال الفلاتر */}
      <Modal isOpen={isFilterOpen} onClose={onFilterClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>تصفية البرامج السياحية</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            <VStack spacing="4" align="stretch">
              <Box>
                <Text mb="2">الوجهة</Text>
                <Select
                  value={filters.destination}
                  onChange={(e) => handleFilterChange('destination', e.target.value)}
                >
                  <option value="all">جميع الوجهات</option>
                  {destinations.map(destination => (
                    <option key={destination} value={destination}>
                      {destination}
                    </option>
                  ))}
                </Select>
              </Box>
              
              <Box>
                <Text mb="2">المدة</Text>
                <Select
                  value={filters.duration}
                  onChange={(e) => handleFilterChange('duration', e.target.value)}
                >
                  <option value="all">جميع المدد</option>
                  {durations.map(duration => (
                    <option key={duration} value={duration}>
                      {duration}
                    </option>
                  ))}
                </Select>
              </Box>
              
              <Box>
                <Flex justify="space-between" mb="2">
                  <Text>نطاق السعر</Text>
                  <Text>
                    {formatAmount(filters.priceRange[0])} - {formatAmount(filters.priceRange[1])}
                  </Text>
                </Flex>
                <RangeSlider
                  min={minPrice}
                  max={maxPrice}
                  step={100}
                  value={filters.priceRange}
                  onChange={(val) => handleFilterChange('priceRange', val)}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
              </Box>
              
              <Flex align="center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.checked)}
                  style={{ marginLeft: '8px' }}
                />
                <label htmlFor="featured">البرامج المميزة فقط</label>
              </Flex>
              
              <HStack spacing="3" justify="flex-end" mt="4">
                <Button variant="outline" onClick={handleResetFilters}>
                  إعادة ضبط
                </Button>
                <Button colorScheme="blue" onClick={handleApplyFilters}>
                  تطبيق
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* مودال تفاصيل البرنامج */}
      <Modal 
        isOpen={isDetailOpen} 
        onClose={onDetailClose} 
        size="xl" 
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>
            {selectedPackage?.name}
            {selectedPackage?.featured && (
              <Badge colorScheme="yellow" mr="2" fontSize="0.6em" verticalAlign="middle">
                <FiStar style={{ display: 'inline', marginLeft: '4px' }} />
                مميز
              </Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            {selectedPackage && (
              <Box>
                {/* صورة البرنامج */}
                {selectedPackage.imageUrl && (
                  <Box mb="4">
                    <Image
                      src={selectedPackage.imageUrl}
                      alt={selectedPackage.name}
                      borderRadius="md"
                      maxH="400px"
                      mx="auto"
                    />
                  </Box>
                )}
                
                {/* معلومات البرنامج */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4" mb="4">
                  <Box>
                    <Flex align="center">
                      <FiMapPin style={{ marginLeft: '8px' }} />
                      <Text fontWeight="bold">الوجهة:</Text>
                      <Text mr="2">{selectedPackage.destination}</Text>
                    </Flex>
                  </Box>
                  <Box>
                    <Flex align="center">
                      <FiClock style={{ marginLeft: '8px' }} />
                      <Text fontWeight="bold">المدة:</Text>
                      <Text mr="2">{selectedPackage.duration}</Text>
                    </Flex>
                  </Box>
                  <Box>
                    <Flex align="center">
                      <FiDollarSign style={{ marginLeft: '8px' }} />
                      <Text fontWeight="bold">السعر:</Text>
                      <Text mr="2">
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
                    </Flex>
                  </Box>
                  <Box>
                    <Flex align="center">
                      <FiCalendar style={{ marginLeft: '8px' }} />
                      <Text fontWeight="bold">تاريخ البدء:</Text>
                      <Text mr="2">
                        {selectedPackage.startDate 
                          ? formatDate(selectedPackage.startDate.toDate()) 
                          : 'متاح على مدار العام'}
                      </Text>
                    </Flex>
                  </Box>
                </Grid>
                
                <Divider my="4" />
                
                {/* وصف البرنامج */}
                <Box mb="4">
                  <Heading size="md" mb="2">وصف البرنامج</Heading>
                  <Text whiteSpace="pre-wrap">{selectedPackage.description}</Text>
                </Box>
                
                <Tabs variant="enclosed" colorScheme="blue" mt="6">
                  <TabList>
                    <Tab>تفاصيل البرنامج</Tab>
                    <Tab>ما يشمله البرنامج</Tab>
                    <Tab>ما لا يشمله البرنامج</Tab>
                    {selectedPackage.itinerary && selectedPackage.itinerary.length > 0 && (
                      <Tab>الجدول الزمني</Tab>
                    )}
                  </TabList>
                  
                  <TabPanels>
                    <TabPanel>
                      <Text whiteSpace="pre-wrap">{selectedPackage.details || selectedPackage.description}</Text>
                    </TabPanel>
                    
                    <TabPanel>
                      {selectedPackage.inclusions && selectedPackage.inclusions.length > 0 ? (
                        <List spacing={2}>
                          {selectedPackage.inclusions.map((item, index) => (
                            <ListItem key={index}>
                              <ListIcon as={FiCheck} color="green.500" />
                              {item}
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Text>لا توجد معلومات متاحة</Text>
                      )}
                    </TabPanel>
                    
                    <TabPanel>
                      {selectedPackage.exclusions && selectedPackage.exclusions.length > 0 ? (
                        <List spacing={2}>
                          {selectedPackage.exclusions.map((item, index) => (
                            <ListItem key={index}>
                              <ListIcon as={FiX} color="red.500" />
                              {item}
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Text>لا توجد معلومات متاحة</Text>
                      )}
                    </TabPanel>
                    
                    {selectedPackage.itinerary && selectedPackage.itinerary.length > 0 && (
                      <TabPanel>
                        <Accordion allowMultiple>
                          {selectedPackage.itinerary.map((day, index) => (
                            <AccordionItem key={index}>
                              <h2>
                                <AccordionButton>
                                  <Box flex="1" textAlign="right">
                                    اليوم {index + 1}: {day.title}
                                  </Box>
                                  <AccordionIcon />
                                </AccordionButton>
                              </h2>
                              <AccordionPanel pb={4}>
                                {day.description}
                              </AccordionPanel>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </TabPanel>
                    )}
                  </TabPanels>
                </Tabs>
                
                {/* معرض الصور */}
                {selectedPackage.galleryImages && selectedPackage.galleryImages.length > 0 && (
                  <Box mt="6">
                    <Heading size="md" mb="2">معرض الصور</Heading>
                    <Grid templateColumns="repeat(auto-fill, minmax(150px, 1fr))" gap="2">
                      {selectedPackage.galleryImages.map((image, index) => (
                        <Image
                          key={index}
                          src={image}
                          alt={`صورة ${index + 1}`}
                          borderRadius="md"
                          objectFit="cover"
                          h="100px"
                          cursor="pointer"
                          onClick={() => window.open(image, '_blank')}
                        />
                      ))}
                    </Grid>
                  </Box>
                )}
                
                {/* ملاحظات */}
                {selectedPackage.notes && (
                  <Box mt="6">
                    <Heading size="md" mb="2">ملاحظات هامة</Heading>
                    <Text whiteSpace="pre-wrap">{selectedPackage.notes}</Text>
                  </Box>
                )}
                
                <Flex justify="center" mt="6">
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={() => handleBookPackage(selectedPackage)}
                    leftIcon={<FiCalendar />}
                  >
                    احجز الآن
                  </Button>
                </Flex>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PublicTourPackages;
