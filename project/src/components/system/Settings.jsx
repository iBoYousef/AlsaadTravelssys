import React, { useState, useEffect } from 'react';
import {
  Button, VStack, HStack, Box, Text, Heading, useToast, Divider,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, useDisclosure, Badge,
  SimpleGrid, Flex, Spinner
} from '@chakra-ui/react';
import firebaseServices from '../../firebase';
import { collection, addDoc, deleteDoc, getDocs, query, where, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { getEmptyDocument } from '../../utils/dbSchemas';
import { CUSTOMER_FIELDS_META } from '../../utils/customerFieldsMeta';
import { DEFAULT_REQUIRED_CUSTOMER_FIELDS } from '../../utils/requiredCustomerFields';
import { FormLabel } from '@chakra-ui/react';
import BackButton from '../shared/BackButton';
import { cleanTestDataWithToast } from '../../utils/cleanTestData';

const { db } = firebaseServices;

const DEMO_COLLECTIONS = {
  flights: { name: 'رحلات الطيران', color: 'blue' },
  hotels: { name: 'الفنادق', color: 'green' },
  vehicles: { name: 'المركبات', color: 'purple' },
  visas: { name: 'التأشيرات', color: 'orange' },
  events: { name: 'الفعاليات', color: 'pink' },
  customers: { name: 'العملاء', color: 'cyan' },
  revenues: { name: 'الإيرادات', color: 'teal' },
  expenses: { name: 'المصروفات', color: 'red' }
};

const Settings = () => {
  // حالة الحقول الإجبارية للعملاء
  const [requiredCustomerFields, setRequiredCustomerFields] = useState(DEFAULT_REQUIRED_CUSTOMER_FIELDS);
  const [isSavingFields, setIsSavingFields] = useState(false);
  const [isCleaningAllTestData, setIsCleaningAllTestData] = useState(false);

  // تحميل الإعدادات من قاعدة البيانات أو التخزين المحلي (يمكن تطويرها لاحقًا)
  useEffect(() => {
    // مثال: تحميل من localStorage
    const savedFields = localStorage.getItem('requiredCustomerFields');
    if (savedFields) {
      setRequiredCustomerFields(JSON.parse(savedFields));
    }
  }, []);

  // حفظ الإعدادات (يمكن ربطها بقاعدة البيانات لاحقًا)
  const saveRequiredFields = () => {
    setIsSavingFields(true);
    localStorage.setItem('requiredCustomerFields', JSON.stringify(requiredCustomerFields));
    setTimeout(() => {
      setIsSavingFields(false);
      toast({
        title: 'تم حفظ الحقول الإجبارية',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }, 800);
  };

  // تبديل حالة الحقل
  const toggleField = (key) => {
    setRequiredCustomerFields(prev =>
      prev.includes(key)
        ? prev.filter(f => f !== key)
        : [...prev, key]
    );
  };

  const [isLoading, setIsLoading] = useState(false);
  const [demoCounts, setDemoCounts] = useState(
    Object.keys(DEMO_COLLECTIONS).reduce((acc, key) => ({ ...acc, [key]: 0 }), {})
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  const toast = useToast();
  const { user } = useAuth();

  const fetchDemoCounts = async () => {
    try {
      console.log('جاري جلب عدد العناصر التجريبية...');
      const counts = {};
      for (const collectionName of Object.keys(DEMO_COLLECTIONS)) {
        const q = query(collection(db, collectionName), where("isDemo", "==", true));
        const snapshot = await getDocs(q);
        counts[collectionName] = snapshot.size;
      }
      console.log('تم جلب العناصر التجريبية:', counts);
      setDemoCounts(counts);
    } catch (error) {
      console.error('خطأ في جلب عدد العناصر التجريبية:', error);
      toast({
        title: "خطأ في جلب البيانات",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    console.log('تهيئة صفحة الإعدادات...');
    fetchDemoCounts();
  }, []);

  const generateDemoData = async () => {
    try {
      setIsLoading(true);
      console.log('جاري إنشاء البيانات التجريبية...');

      // إنشاء عملاء تجريبيين
      const customerIds = [];
      const customersRef = collection(db, 'customers');
      for (let i = 1; i <= 5; i++) {
        const customerData = {
          ...getEmptyDocument('customers'),
          name: `عميل تجريبي ${i}`,
          email: `customer${i}@test.com`,
          phone: `9665000000${i.toString().padStart(2, '0')}`,
          nationality: 'سعودي',
          isActive: true,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          isDemo: true
        };
        const docRef = await addDoc(customersRef, customerData);
        customerIds.push(docRef.id);
        console.log(`تم إضافة عميل تجريبي: ${docRef.id}`);
      }

      // إنشاء بيانات تجريبية لكل جدول
      for (const collectionName of Object.keys(DEMO_COLLECTIONS)) {
        if (collectionName === 'customers') continue; // تم إنشاء العملاء بالفعل

        console.log(`جاري إضافة البيانات التجريبية إلى ${collectionName}...`);
        const collectionRef = collection(db, collectionName);
        
        for (let i = 1; i <= 3; i++) {
          const baseData = {
            ...getEmptyDocument(collectionName),
            createdAt: serverTimestamp(),
            createdBy: user.uid,
            isDemo: true
          };

          // إضافة البيانات الخاصة بكل جدول
          let itemData = { ...baseData };
          switch (collectionName) {
            case 'flights':
              itemData = {
                ...itemData,
                customerId: customerIds[Math.floor(Math.random() * customerIds.length)],
                from: ['جدة', 'الرياض', 'الدمام'][i % 3],
                to: ['دبي', 'القاهرة', 'اسطنبول'][i % 3],
                departureDate: new Date(2024, 3 + i, i).toISOString(),
                airline: ['الخطوط السعودية', 'طيران الإمارات', 'الخطوط التركية'][i % 3],
                price: 1000 + (i * 500),
                status: 'confirmed'
              };
              break;

            case 'hotels':
              itemData = {
                ...itemData,
                customerId: customerIds[Math.floor(Math.random() * customerIds.length)],
                hotelName: ['فندق الريتز', 'فندق هيلتون', 'فندق ماريوت'][i % 3],
                city: ['مكة', 'المدينة', 'دبي'][i % 3],
                checkIn: new Date(2024, 3 + i, i).toISOString(),
                checkOut: new Date(2024, 3 + i, i + 3).toISOString(),
                roomType: ['مفردة', 'مزدوجة', 'جناح'][i % 3],
                price: 500 + (i * 300),
                status: 'confirmed'
              };
              break;

            case 'vehicles':
              itemData = {
                ...itemData,
                customerId: customerIds[Math.floor(Math.random() * customerIds.length)],
                vehicleType: ['سيارة', 'حافلة صغيرة', 'حافلة'][i % 3],
                model: ['تويوتا كامري', 'هيونداي H1', 'مرسيدس'][i % 3],
                startDate: new Date(2024, 3 + i, i).toISOString(),
                endDate: new Date(2024, 3 + i, i + 5).toISOString(),
                price: 200 + (i * 100),
                status: 'confirmed'
              };
              break;

            case 'visas':
              itemData = {
                ...itemData,
                customerId: customerIds[Math.floor(Math.random() * customerIds.length)],
                country: ['الإمارات', 'مصر', 'تركيا'][i % 3],
                type: ['سياحية', 'عمل', 'زيارة'][i % 3],
                duration: ['30 يوم', '90 يوم', '180 يوم'][i % 3],
                price: 300 + (i * 200),
                status: 'issued'
              };
              break;

            case 'events':
              itemData = {
                ...itemData,
                name: ['موسم الرياض', 'معرض السياحة', 'مهرجان جدة'][i % 3],
                location: ['الرياض', 'جدة', 'الدمام'][i % 3],
                startDate: new Date(2024, 3 + i, i).toISOString(),
                endDate: new Date(2024, 3 + i, i + 7).toISOString(),
                price: 100 + (i * 50),
                capacity: 100,
                bookedCount: 0,
                status: 'active'
              };
              break;

            case 'revenues':
              itemData = {
                ...itemData,
                type: ['flight', 'hotel', 'visa'][i % 3],
                customerId: customerIds[Math.floor(Math.random() * customerIds.length)],
                amount: 1000 + (i * 500),
                description: ['حجز طيران', 'حجز فندق', 'إصدار تأشيرة'][i % 3],
                paymentMethod: 'cash',
                paymentStatus: 'paid',
                transactionDate: new Date(2024, 3 + i, i).toISOString()
              };
              break;

            case 'expenses':
              itemData = {
                ...itemData,
                category: ['رواتب', 'إيجار', 'مرافق'][i % 3],
                amount: 5000 + (i * 1000),
                description: ['رواتب موظفين', 'إيجار المكتب', 'فواتير مرافق'][i % 3],
                paymentMethod: 'bank_transfer',
                paymentStatus: 'paid',
                transactionDate: new Date(2024, 3 + i, i).toISOString()
              };
              break;
          }

          const docRef = await addDoc(collectionRef, itemData);
          console.log(`تم إضافة عنصر تجريبي إلى ${collectionName}:`, docRef.id);
        }
      }

      await fetchDemoCounts();
      
      toast({
        title: "تم إنشاء البيانات التجريبية",
        description: "تم إضافة البيانات التجريبية بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('خطأ في إنشاء البيانات التجريبية:', error);
      toast({
        title: "خطأ في إنشاء البيانات",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDemoData = async () => {
    try {
      setIsLoading(true);
      onClose();
      console.log('جاري إزالة البيانات التجريبية...');

      const batch = writeBatch(db);
      let totalDeleted = 0;

      for (const collectionName of Object.keys(DEMO_COLLECTIONS)) {
        console.log(`جاري إزالة البيانات التجريبية من ${collectionName}...`);
        const q = query(collection(db, collectionName), where("isDemo", "==", true));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          console.log(`لا توجد بيانات تجريبية في ${collectionName}`);
          continue;
        }

        snapshot.docs.forEach(doc => {
          console.log(`حذف الوثيقة ${doc.id} من ${collectionName}`);
          batch.delete(doc.ref);
          totalDeleted++;
        });
      }

      if (totalDeleted > 0) {
        console.log(`جاري حذف ${totalDeleted} وثيقة...`);
        await batch.commit();
        console.log('تم الحذف بنجاح');
      } else {
        console.log('لا توجد بيانات تجريبية للحذف');
      }

      await fetchDemoCounts();
      
      toast({
        title: "تم إزالة البيانات التجريبية",
        description: `تم حذف ${totalDeleted} عنصر بنجاح`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('خطأ في إزالة البيانات التجريبية:', error);
      toast({
        title: "خطأ في إزالة البيانات",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalDemoItems = Object.values(demoCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <VStack spacing={6} align="stretch">
        <Box>
          <BackButton />
          <Heading size="lg">الإعدادات</Heading>
          <Text color="gray.600">إدارة إعدادات النظام</Text>
        </Box>
        
        <Divider />

        {/* إعداد الحقول الإجبارية للعملاء */}
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>الحقول الإجبارية للعملاء</Heading>
          <Text fontSize="sm" color="gray.500" mb={2}>حدد الحقول التي تريد جعلها إجبارية عند إضافة أو تعديل عميل</Text>
          <SimpleGrid columns={[1, 2, 3]} spacing={3} mb={4}>
            {CUSTOMER_FIELDS_META.map(field => (
              <Flex key={field.key} align="center">
                <input
                  type="checkbox"
                  id={field.key}
                  checked={requiredCustomerFields.includes(field.key)}
                  onChange={() => toggleField(field.key)}
                  style={{ accentColor: '#3182ce', width: 18, height: 18, marginLeft: 8 }}
                />
                <FormLabel htmlFor={field.key} mb={0} fontWeight="normal">{field.label}</FormLabel>
              </Flex>
            ))}
          </SimpleGrid>
          <Button
            colorScheme="blue"
            onClick={saveRequiredFields}
            isLoading={isSavingFields}
            loadingText="جاري الحفظ..."
            mt={2}
          >
            حفظ التغييرات
          </Button>
        </Box>

        <Divider />
        
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="md">البيانات التجريبية</Heading>
              <Badge colorScheme={totalDemoItems > 0 ? "blue" : "gray"} fontSize="md">
                {totalDemoItems} عنصر تجريبي
              </Badge>
            </HStack>

            <Text color="gray.600">
              إضافة أو إزالة بيانات تجريبية للنظام. تشمل البيانات التجريبية:
            </Text>

            <SimpleGrid columns={[2, 3, 4]} spacing={4}>
              {Object.entries(DEMO_COLLECTIONS).map(([key, { name, color }]) => (
                <Badge key={key} colorScheme={color}>
                  {name} ({demoCounts[key]})
                </Badge>
              ))}
            </SimpleGrid>
            
            <HStack spacing={4}>
              <Button
                colorScheme="blue"
                onClick={generateDemoData}
                isLoading={isLoading}
                isDisabled={totalDemoItems > 0}
              >
                إضافة بيانات تجريبية
              </Button>
              
              <Button
                colorScheme="red"
                variant="outline"
                onClick={onOpen}
                isDisabled={totalDemoItems === 0}
              >
                إزالة البيانات التجريبية
              </Button>
            </HStack>
          </VStack>
        </Box>
      </VStack>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              تأكيد إزالة البيانات التجريبية
            </AlertDialogHeader>

            <AlertDialogBody>
              هل أنت متأكد من رغبتك في إزالة جميع البيانات التجريبية؟ ({totalDemoItems} عنصر)
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={handleRemoveDemoData} mr={3} isLoading={isLoading}>
                نعم، قم بالإزالة
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </div>
  );
};

export default Settings;
