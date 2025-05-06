import React, { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Card,
  CardBody,
  useToast
} from '@chakra-ui/react';
import { FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiInfo, FiXCircle, FiDatabase } from 'react-icons/fi';
import { checkDatabaseRelations, checkDataIntegrity } from '../../utils/systemChecker';

/**
 * مكون فحص ترابط الجداول وسلامة البيانات
 * يستخدم وظائف من ملف systemChecker.js
 */
const DatabaseIntegrityChecker = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [relationsResults, setRelationsResults] = useState(null);
  const [integrityResults, setIntegrityResults] = useState(null);
  const [activeTab, setActiveTab] = useState('relations');

  // فحص الترابط بين الجداول
  const handleCheckRelations = async () => {
    setLoading(true);
    setActiveTab('relations');
    try {
      const results = await checkDatabaseRelations();
      setRelationsResults(results);
      
      if (results.success) {
        toast({
          title: 'تم الفحص بنجاح',
          description: 'لم يتم العثور على مشاكل في ترابط الجداول',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'تم العثور على مشاكل',
          description: `تم العثور على ${results.issues.length} مشكلة في ترابط الجداول`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('خطأ في فحص ترابط الجداول:', error);
      toast({
        title: 'خطأ في الفحص',
        description: error.message || 'حدث خطأ أثناء فحص ترابط الجداول',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // فحص سلامة البيانات
  const handleCheckIntegrity = async () => {
    setLoading(true);
    setActiveTab('integrity');
    try {
      const results = await checkDataIntegrity();
      setIntegrityResults(results);
      
      if (results.success) {
        toast({
          title: 'تم الفحص بنجاح',
          description: 'لم يتم العثور على مشاكل في سلامة البيانات',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'تم العثور على مشاكل',
          description: `تم العثور على ${results.issues.length} مشكلة في سلامة البيانات`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('خطأ في فحص سلامة البيانات:', error);
      toast({
        title: 'خطأ في الفحص',
        description: error.message || 'حدث خطأ أثناء فحص سلامة البيانات',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // الحصول على أيقونة حسب مستوى الخطورة
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <FiXCircle color="red.500" />;
      case 'warning':
        return <FiAlertTriangle color="orange.500" />;
      case 'info':
        return <FiInfo color="blue.500" />;
      default:
        return <FiInfo color="gray.500" />;
    }
  };

  // الحصول على لون حسب مستوى الخطورة
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'red';
      case 'warning':
        return 'orange';
      case 'info':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <Box>
      <Heading size="md" mb={4}>فحص ترابط الجداول وسلامة البيانات</Heading>
      <Text mb={6}>
        يمكنك من خلال هذا القسم فحص ترابط الجداول وسلامة البيانات في قاعدة البيانات
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>فحص ترابط الجداول</StatLabel>
              <StatNumber>
                {relationsResults ? (
                  relationsResults.issues.length === 0 ? (
                    <Flex align="center" color="green.500">
                      <FiCheckCircle />
                      <Text ml={2}>لا توجد مشاكل</Text>
                    </Flex>
                  ) : (
                    <Flex align="center" color="orange.500">
                      <FiAlertTriangle />
                      <Text ml={2}>{relationsResults.issues.length} مشكلة</Text>
                    </Flex>
                  )
                ) : (
                  <Text color="gray.500">لم يتم الفحص بعد</Text>
                )}
              </StatNumber>
              <StatHelpText>
                يفحص الترابط بين الجداول المختلفة في قاعدة البيانات
              </StatHelpText>
              <Button
                leftIcon={<FiRefreshCw />}
                colorScheme="blue"
                variant="outline"
                size="sm"
                onClick={handleCheckRelations}
                isLoading={loading && activeTab === 'relations'}
                loadingText="جاري الفحص..."
                mt={2}
                isFullWidth
              >
                فحص الترابط
              </Button>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>فحص سلامة البيانات</StatLabel>
              <StatNumber>
                {integrityResults ? (
                  integrityResults.issues.length === 0 ? (
                    <Flex align="center" color="green.500">
                      <FiCheckCircle />
                      <Text ml={2}>لا توجد مشاكل</Text>
                    </Flex>
                  ) : (
                    <Flex align="center" color="orange.500">
                      <FiAlertTriangle />
                      <Text ml={2}>{integrityResults.issues.length} مشكلة</Text>
                    </Flex>
                  )
                ) : (
                  <Text color="gray.500">لم يتم الفحص بعد</Text>
                )}
              </StatNumber>
              <StatHelpText>
                يفحص سلامة البيانات وصحتها في قاعدة البيانات
              </StatHelpText>
              <Button
                leftIcon={<FiDatabase />}
                colorScheme="teal"
                variant="outline"
                size="sm"
                onClick={handleCheckIntegrity}
                isLoading={loading && activeTab === 'integrity'}
                loadingText="جاري الفحص..."
                mt={2}
                isFullWidth
              >
                فحص سلامة البيانات
              </Button>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* عرض نتائج فحص الترابط بين الجداول */}
      {relationsResults && (
        <Box mb={8}>
          <Heading size="md" mb={4}>
            نتائج فحص ترابط الجداول
          </Heading>
          
          {relationsResults.issues.length === 0 ? (
            <Alert status="success" variant="subtle" borderRadius="md">
              <AlertIcon />
              <AlertTitle>لا توجد مشاكل!</AlertTitle>
              <AlertDescription>
                لم يتم العثور على أي مشاكل في ترابط الجداول
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert status="warning" variant="subtle" borderRadius="md" mb={4}>
                <AlertIcon />
                <AlertTitle>تم العثور على مشاكل!</AlertTitle>
                <AlertDescription>
                  تم العثور على {relationsResults.issues.length} مشكلة في ترابط الجداول
                </AlertDescription>
              </Alert>
              
              <Table variant="simple" size="sm" mb={4}>
                <Thead>
                  <Tr>
                    <Th width="10%">الخطورة</Th>
                    <Th width="30%">المشكلة</Th>
                    <Th width="60%">التفاصيل</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {relationsResults.issues.map((issue, index) => (
                    <Tr key={index}>
                      <Td>
                        <Badge colorScheme={getSeverityColor(issue.severity)}>
                          {issue.severity === 'error' ? 'خطأ' : issue.severity === 'warning' ? 'تحذير' : 'معلومات'}
                        </Badge>
                      </Td>
                      <Td>{issue.message}</Td>
                      <Td>{issue.details}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              <Accordion allowToggle>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="right">
                        إحصائيات الفحص
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
                      {Object.entries(relationsResults.stats).map(([key, value]) => (
                        <Box key={key} p={3} borderWidth="1px" borderRadius="md">
                          <Text fontWeight="bold" mb={2}>{key}</Text>
                          <Text>إجمالي: {value.totalInvoices || value.totalBookings || value.totalReceipts || 0}</Text>
                          <Text>علاقات صحيحة: {value.validRelations || 0}</Text>
                          <Text>علاقات معطوبة: {value.brokenRelations || 0}</Text>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </>
          )}
        </Box>
      )}

      {/* عرض نتائج فحص سلامة البيانات */}
      {integrityResults && (
        <Box>
          <Heading size="md" mb={4}>
            نتائج فحص سلامة البيانات
          </Heading>
          
          {integrityResults.issues.length === 0 ? (
            <Alert status="success" variant="subtle" borderRadius="md">
              <AlertIcon />
              <AlertTitle>لا توجد مشاكل!</AlertTitle>
              <AlertDescription>
                لم يتم العثور على أي مشاكل في سلامة البيانات
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert status="warning" variant="subtle" borderRadius="md" mb={4}>
                <AlertIcon />
                <AlertTitle>تم العثور على مشاكل!</AlertTitle>
                <AlertDescription>
                  تم العثور على {integrityResults.issues.length} مشكلة في سلامة البيانات
                </AlertDescription>
              </Alert>
              
              <Table variant="simple" size="sm" mb={4}>
                <Thead>
                  <Tr>
                    <Th width="10%">الخطورة</Th>
                    <Th width="30%">المشكلة</Th>
                    <Th width="60%">التفاصيل</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {integrityResults.issues.map((issue, index) => (
                    <Tr key={index}>
                      <Td>
                        <Badge colorScheme={getSeverityColor(issue.severity)}>
                          {issue.severity === 'error' ? 'خطأ' : issue.severity === 'warning' ? 'تحذير' : 'معلومات'}
                        </Badge>
                      </Td>
                      <Td>{issue.message}</Td>
                      <Td>{issue.details}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              <Accordion allowToggle>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="right">
                        إحصائيات الفحص
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
                      {Object.entries(integrityResults.stats).map(([key, value]) => (
                        <Box key={key} p={3} borderWidth="1px" borderRadius="md">
                          <Text fontWeight="bold" mb={2}>{key}</Text>
                          <Text>إجمالي: {value.totalCustomers || value.totalInvoices || value.totalPackages || 0}</Text>
                          <Text>بيانات صحيحة: {value.validCustomers || value.validInvoices || value.validPackages || 0}</Text>
                          <Text>بيانات غير صحيحة: {value.invalidCustomers || value.invalidInvoices || value.invalidPackages || 0}</Text>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DatabaseIntegrityChecker;
