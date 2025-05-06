import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaCheck, FaUser, FaIdCard, FaPassport } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../shared/PageHeader';
import { useActionLogger } from '../../hooks/useActionLogger';

// نموذج المرافق الفارغ
const emptyCompanion = {
  nameAr1: '',
  nameAr2: '',
  nameAr3: '',
  nameAr4: '',
  nameEn1: '',
  nameEn2: '',
  nameEn3: '',
  nameEn4: '',
  relationship: '',
  civilId: '',
  passportNumber: '',
  nationality: '',
  birthDate: '',
  notes: ''
};

export default function CompanionsPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [companions, setCompanions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [companionData, setCompanionData] = useState({ ...emptyCompanion });
  const [editingCompanionId, setEditingCompanionId] = useState(null);
  const [customer, setCustomer] = useState(null);
  const { user } = useAuth();
  const { logPageView, logCreate, logUpdate, logDelete, ACTION_CATEGORIES } = useActionLogger();

  // تسجيل عرض الصفحة عند التحميل
  useEffect(() => {
    if (customerId && user) {
      logPageView('صفحة المرافقين', ACTION_CATEGORIES.CUSTOMER, { customerId });
    }
  }, [customerId, logPageView, user]);

  // جلب بيانات العميل
  useEffect(() => {
    if (!customerId) {
      navigate('/customers');
      return;
    }

    const fetchCustomer = async () => {
      try {
        const customerDoc = await getDoc(doc(db, 'customers', customerId));
        if (customerDoc.exists()) {
          setCustomer({
            id: customerDoc.id,
            ...customerDoc.data()
          });
        } else {
          toast.error('العميل غير موجود');
          navigate('/customers');
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
        toast.error('حدث خطأ أثناء جلب بيانات العميل');
        navigate('/customers');
      }
    };

    fetchCustomer();
  }, [customerId, navigate]);

  // جلب المرافقين للعميل
  useEffect(() => {
    if (!customerId) {
      console.warn('CompanionsPage: customerId غير موجود في الرابط');
      setCompanions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    console.log('CompanionsPage: بدء جلب بيانات المرافقين للعميل:', customerId);
    const q = query(
      collection(db, 'companions'),
      where('customerId', '==', customerId),
      orderBy('created_at', 'desc')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const companionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCompanions(companionsData);
        setIsLoading(false);
        console.log('CompanionsPage: تم جلب بيانات المرافقين:', companionsData);
      },
      (error) => {
        console.error('CompanionsPage: خطأ أثناء جلب بيانات المرافقين:', error);
        toast.error('حدث خطأ أثناء جلب بيانات المرافقين');
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [customerId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanionData({
      ...companionData,
      [name]: value
    });
  };

  const validateCompanionData = () => {
    if (!companionData.nameAr1 || !companionData.nameAr2 || !companionData.nameAr4) {
      toast.error('يجب إدخال الاسم الأول والثاني والأخير باللغة العربية');
      return false;
    }

    if (!companionData.nameEn1 || !companionData.nameEn2 || !companionData.nameEn4) {
      toast.error('يجب إدخال الاسم الأول والثاني والأخير باللغة الإنجليزية');
      return false;
    }

    if (!companionData.relationship) {
      toast.error('يجب تحديد صلة القرابة');
      return false;
    }

    return true;
  };

  const handleSaveCompanion = async () => {
    if (!validateCompanionData()) {
      return;
    }

    if (!user) {
      toast.error('يجب تسجيل الدخول لإضافة أو تعديل المرافقين');
      return;
    }

    setIsLoading(true);
    try {
      const userId = user.uid || user.id || '';
      const userName = user.displayName || user.name || '';
      
      if (editingCompanionId) {
        // تحديث مرافق موجود
        await updateDoc(doc(db, 'companions', editingCompanionId), {
          ...companionData,
          customerId,
          updated_at: new Date(),
          updated_by: userId,
          updated_by_name: userName
        });
        toast.success('تم تحديث بيانات المرافق بنجاح');
        logUpdate('تحديث بيانات مرافق', ACTION_CATEGORIES.CUSTOMER, { customerId, companionId: editingCompanionId });
      } else {
        // إضافة مرافق جديد
        await addDoc(collection(db, 'companions'), {
          ...companionData,
          customerId,
          created_at: new Date(),
          created_by: userId,
          created_by_name: userName,
          updated_at: new Date(),
          updated_by: userId,
          updated_by_name: userName
        });
        toast.success('تم إضافة المرافق بنجاح');
        logCreate('إضافة مرافق جديد', ACTION_CATEGORIES.CUSTOMER, { customerId });
      }

      setCompanionData({ ...emptyCompanion });
      setEditingCompanionId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving companion:', error);
      toast.error('حدث خطأ أثناء حفظ بيانات المرافق');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCompanion = (companionId) => {
    const companion = companions.find(c => c.id === companionId);
    if (companion) {
      setCompanionData(companion);
      setEditingCompanionId(companionId);
      setShowForm(true);
    } else {
      toast.error('المرافق غير موجود');
    }
  };

  const handleDeleteCompanion = async (companionId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المرافق؟')) {
      return;
    }

    if (!user) {
      toast.error('يجب تسجيل الدخول لحذف المرافقين');
      return;
    }

    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'companions', companionId));
      toast.success('تم حذف المرافق بنجاح');
      logDelete('حذف مرافق', ACTION_CATEGORIES.CUSTOMER, { customerId, companionId });
    } catch (error) {
      console.error('Error deleting companion:', error);
      toast.error('حدث خطأ أثناء حذف المرافق');
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomerName = () => {
    if (!customer) return '';
    return `${customer.nameAr1 || ''} ${customer.nameAr2 || ''} ${customer.nameAr3 || ''} ${customer.nameAr4 || ''}`;
  };

  return (
    <div className="container mx-auto p-4">
      <PageHeader 
        title={customer ? `المرافقين لـ ${customer.nameAr1} ${customer.nameAr2} ${customer.nameAr4}` : 'المرافقين'} 
        icon={<FaUser />} 
      />

      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={() => navigate('/customers')}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
        >
          <FaArrowLeft />
          العودة لقائمة العملاء
        </button>

        {!showForm && (
          <button
            onClick={() => {
              setCompanionData({ ...emptyCompanion });
              setEditingCompanionId(null);
              setShowForm(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
            disabled={isLoading}
          >
            <FaPlus />
            إضافة مرافق جديد
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            {editingCompanionId ? 'تعديل بيانات المرافق' : 'إضافة مرافق جديد'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameAr1">
                الاسم الأول (عربي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nameAr1"
                name="nameAr1"
                value={companionData.nameAr1}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="الاسم الأول"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameAr2">
                اسم الأب (عربي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nameAr2"
                name="nameAr2"
                value={companionData.nameAr2}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="اسم الأب"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameAr3">
                اسم الجد (عربي)
              </label>
              <input
                type="text"
                id="nameAr3"
                name="nameAr3"
                value={companionData.nameAr3}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="اسم الجد"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameAr4">
                اسم العائلة (عربي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nameAr4"
                name="nameAr4"
                value={companionData.nameAr4}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="اسم العائلة"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameEn1">
                الاسم الأول (إنجليزي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nameEn1"
                name="nameEn1"
                value={companionData.nameEn1}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="First Name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameEn2">
                اسم الأب (إنجليزي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nameEn2"
                name="nameEn2"
                value={companionData.nameEn2}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Middle Name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameEn3">
                اسم الجد (إنجليزي)
              </label>
              <input
                type="text"
                id="nameEn3"
                name="nameEn3"
                value={companionData.nameEn3}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Third Name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameEn4">
                اسم العائلة (إنجليزي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nameEn4"
                name="nameEn4"
                value={companionData.nameEn4}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Last Name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="relationship">
                صلة القرابة <span className="text-red-500">*</span>
              </label>
              <select
                id="relationship"
                name="relationship"
                value={companionData.relationship}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">اختر صلة القرابة</option>
                <option value="زوج/زوجة">زوج/زوجة</option>
                <option value="ابن/ابنة">ابن/ابنة</option>
                <option value="أب/أم">أب/أم</option>
                <option value="أخ/أخت">أخ/أخت</option>
                <option value="جد/جدة">جد/جدة</option>
                <option value="حفيد/حفيدة">حفيد/حفيدة</option>
                <option value="عم/عمة">عم/عمة</option>
                <option value="خال/خالة">خال/خالة</option>
                <option value="ابن عم/ابنة عم">ابن عم/ابنة عم</option>
                <option value="ابن خال/ابنة خال">ابن خال/ابنة خال</option>
                <option value="صديق/صديقة">صديق/صديقة</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="civilId">
                الرقم المدني
              </label>
              <input
                type="text"
                id="civilId"
                name="civilId"
                value={companionData.civilId}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="الرقم المدني"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="passportNumber">
                رقم جواز السفر
              </label>
              <input
                type="text"
                id="passportNumber"
                name="passportNumber"
                value={companionData.passportNumber}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="رقم جواز السفر"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nationality">
                الجنسية
              </label>
              <input
                type="text"
                id="nationality"
                name="nationality"
                value={companionData.nationality}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="الجنسية"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="birthDate">
                تاريخ الميلاد
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={companionData.birthDate}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
              ملاحظات
            </label>
            <textarea
              id="notes"
              name="notes"
              value={companionData.notes}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              placeholder="ملاحظات إضافية"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setCompanionData({ ...emptyCompanion });
                setEditingCompanionId(null);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
              disabled={isLoading}
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveCompanion}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <FaCheck className="mr-2" />
                  {editingCompanionId ? 'تحديث' : 'حفظ'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {isLoading && !showForm ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">جاري التحميل...</span>
          </div>
        </div>
      ) : companions.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">لا يوجد مرافقين لهذا العميل</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الاسم (عربي)
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الاسم (إنجليزي)
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    صلة القرابة
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الرقم المدني
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم جواز السفر
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companions.map((companion) => (
                  <tr key={companion.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs overflow-hidden text-ellipsis" style={{direction:'rtl'}} title={`${companion.nameAr1} ${companion.nameAr2} ${companion.nameAr3} ${companion.nameAr4}`}>
  <span className="block truncate">
    {companion.nameAr1} {companion.nameAr2} {companion.nameAr3} {companion.nameAr4}
  </span>
</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs overflow-hidden text-ellipsis" style={{direction:'ltr'}} title={`${companion.nameEn1} ${companion.nameEn2} ${companion.nameEn3} ${companion.nameEn4}`}>
  <span className="block truncate">
    {companion.nameEn1} {companion.nameEn2} {companion.nameEn3} {companion.nameEn4}
  </span>
</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {companion.relationship}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {companion.civilId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {companion.passportNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEditCompanion(companion.id)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-full"
                          title="تعديل"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCompanion(companion.id)}
                          className="text-red-600 hover:text-red-900 bg-red-100 p-2 rounded-full"
                          title="حذف"
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
