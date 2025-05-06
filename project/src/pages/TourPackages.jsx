import React, { useState, useEffect, useRef, memo } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast,
  Spinner,
  Center,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  useBreakpointValue,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Image,
  Grid,
  UnorderedList,
  ListItem,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  ButtonGroup,
  Tooltip
} from '@chakra-ui/react';
import { FiPlus, FiDownload, FiRefreshCw, FiGrid, FiList } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { tourPackageService } from '../services/api';
import TourPackageTable from '../components/tours/TourPackageTable';
import TourPackageForm from '../components/tours/TourPackageForm';
import TourPackageFilters from '../components/tours/TourPackageFilters';
import BackButton from '../components/shared/BackButton';
import { formatAmount } from '../utils/validationUtils';
import { useActionLogger } from '../hooks/useActionLogger';

/**
 * صفحة إدارة البرامج السياحية
 * تعرض قائمة البرامج السياحية وتتيح إضافة وتعديل وحذف البرامج
 */
const TourPackages = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // حالة البرامج
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // إضافة حالة لعرض التحميل المتكاسل
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPackages, setTotalPackages] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  
  // حالة البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    destination: 'all',
    duration: 'all',
    priceRange: [0, 10000],
    status: 'all'
  });
  
  // قوائم الفلاتر
  const [destinations, setDestinations] = useState([]);
  const [durations, setDurations] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  
  // حالة المودال
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  // مرجع للبرنامج المراد حذفه
  const packageToDeleteRef = useRef(null);
  const cancelRef = useRef();
  
  // هوكس
  const { logPageView, logCreate, logUpdate, logDelete, logSearch, logExport, ACTION_CATEGORIES } = useActionLogger();

  // تسجيل عرض الصفحة عند التحميل
  useEffect(() => {
    logPageView('صفحة البرامج السياحية', ACTION_CATEGORIES.TOUR);
  }, [logPageView]);

  // جلب البرامج السياحية
  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await tourPackageService.getAllPackages();
      setPackages(data);
      setTotalPackages(data.length);
      
      // إعادة تعيين الصفحة الحالية عند تحديث البيانات
      setCurrentPage(1);
      
      // استخراج قائمة الوجهات الفريقة من البرامج
      const uniqueDestinations = [...new Set(data.map(pkg => pkg.destination))].filter(Boolean).sort();
      setDestinations(uniqueDestinations);
      
      // استخراج قائمة المدد الفريقة من البرامج
      const uniqueDurations = [...new Set(data.map(pkg => pkg.duration))].filter(Boolean).sort();
      setDurations(uniqueDurations);
      
      // تحديد الحد الأدنى والأقصى للسعر
      if (data.length > 0) {
        const prices = data.map(pkg => pkg.price).filter(price => !isNaN(price));
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
      
      // تطبيق الفلاتر الحالية على البيانات المحدثة
      applyFilters(data);
      
    } catch (error) {
      console.error('خطأ في جلب البرامج السياحية:', error);
      setError('حدث خطأ أثناء جلب البرامج السياحية. يرجى المحاولة مرة أخرى.');
      toast({
        title: 'خطأ في جلب البيانات',
        description: error.message || 'حدث خطأ غير معروف',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // دالة تطبيق الفلاتر على البيانات
  const applyFilters = (data = packages) => {
    if (!data.length) return;
    
    let result = [...data];
    
    // تطبيق البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(pkg => 
        (pkg.name && pkg.name.toLowerCase().includes(searchLower)) ||
        (pkg.destination && pkg.destination.toLowerCase().includes(searchLower)) ||
        (pkg.description && pkg.description.toLowerCase().includes(searchLower))
      );
      
      // تسجيل حدث البحث
      logSearch(searchTerm, ACTION_CATEGORIES.TOUR, { 
        resultsCount: result.length,
        totalCount: packages.length
      });
    }
    
    // تطبيق فلتر الوجهة
    if (filters.destination && filters.destination !== 'all') {
      result = result.filter(pkg => pkg.destination === filters.destination);
    }
    
    // تطبيق فلتر المدة
    if (filters.duration && filters.duration !== 'all') {
      result = result.filter(pkg => pkg.duration === filters.duration);
    }
    
    // تطبيق فلتر نطاق السعر
    result = result.filter(pkg => 
      pkg.price >= filters.priceRange[0] && 
      pkg.price <= filters.priceRange[1]
    );
    
    // تطبيق فلتر الحالة
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        result = result.filter(pkg => pkg.active);
      } else if (filters.status === 'inactive') {
        result = result.filter(pkg => !pkg.active);
      } else if (filters.status === 'featured') {
        result = result.filter(pkg => pkg.featured);
      }
    }
    
    setFilteredPackages(result);
    setTotalPackages(result.length);
    setCurrentPage(1); // إعادة تعيين الصفحة الحالية عند تغيير الفلاتر
  };
  
  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchPackages();
  }, []);
  
  // فتح نموذج إضافة برنامج جديد
  const handleAddPackage = () => {
    setSelectedPackage(null);
    onFormOpen();
  };
  
  // فتح نموذج تعديل برنامج موجود
  const handleEditPackage = (tourPackage) => {
    setSelectedPackage(tourPackage);
    onFormOpen();
  };
  
  // فتح مودال عرض تفاصيل البرنامج
  const handleViewPackage = (tourPackage) => {
    setSelectedPackage(tourPackage);
    onViewOpen();
  };
  
  // فتح مودال حذف برنامج
  const handleDeleteClick = (tourPackage) => {
    packageToDeleteRef.current = tourPackage;
    onDeleteOpen();
  };
  
  // نسخ برنامج موجود
  const handleClonePackage = (tourPackage) => {
    const clonedPackage = {
      ...tourPackage,
      name: `نسخة من ${tourPackage.name}`,
      id: null
    };
    
    setSelectedPackage(clonedPackage);
    onFormOpen();
    
    // تسجيل حدث نسخ البرنامج
    logCreate('نسخ برنامج سياحي', '', ACTION_CATEGORIES.TOUR, {
      originalPackageId: tourPackage.id,
      originalPackageName: tourPackage.name
    });
  };
  
  // تغيير حالة نشاط البرنامج
  const handleToggleActive = async (id, isActive) => {
    try {
      const updatedPackage = await tourPackageService.updatePackage(
        id,
        { active: isActive, user }
      );
      
      setPackages(prev => 
        prev.map(pkg => pkg.id === id ? { ...pkg, active: isActive } : pkg)
      );
      
      // تسجيل حدث تغيير حالة البرنامج
      const tourPackage = packages.find(pkg => pkg.id === id);
      logUpdate('حالة برنامج سياحي', id, ACTION_CATEGORIES.TOUR, {
        packageName: tourPackage?.name || 'غير معروف',
        oldStatus: !isActive ? 'نشط' : 'غير نشط',
        newStatus: isActive ? 'نشط' : 'غير نشط'
      });
      
      toast({
        title: isActive ? 'تم تنشيط البرنامج' : 'تم إيقاف البرنامج',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('خطأ في تحديث حالة البرنامج:', error);
      toast({
        title: 'خطأ في تحديث حالة البرنامج',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // حذف برنامج
  const handleDeleteConfirm = async () => {
    if (!packageToDeleteRef.current) return;
    
    try {
      const packageToDelete = packageToDeleteRef.current;
      await tourPackageService.deletePackage(packageToDelete.id, { user });
      
      setPackages(prev => prev.filter(pkg => pkg.id !== packageToDelete.id));
      
      // تسجيل حدث حذف البرنامج
      logDelete('برنامج سياحي', packageToDelete.id, ACTION_CATEGORIES.TOUR, {
        packageName: packageToDelete.name,
        destination: packageToDelete.destination
      });
      
      toast({
        title: 'تم حذف البرنامج',
        description: 'تم حذف البرنامج السياحي بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('خطأ في حذف البرنامج:', error);
      toast({
        title: 'خطأ في حذف البرنامج',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      packageToDeleteRef.current = null;
    }
  };
  
  // حفظ برنامج جديد أو تحديث برنامج موجود
  const handleSubmitPackage = async (packageData) => {
    try {
      if (selectedPackage && selectedPackage.id) {
        // تحديث برنامج موجود
        const updatedPackage = await tourPackageService.updatePackage(
          selectedPackage.id,
          { ...packageData, user }
        );
        
        setPackages(prev => 
          prev.map(pkg => pkg.id === selectedPackage.id ? { ...updatedPackage, id: selectedPackage.id } : pkg)
        );
        
        // تسجيل حدث تعديل البرنامج
        logUpdate('برنامج سياحي', selectedPackage.id, ACTION_CATEGORIES.TOUR, {
          packageName: packageData.name,
          destination: packageData.destination
        });
        
        toast({
          title: 'تم تحديث البرنامج',
          description: 'تم تحديث البرنامج السياحي بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // إضافة برنامج جديد
        const newPackage = await tourPackageService.createPackage({
          ...packageData,
          createdBy: user?.uid || 'unknown',
          createdAt: new Date().toISOString()
        });
        
        setPackages(prev => [newPackage, ...prev]);
        
        // تسجيل حدث إضافة البرنامج
        logCreate('برنامج سياحي', newPackage.id, ACTION_CATEGORIES.TOUR, {
          packageName: packageData.name,
          destination: packageData.destination
        });
        
        toast({
          title: 'تم إضافة البرنامج',
          description: 'تم إضافة البرنامج السياحي بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('خطأ في حفظ البرنامج:', error);
      throw error;
    }
  };
  
  // معالجة تغيير الفلاتر
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // معالجة إعادة تعيين الفلاتر
  const handleResetFilters = () => {
    setFilters({
      destination: 'all',
      duration: 'all',
      priceRange: [minPrice, maxPrice],
      status: 'all'
    });
    setSearchTerm('');
    
    // إعادة تطبيق الفلاتر بعد إعادة التعيين
    setTimeout(() => applyFilters(packages), 0);
  };
  
  // معالجة تطبيق الفلاتر
  const handleApplyFilters = () => {
    applyFilters();
  };
  
  // تصدير جميع البرامج إلى ملف Excel
  const handleExportToExcel = () => {
    // تنفيذ منطق التصدير هنا
    
    // تسجيل حدث تصدير البيانات
    logExport('البرامج السياحية', 'Excel', ACTION_CATEGORIES.TOUR, {
      count: filteredPackages.length,
      filters: filters
    });
    
    toast({
      title: 'جاري التصدير',
      description: 'جاري تصدير بيانات البرامج السياحية إلى ملف Excel',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  return (
    <Box p="4">
      <Flex justify="space-between" align="center" mb="6">
        <Box>
          <BackButton />
          <Heading size="lg">البرامج السياحية</Heading>
        </Box>
        
        <HStack spacing="3">
          <ButtonGroup isAttached variant="outline" size="md">
            <Tooltip label="عرض جدولي">
              <IconButton
                icon={<FiList />}
                aria-label="عرض جدولي"
                isActive={viewMode === 'table'}
                onClick={() => setViewMode('table')}
              />
            </Tooltip>
            <Tooltip label="عرض شبكي">
              <IconButton
                icon={<FiGrid />}
                aria-label="عرض شبكي"
                isActive={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
              />
            </Tooltip>
          </ButtonGroup>
          
          <Button
            leftIcon={<FiRefreshCw />}
            variant="outline"
            onClick={fetchPackages}
            isLoading={loading}
            loadingText="جاري التحديث..."
          >
            تحديث
          </Button>
          
          <Button
            leftIcon={<FiDownload />}
            variant="outline"
            onClick={handleExportToExcel}
          >
            تصدير
          </Button>
          
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleAddPackage}
          >
            برنامج جديد
          </Button>
        </HStack>
      </Flex>
      
      <TourPackageFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyFilters}
        destinations={destinations}
        durations={durations}
        minPrice={minPrice}
        maxPrice={maxPrice}
      />
      
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
      ) : (
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>جميع البرامج ({filteredPackages.length})</Tab>
            <Tab>
              البرامج النشطة (
              {filteredPackages.filter(pkg => pkg.active).length})
            </Tab>
            <Tab>
              البرامج المميزة (
              {filteredPackages.filter(pkg => pkg.featured).length})
            </Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p="0" pt="4">
              <TourPackageTable
                packages={filteredPackages.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                onView={handleViewPackage}
                onEdit={handleEditPackage}
                onDelete={handleDeleteClick}
                onClone={handleClonePackage}
                onToggleActive={handleToggleActive}
                isLoading={loading}
                pageSize={pageSize}
                currentPage={currentPage}
                totalPackages={totalPackages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </TabPanel>
            
            <TabPanel p="0" pt="4">
              <TourPackageTable
                packages={filteredPackages.filter(pkg => pkg.active).slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                onView={handleViewPackage}
                onEdit={handleEditPackage}
                onDelete={handleDeleteClick}
                onClone={handleClonePackage}
                onToggleActive={handleToggleActive}
                isLoading={loading}
                pageSize={pageSize}
                currentPage={currentPage}
                totalPackages={totalPackages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </TabPanel>
            
            <TabPanel p="0" pt="4">
              <TourPackageTable
                packages={filteredPackages.filter(pkg => pkg.featured).slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                onView={handleViewPackage}
                onEdit={handleEditPackage}
                onDelete={handleDeleteClick}
                onClone={handleClonePackage}
                onToggleActive={handleToggleActive}
                isLoading={loading}
                pageSize={pageSize}
                currentPage={currentPage}
                totalPackages={totalPackages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
      
      {/* مودال إضافة/تعديل برنامج */}
      <Modal
        isOpen={isFormOpen}
        onClose={onFormClose}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>
            {selectedPackage && selectedPackage.id ? 'تعديل برنامج سياحي' : 'إضافة برنامج سياحي جديد'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            <TourPackageForm
              tourPackage={selectedPackage}
              onSubmit={handleSubmitPackage}
              onClose={onFormClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* مودال تأكيد الحذف */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              تأكيد الحذف
            </AlertDialogHeader>

            <AlertDialogBody>
              هل أنت متأكد من رغبتك في حذف البرنامج السياحي
              {packageToDeleteRef.current && (
                <Text as="span" fontWeight="bold">
                  {' '}"{packageToDeleteRef.current.name}"
                </Text>
              )}؟
              <Text color="red.500" mt="2">
                لا يمكن التراجع عن هذا الإجراء.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} mr="3">
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* مودال عرض تفاصيل البرنامج */}
      <Modal
        isOpen={isViewOpen}
        onClose={onViewClose}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxW="800px">
          <ModalHeader>
            {selectedPackage?.name}
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
                      maxH="300px"
                      mx="auto"
                    />
                  </Box>
                )}
                
                {/* معلومات البرنامج */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4" mb="4">
                  <Box>
                    <Text fontWeight="bold">الوجهة:</Text>
                    <Text>{selectedPackage.destination}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">المدة:</Text>
                    <Text>{selectedPackage.duration}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">السعر:</Text>
                    <Text>{formatAmount(selectedPackage.price)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">الحالة:</Text>
                    <Badge
                      colorScheme={selectedPackage.active ? 'green' : 'red'}
                    >
                      {selectedPackage.active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </Box>
                </Grid>
                
                {/* وصف البرنامج */}
                <Box mb="4">
                  <Text fontWeight="bold" mb="2">الوصف:</Text>
                  <Text whiteSpace="pre-wrap">{selectedPackage.description}</Text>
                </Box>
                
                {/* ما يشمله البرنامج */}
                {selectedPackage.inclusions && selectedPackage.inclusions.length > 0 && (
                  <Box mb="4">
                    <Text fontWeight="bold" mb="2">ما يشمله البرنامج:</Text>
                    <UnorderedList>
                      {selectedPackage.inclusions.map((item, index) => (
                        <ListItem key={index}>{item}</ListItem>
                      ))}
                    </UnorderedList>
                  </Box>
                )}
                
                {/* ما لا يشمله البرنامج */}
                {selectedPackage.exclusions && selectedPackage.exclusions.length > 0 && (
                  <Box mb="4">
                    <Text fontWeight="bold" mb="2">ما لا يشمله البرنامج:</Text>
                    <UnorderedList>
                      {selectedPackage.exclusions.map((item, index) => (
                        <ListItem key={index}>{item}</ListItem>
                      ))}
                    </UnorderedList>
                  </Box>
                )}
                
                {/* الجدول الزمني */}
                {selectedPackage.itinerary && selectedPackage.itinerary.length > 0 && (
                  <Box mb="4">
                    <Text fontWeight="bold" mb="2">الجدول الزمني:</Text>
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
                  </Box>
                )}
                
                {/* معرض الصور */}
                {selectedPackage.galleryImages && selectedPackage.galleryImages.length > 0 && (
                  <Box mb="4">
                    <Text fontWeight="bold" mb="2">معرض الصور:</Text>
                    <Grid templateColumns="repeat(auto-fill, minmax(150px, 1fr))" gap="2">
                      {selectedPackage.galleryImages.map((image, index) => (
                        <Image
                          key={index}
                          src={image}
                          alt={`صورة ${index + 1}`}
                          borderRadius="md"
                          objectFit="cover"
                          h="100px"
                        />
                      ))}
                    </Grid>
                  </Box>
                )}
                
                {/* ملاحظات */}
                {selectedPackage.notes && (
                  <Box mb="4">
                    <Text fontWeight="bold" mb="2">ملاحظات:</Text>
                    <Text whiteSpace="pre-wrap">{selectedPackage.notes}</Text>
                  </Box>
                )}
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default memo(TourPackages);
