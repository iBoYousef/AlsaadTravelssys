import React from 'react';
import { Box, Heading, Alert, AlertIcon, AlertTitle, AlertDescription, Container } from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';

const DataSeedPage = () => {
  const { user } = useAuth();
  const isAdmin = user && (user.isAdmin || user.role === 'admin' || user.jobTitle === 'مسؤول النظام' || (user.permissions && (user.permissions.includes('all') || user.permissions.includes('admin'))));

  if (!isAdmin) {
    return (
      <Container maxW="container.md" py={6}>
        <Box p={5} textAlign="center">
          <Alert status="warning" variant="left-accent">
            <AlertIcon />
            <AlertTitle>غير مصرح!</AlertTitle>
            <AlertDescription>هذه الصفحة متاحة فقط لمسؤول النظام.</AlertDescription>
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={6}>
      <Box mb={6}>
        <Heading size="lg" mb={2}>إدارة البيانات التجريبية</Heading>
        <Alert status="info" variant="left-accent" mb={4}>
          <AlertIcon />
          <Box>
            <AlertTitle>ميزة غير متوفرة</AlertTitle>
            <AlertDescription>ميزة البيانات التجريبية غير متوفرة في هذا الإصدار من النظام.</AlertDescription>
          </Box>
        </Alert>
      </Box>
    </Container>
  );
};

export default DataSeedPage;
