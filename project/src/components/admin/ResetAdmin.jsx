import React, { useState } from 'react';
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import firebaseServices from '../../firebase';

const ResetAdmin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleCreateAdmin = async () => {
    setIsLoading(true);
    try {
      const result = await firebaseServices.createNewAdmin();
      if (result.success) {
        toast({
          title: 'تم بنجاح',
          description: result.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg" textAlign="center">إنشاء حساب مشرف جديد</Heading>
        
        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle mb={1}>معلومات</AlertTitle>
            <AlertDescription>
              هذه الصفحة تتيح لك إنشاء حساب مشرف جديد للنظام. 
              لن يتم المساس بأي حسابات موجودة مسبقاً.
            </AlertDescription>
          </Box>
        </Alert>

        <Box bg="white" p={6} rounded="md" shadow="sm">
          <VStack spacing={4} align="stretch">
            <Text>
              سيتم إنشاء حساب مشرف جديد بالبيانات التالية:
              <ul style={{ paddingRight: '20px', marginTop: '10px' }}>
                <li>البريد الإلكتروني: admin@test.com</li>
                <li>كلمة المرور: 123456</li>
              </ul>
            </Text>
            
            <Button
              colorScheme="blue"
              onClick={onOpen}
              isLoading={isLoading}
            >
              إنشاء حساب مشرف جديد
            </Button>
          </VStack>
        </Box>
      </VStack>

      {/* نافذة تأكيد العملية */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>تأكيد إنشاء حساب مشرف جديد</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            هل أنت متأكد من أنك تريد إنشاء حساب مشرف جديد بالبيانات المحددة؟
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleCreateAdmin}
              isLoading={isLoading}
              loadingText="جاري إنشاء الحساب..."
            >
              تأكيد الإنشاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ResetAdmin;
