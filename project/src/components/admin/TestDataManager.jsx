import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Spinner,
  HStack,
  Switch,
  FormControl,
} from '@chakra-ui/react';

const TestDataManager = () => (
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

export default TestDataManager;
