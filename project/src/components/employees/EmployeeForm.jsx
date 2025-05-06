import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Checkbox,
  Grid,
  GridItem,
  FormHelperText,
  Container,
  Heading,
  Text,
  Stack,
  FormErrorMessage,
  Select,
  CheckboxGroup,
  HStack,
  Flex,
  Spacer,
  Divider,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Icon,
  Tooltip,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaUser, FaEnvelope, FaLock, FaIdCard, FaShieldAlt, FaSave, FaArrowLeft } from 'react-icons/fa';
import rolesConfig, { getPermissionsByCategory } from '../../config/roles';
import employeeService from '../../services/employeeService';
import firebaseServices from '../../firebase';
import PageHeader from '../shared/PageHeader';
import { useActionLogger } from '../../hooks/useActionLogger';

const { jobTitles } = firebaseServices;

const EmployeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    jobTitle: '',
    permissions: [],
    phoneNumber: '',
    civilId: '',
    nationality: 'سعودي',
    hireDate: new Date().toISOString().split('T')[0],
    status: 'active',
    active: true
  });
  const [errors, setErrors] = useState({});
  const { logPageView, logCreate, logUpdate, ACTION_CATEGORIES } = useActionLogger();

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('blue.50', 'blue.900');

  // تسجيل عرض الصفحة عند التحميل
  useEffect(() => {
    if (id) {
      logPageView('تعديل بيانات موظف', ACTION_CATEGORIES.EMPLOYEE, { employeeId: id });
      loadEmployee();
    } else {
      logPageView('إضافة موظف جديد', ACTION_CATEGORIES.EMPLOYEE);
    }
  }, [id, logPageView]);

  const loadEmployee = async () => {
    try {
      const data = await employeeService.getEmployee(id);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        role: data.role || '',
        jobTitle: data.jobTitle || '',
        permissions: data.permissions || [],
        phoneNumber: data.phoneNumber || '',
        civilId: data.civilId || '',
        nationality: data.nationality || 'سعودي',
        hireDate: data.hireDate || new Date().toISOString().split('T')[0],
        status: data.status || 'active',
        active: data.active !== false
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل بيانات الموظف',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }
    if (!id && !formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (!id && formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    if (!formData.role) {
      newErrors.role = 'الدور مطلوب';
    }
    if (!formData.jobTitle) {
      newErrors.jobTitle = 'المسمى الوظيفي مطلوب';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (id) {
        await employeeService.updateEmployee(id, formData);
        logUpdate('تعديل بيانات موظف', ACTION_CATEGORIES.EMPLOYEE, { employeeId: id });
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث بيانات الموظف بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
        // إضافة تأخير قصير قبل التوجيه
        setTimeout(() => {
          navigate('/employees');
        }, 1000);
      } else {
        await employeeService.createEmployee(formData);
        logCreate('إضافة موظف جديد', ACTION_CATEGORIES.EMPLOYEE);
        toast({
          title: 'تم الإضافة',
          description: 'تم إضافة الموظف بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
        // إضافة تأخير قصير قبل التوجيه
        setTimeout(() => {
          navigate('/employees');
        }, 1000);
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء حفظ البيانات',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePermissionChange = (permissions) => {
    setFormData(prev => ({
      ...prev,
      permissions
    }));
  };

  return (
    <Container maxW="container.lg" py={5}>
      <PageHeader
        title={id ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}
        icon={<FaUser />}
      />
      
      <Box as="form" onSubmit={handleSubmit} mt={5} boxShadow="md" borderRadius="lg" overflow="hidden" bg={cardBg} p={4}>
        <Flex align="center" bg={headerBg} py={4} mb={4}>
          <Icon as={FaUser} mr={2} />
          <Heading size="md">{id ? 'تعديل بيانات الموظف' : 'معلومات الموظف الجديد'}</Heading>
        </Flex>
        
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
          {/* المعلومات الشخصية */}
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Heading size="sm" mb={4} borderBottom="1px" borderColor={borderColor} pb={2}>
              المعلومات الشخصية
            </Heading>
          </GridItem>
            
          <FormControl isInvalid={!!errors.name}>
            <FormLabel>الاسم الكامل</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaUser} color="gray.300" />
              </InputLeftElement>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="أدخل اسم الموظف الكامل"
                borderRadius="md"
              />
            </InputGroup>
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.email}>
            <FormLabel>البريد الإلكتروني</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaEnvelope} color="gray.300" />
              </InputLeftElement>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@company.com"
                borderRadius="md"
                dir="ltr"
              />
            </InputGroup>
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          </FormControl>

          <FormControl>
            <FormLabel>رقم الهاتف</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Text color="gray.300">+966</Text>
              </InputLeftElement>
              <Input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="5xxxxxxxx"
                borderRadius="md"
                dir="ltr"
                pl="60px"
              />
            </InputGroup>
          </FormControl>

          {!id && (
            <FormControl isInvalid={!!errors.password}>
              <FormLabel>كلمة المرور</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaLock} color="gray.300" />
                </InputLeftElement>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="كلمة المرور (6 أحرف على الأقل)"
                  borderRadius="md"
                />
              </InputGroup>
              <FormErrorMessage>{errors.password}</FormErrorMessage>
              <FormHelperText>كلمة المرور يجب أن تكون 6 أحرف على الأقل</FormHelperText>
            </FormControl>
          )}

          <FormControl isInvalid={!!errors.role}>
            <FormLabel>الدور الوظيفي</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaShieldAlt} color="gray.300" />
              </InputLeftElement>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="اختر الدور الوظيفي"
                borderRadius="md"
                pl="40px"
              >
                {Object.entries(rolesConfig.roles).map(([key, role]) => (
                  <option key={key} value={key}>
                    {role.title}
                  </option>
                ))}
              </Select>
            </InputGroup>
            <FormErrorMessage>{errors.role}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.jobTitle}>
            <FormLabel>المسمى الوظيفي</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaIdCard} color="gray.300" />
              </InputLeftElement>
              <Select
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="اختر المسمى الوظيفي"
                borderRadius="md"
                pl="40px"
              >
                {Object.keys(jobTitles).map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </Select>
            </InputGroup>
            <FormErrorMessage>{errors.jobTitle}</FormErrorMessage>
            <FormHelperText>المسمى الوظيفي يحدد الصلاحيات المتاحة للمستخدم</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel>رقم الهوية المدنية</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaIdCard} color="gray.300" />
              </InputLeftElement>
              <Input
                name="civilId"
                value={formData.civilId}
                onChange={handleChange}
                placeholder="أدخل رقم الهوية المدنية"
                borderRadius="md"
                dir="ltr"
              />
            </InputGroup>
          </FormControl>

          <FormControl>
            <FormLabel>الجنسية</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaUser} color="gray.300" />
              </InputLeftElement>
              <Input
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                placeholder="أدخل الجنسية"
                borderRadius="md"
              />
            </InputGroup>
          </FormControl>

          <FormControl>
            <FormLabel>تاريخ التعيين</FormLabel>
            <Input
              name="hireDate"
              type="date"
              value={formData.hireDate}
              onChange={handleChange}
              borderRadius="md"
              dir="ltr"
            />
          </FormControl>

          <FormControl>
            <FormLabel>حالة الحساب</FormLabel>
            <Checkbox
              name="active"
              isChecked={formData.active}
              onChange={handleChange}
              colorScheme="green"
            >
              الحساب نشط
            </Checkbox>
            <FormHelperText>الحسابات غير النشطة لا يمكنها تسجيل الدخول</FormHelperText>
          </FormControl>
        </Grid>

        {formData.role && (
          <>
            <Divider my={6} />
            <Box>
              <Heading size="sm" mb={4} borderBottom="1px" borderColor={borderColor} pb={2}>
                الصلاحيات
              </Heading>
              <FormControl>
                <CheckboxGroup
                  value={formData.permissions}
                  onChange={handlePermissionChange}
                >
                  <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                    {Object.entries(getPermissionsByCategory()).map(([category, categoryData]) => (
                      <GridItem key={category}>
                        <Box borderWidth="1px" borderRadius="md" overflow="hidden" size="sm" bg={cardBg} p={4}>
                          <Flex align="center" bg={headerBg} py={2} px={3} mb={2}>
                            <Text fontWeight="bold" fontSize="sm">{categoryData.title || category}</Text>
                          </Flex>
                          <Stack spacing={2}>
                            {categoryData.permissions && categoryData.permissions.map(permission => (
                              <Checkbox key={permission.id} value={permission.id} colorScheme="blue">
                                <Tooltip label={permission.description} placement="top">
                                  <Text fontSize="sm">{permission.title}</Text>
                                </Tooltip>
                              </Checkbox>
                            ))}
                          </Stack>
                        </Box>
                      </GridItem>
                    ))}
                  </Grid>
                </CheckboxGroup>
              </FormControl>
            </Box>
          </>
        )}
        
        <Flex justifyContent="space-between" mt={4} pt={4} borderTop="1px" borderColor={borderColor}>
          <Button 
            leftIcon={<FaArrowLeft />} 
            onClick={() => navigate('/employees')}
            variant="outline"
          >
            العودة
          </Button>
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isSubmitting}
            loadingText="جاري الحفظ..."
            rightIcon={<FaSave />}
          >
            {id ? 'تحديث البيانات' : 'إضافة موظف'}
          </Button>
        </Flex>
      </Box>
    </Container>
  );
};

export default EmployeeForm;
