import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
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
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FaUserPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import BackButton from '../shared/BackButton';
import userService from '../../services/userService';
import AlsaadButton from '../shared/AlsaadButton';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, checkUserPermission } = useAuth();
  const toast = useToast();

  useEffect(() => {
    // السماح لمسؤول النظام أو أي شخص لديه صلاحية إدارة المستخدمين
    if (!user || (typeof checkUserPermission === 'function' && !checkUserPermission('manage_users'))) {
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const usersList = await userService.getUsers();
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('حدث خطأ أثناء جلب بيانات المستخدمين');
        toast({
          title: 'حدث خطأ أثناء جلب بيانات المستخدمين',
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate, toast]);

  const handleStatusChange = async (userId, newStatus) => {
    // لا يمكن تعطيل حساب مسؤول النظام
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate && userToUpdate.role === 'admin') {
      toast({
        title: "لا يمكن تعطيل حساب مسؤول النظام",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await userService.updateUser(userId, {
        active: newStatus
      });
      
      // تحديث القائمة المحلية
      setUsers(users.map(u => 
        u.id === userId ? { ...u, active: newStatus } : u
      ));
      
      toast({
        title: `تم ${newStatus ? 'تفعيل' : 'تعطيل'} حساب المستخدم بنجاح`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'حدث خطأ أثناء تحديث حالة المستخدم',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    // لا يمكن حذف حساب مسؤول النظام
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete && userToDelete.role === 'admin') {
      toast({
        title: "لا يمكن حذف حساب مسؤول النظام",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      
      // تحديث القائمة المحلية
      setUsers(users.filter(u => u.id !== userId));
      
      toast({
        title: 'تم حذف المستخدم بنجاح',
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'حدث خطأ أثناء حذف المستخدم',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" p={4}>
      {/* رأس الصفحة */}
      <Flex justify="space-between" align="center" mb={6} bg="white" p={4} rounded="md" shadow="sm">
        <BackButton />
        <Box>
          <Heading size="md">إدارة المستخدمين</Heading>
        </Box>
        <Box>
          <Text fontSize="lg" fontWeight="bold">{user?.displayName}</Text>
          <Text color="gray.600">{user?.role === 'admin' ? 'مسؤول النظام' : 'موظف'}</Text>
        </Box>
      </Flex>

      {/* زر إضافة مستخدم */}
      <AlsaadButton
        leftIcon={<FaUserPlus />}
        colorScheme="blue"
        onClick={() => navigate('/users/new')}
        mb={6}
      >
        إضافة مستخدم جديد
      </AlsaadButton>

      {/* جدول المستخدمين */}
      <Box bg="white" rounded="md" shadow="sm" overflowX="auto">
        {isLoading ? (
          <Flex justify="center" align="center" h="100%" p={4}>
            <Spinner size="xl" />
          </Flex>
        ) : error ? (
          <Alert status="error" variant="solid" mb={6}>
            <AlertIcon />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
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
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>{user.name}</Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Badge colorScheme={user.role === 'admin' ? 'red' : 'blue'}>
                      {user.role === 'admin' ? 'مسؤول النظام' : 
                       user.role === 'general_manager' ? 'مدير عام' : 
                       user.role === 'executive_manager' ? 'مدير تنفيذي' : 
                       user.role === 'branch_manager' ? 'مدير فرع' : 
                       user.role === 'shift_supervisor' ? 'مسؤول الشفت' : 
                       user.role === 'booking_agent' ? 'موظف حجوزات' : 
                       user.role === 'accountant' ? 'محاسب' : 'موظف'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={user.active ? 'green' : 'red'}>
                      {user.active ? 'نشط' : 'معطل'}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<FaEdit />}
                        aria-label="تعديل"
                        colorScheme="blue"
                        onClick={() => navigate(`/users/edit/${user.id}`)}
                      />
                      {user.role !== 'admin' && (
                        <>
                          <IconButton
                            icon={user.active ? <FaTimes /> : <FaCheck />}
                            aria-label={user.active ? 'تعطيل' : 'تفعيل'}
                            colorScheme={user.active ? 'red' : 'green'}
                            onClick={() => handleStatusChange(user.id, !user.active)}
                          />
                          <IconButton
                            icon={<FaTrash />}
                            aria-label="حذف"
                            colorScheme="red"
                            onClick={() => handleDeleteUser(user.id)}
                          />
                        </>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </Container>
  );
};

export default UsersPage;
