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
  FiMapPin
} from 'react-icons/fi';

/**
 * مكون فلاتر حجوزات الفنادق
 * يتيح البحث وتصفية حجوزات الفنادق حسب معايير مختلفة
 */
const HotelBookingFilters = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onResetFilters,
  onApplyFilters,
  cities = []
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
        pending: 'معلق',
        confirmed: 'مؤكد',
        cancelled: 'ملغي',
        completed: 'مكتمل'
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
    
    if (filters.dateRange && filters.dateRange !== 'all') {
      const dateRangeLabels = {
        upcoming: 'القادمة',
        today: 'اليوم',
        week: 'هذا الأسبوع',
        month: 'هذا الشهر',
        custom: 'مخصص'
      };
      
      activeFilters.push(
        <Badge key="dateRange" colorScheme="green" borderRadius="full" px="2" py="1">
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
    
    if (filters.city) {
      activeFilters.push(
        <Badge key="city" colorScheme="purple" borderRadius="full" px="2" py="1">
          المدينة: {filters.city}
          <IconButton
            aria-label="إزالة الفلتر"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            ml="1"
            onClick={() => handleFilterChange('city', '')}
          />
        </Badge>
      );
    }
    
    if (filters.roomType && filters.roomType !== 'all') {
      const roomTypeLabels = {
        standard: 'قياسية',
        deluxe: 'ديلوكس',
        suite: 'جناح',
        family: 'عائلية'
      };
      
      activeFilters.push(
        <Badge key="roomType" colorScheme="orange" borderRadius="full" px="2" py="1">
          نوع الغرفة: {roomTypeLabels[filters.roomType] || filters.roomType}
          <IconButton
            aria-label="إزالة الفلتر"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            ml="1"
            onClick={() => handleFilterChange('roomType', 'all')}
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
            placeholder="بحث عن حجز..."
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
                معلق
              </MenuItem>
              <MenuItem
                icon={filters.status === 'confirmed' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('status', 'confirmed')}
              >
                مؤكد
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
                icon={filters.dateRange === 'upcoming' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('dateRange', 'upcoming')}
              >
                الحجوزات القادمة
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
              المدينة
            </MenuButton>
            <MenuList maxH="300px" overflowY="auto">
              <MenuItem
                onClick={() => handleFilterChange('city', '')}
              >
                الكل
              </MenuItem>
              {cities.map(city => (
                <MenuItem
                  key={city}
                  icon={filters.city === city ? <FiCheck /> : null}
                  onClick={() => handleFilterChange('city', city)}
                >
                  {city}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          
          <Select
            placeholder="نوع الغرفة"
            value={filters.roomType || 'all'}
            onChange={(e) => handleFilterChange('roomType', e.target.value)}
            w={{ base: 'full', md: '180px' }}
            display={{ base: 'none', md: 'block' }}
          >
            <option value="all">الكل</option>
            <option value="standard">غرفة قياسية</option>
            <option value="deluxe">غرفة ديلوكس</option>
            <option value="suite">جناح</option>
            <option value="family">غرفة عائلية</option>
          </Select>
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
              placeholder="المدينة"
              value={filters.city || ''}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            >
              <option value="">الكل</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </Select>
            
            <Select
              placeholder="نوع الغرفة"
              value={filters.roomType || 'all'}
              onChange={(e) => handleFilterChange('roomType', e.target.value)}
            >
              <option value="all">الكل</option>
              <option value="standard">غرفة قياسية</option>
              <option value="deluxe">غرفة ديلوكس</option>
              <option value="suite">جناح</option>
              <option value="family">غرفة عائلية</option>
            </Select>
            
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

export default HotelBookingFilters;
