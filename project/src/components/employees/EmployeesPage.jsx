import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
  HStack,
  Text,
} from '@chakra-ui/react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaUserPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import BackButton from '../shared/BackButton';
import { useActionLogger } from '../../hooks/useActionLogger';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const { logPageView, logUpdate, logDelete, ACTION_CATEGORIES } = useActionLogger();

  // تسجيل عرض الصفحة عند التحميل
  useEffect(() => {
    if (user && user.role === 'admin') {
      logPageView('صفحة الموظفين', ACTION_CATEGORIES.EMPLOYEE);
    }
  }, [user, logPageView]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employeesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesList);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  const handleStatusChange = async (employeeId, newStatus) => {
    // لا يمكن تعطيل حساب مسؤول النظام
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee && employee.role === 'admin') {
      toast({
        title: "لا يمكن تعطيل حساب مسؤول النظام",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'employees', employeeId), {
        active: newStatus
      });
      logUpdate(`حالة الموظف ${employee.name}`, ACTION_CATEGORIES.EMPLOYEE);
      toast({
        title: `تم ${newStatus ? 'تفعيل' : 'تعطيل'} حساب الموظف بنجاح`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast({
        title: 'حدث خطأ أثناء تحديث حالة الموظف',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    // لا يمكن حذف حساب مسؤول النظام
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee && employee.role === 'admin') {
      toast({
        title: "لا يمكن حذف حساب مسؤول النظام",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'employees', employeeId));
      logDelete(`حساب الموظف ${employee.name}`, ACTION_CATEGORIES.EMPLOYEE);
      toast({
        title: 'تم حذف الموظف بنجاح',
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'حدث خطأ أثناء حذف الموظف',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Box mb={6}>
        <BackButton />
        <Heading size="lg" mb={4}>إدارة الموظفين</Heading>
        <Text color="gray.600">إدارة بيانات الموظفين وحسابات المستخدمين</Text>
      </Box>

      {/* زر إضافة موظف */}
      <Button
        leftIcon={<FaUserPlus />}
        colorScheme="blue"
        onClick={() => navigate('/employees/new')}
        mb={6}
      >
        إضافة موظف جديد
      </Button>

      {/* جدول الموظفين */}
      <Box bg="white" rounded="md" shadow="sm" overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>الاسم</Th>
              <Th>البريد الإلكتروني</Th>
              <Th>الدور</Th>
              <Th>الحالة</Th>
              <Th>الإجراءات</Th>
            </Tr>
          </Thead>
          <Tbody>
            {employees.map((employee) => (
              <Tr key={employee.id}>
                <Td>{employee.name}</Td>
                <Td>{employee.email}</Td>
                <Td>
                  <Badge colorScheme={employee.role === 'admin' ? 'red' : 'blue'}>
                    {employee.role === 'admin' ? 'مسؤول النظام' : 'موظف'}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme={employee.active ? 'green' : 'red'}>
                    {employee.active ? 'نشط' : 'معطل'}
                  </Badge>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      icon={<FaEdit />}
                      aria-label="تعديل"
                      colorScheme="blue"
                      onClick={() => navigate(`/employees/edit/${employee.id}`)}
                    />
                    {employee.role !== 'admin' && (
                      <>
                        <IconButton
                          icon={employee.active ? <FaTimes /> : <FaCheck />}
                          aria-label={employee.active ? 'تعطيل' : 'تفعيل'}
                          colorScheme={employee.active ? 'red' : 'green'}
                          onClick={() => handleStatusChange(employee.id, !employee.active)}
                        />
                        <IconButton
                          icon={<FaTrash />}
                          aria-label="حذف"
                          colorScheme="red"
                          onClick={() => handleDeleteEmployee(employee.id)}
                        />
                      </>
                    )}
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Container>
  );
};

export default EmployeesPage;
