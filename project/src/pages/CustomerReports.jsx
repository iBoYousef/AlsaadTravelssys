import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Select,
  Button,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Icon,
  Divider,
  useColorModeValue,
  Progress
} from '@chakra-ui/react';
import { 
  FiUsers, 
  FiUserPlus, 
  FiUserCheck, 
  FiDollarSign, 
  FiRepeat, 
  FiTrendingUp,
  FiBarChart2,
  FiPieChart,
  FiDownload
} from 'react-icons/fi';
import { customerService, tourBookingService, reportService } from '../services/api';
import { formatAmount, formatDate } from '../utils/validationUtils';

/**
 * مكون لعرض إحصائيات العملاء
 */
const CustomerStatistics = ({ data, loading }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  
  if (loading) {
    return (
      <Flex justify="center" py="8">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="4">
      <Card bg={cardBg}>
        <CardBody>
          <Stat>
            <StatLabel>إجمالي العملاء</StatLabel>
            <Flex align="center">
              <StatNumber>{data.totalCustomers}</StatNumber>
              <Icon as={FiUsers} ml="2" color="blue.500" />
            </Flex>
            {data.customerGrowth > 0 && (
              <StatHelpText>
                <StatArrow type="increase" />
                {data.customerGrowth}% منذ الشهر الماضي
              </StatHelpText>
            )}
          </Stat>
        </CardBody>
      </Card>
      
      <Card bg={cardBg}>
        <CardBody>
          <Stat>
            <StatLabel>عملاء جدد</StatLabel>
            <Flex align="center">
              <StatNumber>{data.newCustomers}</StatNumber>
              <Icon as={FiUserPlus} ml="2" color="green.500" />
            </Flex>
            <StatHelpText>في الفترة المحددة</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card bg={cardBg}>
        <CardBody>
          <Stat>
            <StatLabel>عملاء نشطون</StatLabel>
            <Flex align="center">
              <StatNumber>{data.activeCustomers}</StatNumber>
              <Icon as={FiUserCheck} ml="2" color="purple.500" />
            </Flex>
            <StatHelpText>{((data.activeCustomers / data.totalCustomers) * 100).toFixed(1)}% من إجمالي العملاء</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card bg={cardBg}>
        <CardBody>
          <Stat>
            <StatLabel>متوسط قيمة العميل</StatLabel>
            <Flex align="center">
              <StatNumber>{formatAmount(data.averageCustomerValue)}</StatNumber>
              <Icon as={FiDollarSign} ml="2" color="orange.500" />
            </Flex>
            {data.avgValueGrowth !== 0 && (
              <StatHelpText>
                <StatArrow type={data.avgValueGrowth > 0 ? "increase" : "decrease"} />
                {Math.abs(data.avgValueGrowth)}% منذ الفترة السابقة
              </StatHelpText>
            )}
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  );
};

/**
 * مكون لعرض قائمة أفضل العملاء
 */
const TopCustomersTable = ({ customers, loading }) => {
  if (loading) {
    return (
      <Flex justify="center" py="4">
        <Spinner />
      </Flex>
    );
  }
  
  if (!customers || customers.length === 0) {
    return (
      <Text textAlign="center" py="4" color="gray.500">
        لا توجد بيانات متاحة
      </Text>
    );
  }
  
  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>اسم العميل</Th>
            <Th>عدد الحجوزات</Th>
            <Th>إجمالي الإنفاق</Th>
            <Th>آخر حجز</Th>
            <Th>حالة العميل</Th>
          </Tr>
        </Thead>
        <Tbody>
          {customers.map((customer) => (
            <Tr key={customer.id}>
              <Td fontWeight="medium">{customer.name}</Td>
              <Td isNumeric>{customer.bookingsCount}</Td>
              <Td isNumeric>{formatAmount(customer.totalSpent)}</Td>
              <Td>{formatDate(customer.lastBookingDate)}</Td>
              <Td>
                <Badge colorScheme={customer.isActive ? "green" : "gray"}>
                  {customer.isActive ? "نشط" : "غير نشط"}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

/**
 * مكون لعرض توزيع العملاء حسب الفئة
 */
const CustomerSegmentation = ({ data, loading }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  
  if (loading) {
    return (
      <Flex justify="center" py="4">
        <Spinner />
      </Flex>
    );
  }
  
  if (!data || !data.segments || data.segments.length === 0) {
    return (
      <Text textAlign="center" py="4" color="gray.500">
        لا توجد بيانات متاحة
      </Text>
    );
  }
  
  // حساب النسب المئوية
  const total = data.segments.reduce((sum, segment) => sum + segment.count, 0);
  
  return (
    <Card bg={cardBg}>
      <CardHeader>
        <Heading size="md">توزيع العملاء حسب الفئة</Heading>
      </CardHeader>
      <CardBody>
        {data.segments.map((segment, index) => {
          const percentage = total > 0 ? (segment.count / total) * 100 : 0;
          const colors = ["blue", "green", "purple", "orange", "red", "teal"];
          const color = colors[index % colors.length];
          
          return (
            <Box key={segment.name} mb={index < data.segments.length - 1 ? 4 : 0}>
              <Flex justify="space-between" mb="1">
                <Text>{segment.name}</Text>
                <HStack>
                  <Text>{segment.count} عميل</Text>
                  <Text>({percentage.toFixed(1)}%)</Text>
                </HStack>
              </Flex>
              <Progress value={percentage} colorScheme={color} size="sm" borderRadius="full" />
            </Box>
          );
        })}
      </CardBody>
    </Card>
  );
};

/**
 * صفحة تقارير العملاء
 * تعرض إحصائيات وتحليلات عن عملاء مكتب السياحة
 */
const CustomerReports = () => {
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalCustomers: 0,
    newCustomers: 0,
    activeCustomers: 0,
    averageCustomerValue: 0,
    customerGrowth: 0,
    avgValueGrowth: 0
  });
  const [topCustomers, setTopCustomers] = useState([]);
  const [segmentation, setSegmentation] = useState({
    segments: []
  });
  const [bookingsByCustomerType, setBookingsByCustomerType] = useState([]);
  
  // جلب البيانات عند تحميل الصفحة وعند تغيير الفترة
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // تحديد تواريخ الفترة
        const endDate = new Date();
        const startDate = new Date();
        
        switch (period) {
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
          case 'year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          default:
            startDate.setMonth(startDate.getMonth() - 1);
        }
        
        // جلب إحصائيات العملاء
        const customerStats = await reportService.getCustomerStatistics({ startDate, endDate });
        
        // جلب قائمة أفضل العملاء
        const topCustomersData = await reportService.getTopCustomers({ 
          startDate, 
          endDate,
          limit: 10
        });
        
        // جلب بيانات تقسيم العملاء
        const segmentationData = await reportService.getCustomerSegmentation();
        
        // جلب بيانات الحجوزات حسب نوع العميل
        const bookingsByType = await reportService.getBookingsByCustomerType({ 
          startDate, 
          endDate 
        });
        
        // تحديث البيانات
        setStatistics(customerStats);
        setTopCustomers(topCustomersData);
        setSegmentation(segmentationData);
        setBookingsByCustomerType(bookingsByType);
      } catch (error) {
        console.error('خطأ في جلب بيانات تقارير العملاء:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period]);
  
  // تغيير الفترة
  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };
  
  return (
    <Box p="4">
      <Flex justify="space-between" align="center" mb="6">
        <Heading size="lg">تقارير العملاء</Heading>
        <HStack>
          <Select value={period} onChange={handlePeriodChange} w="auto">
            <option value="week">آخر أسبوع</option>
            <option value="month">آخر شهر</option>
            <option value="quarter">آخر ربع سنة</option>
            <option value="year">آخر سنة</option>
          </Select>
          <Button leftIcon={<FiDownload />} colorScheme="blue" variant="outline">
            تصدير التقرير
          </Button>
        </HStack>
      </Flex>
      
      {/* إحصائيات العملاء */}
      <Box mb="6">
        <CustomerStatistics data={statistics} loading={loading} />
      </Box>
      
      <Tabs variant="enclosed" mb="6">
        <TabList>
          <Tab>أفضل العملاء</Tab>
          <Tab>تحليل العملاء</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="md">أفضل العملاء من حيث الإنفاق</Heading>
              </CardHeader>
              <CardBody>
                <TopCustomersTable customers={topCustomers} loading={loading} />
              </CardBody>
            </Card>
          </TabPanel>
          
          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="4">
              <CustomerSegmentation data={segmentation} loading={loading} />
              
              <Card>
                <CardHeader>
                  <Heading size="md">معدل تكرار الحجز</Heading>
                </CardHeader>
                <CardBody>
                  <Flex direction="column" align="center" justify="center" h="100%">
                    <Heading size="xl" color="blue.500" mb="2">
                      {statistics.bookingFrequency ? statistics.bookingFrequency.toFixed(1) : '0'} 
                    </Heading>
                    <Text>متوسط عدد الحجوزات لكل عميل</Text>
                    
                    <Divider my="4" />
                    
                    <HStack spacing="8" mt="2">
                      <Stat>
                        <StatLabel>عملاء متكررون</StatLabel>
                        <StatNumber>{statistics.repeatCustomers || 0}</StatNumber>
                        <StatHelpText>
                          {statistics.repeatCustomersPercentage 
                            ? `${statistics.repeatCustomersPercentage.toFixed(1)}%` 
                            : '0%'}
                        </StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>عملاء لمرة واحدة</StatLabel>
                        <StatNumber>{statistics.oneTimeCustomers || 0}</StatNumber>
                        <StatHelpText>
                          {statistics.oneTimeCustomersPercentage 
                            ? `${statistics.oneTimeCustomersPercentage.toFixed(1)}%` 
                            : '0%'}
                        </StatHelpText>
                      </Stat>
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <Card>
        <CardHeader>
          <Heading size="md">توصيات لتحسين قاعدة العملاء</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing="4">
            <Box p="4" borderWidth="1px" borderRadius="lg">
              <Flex align="center" mb="2">
                <Icon as={FiUserPlus} color="green.500" boxSize="6" mr="2" />
                <Heading size="sm">استهداف عملاء جدد</Heading>
              </Flex>
              <Text fontSize="sm">
                زيادة حملات التسويق لاستقطاب عملاء جدد من خلال عروض خاصة للمرة الأولى.
              </Text>
            </Box>
            
            <Box p="4" borderWidth="1px" borderRadius="lg">
              <Flex align="center" mb="2">
                <Icon as={FiRepeat} color="blue.500" boxSize="6" mr="2" />
                <Heading size="sm">تنشيط العملاء غير النشطين</Heading>
              </Flex>
              <Text fontSize="sm">
                التواصل مع العملاء الذين لم يقوموا بالحجز منذ أكثر من 6 أشهر وتقديم عروض خاصة لهم.
              </Text>
            </Box>
            
            <Box p="4" borderWidth="1px" borderRadius="lg">
              <Flex align="center" mb="2">
                <Icon as={FiTrendingUp} color="purple.500" boxSize="6" mr="2" />
                <Heading size="sm">تعزيز ولاء العملاء</Heading>
              </Flex>
              <Text fontSize="sm">
                تطوير برنامج مكافآت للعملاء المتكررين لزيادة معدل الحجوزات وقيمة العميل.
              </Text>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default CustomerReports;
