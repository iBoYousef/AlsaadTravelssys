import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Icon,
  Spinner,
  useColorModeValue,
  Button,
  HStack,
  Select,
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
  Progress,
  Divider,
  Tooltip
} from '@chakra-ui/react';
import {
  FiUsers,
  FiAirplay,
  FiBook,
  FiFileText,
  FiCreditCard,
  FiGlobe,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiBarChart2,
  FiActivity,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';
import { 
  customerService, 
  flightService, 
  hotelService, 
  visaService, 
  tourPackageService, 
  tourBookingService,
  reportService,
  paymentService
} from '../services/api';
import { formatAmount, formatDate } from '../utils/validationUtils';

// مكون بطاقة الإحصائيات
const StatCard = ({ title, value, icon, change, changeType, loading, color }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const iconBg = useColorModeValue(`${color}.100`, `${color}.900`);
  const iconColor = useColorModeValue(`${color}.500`, `${color}.200`);
  
  return (
    <Card bg={cardBg} boxShadow="sm" borderRadius="lg">
      <CardBody>
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="sm" color="gray.500">{title}</Text>
            {loading ? (
              <Spinner size="sm" mt="2" />
            ) : (
              <>
                <Text fontSize="2xl" fontWeight="bold">{value}</Text>
                {change && (
                  <StatHelpText mb="0">
                    <StatArrow type={changeType || 'increase'} />
                    {change}
                  </StatHelpText>
                )}
              </>
            )}
          </Box>
          <Flex
            w="12"
            h="12"
            align="center"
            justify="center"
            borderRadius="full"
            bg={iconBg}
          >
            <Icon as={icon} boxSize="6" color={iconColor} />
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
};

// مكون جدول الحجوزات القادمة
const UpcomingBookingsTable = ({ bookings, loading }) => {
  const tableBg = useColorModeValue('white', 'gray.800');
  
  if (loading) {
    return (
      <Flex justify="center" py="4">
        <Spinner />
      </Flex>
    );
  }
  
  if (!bookings || bookings.length === 0) {
    return (
      <Box textAlign="center" py="4">
        <Text color="gray.500">لا توجد حجوزات قادمة</Text>
      </Box>
    );
  }
  
  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>رقم الحجز</Th>
            <Th>العميل</Th>
            <Th>نوع الحجز</Th>
            <Th>التاريخ</Th>
            <Th>الحالة</Th>
          </Tr>
        </Thead>
        <Tbody>
          {bookings.map((booking) => (
            <Tr key={booking.id}>
              <Td>{booking.bookingNumber || booking.id.substring(0, 8)}</Td>
              <Td>{booking.customerName}</Td>
              <Td>{booking.type}</Td>
              <Td>{formatDate(booking.travelDate || booking.bookingDate)}</Td>
              <Td>
                <Badge
                  colorScheme={
                    booking.status === 'confirmed' ? 'green' :
                    booking.status === 'pending' ? 'yellow' :
                    booking.status === 'cancelled' ? 'red' : 'blue'
                  }
                >
                  {booking.status === 'confirmed' ? 'مؤكد' :
                   booking.status === 'pending' ? 'قيد الانتظار' :
                   booking.status === 'cancelled' ? 'ملغي' : 'مكتمل'}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

// مكون بطاقة التنبيهات
const AlertCard = ({ title, alerts, icon, color, loading }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  
  return (
    <Card bg={cardBg} boxShadow="sm" borderRadius="lg" height="100%">
      <CardHeader pb="2">
        <Flex align="center">
          <Icon as={icon} color={`${color}.500`} mr="2" />
          <Heading size="md">{title}</Heading>
        </Flex>
      </CardHeader>
      <CardBody pt="0">
        {loading ? (
          <Flex justify="center" py="4">
            <Spinner />
          </Flex>
        ) : alerts.length > 0 ? (
          <Box>
            {alerts.map((alert, index) => (
              <Box key={index} mb="3" pb="2" borderBottom={index < alerts.length - 1 ? "1px solid" : "none"} borderColor="gray.100">
                <Flex align="center">
                  <Icon as={alert.icon} color={`${alert.color}.500`} mr="2" />
                  <Text fontWeight="medium">{alert.title}</Text>
                </Flex>
                <Text fontSize="sm" color="gray.500" mt="1">{alert.description}</Text>
              </Box>
            ))}
          </Box>
        ) : (
          <Box textAlign="center" py="4">
            <Text color="gray.500">لا توجد تنبيهات</Text>
          </Box>
        )}
      </CardBody>
    </Card>
  );
};

/**
 * صفحة لوحة التحكم الرئيسية
 * تعرض ملخصاً للإحصائيات المهمة في النظام
 */
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // day, week, month, year
  const [stats, setStats] = useState({
    customers: { total: 0, new: 0 },
    flights: { total: 0, pending: 0, revenue: 0 },
    hotels: { total: 0, pending: 0, revenue: 0 },
    visas: { total: 0, pending: 0, revenue: 0 },
    tours: { total: 0, pending: 0, revenue: 0 },
    payments: { total: 0, today: 0 }
  });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [salesData, setSalesData] = useState(null);
  const [revenueByService, setRevenueByService] = useState({
    flights: 0,
    hotels: 0,
    visas: 0,
    tours: 0
  });

  // جلب الإحصائيات عند تحميل الصفحة وعند تغيير الفترة
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // تحديد تواريخ الفترة
        const endDate = new Date();
        const startDate = new Date();
        
        switch (period) {
          case 'day':
            startDate.setDate(startDate.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          default:
            startDate.setMonth(startDate.getMonth() - 1);
        }
        
        // جلب إحصائيات العملاء
        const customers = await customerService.getAllCustomers();
        const newCustomers = customers.filter(
          customer => new Date(customer.createdAt?.seconds * 1000) >= startDate
        );
        
        // جلب إحصائيات حجوزات الطيران
        const flightStats = await flightService.getBookingStats({ startDate, endDate });
        
        // جلب إحصائيات حجوزات الفنادق
        const hotelStats = await hotelService.getBookingStats({ startDate, endDate });
        
        // جلب إحصائيات طلبات التأشيرات
        const visaStats = await visaService.getVisaStats({ startDate, endDate });
        
        // جلب إحصائيات البرامج السياحية
        const tourStats = await tourPackageService.getPackageStats({ startDate, endDate });
        
        // جلب إحصائيات حجوزات البرامج السياحية
        const tourBookingStats = await tourBookingService.getBookingStats({ startDate, endDate });
        
        // جلب إحصائيات المدفوعات
        const paymentStats = await paymentService.getPaymentStats(startDate, endDate);
        
        // جلب تقرير المبيعات
        const salesReport = await reportService.generateSalesReport({ startDate, endDate });
        
        // جلب الحجوزات القادمة
        const upcomingFlights = await flightService.getUpcomingBookings(5);
        const upcomingHotels = await hotelService.getUpcomingBookings(5);
        const upcomingTours = await tourBookingService.getUpcomingBookings(5);
        
        // دمج وترتيب الحجوزات القادمة
        const allUpcomingBookings = [
          ...upcomingFlights.map(b => ({ ...b, type: 'طيران' })),
          ...upcomingHotels.map(b => ({ ...b, type: 'فندق' })),
          ...upcomingTours.map(b => ({ ...b, type: 'برنامج سياحي' }))
        ].sort((a, b) => {
          const dateA = new Date(a.travelDate || a.bookingDate);
          const dateB = new Date(b.travelDate || b.bookingDate);
          return dateA - dateB;
        }).slice(0, 10);
        
        // إنشاء قائمة التنبيهات
        const newAlerts = [];
        
        // تنبيهات الحجوزات التي تحتاج تأكيد
        if (flightStats.statusCounts?.pending > 0) {
          newAlerts.push({
            title: 'حجوزات طيران تحتاج تأكيد',
            description: `${flightStats.statusCounts.pending} حجز طيران في انتظار التأكيد`,
            icon: FiAirplay,
            color: 'orange'
          });
        }
        
        if (hotelStats.statusCounts?.pending > 0) {
          newAlerts.push({
            title: 'حجوزات فنادق تحتاج تأكيد',
            description: `${hotelStats.statusCounts.pending} حجز فندق في انتظار التأكيد`,
            icon: FiBook,
            color: 'blue'
          });
        }
        
        if (tourBookingStats.statusCounts?.pending > 0) {
          newAlerts.push({
            title: 'حجوزات برامج سياحية تحتاج تأكيد',
            description: `${tourBookingStats.statusCounts.pending} حجز برنامج سياحي في انتظار التأكيد`,
            icon: FiGlobe,
            color: 'green'
          });
        }
        
        // تنبيهات الحجوزات القريبة
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const upcomingThisWeek = allUpcomingBookings.filter(booking => {
          const bookingDate = new Date(booking.travelDate || booking.bookingDate);
          return bookingDate >= today && bookingDate <= nextWeek;
        });
        
        if (upcomingThisWeek.length > 0) {
          newAlerts.push({
            title: 'حجوزات قريبة هذا الأسبوع',
            description: `${upcomingThisWeek.length} حجز في الأسبوع القادم`,
            icon: FiCalendar,
            color: 'purple'
          });
        }
        
        // تنبيهات التأشيرات
        if (visaStats.statusCounts?.pending > 0) {
          newAlerts.push({
            title: 'طلبات تأشيرات في انتظار المتابعة',
            description: `${visaStats.statusCounts.pending} طلب تأشيرة يحتاج متابعة`,
            icon: FiFileText,
            color: 'red'
          });
        }
        
        // إحصائيات الإيرادات حسب الخدمة
        const revenueStats = {
          flights: flightStats.totalRevenue || 0,
          hotels: hotelStats.totalRevenue || 0,
          visas: visaStats.totalRevenue || 0,
          tours: tourBookingStats.totalRevenue || 0
        };
        
        // تحديث الإحصائيات
        setStats({
          customers: { 
            total: customers.length, 
            new: newCustomers.length 
          },
          flights: { 
            total: flightStats.totalBookings || 0, 
            pending: flightStats.statusCounts?.pending || 0,
            revenue: flightStats.totalRevenue || 0
          },
          hotels: { 
            total: hotelStats.totalBookings || 0, 
            pending: hotelStats.statusCounts?.pending || 0,
            revenue: hotelStats.totalRevenue || 0
          },
          visas: { 
            total: visaStats.totalApplications || 0, 
            pending: visaStats.statusCounts?.pending || 0,
            revenue: visaStats.totalRevenue || 0
          },
          tours: { 
            total: tourBookingStats.totalBookings || 0, 
            pending: tourBookingStats.statusCounts?.pending || 0,
            revenue: tourBookingStats.totalRevenue || 0
          },
          payments: { 
            total: paymentStats.totalPayments || 0, 
            today: paymentStats.dailyStats?.[paymentStats.dailyStats.length - 1]?.payments || 0 
          }
        });
        
        setUpcomingBookings(allUpcomingBookings);
        setAlerts(newAlerts);
        setSalesData(salesReport);
        setRevenueByService(revenueStats);
      } catch (error) {
        console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [period]);

  // تغيير الفترة
  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };
  
  // حساب إجمالي الإيرادات
  const totalRevenue = 
    (stats.flights.revenue || 0) + 
    (stats.hotels.revenue || 0) + 
    (stats.visas.revenue || 0) + 
    (stats.tours.revenue || 0);
  
  // حساب النسب المئوية للإيرادات حسب الخدمة
  const revenuePercentages = {
    flights: totalRevenue > 0 ? ((stats.flights.revenue || 0) / totalRevenue) * 100 : 0,
    hotels: totalRevenue > 0 ? ((stats.hotels.revenue || 0) / totalRevenue) * 100 : 0,
    visas: totalRevenue > 0 ? ((stats.visas.revenue || 0) / totalRevenue) * 100 : 0,
    tours: totalRevenue > 0 ? ((stats.tours.revenue || 0) / totalRevenue) * 100 : 0
  };

  return (
    <Box p="4">
      <Flex justify="space-between" align="center" mb="6">
        <Heading size="lg">لوحة التحكم</Heading>
        <HStack>
          <Select value={period} onChange={handlePeriodChange} w="auto">
            <option value="day">اليوم</option>
            <option value="week">الأسبوع</option>
            <option value="month">الشهر</option>
            <option value="year">السنة</option>
          </Select>
        </HStack>
      </Flex>

      {/* إحصائيات رئيسية */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="4" mb="6">
        <StatCard
          title="إجمالي العملاء"
          value={stats.customers.total}
          icon={FiUsers}
          change={`${stats.customers.new} جديد`}
          loading={loading}
          color="blue"
        />
        <StatCard
          title="إجمالي الحجوزات"
          value={stats.flights.total + stats.hotels.total + stats.tours.total}
          icon={FiBook}
          change={`${stats.flights.pending + stats.hotels.pending + stats.tours.pending} قيد الانتظار`}
          loading={loading}
          color="green"
        />
        <StatCard
          title="طلبات التأشيرات"
          value={stats.visas.total}
          icon={FiFileText}
          change={`${stats.visas.pending} قيد المتابعة`}
          loading={loading}
          color="purple"
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={formatAmount(totalRevenue)}
          icon={FiCreditCard}
          loading={loading}
          color="orange"
        />
      </SimpleGrid>

      {/* إحصائيات الإيرادات حسب الخدمة */}
      <Card mb="6">
        <CardHeader pb="2">
          <Heading size="md">توزيع الإيرادات حسب الخدمة</Heading>
        </CardHeader>
        <CardBody pt="0">
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
            <GridItem>
              <Box mb="4">
                <Flex justify="space-between" mb="1">
                  <Text>حجوزات الطيران</Text>
                  <Text>{formatAmount(stats.flights.revenue)}</Text>
                </Flex>
                <Progress value={revenuePercentages.flights} colorScheme="blue" size="sm" borderRadius="full" />
              </Box>
              
              <Box mb="4">
                <Flex justify="space-between" mb="1">
                  <Text>حجوزات الفنادق</Text>
                  <Text>{formatAmount(stats.hotels.revenue)}</Text>
                </Flex>
                <Progress value={revenuePercentages.hotels} colorScheme="green" size="sm" borderRadius="full" />
              </Box>
              
              <Box mb="4">
                <Flex justify="space-between" mb="1">
                  <Text>طلبات التأشيرات</Text>
                  <Text>{formatAmount(stats.visas.revenue)}</Text>
                </Flex>
                <Progress value={revenuePercentages.visas} colorScheme="purple" size="sm" borderRadius="full" />
              </Box>
              
              <Box>
                <Flex justify="space-between" mb="1">
                  <Text>البرامج السياحية</Text>
                  <Text>{formatAmount(stats.tours.revenue)}</Text>
                </Flex>
                <Progress value={revenuePercentages.tours} colorScheme="orange" size="sm" borderRadius="full" />
              </Box>
            </GridItem>
            
            <GridItem>
              <Flex direction="column" h="100%" justify="center" align="center">
                <Heading size="md" mb="2">إجمالي الإيرادات</Heading>
                <Heading size="xl" color="green.500">{formatAmount(totalRevenue)}</Heading>
                <HStack mt="4" spacing="6">
                  <Stat>
                    <StatLabel>الطيران</StatLabel>
                    <StatNumber>{revenuePercentages.flights.toFixed(1)}%</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>الفنادق</StatLabel>
                    <StatNumber>{revenuePercentages.hotels.toFixed(1)}%</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>التأشيرات</StatLabel>
                    <StatNumber>{revenuePercentages.visas.toFixed(1)}%</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>البرامج</StatLabel>
                    <StatNumber>{revenuePercentages.tours.toFixed(1)}%</StatNumber>
                  </Stat>
                </HStack>
              </Flex>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>

      {/* الحجوزات القادمة والتنبيهات */}
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap="6" mb="6">
        <GridItem>
          <Card>
            <CardHeader pb="2">
              <Heading size="md">الحجوزات القادمة</Heading>
            </CardHeader>
            <CardBody pt="0">
              <UpcomingBookingsTable bookings={upcomingBookings} loading={loading} />
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <AlertCard
            title="التنبيهات والمهام"
            alerts={alerts}
            icon={FiAlertCircle}
            color="red"
            loading={loading}
          />
        </GridItem>
      </Grid>

      {/* إحصائيات تفصيلية */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="4">
        <Card>
          <CardHeader pb="2">
            <Flex align="center">
              <Icon as={FiAirplay} color="blue.500" mr="2" />
              <Heading size="md">حجوزات الطيران</Heading>
            </Flex>
          </CardHeader>
          <CardBody pt="0">
            <Stat>
              <StatLabel>إجمالي الحجوزات</StatLabel>
              <StatNumber>{stats.flights.total}</StatNumber>
              <StatHelpText>
                <HStack>
                  <Badge colorScheme="yellow">{stats.flights.pending} قيد الانتظار</Badge>
                  <Badge colorScheme="green">{stats.flights.total - stats.flights.pending} مؤكد</Badge>
                </HStack>
              </StatHelpText>
            </Stat>
            <Divider my="3" />
            <Stat>
              <StatLabel>الإيرادات</StatLabel>
              <StatNumber>{formatAmount(stats.flights.revenue)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader pb="2">
            <Flex align="center">
              <Icon as={FiBook} color="green.500" mr="2" />
              <Heading size="md">حجوزات الفنادق</Heading>
            </Flex>
          </CardHeader>
          <CardBody pt="0">
            <Stat>
              <StatLabel>إجمالي الحجوزات</StatLabel>
              <StatNumber>{stats.hotels.total}</StatNumber>
              <StatHelpText>
                <HStack>
                  <Badge colorScheme="yellow">{stats.hotels.pending} قيد الانتظار</Badge>
                  <Badge colorScheme="green">{stats.hotels.total - stats.hotels.pending} مؤكد</Badge>
                </HStack>
              </StatHelpText>
            </Stat>
            <Divider my="3" />
            <Stat>
              <StatLabel>الإيرادات</StatLabel>
              <StatNumber>{formatAmount(stats.hotels.revenue)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader pb="2">
            <Flex align="center">
              <Icon as={FiGlobe} color="orange.500" mr="2" />
              <Heading size="md">البرامج السياحية</Heading>
            </Flex>
          </CardHeader>
          <CardBody pt="0">
            <Stat>
              <StatLabel>إجمالي الحجوزات</StatLabel>
              <StatNumber>{stats.tours.total}</StatNumber>
              <StatHelpText>
                <HStack>
                  <Badge colorScheme="yellow">{stats.tours.pending} قيد الانتظار</Badge>
                  <Badge colorScheme="green">{stats.tours.total - stats.tours.pending} مؤكد</Badge>
                </HStack>
              </StatHelpText>
            </Stat>
            <Divider my="3" />
            <Stat>
              <StatLabel>الإيرادات</StatLabel>
              <StatNumber>{formatAmount(stats.tours.revenue)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader pb="2">
            <Flex align="center">
              <Icon as={FiFileText} color="purple.500" mr="2" />
              <Heading size="md">طلبات التأشيرات</Heading>
            </Flex>
          </CardHeader>
          <CardBody pt="0">
            <Stat>
              <StatLabel>إجمالي الطلبات</StatLabel>
              <StatNumber>{stats.visas.total}</StatNumber>
              <StatHelpText>
                <HStack>
                  <Badge colorScheme="yellow">{stats.visas.pending} قيد المتابعة</Badge>
                  <Badge colorScheme="green">{stats.visas.total - stats.visas.pending} مكتمل</Badge>
                </HStack>
              </StatHelpText>
            </Stat>
            <Divider my="3" />
            <Stat>
              <StatLabel>الإيرادات</StatLabel>
              <StatNumber>{formatAmount(stats.visas.revenue)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default Dashboard;
