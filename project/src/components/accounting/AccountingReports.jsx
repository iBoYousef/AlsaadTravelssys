import React, { useState } from 'react';
import { Box, Button, Flex, Heading, Input, Select, Table, Tbody, Td, Th, Thead, Tr, useToast, Divider } from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';

const REPORT_TYPES = [
  { value: 'general_ledger', label: 'تقرير الحسابات العامة' },
  { value: 'balance_sheet', label: 'تقرير الميزانية العمومية' },
  { value: 'income_statement', label: 'تقرير الأرباح والخسائر' },
  { value: 'account_activity', label: 'تقرير حركة الحساب' },
  { value: 'subsidiary_ledger', label: 'تقرير دفتر الأستاذ المساعد' },
];

export default function AccountingReports() {
  const [reportType, setReportType] = useState('general_ledger');
  const [branch, setBranch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [accountType, setAccountType] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const toast = useToast();
  const { user } = useAuth();

  const handleGenerate = () => {
    // TODO: جلب البيانات من قاعدة البيانات
    // TODO: تسجيل العملية في سجل الأحداث
    toast({ title: 'تم توليد التقرير (نموذج تجريبي)', status: 'info', duration: 3000, isClosable: true });
  };

  const handleExport = (type) => {
    // TODO: تصدير البيانات إلى PDF أو Excel
    toast({ title: `تم تصدير التقرير إلى ${type}`, status: 'success', duration: 3000, isClosable: true });
  };

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="md" maxW="1000px" mx="auto" mt={6}>
      <Heading size="md" mb={4}>التقارير المحاسبية</Heading>
      <Flex gap={4} mb={4} wrap="wrap">
        <Select value={reportType} onChange={e => setReportType(e.target.value)} w="220px">
          {REPORT_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
        </Select>
        <Input placeholder="رقم الفرع" value={branch} onChange={e => setBranch(e.target.value)} w="140px" />
        <Input type="date" placeholder="من" value={fromDate} onChange={e => setFromDate(e.target.value)} w="150px" />
        <Input type="date" placeholder="إلى" value={toDate} onChange={e => setToDate(e.target.value)} w="150px" />
        <Input placeholder="نوع الحساب" value={accountType} onChange={e => setAccountType(e.target.value)} w="140px" />
        <Input placeholder="اسم الموظف" value={employeeName} onChange={e => setEmployeeName(e.target.value)} w="160px" />
      </Flex>
      <Flex gap={3} mb={4}>
        <Button colorScheme="teal" onClick={handleGenerate}>توليد التقرير</Button>
        <Button colorScheme="orange" onClick={() => handleExport('PDF')}>تصدير PDF</Button>
        <Button colorScheme="blue" onClick={() => handleExport('Excel')}>تصدير Excel</Button>
      </Flex>
      <Divider mb={4} />
      {/* جدول عرض النتائج (نموذج تجريبي) */}
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>البيان</Th>
            <Th>الحساب</Th>
            <Th>مدين</Th>
            <Th>دائن</Th>
            <Th>الرصيد</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>نموذج</Td>
            <Td>1001</Td>
            <Td>5000</Td>
            <Td>5000</Td>
            <Td>0</Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
}
