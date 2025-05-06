import React, { useState } from 'react';
import {
  Box,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  HStack,
  VStack,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Collapse,
  useDisclosure,
  IconButton
} from '@chakra-ui/react';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiCalendar } from 'react-icons/fi';

/**
 * مكون فلترة حجوزات البرامج السياحية
 */
const TourBookingFilters = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onResetFilters,
  onApplyFilters,
  destinations,
  packages,
  customers
}) => {
  const { isOpen, onToggle } = useDisclosure();
  
  // تحديث مصطلح البحث
  const handleSearchChange = (e) => {
    onSearchChange(e.target.value);
  };
  
  // تحديث فلتر معين
  const handleFilterChange = (name, value) => {
    onFilterChange(name, value);
  };
  
  return (
    <Box mb="6" bg="white" p="4" borderRadius="md" boxShadow="sm">
      <Flex justify="space-between" mb={isOpen ? "4" : "0"}>
        <InputGroup maxW={{ base: "100%", md: "400px" }}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="بحث عن رقم الحجز، اسم العميل، البرنامج..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </InputGroup>
        
        <HStack>
          <Button
            leftIcon={<FiFilter />}
            rightIcon={isOpen ? <FiChevronUp /> : <FiChevronDown />}
            variant="outline"
            onClick={onToggle}
          >
            فلترة متقدمة
          </Button>
          
          <Button
            colorScheme="blue"
            onClick={onApplyFilters}
          >
            تطبيق
          </Button>
        </HStack>
      </Flex>
      
      <Collapse in={isOpen} animateOpacity>
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
          gap="4"
          mt="4"
        >
          <GridItem>
            <FormControl>
              <FormLabel>حالة الحجز</FormLabel>
              <Select
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="confirmed">مؤكد</option>
                <option value="cancelled">ملغي</option>
                <option value="completed">مكتمل</option>
              </Select>
            </FormControl>
          </GridItem>
          
          <GridItem>
            <FormControl>
              <FormLabel>الوجهة</FormLabel>
              <Select
                value={filters.destination || 'all'}
                onChange={(e) => handleFilterChange('destination', e.target.value)}
              >
                <option value="all">جميع الوجهات</option>
                {destinations && destinations.map((destination) => (
                  <option key={destination} value={destination}>
                    {destination}
                  </option>
                ))}
              </Select>
            </FormControl>
          </GridItem>
          
          <GridItem>
            <FormControl>
              <FormLabel>البرنامج السياحي</FormLabel>
              <Select
                value={filters.packageId || 'all'}
                onChange={(e) => handleFilterChange('packageId', e.target.value)}
              >
                <option value="all">جميع البرامج</option>
                {packages && packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </GridItem>
          
          <GridItem>
            <FormControl>
              <FormLabel>العميل</FormLabel>
              <Select
                value={filters.customerId || 'all'}
                onChange={(e) => handleFilterChange('customerId', e.target.value)}
              >
                <option value="all">جميع العملاء</option>
                {customers && customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </GridItem>
          
          <GridItem>
            <FormControl>
              <FormLabel>من تاريخ</FormLabel>
              <Input
                type="date"
                value={filters.fromDate || ''}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
              />
            </FormControl>
          </GridItem>
          
          <GridItem>
            <FormControl>
              <FormLabel>إلى تاريخ</FormLabel>
              <Input
                type="date"
                value={filters.toDate || ''}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
              />
            </FormControl>
          </GridItem>
        </Grid>
        
        <Flex justify="flex-end" mt="4">
          <Button variant="outline" mr="2" onClick={onResetFilters}>
            إعادة ضبط
          </Button>
        </Flex>
      </Collapse>
    </Box>
  );
};

export default TourBookingFilters;
