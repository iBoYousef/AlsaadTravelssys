import React, { useState } from 'react';
import { Box, Button, Flex, Heading, Input, Select, Table, Tbody, Td, Th, Thead, Tr, Textarea, useToast, Divider } from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';

const emptyEntry = { debitAccount: '', creditAccount: '', amount: '', description: '' };

export default function JournalEntries() {
  const [journalNumber, setJournalNumber] = useState('');
  const [date, setDate] = useState('');
  const [branch, setBranch] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [rows, setRows] = useState([{ ...emptyEntry }]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { user } = useAuth();

  // تحقق من توازن القيد
  const isBalanced = () => {
    let debit = 0, credit = 0;
    rows.forEach(r => {
      debit += Number(r.amount) || 0;
      credit += Number(r.amount) || 0;
    });
    // في هذا النموذج البسيط، المبلغ المدين = الدائن لكل سطر. يمكن تطويره لاحقًا لدعم حسابات متعددة.
    return debit === credit && debit > 0;
  };

  const handleRowChange = (idx, field, value) => {
    const updated = rows.map((row, i) => i === idx ? { ...row, [field]: value } : row);
    setRows(updated);
  };

  const addRow = () => setRows([...rows, { ...emptyEntry }]);
  const removeRow = idx => setRows(rows.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!isBalanced()) {
      toast({ title: 'القيد غير متوازن', status: 'error', duration: 4000, isClosable: true });
      return;
    }
    setSaving(true);
    // TODO: حفظ القيد في قاعدة البيانات
    // TODO: تسجيل العملية في سجل الأحداث
    setSaving(false);
    toast({ title: 'تم حفظ القيد بنجاح', status: 'success', duration: 3000, isClosable: true });
  };

  const handleCancel = () => {
    setJournalNumber('');
    setDate('');
    setBranch('');
    setEmployeeName('');
    setRows([{ ...emptyEntry }]);
  };

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="md" maxW="900px" mx="auto" mt={6}>
      <Heading size="md" mb={4}>إدخال قيد يومي جديد</Heading>
      <Flex gap={4} mb={4} wrap="wrap">
        <Input placeholder="رقم القيد" value={journalNumber} onChange={e => setJournalNumber(e.target.value)} w="180px" />
        <Input type="date" placeholder="التاريخ" value={date} onChange={e => setDate(e.target.value)} w="180px" />
        <Input placeholder="رقم الفرع" value={branch} onChange={e => setBranch(e.target.value)} w="180px" />
        <Input placeholder="اسم الموظف" value={employeeName} onChange={e => setEmployeeName(e.target.value)} w="180px" />
      </Flex>
      <Divider mb={4} />
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>الحساب المدين</Th>
            <Th>الحساب الدائن</Th>
            <Th>المبلغ</Th>
            <Th>الوصف</Th>
            <Th>إجراء</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row, idx) => (
            <Tr key={idx}>
              <Td><Input value={row.debitAccount} onChange={e => handleRowChange(idx, 'debitAccount', e.target.value)} /></Td>
              <Td><Input value={row.creditAccount} onChange={e => handleRowChange(idx, 'creditAccount', e.target.value)} /></Td>
              <Td><Input type="number" value={row.amount} onChange={e => handleRowChange(idx, 'amount', e.target.value)} /></Td>
              <Td><Textarea value={row.description} onChange={e => handleRowChange(idx, 'description', e.target.value)} size="sm" /></Td>
              <Td>
                <Button size="sm" colorScheme="red" onClick={() => removeRow(idx)} disabled={rows.length === 1}>حذف</Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Button mt={3} colorScheme="blue" onClick={addRow}>إضافة سطر جديد</Button>
      <Flex gap={3} mt={6} justify="flex-end">
        <Button colorScheme="teal" onClick={handleSave} isLoading={saving}>حفظ القيد</Button>
        <Button colorScheme="gray" onClick={handleCancel}>إلغاء</Button>
        <Button colorScheme="orange" onClick={() => window.print()}>طباعة القيد</Button>
      </Flex>
    </Box>
  );
}
