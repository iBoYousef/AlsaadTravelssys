import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Card,
  CardHeader,
  CardBody,
  Select,
  Button,
  HStack,
  Spinner,
  Center,
  useColorModeValue,
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
  Badge
} from '@chakra-ui/react';
import { FiDownload, FiRefreshCw, FiBarChart2 } from 'react-icons/fi';
import { tourBookingService, tourPackageService } from '../services/api';
import { formatAmount, formatDate } from '../utils/validationUtils';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// تسجيل مكونات الرسم البياني
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  PointElement,
  LineElement
);

/**
 * صفحة تقارير حجوزات البرامج السياحية
 * تعرض إحصائيات وتقارير عن حجوزات البرامج السياحية
 */
const TourBookingReports = () => {
  // حالة البيانات
  const [bookings, setBookings] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // all, month, quarter, year
  const [stats, setStats] = useState({
    total: 0,
    statusCounts: {},
    totalRevenue: 0,
    monthlyBookings: []
  });
  
  // ألوان للرسوم البيانية
  const colors = [
    'rgba(255, 99, 132, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)',
    'rgba(83, 102, 255, 0.7)',
    'rgba(40, 159, 64, 0.7)',
    'rgba(210, 199, 199, 0.7)',
  ];
  
  // ألوان الحدود للرسوم البيانية
  const borderColors = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(199, 199, 199, 1)',
    'rgba(83, 102, 255, 1)',
    'rgba(40, 159, 64, 1)',
    'rgba(210, 199, 199, 1)',
  ];
  
  // جلب حجوزات البرامج السياحية
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // جلب الإحصائيات
      const statsData = await tourBookingService.getBookingStats();
      setStats(statsData);
      
      // جلب الحجوزات
      const data = await tourBookingService.getAllBookings();
      
      // تصفية البيانات حسب النطاق الزمني المحدد
      let filteredData = [...data];
      
      if (timeRange !== 'all') {
        const now = new Date();
        let startDate;
        
        if (timeRange === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        } else if (timeRange === 'quarter') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        } else if (timeRange === 'year') {
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        }
        
        filteredData = data.filter(booking => {
          if (!booking.createdAt || !booking.createdAt.toDate) return false;
          const creationDate = booking.createdAt.toDate();
          return creationDate >= startDate;
        });
      }
      
      setBookings(filteredData);
    } catch (error) {
      console.error('خطأ في جلب حجوزات البرامج السياحية:', error);
      setError('حدث خطأ أثناء جلب حجوزات البرامج السياحية. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };
  
  // جلب البرامج السياحية
  const fetchPackages = async () => {
    try {
      const data = await tourPackageService.getAllPackages();
      setPackages(data);
    } catch (error) {
      console.error('خطأ في جلب البرامج السياحية:', error);
    }
  };
  
  // جلب البيانات عند تحميل الصفحة وعند تغيير النطاق الزمني
  useEffect(() => {
    fetchBookings();
    fetchPackages();
  }, [timeRange]);
  
  // تجميع البيانات حسب الوجهة
  const destinationData = bookings.reduce((acc, booking) => {
    if (booking.destination) {
      if (!acc[booking.destination]) {
        acc[booking.destination] = { count: 0, totalAmount: 0 };
      }
      acc[booking.destination].count += 1;
      acc[booking.destination].totalAmount += booking.totalAmount || 0;
    }
    return acc;
  }, {});
  
  // تجميع البيانات حسب البرنامج
  const packageData = bookings.reduce((acc, booking) => {
    if (booking.packageId && booking.packageName) {
      if (!acc[booking.packageId]) {
        acc[booking.packageId] = { 
          name: booking.packageName,
          count: 0, 
          totalAmount: 0 
        };
      }
      acc[booking.packageId].count += 1;
      acc[booking.packageId].totalAmount += booking.totalAmount || 0;
    }
    return acc;
  }, {});
  
  // ترتيب البرامج حسب عدد الحجوزات
  const topPackages = Object.values(packageData)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // بيانات الرسم البياني للوجهات
  const destinationChartData = {
    labels: Object.keys(destinationData),
    datasets: [
      {
        label: 'عدد الحجوزات حسب الوجهة',
        data: Object.values(destinationData).map(data => data.count),
        backgroundColor: colors.slice(0, Object.keys(destinationData).length),
        borderColor: borderColors.slice(0, Object.keys(destinationData).length),
        borderWidth: 1,
      },
    ],
  };
  
  // بيانات الرسم البياني للحالة
  const statusData = [
    { status: 'قيد الانتظار', count: stats.statusCounts?.pending || 0 },
    { status: 'مؤكد', count: stats.statusCounts?.confirmed || 0 },
    { status: 'مكتمل', count: stats.statusCounts?.completed || 0 },
    { status: 'ملغي', count: stats.statusCounts?.cancelled || 0 },
  ];
  
  const statusChartData = {
    labels: statusData.map(data => data.status),
    datasets: [
      {
        label: 'عدد الحجوزات حسب الحالة',
        data: statusData.map(data => data.count),
        backgroundColor: [
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)',
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // بيانات الرسم البياني للإيرادات الشهرية
  const monthlyRevenueData = {
    labels: stats.monthlyBookings.map(data => `${data.year}-${data.month}`),
    datasets: [
      {
        label: 'الإيرادات الشهرية',
        data: stats.monthlyBookings.map(data => data.revenue),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  // بيانات الرسم البياني لعدد الحجوزات الشهرية
  const monthlyBookingsData = {
    labels: stats.monthlyBookings.map(data => `${data.year}-${data.month}`),
    datasets: [
      {
        label: 'عدد الحجوزات الشهرية',
        data: stats.monthlyBookings.map(data => data.count),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  // تصدير التقرير إلى Excel
  const handleExportToExcel = () => {
    // تنفيذ منطق التصدير هنا
    console.log('تصدير التقرير إلى Excel');
  };
  
  return (
    <Box p="4">
      <Flex justify="space-between" align="center" mb="6">
        <Heading size="lg">تقارير حجوزات البرامج السياحية</Heading>
        
        <HStack spacing="3">
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            w="200px"
          >
            <option value="all">كل الفترات</option>
            <option value="month">آخر شهر</option>
            <option value="quarter">آخر 3 أشهر</option>
            <option value="year">آخر سنة</option>
          </Select>
          
          <Button
            leftIcon={<FiRefreshCw />}
            variant="outline"
            onClick={fetchBookings}
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
        </HStack>
      </Flex>
      
      {loading ? (
        <Center p="8">
          <Spinner size="xl" color="blue.500" />
        </Center>
      ) : error ? (
        <Center p="8">
          <Text color="red.500">{error}</Text>
          <Button ml="4" onClick={fetchBookings}>
            إعادة المحاولة
          </Button>
        </Center>
      ) : (
        <Box>
          {/* الإحصائيات الرئيسية */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap="4" mb="6">
            <GridItem>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>إجمالي الحجوزات</StatLabel>
                    <StatNumber>{stats.total}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>الحجوزات المؤكدة</StatLabel>
                    <StatNumber>{stats.statusCounts?.confirmed || 0}</StatNumber>
                    <StatHelpText>
                      {stats.total > 0 ? (
                        <Text>
                          {((stats.statusCounts?.confirmed || 0) / stats.total * 100).toFixed(1)}%
                        </Text>
                      ) : null}
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>الحجوزات المكتملة</StatLabel>
                    <StatNumber>{stats.statusCounts?.completed || 0}</StatNumber>
                    <StatHelpText>
                      {stats.total > 0 ? (
                        <Text>
                          {((stats.statusCounts?.completed || 0) / stats.total * 100).toFixed(1)}%
                        </Text>
                      ) : null}
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>إجمالي الإيرادات</StatLabel>
                    <StatNumber>{formatAmount(stats.totalRevenue)}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
          
          {/* الرسوم البيانية */}
          <Tabs variant="enclosed" colorScheme="blue" mb="6">
            <TabList>
              <Tab>الحجوزات حسب الحالة</Tab>
              <Tab>الحجوزات حسب الوجهة</Tab>
              <Tab>الإيرادات الشهرية</Tab>
              <Tab>عدد الحجوزات الشهرية</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel>
                <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap="6">
                  <GridItem>
                    <Box h="300px">
                      <Pie data={statusChartData} options={{ maintainAspectRatio: false }} />
                    </Box>
                  </GridItem>
                  
                  <GridItem>
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>الحالة</Th>
                            <Th isNumeric>عدد الحجوزات</Th>
                            <Th isNumeric>النسبة المئوية</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {statusData.map((data) => (
                            <Tr key={data.status}>
                              <Td>{data.status}</Td>
                              <Td isNumeric>{data.count}</Td>
                              <Td isNumeric>
                                {stats.total > 0 
                                  ? ((data.count / stats.total) * 100).toFixed(1) + '%' 
                                  : '0%'}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </GridItem>
                </Grid>
              </TabPanel>
              
              <TabPanel>
                <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap="6">
                  <GridItem>
                    <Box h="300px">
                      <Pie data={destinationChartData} options={{ maintainAspectRatio: false }} />
                    </Box>
                  </GridItem>
                  
                  <GridItem>
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>الوجهة</Th>
                            <Th isNumeric>عدد الحجوزات</Th>
                            <Th isNumeric>إجمالي المبالغ</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {Object.entries(destinationData).map(([destination, data]) => (
                            <Tr key={destination}>
                              <Td>{destination}</Td>
                              <Td isNumeric>{data.count}</Td>
                              <Td isNumeric>{formatAmount(data.totalAmount)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </GridItem>
                </Grid>
              </TabPanel>
              
              <TabPanel>
                <Box h="400px">
                  <Line 
                    data={monthlyRevenueData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'الإيرادات'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'الشهر'
                          }
                        }
                      }
                    }} 
                  />
                </Box>
              </TabPanel>
              
              <TabPanel>
                <Box h="400px">
                  <Line 
                    data={monthlyBookingsData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'عدد الحجوزات'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'الشهر'
                          }
                        }
                      }
                    }} 
                  />
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
          
          {/* الجداول */}
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap="6">
            {/* البرامج الأكثر حجزًا */}
            <GridItem>
              <Card>
                <CardHeader>
                  <Heading size="md">البرامج الأكثر حجزًا</Heading>
                </CardHeader>
                <CardBody>
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>البرنامج</Th>
                          <Th isNumeric>عدد الحجوزات</Th>
                          <Th isNumeric>إجمالي المبالغ</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {topPackages.map((pkg) => (
                          <Tr key={pkg.name}>
                            <Td>{pkg.name}</Td>
                            <Td isNumeric>{pkg.count}</Td>
                            <Td isNumeric>{formatAmount(pkg.totalAmount)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </CardBody>
              </Card>
            </GridItem>
            
            {/* أحدث الحجوزات */}
            <GridItem>
              <Card>
                <CardHeader>
                  <Heading size="md">أحدث الحجوزات</Heading>
                </CardHeader>
                <CardBody>
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>رقم الحجز</Th>
                          <Th>العميل</Th>
                          <Th>البرنامج</Th>
                          <Th>تاريخ الحجز</Th>
                          <Th>الحالة</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {bookings.slice(0, 5).map((booking) => (
                          <Tr key={booking.id}>
                            <Td>{booking.bookingNumber || booking.id.substring(0, 8)}</Td>
                            <Td>{booking.customerName}</Td>
                            <Td>{booking.packageName}</Td>
                            <Td>
                              {booking.createdAt && booking.createdAt.toDate 
                                ? formatDate(booking.createdAt.toDate()) 
                                : '-'}
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  booking.status === 'confirmed' ? 'green' :
                                  booking.status === 'pending' ? 'yellow' :
                                  booking.status === 'completed' ? 'blue' :
                                  'red'
                                }
                              >
                                {booking.status === 'confirmed' ? 'مؤكد' :
                                 booking.status === 'pending' ? 'قيد الانتظار' :
                                 booking.status === 'completed' ? 'مكتمل' :
                                 'ملغي'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default TourBookingReports;
