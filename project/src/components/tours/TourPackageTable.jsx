import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Flex,
  Image,
  Tooltip,
  useColorModeValue,
  useBreakpointValue,
  Stack,
  Skeleton,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardFooter,
  Heading,
  Button,
  HStack,
  VStack,
  Divider,
  Spacer
} from '@chakra-ui/react';
import {
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEye,
  FiPrinter,
  FiCopy,
  FiCheck,
  FiX,
  FiGrid,
  FiList,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { formatAmount } from '../../utils/validationUtils';

/**
 * مكون جدول البرامج السياحية
 * يعرض قائمة البرامج السياحية مع خيارات التعديل والحذف والعرض
 */
const TourPackageTable = ({
  packages,
  onView,
  onEdit,
  onDelete,
  onClone,
  onToggleActive,
  isLoading = false,
  pageSize = 10,
  currentPage = 1,
  totalPackages = 0,
  onPageChange,
  viewMode = 'table'
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.700');
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // حساب عدد الصفحات
  const totalPages = Math.ceil(totalPackages / pageSize);
  
  // عرض رسالة عندما لا توجد برامج
  if (packages.length === 0 && !isLoading) {
    return (
      <Box textAlign="center" py="8" borderWidth="1px" borderRadius="lg" borderColor={borderColor} p={6}>
        <Text fontSize="lg" color="gray.500">
          لا توجد برامج سياحية متاحة
        </Text>
        <Text fontSize="sm" color="gray.400" mt="2">
          قم بإضافة برامج سياحية جديدة لعرضها هنا
        </Text>
      </Box>
    );
  }
  
  // عرض هيكل تحميل عندما تكون البيانات قيد التحميل
  if (isLoading) {
    return (
      <Box overflowX="auto">
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th>الصورة</Th>
              <Th>اسم البرنامج</Th>
              <Th>الوجهة</Th>
              <Th>المدة</Th>
              <Th>السعر</Th>
              <Th>الحالة</Th>
              <Th>خيارات</Th>
            </Tr>
          </Thead>
          <Tbody>
            {[...Array(5)].map((_, index) => (
              <Tr key={index}>
                <Td><Skeleton height="40px" width="40px" borderRadius="md" /></Td>
                <Td><Skeleton height="20px" width="150px" /></Td>
                <Td><Skeleton height="20px" width="100px" /></Td>
                <Td><Skeleton height="20px" width="80px" /></Td>
                <Td><Skeleton height="20px" width="100px" /></Td>
                <Td><Skeleton height="20px" width="80px" /></Td>
                <Td><Skeleton height="20px" width="50px" /></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    );
  }
  
  // مكون عرض البطاقة للبرنامج السياحي
  const PackageCard = ({ pkg }) => (
    <Card maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden" bg={cardBg}>
      <Box position="relative">
        {pkg.imageUrl ? (
          <Image
            src={pkg.imageUrl}
            alt={pkg.name}
            height="200px"
            width="100%"
            objectFit="cover"
            fallback={<Box height="200px" bg="gray.200" />}
          />
        ) : (
          <Box height="200px" bg="gray.200" />
        )}
        {pkg.featured && (
          <Badge
            position="absolute"
            top="2"
            right="2"
            colorScheme="yellow"
            variant="solid"
            borderRadius="full"
            px="2"
          >
            مميز
          </Badge>
        )}
      </Box>
      
      <CardBody>
        <Stack spacing="3">
          <Heading size="md">{pkg.name}</Heading>
          <Text>{pkg.destination}</Text>
          <HStack>
            <Text>المدة:</Text>
            <Text fontWeight="bold">{pkg.duration}</Text>
          </HStack>
          <Text color="blue.600" fontSize="2xl">
            {formatAmount(pkg.price)}
          </Text>
          <Badge
            colorScheme={pkg.active ? 'green' : 'red'}
            alignSelf="start"
            borderRadius="full"
            px="2"
          >
            {pkg.active ? 'نشط' : 'غير نشط'}
          </Badge>
        </Stack>
      </CardBody>
      <Divider />
      <CardFooter>
        <HStack spacing="2" width="100%">
          <Tooltip label="عرض التفاصيل">
            <IconButton
              aria-label="عرض التفاصيل"
              icon={<FiEye />}
              variant="ghost"
              onClick={() => onView(pkg)}
            />
          </Tooltip>
          <Tooltip label="تعديل">
            <IconButton
              aria-label="تعديل"
              icon={<FiEdit />}
              variant="ghost"
              onClick={() => onEdit(pkg)}
            />
          </Tooltip>
          <Tooltip label="نسخ">
            <IconButton
              aria-label="نسخ"
              icon={<FiCopy />}
              variant="ghost"
              onClick={() => onClone(pkg)}
            />
          </Tooltip>
          <Spacer />
          <Tooltip label={pkg.active ? 'إيقاف' : 'تنشيط'}>
            <IconButton
              aria-label={pkg.active ? 'إيقاف' : 'تنشيط'}
              icon={pkg.active ? <FiX /> : <FiCheck />}
              colorScheme={pkg.active ? 'red' : 'green'}
              variant="ghost"
              onClick={() => onToggleActive(pkg.id, !pkg.active)}
            />
          </Tooltip>
          <Tooltip label="حذف">
            <IconButton
              aria-label="حذف"
              icon={<FiTrash2 />}
              colorScheme="red"
              variant="ghost"
              onClick={() => onDelete(pkg)}
            />
          </Tooltip>
        </HStack>
      </CardFooter>
    </Card>
  );
  
  // عرض الشبكة للبرامج السياحية
  const GridView = () => (
    <Grid templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }} gap={6}>
      {packages.map((pkg) => (
        <GridItem key={pkg.id}>
          <PackageCard pkg={pkg} />
        </GridItem>
      ))}
    </Grid>
  );
  
  // عرض الجدول للشاشات الكبيرة
  const TableView = () => (
    <Box overflowX="auto">
      <Table variant="simple" size="md">
        <Thead>
          <Tr>
            <Th>الصورة</Th>
            <Th>اسم البرنامج</Th>
            <Th>الوجهة</Th>
            <Th>المدة</Th>
            <Th>السعر</Th>
            <Th>الحالة</Th>
            <Th>خيارات</Th>
          </Tr>
        </Thead>
        <Tbody>
          {packages.map((pkg) => (
            <Tr key={pkg.id}>
              <Td>
                {pkg.imageUrl ? (
                  <Image
                    src={pkg.imageUrl}
                    alt={pkg.name}
                    boxSize="40px"
                    objectFit="cover"
                    borderRadius="md"
                    fallback={<Box boxSize="40px" bg="gray.200" borderRadius="md" />}
                  />
                ) : (
                  <Box boxSize="40px" bg="gray.200" borderRadius="md" />
                )}
              </Td>
              <Td fontWeight="medium">{pkg.name}</Td>
              <Td>{pkg.destination}</Td>
              <Td>{pkg.duration}</Td>
              <Td>{formatAmount(pkg.price)}</Td>
              <Td>
                <Badge
                  colorScheme={pkg.active ? 'green' : 'red'}
                  borderRadius="full"
                  px="2"
                >
                  {pkg.active ? 'نشط' : 'غير نشط'}
                </Badge>
                {pkg.featured && (
                  <Badge
                    ml="1"
                    colorScheme="yellow"
                    borderRadius="full"
                    px="2"
                  >
                    مميز
                  </Badge>
                )}
              </Td>
              <Td>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem icon={<FiEye />} onClick={() => onView(pkg)}>
                      عرض التفاصيل
                    </MenuItem>
                    <MenuItem icon={<FiEdit />} onClick={() => onEdit(pkg)}>
                      تعديل
                    </MenuItem>
                    <MenuItem icon={<FiCopy />} onClick={() => onClone(pkg)}>
                      نسخ
                    </MenuItem>
                    <MenuItem
                      icon={pkg.active ? <FiX /> : <FiCheck />}
                      onClick={() => onToggleActive(pkg.id, !pkg.active)}
                    >
                      {pkg.active ? 'إيقاف' : 'تنشيط'}
                    </MenuItem>
                    <MenuItem
                      icon={<FiTrash2 />}
                      color="red.500"
                      onClick={() => onDelete(pkg)}
                    >
                      حذف
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
  
  // عرض القائمة للشاشات الصغيرة
  const MobileView = () => (
    <Stack spacing="4">
      {packages.map((pkg) => (
        <Box
          key={pkg.id}
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          p="4"
        >
          <Flex>
            {pkg.imageUrl ? (
              <Image
                src={pkg.imageUrl}
                alt={pkg.name}
                boxSize="60px"
                objectFit="cover"
                borderRadius="md"
                mr="3"
                fallback={<Box boxSize="60px" bg="gray.200" borderRadius="md" />}
              />
            ) : (
              <Box boxSize="60px" bg="gray.200" borderRadius="md" mr="3" />
            )}
            
            <Box flex="1">
              <Flex justify="space-between" align="start">
                <Box>
                  <Text fontWeight="bold" fontSize="md">
                    {pkg.name}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {pkg.destination} • {pkg.duration}
                  </Text>
                  <Text fontWeight="bold" color="blue.600">
                    {formatAmount(pkg.price)}
                  </Text>
                </Box>
                
                <HStack>
                  <Badge
                    colorScheme={pkg.active ? 'green' : 'red'}
                    borderRadius="full"
                    px="2"
                  >
                    {pkg.active ? 'نشط' : 'غير نشط'}
                  </Badge>
                  {pkg.featured && (
                    <Badge
                      colorScheme="yellow"
                      borderRadius="full"
                      px="2"
                    >
                      مميز
                    </Badge>
                  )}
                </HStack>
              </Flex>
              
              <Flex mt="3" justify="flex-end">
                <HStack spacing="2">
                  <IconButton
                    aria-label="عرض التفاصيل"
                    icon={<FiEye />}
                    size="sm"
                    variant="ghost"
                    onClick={() => onView(pkg)}
                  />
                  <IconButton
                    aria-label="تعديل"
                    icon={<FiEdit />}
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(pkg)}
                  />
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<FiMoreVertical />}
                      variant="ghost"
                      size="sm"
                    />
                    <MenuList>
                      <MenuItem icon={<FiCopy />} onClick={() => onClone(pkg)}>
                        نسخ
                      </MenuItem>
                      <MenuItem
                        icon={pkg.active ? <FiX /> : <FiCheck />}
                        onClick={() => onToggleActive(pkg.id, !pkg.active)}
                      >
                        {pkg.active ? 'إيقاف' : 'تنشيط'}
                      </MenuItem>
                      <MenuItem
                        icon={<FiTrash2 />}
                        color="red.500"
                        onClick={() => onDelete(pkg)}
                      >
                        حذف
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </Flex>
            </Box>
          </Flex>
        </Box>
      ))}
    </Stack>
  );
  
  return (
    <VStack spacing={4} align="stretch">
      {/* عرض المحتوى حسب نوع العرض والجهاز */}
      {isMobile ? (
        <MobileView />
      ) : viewMode === 'grid' ? (
        <GridView />
      ) : (
        <TableView />
      )}
      
      {/* شريط التصفح الصفحي */}
      {totalPages > 1 && (
        <Flex justifyContent="center" mt={4}>
          <Stack direction="row" spacing={2} align="center">
            <Button
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              isDisabled={currentPage === 1}
              leftIcon={<FiChevronLeft />}
            >
              السابق
            </Button>
            
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              // عرض أول صفحتين، آخر صفحتين، والصفحة الحالية مع صفحة قبلها وبعدها
              if (
                pageNumber <= 2 ||
                pageNumber > totalPages - 2 ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={pageNumber}
                    size="sm"
                    colorScheme={pageNumber === currentPage ? "blue" : "gray"}
                    variant={pageNumber === currentPage ? "solid" : "outline"}
                    onClick={() => onPageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              } else if (
                pageNumber === 3 && currentPage > 4 ||
                pageNumber === totalPages - 2 && currentPage < totalPages - 3
              ) {
                return <Text key={pageNumber}>...</Text>;
              }
              return null;
            })}
            
            <Button
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              isDisabled={currentPage === totalPages}
              rightIcon={<FiChevronRight />}
            >
              التالي
            </Button>
          </Stack>
        </Flex>
      )}
    </VStack>
  );
};

export default TourPackageTable;
