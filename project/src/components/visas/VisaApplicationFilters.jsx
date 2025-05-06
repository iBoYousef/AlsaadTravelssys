import React, { useState } from 'react';
import {
  Flex,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Button,
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  useDisclosure,
  Collapse,
  useBreakpointValue
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiCalendar,
  FiChevronDown,
  FiX,
  FiCheck,
  FiMapPin,
  FiFileText
} from 'react-icons/fi';

// قائمة أنواع التأشيرات
const visaTypes = [
  { value: 'tourist', label: 'سياحية' },
  { value: 'business', label: 'عمل' },
  { value: 'visit', label: 'زيارة' },
  { value: 'umrah', label: 'عمرة' },
  { value: 'hajj', label: 'حج' },
  { value: 'student', label: 'دراسية' },
  { value: 'medical', label: 'علاجية' },
  { value: 'transit', label: 'ترانزيت' },
  { value: 'work', label: 'إقامة عمل' },
  { value: 'family', label: 'لم شمل عائلي' }
];

/**
 * مكون فلاتر طلبات التأشيرات
 * يتيح البحث وتصفية طلبات التأشيرات حسب معايير مختلفة
 */
const VisaApplicationFilters = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onResetFilters,
  onApplyFilters,
  countries = []
}) => {
  const { isOpen, onToggle } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // تحديث مصطلح البحث
  const handleSearchChange = (e) => {
    onSearchChange(e.target.value);
  };
  
  // تحديث الفلاتر
  const handleFilterChange = (name, value) => {
    onFilterChange(name, value);
  };
  
  // عرض الفلاتر النشطة كشارات
  const renderActiveFilters = () => {
    const activeFilters = [];
    
    if (filters.status && filters.status !== 'all') {
      const statusLabels = {
        pending: 'قيد المعالجة',
        submitted: 'تم التقديم',
        approved: 'تمت الموافقة',
        rejected: 'مرفوض',
        completed: 'مكتمل',
        cancelled: 'ملغي',
        urgent: 'عاجل'
      };
      
      activeFilters.push(
        <Badge key="status" colorScheme="blue" borderRadius="full" px="2" py="1">
          الحالة: {statusLabels[filters.status] || filters.status}
          <IconButton
            aria-label="إزالة الفلتر"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            ml="1"
            onClick={() => handleFilterChange('status', 'all')}
          />
        </Badge>
      );
    }
    
    if (filters.visaType && filters.visaType !== 'all') {
      const typeLabel = visaTypes.find(t => t.value === filters.visaType)?.label || filters.visaType;
      
      activeFilters.push(
        <Badge key="visaType" colorScheme="purple" borderRadius="full" px="2" py="1">
          نوع التأشيرة: {typeLabel}
          <IconButton
            aria-label="إزالة الفلتر"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            ml="1"
            onClick={() => handleFilterChange('visaType', 'all')}
          />
        </Badge>
      );
    }
    
    if (filters.country) {
      activeFilters.push(
        <Badge key="country" colorScheme="green" borderRadius="full" px="2" py="1">
          الدولة: {filters.country}
          <IconButton
            aria-label="إزالة الفلتر"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            ml="1"
            onClick={() => handleFilterChange('country', '')}
          />
        </Badge>
      );
    }
    
    if (filters.dateRange && filters.dateRange !== 'all') {
      const dateRangeLabels = {
        today: 'اليوم',
        week: 'هذا الأسبوع',
        month: 'هذا الشهر',
        custom: 'مخصص'
      };
      
      activeFilters.push(
        <Badge key="dateRange" colorScheme="orange" borderRadius="full" px="2" py="1">
          الفترة: {dateRangeLabels[filters.dateRange] || filters.dateRange}
          <IconButton
            aria-label="إزالة الفلتر"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            ml="1"
            onClick={() => handleFilterChange('dateRange', 'all')}
          />
        </Badge>
      );
    }
    
    if (filters.isUrgent) {
      activeFilters.push(
        <Badge key="isUrgent" colorScheme="red" borderRadius="full" px="2" py="1">
          طلبات عاجلة فقط
          <IconButton
            aria-label="إزالة الفلتر"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            ml="1"
            onClick={() => handleFilterChange('isUrgent', false)}
          />
        </Badge>
      );
    }
    
    return activeFilters;
  };
  
  return (
    <Box mb="4">
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'stretch', md: 'center' }}
        gap="3"
        mb="3"
      >
        <InputGroup maxW={{ base: 'full', md: '300px' }}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="بحث عن طلب..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </InputGroup>
        
        <HStack spacing="3">
          <Menu closeOnSelect={false}>
            <MenuButton
              as={Button}
              rightIcon={<FiChevronDown />}
              leftIcon={<FiFilter />}
              variant="outline"
            >
              الحالة
            </MenuButton>
            <MenuList minWidth="180px">
              <MenuItem
                icon={filters.status === 'all' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('status', 'all')}
              >
                الكل
              </MenuItem>
              <MenuItem
                icon={filters.status === 'pending' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('status', 'pending')}
              >
                قيد المعالجة
              </MenuItem>
              <MenuItem
                icon={filters.status === 'submitted' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('status', 'submitted')}
              >
                تم التقديم
              </MenuItem>
              <MenuItem
                icon={filters.status === 'approved' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('status', 'approved')}
              >
                تمت الموافقة
              </MenuItem>
              <MenuItem
                icon={filters.status === 'rejected' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('status', 'rejected')}
              >
                مرفوض
              </MenuItem>
              <MenuItem
                icon={filters.status === 'completed' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('status', 'completed')}
              >
                مكتمل
              </MenuItem>
              <MenuItem
                icon={filters.status === 'cancelled' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('status', 'cancelled')}
              >
                ملغي
              </MenuItem>
            </MenuList>
          </Menu>
          
          <Menu closeOnSelect={false}>
            <MenuButton
              as={Button}
              rightIcon={<FiChevronDown />}
              leftIcon={<FiFileText />}
              variant="outline"
              display={{ base: 'none', md: 'flex' }}
            >
              نوع التأشيرة
            </MenuButton>
            <MenuList minWidth="180px">
              <MenuItem
                icon={filters.visaType === 'all' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('visaType', 'all')}
              >
                الكل
              </MenuItem>
              {visaTypes.map(type => (
                <MenuItem
                  key={type.value}
                  icon={filters.visaType === type.value ? <FiCheck /> : null}
                  onClick={() => handleFilterChange('visaType', type.value)}
                >
                  {type.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          
          <Menu closeOnSelect={false}>
            <MenuButton
              as={Button}
              rightIcon={<FiChevronDown />}
              leftIcon={<FiCalendar />}
              variant="outline"
            >
              التاريخ
            </MenuButton>
            <MenuList minWidth="180px">
              <MenuItem
                icon={filters.dateRange === 'all' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('dateRange', 'all')}
              >
                الكل
              </MenuItem>
              <MenuItem
                icon={filters.dateRange === 'today' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('dateRange', 'today')}
              >
                اليوم
              </MenuItem>
              <MenuItem
                icon={filters.dateRange === 'week' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('dateRange', 'week')}
              >
                هذا الأسبوع
              </MenuItem>
              <MenuItem
                icon={filters.dateRange === 'month' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('dateRange', 'month')}
              >
                هذا الشهر
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={filters.dateRange === 'custom' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('dateRange', 'custom')}
              >
                مخصص
              </MenuItem>
            </MenuList>
          </Menu>
          
          <Button
            variant="ghost"
            colorScheme="blue"
            onClick={onToggle}
            display={{ base: 'flex', md: 'none' }}
          >
            فلاتر متقدمة
          </Button>
          
          <Menu closeOnSelect={true}>
            <MenuButton
              as={Button}
              rightIcon={<FiChevronDown />}
              leftIcon={<FiMapPin />}
              variant="outline"
              display={{ base: 'none', md: 'flex' }}
            >
              الدولة
            </MenuButton>
            <MenuList maxH="300px" overflowY="auto">
              <MenuItem
                onClick={() => handleFilterChange('country', '')}
              >
                الكل
              </MenuItem>
              {countries.map(country => (
                <MenuItem
                  key={country}
                  icon={filters.country === country ? <FiCheck /> : null}
                  onClick={() => handleFilterChange('country', country)}
                >
                  {country}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          
          <Button
            colorScheme={filters.isUrgent ? 'red' : 'gray'}
            variant={filters.isUrgent ? 'solid' : 'outline'}
            size="md"
            onClick={() => handleFilterChange('isUrgent', !filters.isUrgent)}
            display={{ base: 'none', md: 'flex' }}
          >
            طلبات عاجلة
            {filters.isUrgent && <FiCheck style={{ marginRight: '8px' }} />}
          </Button>
        </HStack>
      </Flex>
      
      {/* الفلاتر المتقدمة للجوال */}
      <Collapse in={isOpen} animateOpacity>
        <Box
          p="3"
          bg="gray.50"
          borderRadius="md"
          mb="3"
          display={{ base: 'block', md: 'none' }}
        >
          <VStack align="stretch" spacing="3">
            <Select
              placeholder="نوع التأشيرة"
              value={filters.visaType || 'all'}
              onChange={(e) => handleFilterChange('visaType', e.target.value)}
            >
              <option value="all">الكل</option>
              {visaTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
            
            <Select
              placeholder="الدولة"
              value={filters.country || ''}
              onChange={(e) => handleFilterChange('country', e.target.value)}
            >
              <option value="">الكل</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </Select>
            
            <Flex align="center">
              <Text flex="1">طلبات عاجلة فقط</Text>
              <Button
                colorScheme={filters.isUrgent ? 'red' : 'gray'}
                variant={filters.isUrgent ? 'solid' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('isUrgent', !filters.isUrgent)}
              >
                {filters.isUrgent ? 'نعم' : 'لا'}
              </Button>
            </Flex>
            
            {filters.dateRange === 'custom' && (
              <Flex gap="3">
                <Box flex="1">
                  <Text fontSize="sm" mb="1">من تاريخ</Text>
                  <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </Box>
                <Box flex="1">
                  <Text fontSize="sm" mb="1">إلى تاريخ</Text>
                  <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </Box>
              </Flex>
            )}
            
            <Flex justify="space-between">
              <Button size="sm" variant="outline" onClick={onResetFilters}>
                إعادة ضبط
              </Button>
              <Button size="sm" colorScheme="blue" onClick={onApplyFilters}>
                تطبيق
              </Button>
            </Flex>
          </VStack>
        </Box>
      </Collapse>
      
      {/* عرض الفلاتر النشطة */}
      {renderActiveFilters().length > 0 && (
        <Flex
          wrap="wrap"
          gap="2"
          mt="3"
          align="center"
        >
          <Text fontSize="sm" fontWeight="medium">
            الفلاتر النشطة:
          </Text>
          {renderActiveFilters()}
          
          <Button
            size="xs"
            variant="link"
            colorScheme="red"
            onClick={onResetFilters}
            mr="2"
          >
            مسح الكل
          </Button>
        </Flex>
      )}
      
      {/* فلاتر التاريخ المخصصة للشاشات الكبيرة */}
      {filters.dateRange === 'custom' && !isMobile && (
        <Flex
          mt="3"
          p="3"
          bg="gray.50"
          borderRadius="md"
          align="center"
          gap="3"
        >
          <Text fontWeight="medium" fontSize="sm">
            نطاق التاريخ:
          </Text>
          <Flex flex="1" gap="3" align="center">
            <Box>
              <Text fontSize="sm" mb="1">من تاريخ</Text>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                size="sm"
              />
            </Box>
            <Box>
              <Text fontSize="sm" mb="1">إلى تاريخ</Text>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                size="sm"
              />
            </Box>
          </Flex>
          <Button size="sm" colorScheme="blue" onClick={onApplyFilters}>
            تطبيق
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export default VisaApplicationFilters;
