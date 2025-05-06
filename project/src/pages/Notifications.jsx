import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Stack,
  Badge,
  Button,
  IconButton,
  useToast,
  Divider,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Avatar,
  Spinner,
  Center,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue
} from '@chakra-ui/react';
import { FiBell, FiCheck, FiTrash2, FiMoreVertical, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import firebaseServices from '../firebase';
import BackButton from '../components/shared/BackButton';

const { db } = firebaseServices;

/**
 * صفحة الإشعارات
 * تعرض قائمة الإشعارات والتنبيهات للمستخدم
 */
const Notifications = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // جلب الإشعارات
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    // استخدام onSnapshot للاستماع للتغييرات في الوقت الفعلي
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      setNotifications(notificationsList);
      setLoading(false);
      
      // إظهار رسالة توست عند استلام إشعارات جديدة
      const newNotifications = notificationsList.filter(n => !n.read);
      if (newNotifications.length > 0) {
        toast({
          title: `لديك ${newNotifications.length} إشعار جديد`,
          status: 'info',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
      }
    }, (error) => {
      console.error('خطأ في جلب الإشعارات:', error);
      toast({
        title: 'خطأ في جلب الإشعارات',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, toast]);
  
  // تحديث حالة الإشعار (مقروء/غير مقروء)
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
      
      toast({
        title: 'تم تحديث الإشعار',
        description: 'تم تحديث حالة الإشعار بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('خطأ في تحديث الإشعار:', error);
      toast({
        title: 'خطأ في تحديث الإشعار',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // حذف إشعار
  const deleteNotification = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
      
      toast({
        title: 'تم حذف الإشعار',
        description: 'تم حذف الإشعار بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('خطأ في حذف الإشعار:', error);
      toast({
        title: 'خطأ في حذف الإشعار',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // تحديث حالة جميع الإشعارات كمقروءة
  const markAllAsRead = async () => {
    if (notifications.filter(n => !n.read).length === 0) {
      toast({
        title: 'لا توجد إشعارات غير مقروءة',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(n => !n.read);
      
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      });
      
      await batch.commit();
      
      toast({
        title: 'تم تحديث الإشعارات',
        description: `تم تحديد ${unreadNotifications.length} إشعار كمقروء`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('خطأ في تحديث الإشعارات:', error);
      toast({
        title: 'خطأ في تحديث الإشعارات',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // تنسيق التاريخ
  const formatDate = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = now - date;
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `منذ ${diffMinutes} دقيقة`;
    } else if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`;
    } else if (diffDays < 30) {
      return `منذ ${diffDays} يوم`;
    } else {
      return date.toLocaleDateString('ar-SA');
    }
  };
  
  // تصفية الإشعارات حسب التبويب النشط
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 0) return true; // كل الإشعارات
    if (activeTab === 1) return !notification.read; // غير المقروءة
    if (activeTab === 2) return notification.read; // المقروءة
    return true;
  });
  
  // عدد الإشعارات غير المقروءة
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  return (
    <Box p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Box>
          <BackButton />
          <Heading size="lg">الإشعارات</Heading>
        </Box>
        <HStack>
          <Button
            leftIcon={<FiRefreshCw />}
            colorScheme="blue"
            variant="outline"
            onClick={() => setLoading(true)}
            isLoading={loading}
          >
            تحديث
          </Button>
          <Button
            leftIcon={<FiCheck />}
            colorScheme="blue"
            variant="outline"
            onClick={markAllAsRead}
          >
            تحديد الكل كمقروء
          </Button>
        </HStack>
      </Flex>
      
      <Tabs colorScheme="blue" onChange={(index) => setActiveTab(index)} mb={4}>
        <TabList>
          <Tab>الكل</Tab>
          <Tab>غير المقروءة {unreadCount > 0 && `(${unreadCount})`}</Tab>
          <Tab>المقروءة</Tab>
        </TabList>
        
        <TabPanels>
          {[0, 1, 2].map((tabIndex) => (
            <TabPanel key={tabIndex} p={0} pt={4}>
              {loading ? (
                <Center h="200px">
                  <Spinner size="xl" color="blue.500" />
                </Center>
              ) : filteredNotifications.length === 0 ? (
                <Center h="200px" flexDirection="column">
                  <Box fontSize="5xl" mb={4}>
                    <FiBell />
                  </Box>
                  <Text fontSize="lg">لا توجد إشعارات</Text>
                </Center>
              ) : (
                <Stack spacing={4}>
                  {filteredNotifications.map((notification) => (
                    <Card 
                      key={notification.id} 
                      borderWidth="1px" 
                      borderColor={notification.read ? borderColor : 'blue.500'} 
                      bg={cardBg}
                      boxShadow="sm"
                      borderRadius="md"
                      position="relative"
                      overflow="hidden"
                    >
                      {!notification.read && (
                        <Box 
                          position="absolute" 
                          left={0} 
                          top={0} 
                          bottom={0} 
                          width="4px" 
                          bg="blue.500" 
                        />
                      )}
                      
                      <CardBody p={4}>
                        <Flex justifyContent="space-between">
                          <HStack spacing={4} flex={1}>
                            <Avatar 
                              size="md" 
                              name={notification.title} 
                              bg={notification.type === 'info' ? 'blue.500' : 
                                 notification.type === 'warning' ? 'orange.500' : 
                                 notification.type === 'error' ? 'red.500' : 
                                 notification.type === 'success' ? 'green.500' : 
                                 notification.read ? 'gray.400' : 'blue.500'} 
                              color="white"
                              icon={<FiBell size={16} />}
                            />
                            
                            <Box flex={1}>
                              <Flex justifyContent="space-between" alignItems="center">
                                <Heading size="sm">{notification.title}</Heading>
                                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                                  {formatDate(notification.createdAt)}
                                </Text>
                              </Flex>
                              
                              <Text mt={2} fontSize="md">{notification.message}</Text>
                              
                              {notification.type && (
                                <Badge 
                                  mt={2} 
                                  colorScheme={
                                    notification.type === 'info' ? 'blue' : 
                                    notification.type === 'warning' ? 'orange' : 
                                    notification.type === 'error' ? 'red' : 'green'
                                  }
                                  borderRadius="full"
                                  px={2}
                                >
                                  {notification.type === 'info' ? 'معلومات' : 
                                   notification.type === 'warning' ? 'تحذير' : 
                                   notification.type === 'error' ? 'خطأ' : 'نجاح'}
                                </Badge>
                              )}
                              
                              {notification.link && (
                                <Button 
                                  mt={2} 
                                  size="sm" 
                                  colorScheme="blue" 
                                  variant="link"
                                  onClick={() => window.location.href = notification.link}
                                >
                                  عرض التفاصيل
                                </Button>
                              )}
                            </Box>
                          </HStack>
                          
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FiMoreVertical />}
                              variant="ghost"
                              aria-label="خيارات"
                            />
                            <MenuList>
                              {!notification.read && (
                                <MenuItem 
                                  icon={<FiCheck />} 
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  تحديد كمقروء
                                </MenuItem>
                              )}
                              <MenuItem 
                                icon={<FiTrash2 />} 
                                onClick={() => deleteNotification(notification.id)}
                                color="red.500"
                              >
                                حذف
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </Stack>
              )}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Notifications;
