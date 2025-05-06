import React, { useState } from 'react';
import {
  Box,
  Flex,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Button,
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
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Tooltip,
  useBreakpointValue
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiChevronDown,
  FiX,
  FiCheck
} from 'react-icons/fi';
import { formatAmount } from '../../utils/validationUtils';

/**
 * مكون فلاتر البرامج السياحية
 * يتيح البحث وتصفية البرامج السياحية حسب معايير مختلفة
 */
const TourPackageFilters = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onResetFilters,
  onApplyFilters,
  destinations = [],
  durations = [],
  minPrice = 0,
  maxPrice = 10000
}) => {
  const { isOpen, onToggle } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // حالة تلميحات السعر
  const [showMinTooltip, setShowMinTooltip] = useState(false);
  const [showMaxTooltip, setShowMaxTooltip] = useState(false);
  
  // تحديث مصطلح البحث
  const handleSearchChange = (e) => {
    onSearchChange(e.target.value);
  };
  
  // تحديث الفلاتر
  const handleFilterChange = (name, value) => {
    onFilterChange(name, value);
  };
  
  // تحديث نطاق السعر
  const handlePriceRangeChange = (values) => {
    onFilterChange('priceRange', values);
  };
  
  // عرض الفلاتر النشطة كشارات
  const renderActiveFilters = () => {
    const activeFilters = [];
    
    if (filters.destination && filters.destination !== 'all') {
      activeFilters.push(
        <Badge key="destination" colorScheme="blue" borderRadius="full" px="2" py="1">
          الوجهة: {filters.destination}
          <IconButton
            aria-label="إزالة الفلتر"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            mr="1"
            onClick={() => handleFilterChange('destination', 'all')}
          />
        </Badge>
      );
    }
    
    if (filters.duration && filters.duration !== 'all') {
      activeFilters.push(
        <Badge key="duration" colorScheme="purple" borderRadius="full" px="2" py="1">
          المدة: {filters.duration}
          <IconButton
            aria-label="إزالة الفلتر"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            mr="1"
            onClick={() => handleFilterChange('duration', 'all')}
          />
        </Badge>
      );
    }
    
    if (filters.priceRange && (filters.priceRange[0] > minPrice || filters.priceRange[1] < maxPrice)) {
      activeFilters.push(
        <Badge key="price" colorScheme="green" borderRadius="full" px="2" py="1">
          السعر: {formatAmount(filters.priceRange[0])} - {formatAmount(filters.priceRange[1])}
          <IconButton
            aria-label="إزالة الفلتر"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            mr="1"
            onClick={() => handleFilterChange('priceRange', [minPrice, maxPrice])}
          />
        </Badge>
      );
    }
    
    if (filters.status && filters.status !== 'all') {
      const statusLabels = {
        active: 'نشط',
        inactive: 'غير نشط'
      };
      
      activeFilters.push(
        <Badge key="status" colorScheme="orange" borderRadius="full" px="2" py="1">
          الحالة: {statusLabels[filters.status] || filters.status}
          <IconButton
            aria-label="إزالة الفلتر"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            mr="1"
            onClick={() => handleFilterChange('status', 'all')}
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
            placeholder="بحث عن برنامج سياحي..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </InputGroup>
        
        <HStack spacing="3">
          <Menu closeOnSelect={false}>
            <MenuButton
              as={Button}
              rightIcon={<FiChevronDown />}
              leftIcon={<FiMapPin />}
              variant="outline"
            >
              الوجهة
            </MenuButton>
            <MenuList minWidth="180px" maxH="300px" overflowY="auto">
              <MenuItem
                icon={filters.destination === 'all' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('destination', 'all')}
              >
                الكل
              </MenuItem>
              <MenuDivider />
              {destinations.map(destination => (
                <MenuItem
                  key={destination}
                  icon={filters.destination === destination ? <FiCheck /> : null}
                  onClick={() => handleFilterChange('destination', destination)}
                >
                  {destination}
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
              display={{ base: 'none', md: 'flex' }}
            >
              المدة
            </MenuButton>
            <MenuList minWidth="180px">
              <MenuItem
                icon={filters.duration === 'all' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('duration', 'all')}
              >
                الكل
              </MenuItem>
              <MenuDivider />
              {durations.map(duration => (
                <MenuItem
                  key={duration}
                  icon={filters.duration === duration ? <FiCheck /> : null}
                  onClick={() => handleFilterChange('duration', duration)}
                >
                  {duration}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          
          <Menu closeOnSelect={true}>
            <MenuButton
              as={Button}
              rightIcon={<FiChevronDown />}
              leftIcon={<FiDollarSign />}
              variant="outline"
              display={{ base: 'none', md: 'flex' }}
            >
              السعر
            </MenuButton>
            <MenuList p="4" minWidth="250px">
              <Text mb="2" fontWeight="medium">
                نطاق السعر:
              </Text>
              <Flex justify="space-between" mb="2">
                <Text>{formatAmount(filters.priceRange?.[0] || minPrice)}</Text>
                <Text>{formatAmount(filters.priceRange?.[1] || maxPrice)}</Text>
              </Flex>
              <RangeSlider
                min={minPrice}
                max={maxPrice}
                step={100}
                defaultValue={[
                  filters.priceRange?.[0] || minPrice,
                  filters.priceRange?.[1] || maxPrice
                ]}
                onChange={handlePriceRangeChange}
                onMouseEnter={() => {
                  setShowMinTooltip(true);
                  setShowMaxTooltip(true);
                }}
                onMouseLeave={() => {
                  setShowMinTooltip(false);
                  setShowMaxTooltip(false);
                }}
              >
                <RangeSliderTrack>
                  <RangeSliderFilledTrack />
                </RangeSliderTrack>
                <Tooltip
                  hasArrow
                  placement="top"
                  isOpen={showMinTooltip}
                  label={formatAmount(filters.priceRange?.[0] || minPrice)}
                >
                  <RangeSliderThumb index={0} />
                </Tooltip>
                <Tooltip
                  hasArrow
                  placement="top"
                  isOpen={showMaxTooltip}
                  label={formatAmount(filters.priceRange?.[1] || maxPrice)}
                >
                  <RangeSliderThumb index={1} />
                </Tooltip>
              </RangeSlider>
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
                icon={filters.status === 'active' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('status', 'active')}
              >
                نشط
              </MenuItem>
              <MenuItem
                icon={filters.status === 'inactive' ? <FiCheck /> : null}
                onClick={() => handleFilterChange('status', 'inactive')}
              >
                غير نشط
              </MenuItem>
            </MenuList>
          </Menu>
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
            <Box>
              <Text mb="1" fontWeight="medium">
                المدة:
              </Text>
              <Select
                value={filters.duration || 'all'}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
              >
                <option value="all">الكل</option>
                {durations.map(duration => (
                  <option key={duration} value={duration}>{duration}</option>
                ))}
              </Select>
            </Box>
            
            <Box>
              <Text mb="1" fontWeight="medium">
                نطاق السعر:
              </Text>
              <Flex justify="space-between" mb="2">
                <Text>{formatAmount(filters.priceRange?.[0] || minPrice)}</Text>
                <Text>{formatAmount(filters.priceRange?.[1] || maxPrice)}</Text>
              </Flex>
              <RangeSlider
                min={minPrice}
                max={maxPrice}
                step={100}
                defaultValue={[
                  filters.priceRange?.[0] || minPrice,
                  filters.priceRange?.[1] || maxPrice
                ]}
                onChange={handlePriceRangeChange}
              >
                <RangeSliderTrack>
                  <RangeSliderFilledTrack />
                </RangeSliderTrack>
                <RangeSliderThumb index={0} />
                <RangeSliderThumb index={1} />
              </RangeSlider>
            </Box>
            
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
    </Box>
  );
};

export default TourPackageFilters;
