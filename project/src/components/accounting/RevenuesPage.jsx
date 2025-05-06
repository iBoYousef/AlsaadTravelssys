import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilePdf, FaFileExcel, FaFilter, FaUndo, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { paymentMethods, getPaymentMethodLabel, validatePaymentMethod } from '../../constants/paymentMethods';
import * as accountingService from '../../services/accountingService';

const RevenuesPage = () => {
  const { user } = useAuth();

  // فحص صلاحيات المستخدم
  const isAccountingAdmin = user && (user.isAdmin === true || user.role === 'admin' || user.role === 'superadmin' || user.jobTitle === 'مسؤول النظام');
  const [permissionError, setPermissionError] = useState('');

  console.log('RevenuesPage: بيانات المستخدم:', user, 'صلاحيات المحاسبة:', isAccountingAdmin);
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    serviceType: '',
    paymentMethod: '',
    createdByName: '' // فلتر الموظف
  });
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    serviceType: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

  // خيارات أنواع الخدمات
  const serviceTypes = [
    { value: 'flight', label: 'تذاكر طيران' },
    { value: 'hotel', label: 'حجوزات فنادق' },
    { value: 'visa', label: 'تأشيرات' },
    { value: 'vehicle', label: 'تأجير سيارات' },
    { value: 'event', label: 'فعاليات' },
    { value: 'other', label: 'أخرى' }
  ];

  useEffect(() => {
    // تحقق من صلاحيات المستخدم المحاسبية بشكل احترافي
    if (!isAccountingAdmin) {
      setPermissionError('عذراً، ليس لديك صلاحية الوصول إلى صفحة الإيرادات. إذا كنت تعتقد أن هذا خطأ يرجى التواصل مع مسؤول النظام.');
      setLoading(false);
      return;
    }
    setPermissionError('');
    fetchRevenues();
  }, [filters, isAccountingAdmin]);

  const fetchRevenues = async () => {
    try {
      setLoading(true);
      const response = await accountingService.getRevenues(filters);
      
      // تطبيق فلتر الموظف إذا تم اختياره (في حال لم يكن مدعومًا من الاستعلام في الخدمة)
      let data = response && response.success && Array.isArray(response.data) ? response.data : [];
      if (filters.createdByName) {
        data = data.filter(revenue => revenue.createdByName === filters.createdByName);
      }
      if (response && response.success) {
        // تطبيق البحث النصي
        const filteredRevenues = searchTerm 
          ? data.filter(revenue => 
              revenue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              revenue.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              revenue.notes?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : data;
        
        setRevenues(filteredRevenues);
      } else {
        setRevenues([]);
        toast.error(response?.error || "حدث خطأ أثناء تحميل بيانات الإيرادات", { position: 'top-right', rtl: true });
        // تسجيل الخطأ في سجل النظام إذا توفر hook أو خدمة
        if (window.logSystemEvent) window.logSystemEvent('Error', response?.error || 'فشل تحميل الإيرادات');
      }
    } catch (error) {
      console.error("Error fetching revenues:", error);
      toast.error(error.message || "حدث خطأ أثناء تحميل بيانات الإيرادات", { position: 'top-right', rtl: true });
      setRevenues([]);
      // تسجيل الخطأ في سجل النظام إذا توفر hook أو خدمة
      if (window.logSystemEvent) window.logSystemEvent('Error', error.message || 'فشل تحميل الإيرادات');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      serviceType: '',
      paymentMethod: ''
    });
    setSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // تحقق من الحقول المطلوبة قبل الإرسال
    if (!formData.amount || !formData.description || !formData.serviceType || !formData.date) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة", { position: 'top-right', rtl: true });
      return;
    }

    try {
      const revenueData = {
        ...formData,
        amount: parseFloat(formData.amount),
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingRevenue) {
        // تحديث إيراد موجود
        await updateRevenue(editingRevenue.id, revenueData);
        toast.success("تم تحديث الإيراد بنجاح", { position: 'top-right', rtl: true });
      } else {
        // إضافة إيراد جديد
        await addRevenue(revenueData);
        toast.success("تم إضافة الإيراد بنجاح", { position: 'top-right', rtl: true });
      }

      // إعادة تعيين النموذج وإغلاقه
      setFormData({
        amount: '',
        description: '',
        serviceType: '',
        paymentMethod: 'cash',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: ''
      });
      setShowForm(false);
      setEditingRevenue(null);
      
      // إعادة تحميل البيانات
      fetchRevenues();
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الإيراد: " + (error.message || ''), { position: 'top-right', rtl: true });
      // تسجيل الخطأ في سجل النظام إذا توفر hook أو خدمة
      if (window.logSystemEvent) window.logSystemEvent('Error', error.message || 'فشل حفظ الإيراد');
    } finally { };
  };

  // معالجة تعديل الإيراد
  const handleEdit = (revenue) => {
    setEditingRevenue(revenue);
    setFormData({
      amount: revenue.amount.toString(),
      description: revenue.description,
      serviceType: revenue.serviceType,
      paymentMethod: revenue.paymentMethod,
      date: revenue.date,
      reference: revenue.reference || '',
      notes: revenue.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الإيراد؟")) {
      try {
        await accountingService.deleteRevenue(id);
        toast.success("تم حذف الإيراد بنجاح", { position: 'top-right', rtl: true });
        fetchRevenues();
      } catch (error) {
        toast.error("حدث خطأ أثناء حذف الإيراد: " + (error.message || ''), { position: 'top-right', rtl: true });
        // تسجيل الخطأ في سجل النظام إذا توفر hook أو خدمة
        if (window.logSystemEvent) window.logSystemEvent('Error', error.message || 'فشل حذف الإيراد');
      }
    }
  };

  const exportToPDF = () => {
    toast.info("جاري تطوير هذه الميزة");
    // سيتم تنفيذ التصدير إلى PDF هنا
  };

  const exportToExcel = () => {
    toast.info("جاري تطوير هذه الميزة");
    // سيتم تنفيذ التصدير إلى Excel هنا
  };

  // حساب المجموع الكلي للإيرادات
  const totalRevenue = revenues.reduce((sum, revenue) => sum + revenue.amount, 0);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">إدارة الإيرادات - Al-Saad Travels and Tourism</h1>
      {/* رسالة ودية إذا لم توجد بيانات */}
      {revenues.length === 0 && !loading && (
        <div className="text-center text-gray-500 my-8 text-lg">لا توجد بيانات إيرادات متاحة حالياً.</div>
      )}
      {/* فلتر الموظف */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <label className="font-semibold">الموظف المنشئ:</label>
        <select
          className="border border-gray-300 rounded-md px-2 py-1"
          value={filters.createdByName}
          onChange={e => setFilters(prev => ({ ...prev, createdByName: e.target.value }))}
        >
          <option value="">كل الموظفين</option>
          {/* توليد قائمة الموظفين من الإيرادات الحالية */}
          {Array.from(new Set(revenues.map(r => r.createdByName).filter(Boolean))).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      {/* زر الرجوع */}
      <div className="mb-4">
        <button
          onClick={() => window.history.back()}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
        >
          <FaArrowLeft />
          العودة للخلف
        </button>
      </div>
      
      {/* أزرار الإجراءات */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <button 
            onClick={() => { setShowForm(true); setEditingRevenue(null); }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FaPlus className="mr-2" /> إضافة إيراد جديد
          </button>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={exportToPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FaFilePdf className="mr-2" /> تصدير PDF
          </button>
          <button 
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FaFileExcel className="mr-2" /> تصدير Excel
          </button>
        </div>
      </div>
      
      {/* نموذج إضافة/تعديل الإيراد */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">{editingRevenue ? 'تعديل إيراد' : 'إضافة إيراد جديد'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">المبلغ (د.ك) *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                  step="0.001"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">التاريخ *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">الوصف *</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">نوع الخدمة *</label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">اختر نوع الخدمة</option>
                  {serviceTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">طريقة الدفع *</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>{method.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">رقم المرجع</label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  rows="3"
                ></textarea>
              </div>
            </div>
            
            <div className="flex justify-end mt-4 space-x-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingRevenue(null); }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                {editingRevenue ? 'تحديث' : 'حفظ'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* فلاتر البحث */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap justify-between items-center">
          <h2 className="text-lg font-semibold mb-2">فلترة وبحث</h2>
          <button 
            onClick={resetFilters}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md flex items-center text-sm"
          >
            <FaUndo className="mr-1" /> إعادة تعيين
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          <div>
            <label className="block text-sm text-gray-700 mb-1">من تاريخ</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-1">نوع الخدمة</label>
            <select
              name="serviceType"
              value={filters.serviceType}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="">الكل</option>
              {serviceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-1">طريقة الدفع</label>
            <select
              name="paymentMethod"
              value={filters.paymentMethod}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="">الكل</option>
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="بحث عن وصف، مرجع، أو ملاحظات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pr-10 border rounded-md"
            />
            <FaSearch className="absolute top-3 right-3 text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* عرض الإيرادات */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">قائمة الإيرادات</h2>
            <div className="text-lg font-bold text-green-600">
              المجموع: {formatCurrency(totalRevenue)}
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">جاري التحميل...</span>
            </div>
          </div>
        ) : revenues.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            لا توجد إيرادات مسجلة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع الخدمة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">طريقة الدفع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المرجع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">بواسطة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenues.map(revenue => (
                  <tr key={revenue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{revenue.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{revenue.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {serviceTypes.find(t => t.value === revenue.serviceType)?.label || revenue.serviceType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPaymentMethodLabel(revenue.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(revenue.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{revenue.reference || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{revenue.createdByName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(revenue)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-full"
                          title="تعديل"
                        >
                          <FaEdit size={18} />
                        </button>
                        {isAccountingAdmin && (
                          <button
                            onClick={() => handleDelete(revenue.id)}
                            className="text-red-600 hover:text-red-900 bg-red-100 p-2 rounded-full"
                            title="حذف"
                          >
                            <FaTrash size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenuesPage;
