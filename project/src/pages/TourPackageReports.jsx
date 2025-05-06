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
import { tourPackageService } from '../services/api';
import { formatAmount, formatDate } from '../utils/validationUtils';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// تسجيل مكونات الرسم البياني
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

/**
 * صفحة تقارير البرامج السياحية
 * تعرض إحصائيات وتقارير عن البرامج السياحية المتاحة والمبيعات
 */
const TourPackageReports = () => {
  // حالة البيانات
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // all, month, quarter, year
  
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
  
  // جلب البرامج السياحية
  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await tourPackageService.getAllPackages();
      
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
        
        filteredData = data.filter(pkg => {
          if (!pkg.createdAt || !pkg.createdAt.toDate) return false;
          const creationDate = pkg.createdAt.toDate();
          return creationDate >= startDate;
        });
      }
      
      setPackages(filteredData);
    } catch (error) {
      console.error('خطأ في جلب البرامج السياحية:', error);
      setError('حدث خطأ أثناء جلب البرامج السياحية. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };
  
  // جلب البيانات عند تحميل الصفحة وعند تغيير النطاق الزمني
  useEffect(() => {
    fetchPackages();
  }, [timeRange]);
  
  // حساب الإحصائيات
  const stats = {
    totalPackages: packages.length,
    activePackages: packages.filter(pkg => pkg.active).length,
    featuredPackages: packages.filter(pkg => pkg.featured).length,
    averagePrice: packages.length > 0 
      ? packages.reduce((sum, pkg) => sum + (pkg.price || 0), 0) / packages.length 
      : 0,
    highestPrice: packages.length > 0 
      ? Math.max(...packages.map(pkg => pkg.price || 0)) 
      : 0,
    lowestPrice: packages.length > 0 
      ? Math.min(...packages.filter(pkg => pkg.price > 0).map(pkg => pkg.price || 0)) 
      : 0,
  };
  
  // تجميع البيانات حسب الوجهة
  const destinationData = packages.reduce((acc, pkg) => {
    if (pkg.destination) {
      if (!acc[pkg.destination]) {
        acc[pkg.destination] = { count: 0, totalPrice: 0 };
      }
      acc[pkg.destination].count += 1;
      acc[pkg.destination].totalPrice += pkg.price || 0;
    }
    return acc;
  }, {});
  
  // تجميع البيانات حسب المدة
  const durationData = packages.reduce((acc, pkg) => {
    if (pkg.duration) {
      if (!acc[pkg.duration]) {
        acc[pkg.duration] = { count: 0, totalPrice: 0 };
      }
      acc[pkg.duration].count += 1;
      acc[pkg.duration].totalPrice += pkg.price || 0;
    }
    return acc;
  }, {});
  
  // بيانات الرسم البياني للوجهات
  const destinationChartData = {
    labels: Object.keys(destinationData),
    datasets: [
      {
        label: 'عدد البرامج حسب الوجهة',
        data: Object.values(destinationData).map(data => data.count),
        backgroundColor: colors.slice(0, Object.keys(destinationData).length),
        borderColor: borderColors.slice(0, Object.keys(destinationData).length),
        borderWidth: 1,
      },
    ],
  };
  
  // بيانات الرسم البياني للمدة
  const durationChartData = {
    labels: Object.keys(durationData),
    datasets: [
      {
        label: 'عدد البرامج حسب المدة',
        data: Object.values(durationData).map(data => data.count),
        backgroundColor: colors.slice(0, Object.keys(durationData).length),
        borderColor: borderColors.slice(0, Object.keys(durationData).length),
        borderWidth: 1,
      },
    ],
  };
  
  // بيانات الرسم البياني للأسعار
  const priceRanges = [
    { range: '0-1000', min: 0, max: 1000 },
    { range: '1001-2000', min: 1001, max: 2000 },
    { range: '2001-3000', min: 2001, max: 3000 },
    { range: '3001-5000', min: 3001, max: 5000 },
    { range: '5001+', min: 5001, max: Infinity },
  ];
  
  const priceRangeData = priceRanges.map(range => {
    return {
      range: range.range,
      count: packages.filter(pkg => {
        const price = pkg.price || 0;
        return price >= range.min && price <= range.max;
      }).length
    };
  });
  
  const priceChartData = {
    labels: priceRangeData.map(data => data.range),
    datasets: [
      {
        label: 'عدد البرامج حسب نطاق السعر',
        data: priceRangeData.map(data => data.count),
        backgroundColor: colors.slice(0, priceRangeData.length),
        borderColor: borderColors.slice(0, priceRangeData.length),
        borderWidth: 1,
      },
    ],
  };
  
  // بيانات الرسم البياني للحالة
  const statusData = [
    { status: 'نشط', count: packages.filter(pkg => pkg.active).length },
    { status: 'غير نشط', count: packages.filter(pkg => !pkg.active).length },
    { status: 'مميز', count: packages.filter(pkg => pkg.featured).length },
  ];
  
  const statusChartData = {
    labels: statusData.map(data => data.status),
    datasets: [
      {
        label: 'عدد البرامج حسب الحالة',
        data: statusData.map(data => data.count),
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 206, 86, 0.7)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // ترتيب البرامج حسب السعر (الأعلى سعرًا)
  const topPricedPackages = [...packages]
    .sort((a, b) => (b.price || 0) - (a.price || 0))
    .slice(0, 5);
  
  // ترتيب البرامج حسب تاريخ الإنشاء (الأحدث)
  const recentPackages = [...packages]
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      if (!a.createdAt.toDate || !b.createdAt.toDate) return 0;
      return b.createdAt.toDate() - a.createdAt.toDate();
    })
    .slice(0, 5);
  
  // تصدير التقرير إلى Excel
  const handleExportToExcel = () => {
    // تنفيذ منطق التصدير هنا
    console.log('تصدير التقرير إلى Excel');
  };
  
  return (
    <Box p="4">
      <Flex justify="space-between" align="center" mb="6">
        <Heading size="lg">تقارير البرامج السياحية</Heading>
        
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
      ) : (
        <Box>
          {/* الإحصائيات الرئيسية */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }} gap="4" mb="6">
            <GridItem>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>إجمالي البرامج</StatLabel>
                    <StatNumber>{stats.totalPackages}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>البرامج النشطة</StatLabel>
                    <StatNumber>{stats.activePackages}</StatNumber>
                    <StatHelpText>
                      {stats.totalPackages > 0 ? (
                        <Text>
                          {((stats.activePackages / stats.totalPackages) * 100).toFixed(1)}%
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
                    <StatLabel>البرامج المميزة</StatLabel>
                    <StatNumber>{stats.featuredPackages}</StatNumber>
                    <StatHelpText>
                      {stats.totalPackages > 0 ? (
                        <Text>
                          {((stats.featuredPackages / stats.totalPackages) * 100).toFixed(1)}%
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
                    <StatLabel>متوسط السعر</StatLabel>
                    <StatNumber>{formatAmount(stats.averagePrice)}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>أعلى سعر</StatLabel>
                    <StatNumber>{formatAmount(stats.highestPrice)}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>أقل سعر</StatLabel>
                    <StatNumber>{formatAmount(stats.lowestPrice)}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
          
          {/* الرسوم البيانية */}
          <Tabs variant="enclosed" colorScheme="blue" mb="6">
            <TabList>
              <Tab>الوجهات</Tab>
              <Tab>المدة</Tab>
              <Tab>الأسعار</Tab>
              <Tab>الحالة</Tab>
            </TabList>
            
            <TabPanels>
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
                            <Th isNumeric>عدد البرامج</Th>
                            <Th isNumeric>متوسط السعر</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {Object.entries(destinationData).map(([destination, data]) => (
                            <Tr key={destination}>
                              <Td>{destination}</Td>
                              <Td isNumeric>{data.count}</Td>
                              <Td isNumeric>{formatAmount(data.totalPrice / data.count)}</Td>
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
                      <Pie data={durationChartData} options={{ maintainAspectRatio: false }} />
                    </Box>
                  </GridItem>
                  
                  <GridItem>
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>المدة</Th>
                            <Th isNumeric>عدد البرامج</Th>
                            <Th isNumeric>متوسط السعر</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {Object.entries(durationData).map(([duration, data]) => (
                            <Tr key={duration}>
                              <Td>{duration}</Td>
                              <Td isNumeric>{data.count}</Td>
                              <Td isNumeric>{formatAmount(data.totalPrice / data.count)}</Td>
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
                      <Bar 
                        data={priceChartData} 
                        options={{ 
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }} 
                      />
                    </Box>
                  </GridItem>
                  
                  <GridItem>
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>نطاق السعر</Th>
                            <Th isNumeric>عدد البرامج</Th>
                            <Th isNumeric>النسبة المئوية</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {priceRangeData.map((data) => (
                            <Tr key={data.range}>
                              <Td>{data.range}</Td>
                              <Td isNumeric>{data.count}</Td>
                              <Td isNumeric>
                                {stats.totalPackages > 0 
                                  ? ((data.count / stats.totalPackages) * 100).toFixed(1) + '%' 
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
                      <Pie data={statusChartData} options={{ maintainAspectRatio: false }} />
                    </Box>
                  </GridItem>
                  
                  <GridItem>
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>الحالة</Th>
                            <Th isNumeric>عدد البرامج</Th>
                            <Th isNumeric>النسبة المئوية</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {statusData.map((data) => (
                            <Tr key={data.status}>
                              <Td>{data.status}</Td>
                              <Td isNumeric>{data.count}</Td>
                              <Td isNumeric>
                                {stats.totalPackages > 0 
                                  ? ((data.count / stats.totalPackages) * 100).toFixed(1) + '%' 
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
            </TabPanels>
          </Tabs>
          
          {/* الجداول */}
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap="6">
            {/* البرامج الأعلى سعرًا */}
            <GridItem>
              <Card>
                <CardHeader>
                  <Heading size="md">البرامج الأعلى سعرًا</Heading>
                </CardHeader>
                <CardBody>
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>البرنامج</Th>
                          <Th>الوجهة</Th>
                          <Th isNumeric>السعر</Th>
                          <Th>الحالة</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {topPricedPackages.map((pkg) => (
                          <Tr key={pkg.id}>
                            <Td>{pkg.name}</Td>
                            <Td>{pkg.destination}</Td>
                            <Td isNumeric>{formatAmount(pkg.price)}</Td>
                            <Td>
                              <Badge colorScheme={pkg.active ? 'green' : 'red'}>
                                {pkg.active ? 'نشط' : 'غير نشط'}
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
            
            {/* البرامج المضافة حديثًا */}
            <GridItem>
              <Card>
                <CardHeader>
                  <Heading size="md">البرامج المضافة حديثًا</Heading>
                </CardHeader>
                <CardBody>
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>البرنامج</Th>
                          <Th>الوجهة</Th>
                          <Th>تاريخ الإضافة</Th>
                          <Th>الحالة</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {recentPackages.map((pkg) => (
                          <Tr key={pkg.id}>
                            <Td>{pkg.name}</Td>
                            <Td>{pkg.destination}</Td>
                            <Td>
                              {pkg.createdAt && pkg.createdAt.toDate 
                                ? formatDate(pkg.createdAt.toDate()) 
                                : 'غير محدد'}
                            </Td>
                            <Td>
                              <Badge colorScheme={pkg.active ? 'green' : 'red'}>
                                {pkg.active ? 'نشط' : 'غير نشط'}
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

export default TourPackageReports;
