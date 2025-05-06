import React, { useEffect } from 'react';
import { Box, Container, Divider, Heading, Text } from '@chakra-ui/react';
import PageHeader from '../shared/PageHeader';
import SystemChecker from './SystemChecker';
import DatabaseIntegrityChecker from './DatabaseIntegrityChecker';
import { useActionLogger } from '../../hooks/useActionLogger';

const SystemCheckerPage = () => {
  const { logPageView, ACTION_CATEGORIES } = useActionLogger();
  
  useEffect(() => {
    logPageView('صفحة فحص النظام', ACTION_CATEGORIES.SYSTEM);
  }, [logPageView]);

  return (
    <Box>
      <PageHeader title="فحص النظام" />
      <Container maxW="container.xl" py={5}>
        <Box mb={8}>
          <Heading size="md" mb={3}>فحص صلاحيات الوصول</Heading>
          <Text mb={4}>تحقق من صلاحيات الوصول إلى أقسام النظام المختلفة</Text>
          <SystemChecker />
        </Box>
        
        <Divider my={8} />
        
        <Box>
          <DatabaseIntegrityChecker />
        </Box>
      </Container>
    </Box>
  );
};

export default SystemCheckerPage;
