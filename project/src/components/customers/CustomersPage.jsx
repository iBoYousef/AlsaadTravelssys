import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUser, FaPhone, FaPassport, FaCheck, FaArrowLeft, FaSearch, FaUsers } from 'react-icons/fa';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, updateDoc, getDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useToast } from '@chakra-ui/react';
import { getCurrentDate } from '../../utils/dateUtils';
import PageHeader from '../shared/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { isTestMode } from '../../utils/appMode';
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  useColorModeValue,
  Badge,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, DeleteIcon, EditIcon, PhoneIcon } from '@chakra-ui/icons';
import { formatDate } from '../../utils/dateUtils';
import { createFilteredQuery, isTestData } from '../../utils/dataFilters';
import { useActionLogger } from '../../hooks/useActionLogger';

const emptyCustomer = {
  nameAr1: '',
  nameAr2: '',
  nameAr3: '',
  nameAr4: '',
  nameEn1: '',
  nameEn2: '',
  nameEn3: '',
  nameEn4: '',
  civilId: '',
  passportNumber: '',
  mobile: '',
  email: '',
  nationality: 'كويتي',
  notes: '',
  workplace: '',
  birthDate: '',
  contactMethod: 'حضوري'
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [customerData, setCustomerData] = useState({ ...emptyCustomer });
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { logPageView, logCreate, logUpdate, logDelete, logSearch, ACTION_CATEGORIES } = useActionLogger();

  // تسجيل عرض الصفحة عند التحميل
  useEffect(() => {
    logPageView('صفحة العملاء', ACTION_CATEGORIES.CUSTOMER);
  }, [logPageView]);

  // جلب العملاء من قاعدة البيانات
  useEffect(() => {
    // استخدام الاستعلام المصفى بناءً على وضع التطبيق
    const q = createFilteredQuery('customers');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // تصفية البيانات التجريبية في وضع الإنتاج
      .filter(customer => {
        if (!isTestMode() && customer.isTestData) {
          return false;
        }
        return true;
      })
      // ترتيب العملاء حسب الاسم
      .sort((a, b) => {
        const nameA = `${a.nameAr1 || ''} ${a.nameAr2 || ''}`.trim();
        const nameB = `${b.nameAr1 || ''} ${b.nameAr2 || ''}`.trim();
        return nameA.localeCompare(nameB);
      });
      
      setCustomers(customersData);
      setFilteredCustomers(customersData);
      setIsLoading(false);
    }, (error) => {
      console.error('خطأ في جلب العملاء:', error);
      toast({
        title: 'خطأ في جلب العملاء',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    });

    return () => unsubscribe();
  }, [toast]);

  // تصفية العملاء حسب مصطلح البحث
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const searchTermLower = searchQuery.toLowerCase();
    const filtered = customers.filter(customer => {
      const fullNameAr = `${customer.nameAr1 || ''} ${customer.nameAr2 || ''} ${customer.nameAr3 || ''} ${customer.nameAr4 || ''}`.toLowerCase();
      const fullNameEn = `${customer.nameEn1 || ''} ${customer.nameEn2 || ''} ${customer.nameEn3 || ''} ${customer.nameEn4 || ''}`.toLowerCase();
      const civilId = customer.civilId ? customer.civilId.toLowerCase() : '';
      const mobile = customer.mobile ? customer.mobile.toLowerCase() : '';
      const passport = customer.passportNumber ? customer.passportNumber.toLowerCase() : '';

      return (
        fullNameAr.includes(searchTermLower) ||
        fullNameEn.includes(searchTermLower) ||
        civilId.includes(searchTermLower) ||
        mobile.includes(searchTermLower) ||
        passport.includes(searchTermLower)
      );
    });

    setFilteredCustomers(filtered);
    logSearch(searchQuery, ACTION_CATEGORIES.CUSTOMER);
  }, [searchQuery, customers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerData({
      ...customerData,
      [name]: value
    });
  };

  const validateCustomerData = () => {
    if (!customerData.nameAr1 || !customerData.nameAr2 || !customerData.nameAr4) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يجب إدخال الاسم الأول والثاني والأخير باللغة العربية',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!customerData.nameEn1 || !customerData.nameEn2 || !customerData.nameEn4) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يجب إدخال الاسم الأول والثاني والأخير باللغة الإنجليزية',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!customerData.mobile) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يجب إدخال رقم الهاتف',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!customerData.civilId) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يجب إدخال الرقم المدني',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!customerData.passportNumber) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يجب إدخال رقم الجواز',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!customerData.workplace) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يجب إدخال جهة العمل',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!customerData.birthDate) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يجب إدخال تاريخ الميلاد',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!customerData.contactMethod) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يجب اختيار طريقة التواصل',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  const handleAddCustomer = async () => {
    if (!validateCustomerData()) {
      return;
    }

    setIsLoading(true);
    try {
      if (editingCustomerId) {
        // تحديث العميل الموجود
        await updateDoc(doc(db, 'customers', editingCustomerId), {
          ...customerData,
          updated_at: new Date(),
          updated_by: user.id
        });
        logUpdate(editingCustomerId, ACTION_CATEGORIES.CUSTOMER);
        toast({
          title: 'تم بنجاح',
          description: 'تم تحديث بيانات العميل بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // إضافة عميل جديد
        await addDoc(collection(db, 'customers'), {
          ...customerData,
          created_at: new Date(),
          created_by: user.id,
          updated_at: new Date(),
          updated_by: user.id
        });
        logCreate(ACTION_CATEGORIES.CUSTOMER);
        toast({
          title: 'تم بنجاح',
          description: 'تم إضافة العميل بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      setCustomerData({ ...emptyCustomer });
      setEditingCustomerId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ بيانات العميل',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCustomer = async (customerId) => {
    setIsLoading(true);
    try {
      const customerDoc = await getDoc(doc(db, 'customers', customerId));
      if (customerDoc.exists()) {
        setCustomerData(customerDoc.data());
        setEditingCustomerId(customerId);
        setShowForm(true);
      } else {
        toast({
          title: 'خطأ',
          description: 'العميل غير موجود',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء جلب بيانات العميل',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'customers', customerId));
      logDelete(customerId, ACTION_CATEGORIES.CUSTOMER);
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف العميل بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف العميل',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <PageHeader title="إدارة العملاء" />
      
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {showForm ? (
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingCustomerId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingCustomerId(null);
                    setCustomerData({ ...emptyCustomer });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaArrowLeft className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium mb-4">البيانات الشخصية</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* عرض الرقم الكودي فقط في وضع التعديل */}
                      {editingCustomerId && (
                        <div>
                          <label className="block text-gray-700 mb-2">الرقم الكودي (تلقائي)</label>
                          <input
                            type="text"
                            name="customerCode"
                            value={customerData.customerCode || ''}
                            readOnly
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 focus:outline-none"
                            tabIndex={0}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-gray-700 mb-2">الاسم الأول (عربي)*</label>
                        <input
                          type="text"
                          name="nameAr1"
                          value={customerData.nameAr1}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          tabIndex={1}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">الاسم الثاني (عربي)*</label>
                        <input
                          type="text"
                          name="nameAr2"
                          value={customerData.nameAr2}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          tabIndex={2}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">الاسم الثالث (عربي)</label>
                        <input
                          type="text"
                          name="nameAr3"
                          value={customerData.nameAr3}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          tabIndex={3}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">الاسم الأخير (عربي)*</label>
                        <input
                          type="text"
                          name="nameAr4"
                          value={customerData.nameAr4}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          tabIndex={4}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">الاسم الأول (إنجليزي)*</label>
                        <input
                          type="text"
                          name="nameEn1"
                          value={customerData.nameEn1}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          tabIndex={5}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">الاسم الثاني (إنجليزي)*</label>
                        <input
                          type="text"
                          name="nameEn2"
                          value={customerData.nameEn2}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          tabIndex={6}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">الاسم الثالث (إنجليزي)</label>
                        <input
                          type="text"
                          name="nameEn3"
                          value={customerData.nameEn3}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          tabIndex={7}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">الاسم الأخير (إنجليزي)*</label>
                        <input
                          type="text"
                          name="nameEn4"
                          value={customerData.nameEn4}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          tabIndex={8}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium mb-4">معلومات الاتصال والوثائق</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2">رقم الهاتف*</label>
                      <input
                        type="text"
                        name="mobile"
                        value={customerData.mobile}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        tabIndex={9}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">جهة العمل*</label>
                      <input
                        type="text"
                        name="workplace"
                        value={customerData.workplace}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        tabIndex={10}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">تاريخ الميلاد*</label>
                      <input
                        type="date"
                        name="birthDate"
                        value={customerData.birthDate}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        tabIndex={11}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">طريقة التواصل*</label>
                      <select
                        name="contactMethod"
                        value={customerData.contactMethod}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        tabIndex={12}
                      >
                        <option value="حضوري">حضوري</option>
                        <option value="إتصال هاتفي">إتصال هاتفي</option>
                        <option value="واتس آب">واتس آب</option>
                        <option value="معرفة شخصية">معرفة شخصية</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الرقم المدني*</label>
                      <input
                        type="text"
                        name="civilId"
                        value={customerData.civilId}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        tabIndex={13}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">رقم الجواز*</label>
                      <input
                        type="text"
                        name="passportNumber"
                        value={customerData.passportNumber}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        tabIndex={14}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">البريد الإلكتروني</label>
                      <input
                        type="email"
                        name="email"
                        value={customerData.email}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        tabIndex={15}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الجنسية</label>
                      <input
                        type="text"
                        name="nationality"
                        value={customerData.nationality}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        tabIndex={16}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">ملاحظات</label>
                  <textarea
                    name="notes"
                    value={customerData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    tabIndex={17}
                  ></textarea>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleAddCustomer}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200 flex items-center gap-2"
                  tabIndex={18}
                >
                  <FaCheck />
                  {editingCustomerId ? 'حفظ التعديلات' : 'إضافة العميل'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
                <div className="w-full md:w-1/2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="البحث عن عميل..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      tabIndex={0}
                    />
                    <FaSearch className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCustomerData({ ...emptyCustomer });
                    setEditingCustomerId(null);
                    setShowForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  tabIndex={19}
                >
                  <FaPlus className="inline-block ml-2" />
                  إضافة عميل جديد
                </button>
              </div>

              <div className="bg-white shadow-md overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
                    </div>
                  ) : filteredCustomers.length > 0 ? (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>الاسم</Th>
                          <Th>الرقم الكودي</Th>
                          <Th>الرقم المدني</Th>
                          <Th>رقم الهاتف</Th>
                          <Th>رقم الجواز</Th>
                          <Th>الجنسية</Th>
                          <Th>الإجراءات</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredCustomers.map(customer => (
                          <Tr key={customer.id} className="hover:bg-gray-50">
                            <Td>
                              <div className="font-semibold">
                                {customer.nameAr1} {customer.nameAr2} {customer.nameAr3} {customer.nameAr4}
                              </div>
                              <div className="text-sm text-gray-600">
                                {customer.nameEn1} {customer.nameEn2} {customer.nameEn3} {customer.nameEn4}
                              </div>
                              {/* عرض شارة للبيانات التجريبية */}
                              {isTestData(customer) && (
                                <Badge ml={2} colorScheme="purple">تجريبي</Badge>
                              )}
                            </Td>
                            <Td>{customer.customerCode || '-'}</Td>
                             <Td>{customer.civilId || '-'}</Td>
                            <Td>{customer.mobile || '-'}</Td>
                            <Td>{customer.passportNumber || '-'}</Td>
                            <Td>{customer.nationality || '-'}</Td>
                            <Td>
                              <div className="flex gap-2">
                                <IconButton
                                  onClick={() => handleEditCustomer(customer.id)}
                                  icon={<EditIcon />}
                                  aria-label="تعديل بيانات العميل"
                                  colorScheme="blue"
                                  size="sm"
                                  tabIndex={20}
                                />
                                <IconButton
                                  onClick={() => navigate(`/customers/${customer.id}/companions`)}
                                  icon={<FaUsers />}
                                  aria-label="إدارة المرافقين"
                                  colorScheme="green"
                                  size="sm"
                                  tabIndex={21}
                                />
                                <IconButton
                                  onClick={() => handleDeleteCustomer(customer.id)}
                                  icon={<DeleteIcon />}
                                  aria-label="حذف العميل"
                                  colorScheme="red"
                                  size="sm"
                                  tabIndex={22}
                                />
                              </div>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <FaUser className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      {searchQuery ? 'لا توجد نتائج مطابقة لبحثك' : 'لا يوجد عملاء مسجلين حالياً'}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
