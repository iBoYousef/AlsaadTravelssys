import React, { useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, Box, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { addDoc, serverTimestamp } from 'firebase/firestore';

const collections = [
  'invoices',
  'revenues',
  'expenses',
  'customers',
  'companions',
  'flightBookings',
  'hotelBookings',
  'tourBookings',
  'vehicleBookings',
  'eventBookings',
  'visaApplications',
  'payments',
  'receipts',
  'users', // حذف جميع المستخدمين بما فيهم المشرف الافتراضي
  'employees', // حذف جميع الموظفين
  // أضف أي Collections أخرى تريد حذفها
];

const AdminClearData = () => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [adminDone, setAdminDone] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [seedError, setSeedError] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);

  const deleteAllData = async () => {
    setLoading(true);
    setDone(false);
    setError('');
    try {
      for (const coll of collections) {
        const querySnapshot = await getDocs(collection(db, coll));
        for (const docSnap of querySnapshot.docs) {
          // حذف كل المستندات بدون أي استثناء
          await deleteDoc(doc(db, coll, docSnap.id));
        }
      }
      // بعد الحذف، أضف السجلات الافتتاحية تلقائيًا
      try {
        await addInitialRecords();
      } catch (seedErr) {
        setSeedError('حدث خطأ أثناء إنشاء السجلات الافتتاحية: ' + seedErr.message);
      }
      setDone(true);
    } catch (err) {
      setError('حدث خطأ أثناء حذف البيانات: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // دالة إضافة سجل افتتاحي لكل مجموعة رئيسية
  const addInitialRecords = async () => {
    try {
      await Promise.all([
        addDoc(collection(db, 'invoices'), {
          customerName: 'عميل افتتاحي',
          amount: 0,
          status: 'open',
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, 'revenues'), {
          source: 'افتتاحي',
          amount: 0,
          date: serverTimestamp(),
        }),
        addDoc(collection(db, 'expenses'), {
          category: 'افتتاحي',
          amount: 0,
          date: serverTimestamp(),
        }),
        addDoc(collection(db, 'customers'), {
          name: 'عميل افتتاحي',
          phone: '00000000',
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, 'companions'), {
          name: 'مرافق افتتاحي',
          customerId: 'init',
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, 'flightBookings'), {
          customerName: 'عميل افتتاحي',
          flights: [],
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, 'hotelBookings'), {
          customerName: 'عميل افتتاحي',
          hotel: 'فندق افتتاحي',
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, 'tourBookings'), {
          customerName: 'عميل افتتاحي',
          tourName: 'برنامج افتتاحي',
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, 'vehicleBookings'), {
          customerName: 'عميل افتتاحي',
          vehicleType: 'سيارة افتتاحية',
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, 'eventBookings'), {
          customerName: 'عميل افتتاحي',
          eventName: 'فعالية افتتاحية',
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, 'visaApplications'), {
          customerName: 'عميل افتتاحي',
          country: 'الكويت',
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, 'payments'), {
          customerName: 'عميل افتتاحي',
          amount: 0,
          method: 'افتتاحي',
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, 'receipts'), {
          customerName: 'عميل افتتاحي',
          amount: 0,
          createdAt: serverTimestamp(),
        })
      ]);
    } catch (err) {
      throw err;
    }
  };

  // دالة إعادة إنشاء حساب المشرف الافتراضي
  const recreateAdmin = async () => {
    setAdminLoading(true);
    setAdminDone(false);
    setAdminError('');
    try {
      await addDoc(collection(db, 'employees'), {
        email: 'admin@alsaad-travel.com',
        password: 'admin1234', // في الإنتاج يجب تشفير كلمة المرور
        role: 'admin',
        permissions: ['admin'],
        active: true,
        name: 'المشرف الرئيسي',
        createdAt: new Date().toISOString(),
      });
      setAdminDone(true);
    } catch (err) {
      setAdminError('حدث خطأ أثناء إنشاء حساب المشرف: ' + err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <Box maxW="500px" mx="auto" mt={20} p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
      <Text fontSize="xl" fontWeight="bold" mb={4} color="red.600">تحذير: حذف جميع بيانات النظام</Text>
      <Text mb={6} color="gray.700">
        هذا الزر سيقوم بحذف جميع البيانات من النظام بشكل نهائي، ولا يمكن التراجع عن هذه العملية. تأكد أنك تريد المتابعة قبل الضغط على الزر.
      </Text>
      {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}
      {done && <Alert status="success" mb={4}><AlertIcon />تم حذف جميع البيانات بنجاح!</Alert>}
      <Button colorScheme="red" size="lg" onClick={deleteAllData} isLoading={loading} loadingText="جاري الحذف...">
        حذف جميع البيانات
      </Button>
      {loading && <Spinner mt={4} />}
      <Box mt={10}>
        <Text mb={2} fontWeight="bold">إعادة إنشاء حساب المشرف الافتراضي</Text>
        {adminError && <Alert status="error" mb={4}><AlertIcon />{adminError}</Alert>}
        {adminDone && <Alert status="success" mb={4}><AlertIcon />تم إنشاء حساب المشرف بنجاح!</Alert>}
        <Button colorScheme="blue" size="md" onClick={recreateAdmin} isLoading={adminLoading} loadingText="جاري الإنشاء...">
          إعادة إنشاء حساب المشرف الافتراضي
        </Button>
      </Box>

    </Box>
  );
};

export default AdminClearData;
