import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  useToast,
  Progress,
  Badge,
  Code,
  List,
  ListItem,
  ListIcon,
  Flex,
  Spacer
} from '@chakra-ui/react';
import { FaCheck, FaTimes, FaExclamationTriangle, FaArrowRight, FaDatabase, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import BackButton from '../shared/BackButton';
import { migrateEmployeesToUsers, deleteEmployeesCollection } from '../../utils/migrateEmployeesToUsers';

const DataMigration = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [deleteResult, setDeleteResult] = useState(null);

  // التحقق من صلاحيات المستخدم
  if (!user || user.role !== 'admin') {
    return (
      <Container maxW="container.md" py={10}>
        <Alert status="error" variant="solid" borderRadius="md">
          <AlertIcon />
          <AlertTitle>غير مصرح!</AlertTitle>
          <AlertDescription>
            هذه الصفحة متاحة فقط لمسؤولي النظام.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  const handleMigration = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في نقل البيانات من جدول employees إلى جدول users؟')) {
      return;
    }

    setIsMigrating(true);
    try {
      const result = await migrateEmployeesToUsers();
      setMigrationResult(result);
      
      toast({
        title: result.success ? 'تمت العملية بنجاح' : 'حدث خطأ',
        description: result.message || result.error,
        status: result.success ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    } catch (error) {
      setMigrationResult({
        success: false,
        error: error.message || 'حدث خطأ غير متوقع أثناء عملية النقل'
      });
      
      toast({
        title: 'حدث خطأ',
        description: error.message || 'حدث خطأ غير متوقع أثناء عملية النقل',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('تحذير: هذه العملية لا يمكن التراجع عنها! هل أنت متأكد من رغبتك في حذف جدول employees؟')) {
      return;
    }
    
    if (!window.confirm('تأكيد نهائي: هل تم نقل جميع البيانات المهمة من جدول employees إلى جدول users؟')) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteEmployeesCollection();
      setDeleteResult(result);
      
      toast({
        title: result.success ? 'تمت العملية بنجاح' : 'حدث خطأ',
        description: result.message || result.error,
        status: result.success ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    } catch (error) {
      setDeleteResult({
        success: false,
        error: error.message || 'حدث خطأ غير متوقع أثناء عملية الحذف'
      });
      
      toast({
        title: 'حدث خطأ',
        description: error.message || 'حدث خطأ غير متوقع أثناء عملية الحذف',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Container maxW="container.xl" p={4}>
      <Box mb={6}>
        <BackButton />
        <Heading size="lg" mt={2}>ترحيل البيانات</Heading>
        <Text color="gray.600">
          أداة لترحيل البيانات من النظام القديم إلى النظام الجديد
        </Text>
      </Box>
      <VStack spacing={6} align="stretch">
        <Flex align="center" bg="blue.50" p={4} borderRadius="md">
          <Heading size="lg">نقل البيانات من جدول Employees إلى Users</Heading>
          <Spacer />
          <Badge colorScheme="blue" fontSize="md" p={2}>أداة النظام</Badge>
        </Flex>

        <Alert status="warning" variant="left-accent">
          <AlertIcon />
          <Box>
            <AlertTitle>تنبيه هام!</AlertTitle>
            <AlertDescription>
              هذه الأداة مخصصة لنقل البيانات من النظام القديم (جدول employees) إلى النظام الجديد (جدول users).
              يرجى التأكد من فهم العملية قبل المتابعة.
            </AlertDescription>
          </Box>
        </Alert>

        <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
          <Heading size="md" mb={4}>خطوات عملية النقل:</Heading>
          <List spacing={3}>
            <ListItem>
              <ListIcon as={FaArrowRight} color="blue.500" />
              نقل جميع بيانات الموظفين من جدول employees إلى جدول users
            </ListItem>
            <ListItem>
              <ListIcon as={FaArrowRight} color="blue.500" />
              الحفاظ على نفس المعرفات (IDs) لضمان استمرارية عمل النظام
            </ListItem>
            <ListItem>
              <ListIcon as={FaArrowRight} color="blue.500" />
              التحقق من اكتمال عملية النقل قبل حذف البيانات القديمة
            </ListItem>
            <ListItem>
              <ListIcon as={FaExclamationTriangle} color="red.500" />
              <Text as="span" fontWeight="bold">تحذير:</Text> حذف جدول employees هي عملية نهائية لا يمكن التراجع عنها!
            </ListItem>
          </List>
        </Box>

        <Divider />

        <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
          <Heading size="md" mb={4}>الخطوة 1: نقل البيانات</Heading>
          <Text mb={4}>
            سيتم نقل جميع بيانات الموظفين من جدول employees إلى جدول users مع الحفاظ على المعرفات.
            إذا كان المستخدم موجوداً بالفعل في جدول users، سيتم تخطيه.
          </Text>
          
          {migrationResult && (
            <Alert 
              status={migrationResult.success ? 'success' : 'error'} 
              mb={4}
              borderRadius="md"
            >
              <AlertIcon />
              <Box>
                <AlertTitle>{migrationResult.success ? 'تمت العملية بنجاح' : 'حدث خطأ'}</AlertTitle>
                <AlertDescription>
                  {migrationResult.message || migrationResult.error}
                  {migrationResult.success && migrationResult.migratedCount !== undefined && (
                    <Text mt={2}>
                      تم نقل {migrationResult.migratedCount} موظف بنجاح
                      {migrationResult.skippedCount !== undefined && ` وتخطي ${migrationResult.skippedCount} موظف`}.
                    </Text>
                  )}
                  {migrationResult.missingUsers && migrationResult.missingUsers.length > 0 && (
                    <Box mt={2}>
                      <Text fontWeight="bold">المستخدمون المفقودون:</Text>
                      <Code p={2} mt={1} display="block">
                        {migrationResult.missingUsers.join(', ')}
                      </Code>
                    </Box>
                  )}
                </AlertDescription>
              </Box>
            </Alert>
          )}
          
          <Button
            leftIcon={<FaDatabase />}
            colorScheme="blue"
            isLoading={isMigrating}
            loadingText="جاري نقل البيانات..."
            onClick={handleMigration}
            width="full"
          >
            بدء عملية نقل البيانات
          </Button>
          
          {isMigrating && (
            <Progress size="xs" isIndeterminate colorScheme="blue" mt={2} />
          )}
        </Box>

        <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
          <Heading size="md" mb={4}>الخطوة 2: حذف البيانات القديمة</Heading>
          <Text mb={4}>
            بعد التأكد من نقل جميع البيانات بنجاح، يمكنك حذف جدول employees.
            <Text as="span" fontWeight="bold" color="red.500"> هذه العملية لا يمكن التراجع عنها!</Text>
          </Text>
          
          {deleteResult && (
            <Alert 
              status={deleteResult.success ? 'success' : 'error'} 
              mb={4}
              borderRadius="md"
            >
              <AlertIcon />
              <Box>
                <AlertTitle>{deleteResult.success ? 'تمت العملية بنجاح' : 'حدث خطأ'}</AlertTitle>
                <AlertDescription>
                  {deleteResult.message || deleteResult.error}
                  {deleteResult.success && deleteResult.deletedCount !== undefined && (
                    <Text mt={2}>
                      تم حذف {deleteResult.deletedCount} موظف من جدول employees.
                    </Text>
                  )}
                  {deleteResult.missingUsers && deleteResult.missingUsers.length > 0 && (
                    <Box mt={2}>
                      <Text fontWeight="bold">المستخدمون المفقودون:</Text>
                      <Code p={2} mt={1} display="block">
                        {deleteResult.missingUsers.join(', ')}
                      </Code>
                    </Box>
                  )}
                </AlertDescription>
              </Box>
            </Alert>
          )}
          
          <Button
            leftIcon={<FaTrash />}
            colorScheme="red"
            isLoading={isDeleting}
            loadingText="جاري حذف البيانات..."
            onClick={handleDelete}
            width="full"
            isDisabled={!migrationResult || !migrationResult.success}
          >
            حذف جدول Employees
          </Button>
          
          {isDeleting && (
            <Progress size="xs" isIndeterminate colorScheme="red" mt={2} />
          )}
        </Box>
      </VStack>
    </Container>
  );
};

export default DataMigration;
