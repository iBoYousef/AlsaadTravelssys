import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Table, 
  Tbody, 
  Td, 
  Th, 
  Thead, 
  Tr,
  TableContainer,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Text,
  Button,
  Stack,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  StatHelpText,
  Grid,
  FormControl,
  FormLabel,
  HStack
} from '@chakra-ui/react';
import { SearchIcon, RepeatIcon, DownloadIcon, CalendarIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import systemLogService, { ACTION_TYPES, ACTION_CATEGORIES } from '../../services/firebase/systemLogService';

const SystemLogsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    category: '',
    actionType: '',
    employeeId: '',
    startDate: '',
    endDate: '',
    clientInfo: '',
    sortBy: 'actionTime',
    sortDirection: 'desc'
  });
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // التحقق من صلاحية الوصول
  useEffect(() => {
    if (!systemLogService.canAccessSystemLogs(user)) {
      // إذا لم يكن المستخدم مسؤول نظام، يتم توجيهه إلى الصفحة الرئيسية
      navigate('/');
    }
  }, [user, navigate]);

  // جلب سجلات النظام
  const fetchLogs = async (resetPage = true) => {
    setLoading(true);
    try {
      const currentPage = resetPage ? 0 : page;
      if (resetPage) {
        setPage(0);
        setLastDoc(null);
      }

      const options = {
        limitCount: rowsPerPage,
        ...filters,
        lastDoc: resetPage ? null : lastDoc
      };

      const result = await systemLogService.getSystemLogs(options);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (resetPage) {
        setLogs(result.logs);
        setFilteredLogs(result.logs);
      } else {
        setLogs([...logs, ...result.logs]);
        setFilteredLogs([...logs, ...result.logs]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      setError(null);
    } catch (err) {
      console.error('خطأ في جلب سجلات النظام:', err);
      setError('حدث خطأ أثناء جلب سجلات النظام. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // جلب إحصائيات سجل النظام
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const result = await systemLogService.getSystemLogStats();
      
      if (result.success) {
        setStats(result.stats);
      } else {
        console.error('خطأ في جلب إحصائيات سجل النظام:', result.error);
      }
    } catch (err) {
      console.error('خطأ في جلب إحصائيات سجل النظام:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // جلب السجلات والإحصائيات عند تحميل الصفحة
  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  // جلب السجلات عند تغيير عدد الصفوف في الصفحة
  useEffect(() => {
    if (!loading) {
      fetchLogs(true);
    }
  }, [rowsPerPage]);

  // تصفية السجلات عند تغيير مصطلح البحث
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredLogs(logs);
    } else {
      const lowercasedFilter = searchTerm.toLowerCase();
      const filtered = logs.filter(log => 
        (log.actionType && log.actionType.toLowerCase().includes(lowercasedFilter)) ||
        (log.description && log.description.toLowerCase().includes(lowercasedFilter)) ||
        (log.employeeName && log.employeeName.toLowerCase().includes(lowercasedFilter)) ||
        (log.employeeId && log.employeeId.toLowerCase().includes(lowercasedFilter)) ||
        (log.category && log.category.toLowerCase().includes(lowercasedFilter))
      );
      setFilteredLogs(filtered);
    }
    setPage(0);
  }, [searchTerm, logs]);

  // معالجة تغيير الصفحة
  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  // معالجة تغيير عدد الصفوف في الصفحة
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // معالجة تغيير الفلاتر
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // تطبيق الفلاتر
  const applyFilters = () => {
    fetchLogs(true);
  };

  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setFilters({
      category: '',
      actionType: '',
      employeeId: '',
      startDate: '',
      endDate: '',
      clientInfo: '',
      sortBy: 'actionTime',
      sortDirection: 'desc'
    });
    fetchLogs(true);
  };

  // تحميل المزيد من السجلات
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchLogs(false);
    }
  };

  // تصدير السجلات إلى ملف CSV
  const exportToCSV = () => {
    try {
      // تحويل السجلات إلى تنسيق CSV
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // إضافة رأس الجدول
      csvContent += "التاريخ,الوقت,نوع الإجراء,الوصف,الموظف,الفئة,معلومات العميل\n";
      
      // إضافة البيانات
      filteredLogs.forEach(log => {
        const date = log.actionTime ? new Date(log.actionTime.seconds * 1000) : new Date();
        const dateStr = date.toLocaleDateString('ar-SA');
        const timeStr = date.toLocaleTimeString('ar-SA');
        
        const row = [
          dateStr,
          timeStr,
          log.actionType || '',
          log.description || '',
          log.employeeName || '',
          log.category || '',
          log.clientInfo ? `${log.clientInfo.platform || ''} - ${log.clientInfo.userAgent || ''}` : ''
        ].map(cell => `"${cell.replace(/"/g, '""')}"`).join(',');
        
        csvContent += row + "\n";
      });
      
      // إنشاء رابط تنزيل
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `system_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      
      // تنزيل الملف
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('خطأ في تصدير السجلات:', err);
      setError('حدث خطأ أثناء تصدير السجلات. يرجى المحاولة مرة أخرى.');
    }
  };

  // تنسيق التاريخ والوقت
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'غير محدد';
    
    try {
      const date = timestamp.seconds 
        ? new Date(timestamp.seconds * 1000) 
        : new Date(timestamp);
      
      return date.toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('خطأ في تنسيق التاريخ:', error);
      return 'تنسيق غير صالح';
    }
  };

  // عرض جدول السجلات
  const renderLogsTable = () => {
    if (loading && logs.length === 0) {
      return (
        <Flex justifyContent="center" my={8}>
          <Spinner size="xl" />
        </Flex>
      );
    }

    if (filteredLogs.length === 0) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          لا توجد سجلات مطابقة لمعايير البحث
        </Alert>
      );
    }

    return (
      <>
        <TableContainer borderRadius="md" borderWidth="1px" borderColor="gray.200" mb={4}>
          <Table variant="striped" colorScheme="gray" size="sm">
            <Thead bg="gray.100">
              <Tr>
                <Th width="15%">التاريخ والوقت</Th>
                <Th width="10%">نوع الإجراء</Th>
                <Th width="10%">الفئة</Th>
                <Th width="30%">الوصف</Th>
                <Th width="15%">الموظف</Th>
                <Th width="20%">معلومات العميل</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredLogs
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((log, index) => (
                  <Tr key={log.id || index} _hover={{ bg: "blue.50" }}>
                    <Td fontSize="xs">{formatDateTime(log.actionTime)}</Td>
                    <Td>
                      <Badge colorScheme={getActionTypeColor(log.actionType)}>
                        {log.actionType || 'غير محدد'}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getCategoryColor(log.category)}>
                        {log.category || 'غير محدد'}
                      </Badge>
                    </Td>
                    <Td fontSize="sm">{log.description || 'لا يوجد وصف'}</Td>
                    <Td fontSize="sm">
                      {log.employeeName ? (
                        <Text>
                          {log.employeeName}
                          {log.employeeId && (
                            <Text as="span" fontSize="xs" color="gray.500" ml={1}>
                              ({log.employeeId})
                            </Text>
                          )}
                        </Text>
                      ) : (
                        'غير محدد'
                      )}
                    </Td>
                    <Td fontSize="xs">
                      {log.clientInfo ? (
                        <Box>
                          {log.clientInfo.ip && (
                            <Text>IP: {log.clientInfo.ip}</Text>
                          )}
                          {log.clientInfo.platform && (
                            <Text>النظام: {log.clientInfo.platform}</Text>
                          )}
                          {log.clientInfo.userAgent && (
                            <Text noOfLines={1} title={log.clientInfo.userAgent}>
                              المتصفح: {log.clientInfo.userAgent.split(' ')[0]}
                            </Text>
                          )}
                        </Box>
                      ) : (
                        'غير متوفر'
                      )}
                    </Td>
                  </Tr>
                ))}
            </Tbody>
          </Table>
        </TableContainer>

        <Flex justifyContent="space-between" alignItems="center">
          <Box>
            <Text fontSize="sm">
              عرض {filteredLogs.length > 0 ? page * rowsPerPage + 1 : 0} - {Math.min((page + 1) * rowsPerPage, filteredLogs.length)} من {filteredLogs.length} سجل
            </Text>
          </Box>
          
          <HStack spacing={2}>
            <Button
              size="sm"
              onClick={() => handleChangePage(page - 1)}
              isDisabled={page === 0}
              leftIcon={<Text as="span">◀</Text>}
            >
              السابق
            </Button>
            
            <Select
              size="sm"
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              width="auto"
            >
              <option value={10}>10 سجلات</option>
              <option value={25}>25 سجل</option>
              <option value={50}>50 سجل</option>
              <option value={100}>100 سجل</option>
            </Select>
            
            <Button
              size="sm"
              onClick={() => handleChangePage(page + 1)}
              isDisabled={(page + 1) * rowsPerPage >= filteredLogs.length}
              rightIcon={<Text as="span">▶</Text>}
            >
              التالي
            </Button>
          </HStack>
          
          {hasMore && (
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => fetchLogs(false)}
              isLoading={loading}
              leftIcon={<RepeatIcon />}
            >
              تحميل المزيد
            </Button>
          )}
        </Flex>
      </>
    );
  };

  // تحديد لون لنوع الإجراء
  const getActionTypeColor = (actionType) => {
    const colorMap = {
      'تسجيل دخول': 'green',
      'تسجيل خروج': 'red',
      'إضافة': 'blue',
      'تعديل': 'orange',
      'حذف': 'red',
      'عرض': 'teal',
      'بحث': 'purple',
      'تصدير': 'cyan',
      'استيراد': 'pink',
      'طباعة': 'gray',
      'دفع': 'green',
      'استرداد': 'orange',
      'موافقة': 'green',
      'رفض': 'red',
      'إلغاء': 'red',
      'نظام': 'blue'
    };
    
    return colorMap[actionType] || 'gray';
  };

  // تحديد لون للفئة
  const getCategoryColor = (category) => {
    const colorMap = {
      'المصادقة': 'blue',
      'العملاء': 'green',
      'الحجوزات': 'purple',
      'الطيران': 'cyan',
      'الفنادق': 'orange',
      'التأشيرات': 'red',
      'البرامج السياحية': 'teal',
      'المالية': 'green',
      'الموظفين': 'blue',
      'النظام': 'gray',
      'التقارير': 'yellow',
      'المستخدمين': 'pink'
    };
    
    return colorMap[category] || 'gray';
  };

  // قسم الفلاتر المتقدمة
  const renderAdvancedFilters = () => (
    <Box p={4} bg="white" borderRadius="md" shadow="sm" mb={4}>
      <Heading size="md" mb={4}>خيارات البحث المتقدم</Heading>
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
        <FormControl>
          <FormLabel>فئة الإجراء</FormLabel>
          <Select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            placeholder="جميع الفئات"
          >
            {Object.values(ACTION_CATEGORIES).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>نوع الإجراء</FormLabel>
          <Select
            name="actionType"
            value={filters.actionType}
            onChange={handleFilterChange}
            placeholder="جميع الأنواع"
          >
            {Object.values(ACTION_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>الموظف</FormLabel>
          <Input
            name="employeeId"
            value={filters.employeeId}
            onChange={handleFilterChange}
            placeholder="رقم أو اسم الموظف"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>من تاريخ</FormLabel>
          <Input
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>إلى تاريخ</FormLabel>
          <Input
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>معلومات العميل</FormLabel>
          <Input
            name="clientInfo"
            value={filters.clientInfo}
            onChange={handleFilterChange}
            placeholder="نظام التشغيل أو المتصفح"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>ترتيب حسب</FormLabel>
          <Select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
          >
            <option value="actionTime">وقت الإجراء</option>
            <option value="actionType">نوع الإجراء</option>
            <option value="category">الفئة</option>
            <option value="employeeName">الموظف</option>
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>اتجاه الترتيب</FormLabel>
          <Select
            name="sortDirection"
            value={filters.sortDirection}
            onChange={handleFilterChange}
          >
            <option value="desc">تنازلي (الأحدث أولاً)</option>
            <option value="asc">تصاعدي (الأقدم أولاً)</option>
          </Select>
        </FormControl>
      </Grid>
      
      <HStack spacing={4} mt={4} justify="flex-end">
        <Button colorScheme="blue" onClick={applyFilters}>
          تطبيق الفلاتر
        </Button>
        <Button variant="outline" onClick={resetFilters}>
          إعادة تعيين
        </Button>
        <Button leftIcon={<DownloadIcon />} colorScheme="green" onClick={exportToCSV}>
          تصدير النتائج (CSV)
        </Button>
      </HStack>
    </Box>
  );

  // تحسين عرض الإحصائيات
  const renderStats = () => {
    if (statsLoading) {
      return (
        <Box textAlign="center" p={10}>
          <Spinner size="xl" />
          <Text mt={4}>جاري تحميل الإحصائيات...</Text>
        </Box>
      );
    }

    if (!stats || Object.keys(stats).length === 0) {
      return (
        <Alert status="info">
          <AlertIcon />
          لا توجد إحصائيات متاحة
        </Alert>
      );
    }

    return (
      <Box p={4} bg="white" borderRadius="md" shadow="sm">
        <Heading size="md" mb={6}>إحصائيات سجل النظام</Heading>
        
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6} mb={6}>
          <Stat bg="blue.50" p={4} borderRadius="md" borderLeft="4px solid" borderLeftColor="blue.500">
            <StatLabel fontSize="sm">إجمالي السجلات</StatLabel>
            <StatNumber fontSize="2xl">{stats.totalLogs || 0}</StatNumber>
            <StatHelpText>
              <Text fontSize="xs">آخر 30 يوم: {stats.lastMonthLogs || 0}</Text>
            </StatHelpText>
          </Stat>
          
          <Stat bg="green.50" p={4} borderRadius="md" borderLeft="4px solid" borderLeftColor="green.500">
            <StatLabel fontSize="sm">عمليات تسجيل الدخول</StatLabel>
            <StatNumber fontSize="2xl">{stats.loginCount || 0}</StatNumber>
            <StatHelpText>
              <Text fontSize="xs">آخر 24 ساعة: {stats.todayLoginCount || 0}</Text>
            </StatHelpText>
          </Stat>
          
          <Stat bg="purple.50" p={4} borderRadius="md" borderLeft="4px solid" borderLeftColor="purple.500">
            <StatLabel fontSize="sm">عدد المستخدمين النشطين</StatLabel>
            <StatNumber fontSize="2xl">{stats.activeUsers || 0}</StatNumber>
            <StatHelpText>
              <Text fontSize="xs">آخر 7 أيام: {stats.weeklyActiveUsers || 0}</Text>
            </StatHelpText>
          </Stat>
          
          <Stat bg="orange.50" p={4} borderRadius="md" borderLeft="4px solid" borderLeftColor="orange.500">
            <StatLabel fontSize="sm">متوسط الإجراءات اليومية</StatLabel>
            <StatNumber fontSize="2xl">{stats.avgDailyActions || 0}</StatNumber>
            <StatHelpText>
              <Text fontSize="xs">الأسبوع الماضي: {stats.lastWeekAvgActions || 0}</Text>
            </StatHelpText>
          </Stat>
        </Grid>
        
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
          {/* توزيع الإجراءات حسب النوع */}
          <Box p={4} bg="gray.50" borderRadius="md">
            <Heading size="sm" mb={4}>توزيع الإجراءات حسب النوع</Heading>
            <Box maxH="200px" overflowY="auto">
              <Table size="sm" variant="simple">
                <Thead bg="gray.100">
                  <Tr>
                    <Th>نوع الإجراء</Th>
                    <Th isNumeric>العدد</Th>
                    <Th isNumeric>النسبة</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {stats.actionTypeDistribution && Object.entries(stats.actionTypeDistribution)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .map(([type, count]) => (
                      <Tr key={type}>
                        <Td>
                          <Badge colorScheme={getActionTypeColor(type)}>{type}</Badge>
                        </Td>
                        <Td isNumeric>{count}</Td>
                        <Td isNumeric>
                          {stats.totalLogs ? `${((count / stats.totalLogs) * 100).toFixed(1)}%` : '0%'}
                        </Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
          
          {/* توزيع الإجراءات حسب الفئة */}
          <Box p={4} bg="gray.50" borderRadius="md">
            <Heading size="sm" mb={4}>توزيع الإجراءات حسب الفئة</Heading>
            <Box maxH="200px" overflowY="auto">
              <Table size="sm" variant="simple">
                <Thead bg="gray.100">
                  <Tr>
                    <Th>الفئة</Th>
                    <Th isNumeric>العدد</Th>
                    <Th isNumeric>النسبة</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {stats.categoryDistribution && Object.entries(stats.categoryDistribution)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .map(([category, count]) => (
                      <Tr key={category}>
                        <Td>
                          <Badge colorScheme={getCategoryColor(category)}>{category}</Badge>
                        </Td>
                        <Td isNumeric>{count}</Td>
                        <Td isNumeric>
                          {stats.totalLogs ? `${((count / stats.totalLogs) * 100).toFixed(1)}%` : '0%'}
                        </Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
          
          {/* أكثر المستخدمين نشاطاً */}
          <Box p={4} bg="gray.50" borderRadius="md">
            <Heading size="sm" mb={4}>أكثر المستخدمين نشاطاً</Heading>
            <Box maxH="200px" overflowY="auto">
              <Table size="sm" variant="simple">
                <Thead bg="gray.100">
                  <Tr>
                    <Th>الموظف</Th>
                    <Th isNumeric>عدد الإجراءات</Th>
                    <Th isNumeric>النسبة</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {stats.topUsers && Object.entries(stats.topUsers)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .slice(0, 10)
                    .map(([user, count]) => (
                      <Tr key={user}>
                        <Td>{user}</Td>
                        <Td isNumeric>{count}</Td>
                        <Td isNumeric>
                          {stats.totalLogs ? `${((count / stats.totalLogs) * 100).toFixed(1)}%` : '0%'}
                        </Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
          
          {/* نشاط النظام على مدار اليوم */}
          <Box p={4} bg="gray.50" borderRadius="md">
            <Heading size="sm" mb={4}>نشاط النظام على مدار اليوم</Heading>
            <Box maxH="200px" overflowY="auto">
              <Table size="sm" variant="simple">
                <Thead bg="gray.100">
                  <Tr>
                    <Th>الساعة</Th>
                    <Th isNumeric>عدد الإجراءات</Th>
                    <Th isNumeric>النسبة</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {stats.hourlyDistribution && Object.entries(stats.hourlyDistribution)
                    .sort(([hourA, ], [hourB, ]) => parseInt(hourA) - parseInt(hourB))
                    .map(([hour, count]) => (
                      <Tr key={hour}>
                        <Td>{`${hour}:00 - ${hour}:59`}</Td>
                        <Td isNumeric>{count}</Td>
                        <Td isNumeric>
                          {stats.totalLogs ? `${((count / stats.totalLogs) * 100).toFixed(1)}%` : '0%'}
                        </Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
        </Grid>
      </Box>
    );
  };

  return (
    <Box p={3}>
      <Heading as="h1" size="lg" mb={4}>
        سجل أحداث النظام
      </Heading>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Tabs variant="enclosed" colorScheme="blue" mb={4}>
        <TabList>
          <Tab>السجلات</Tab>
          <Tab>الإحصائيات</Tab>
          <Tab>البحث المتقدم</Tab>
        </TabList>

        <TabPanels>
          {/* علامة تبويب السجلات */}
          <TabPanel>
            <Box mb={4}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="بحث في السجلات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Box>
            
            {renderLogsTable()}
          </TabPanel>
          
          {/* علامة تبويب الإحصائيات */}
          <TabPanel>
            {renderStats()}
          </TabPanel>
          
          {/* علامة تبويب البحث المتقدم */}
          <TabPanel>
            {renderAdvancedFilters()}
            {renderLogsTable()}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default SystemLogsPage;
