import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilePdf, FaFileExcel, FaFilter, FaUndo, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { paymentMethods, getPaymentMethodLabel, validatePaymentMethod } from '../../constants/paymentMethods';
import * as accountingService from '../../services/accountingService';

import DirectDeleteButton from '../shared/DirectDeleteButton';

const ExpensesPage = () => {
  const { user } = useAuth();

  // فحص صلاحيات المستخدم
  const isAccountingAdmin = user && (user.isAdmin === true || user.role === 'admin' || user.role === 'superadmin' || user.jobTitle === 'مسؤول النظام');
  const [permissionError, setPermissionError] = useState('');

  console.log('ExpensesPage: بيانات المستخدم:', user, 'صلاحيات المحاسبة:', isAccountingAdmin);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    paymentMethod: ''
  });
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    recipient: '',
    notes: ''
  });

  // خيارات فئات المصروفات
  const expenseCategories = [
    { value: 'salary', label: 'رواتب' },
    { value: 'rent', label: 'إيجارات' },
    { value: 'utilities', label: 'مرافق' },
    { value: 'supplies', label: 'مستلزمات مكتبية' },
    { value: 'marketing', label: 'تسويق وإعلان' },
    { value: 'travel', label: 'سفر' },
    { value: 'maintenance', label: 'صيانة' },
    { value: 'insurance', label: 'تأمين' },
    { value: 'taxes', label: 'ضرائب ورسوم' },
    { value: 'other', label: 'أخرى' }
  ];

  useEffect(() => {
    if (!isAccountingAdmin) {
      setPermissionError('ليس لديك صلاحية الوصول إلى صفحة المصروفات. يرجى مراجعة مسؤول النظام إذا كنت تعتقد أن هذا خطأ.');
      setLoading(false);
      return;
    }
    setPermissionError('');
    fetchExpenses();
  }, [filters, isAccountingAdmin]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await accountingService.getExpenses(filters);
      
      if (response && response.success && Array.isArray(response.data)) {
        // تطبيق البحث النصي
        const filteredExpenses = searchTerm 
          ? response.data.filter(expense => 
              expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              expense.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              expense.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              expense.notes?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : response.data.map(expense => ({...expense, amount: parseFloat(expense.amount)}));
        
        setExpenses(filteredExpenses);
      } else {
        setExpenses([]);
        toast.error(response?.error || "حدث خطأ أثناء تحميل بيانات المصروفات");
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error(error.message || "حدث خطأ أثناء تحميل بيانات المصروفات");
      setExpenses([]);
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
      category: '',
      paymentMethod: ''
    });
    setSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.category || !formData.date) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingExpense) {
        // تحديث مصروف موجود
        await accountingService.updateExpense(editingExpense.id, expenseData);
        toast.success("تم تحديث المصروف بنجاح");
      } else {
        // إضافة مصروف جديد
        await accountingService.addExpense(expenseData);
        toast.success("تم إضافة المصروف بنجاح");
      }

      // إعادة تعيين النموذج وإغلاقه
      setFormData({
        amount: '',
        description: '',
        category: '',
        paymentMethod: 'cash',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        recipient: '',
        notes: ''
      });
      setShowForm(false);
      setEditingExpense(null);
      
      // إعادة تحميل البيانات
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("حدث خطأ أثناء حفظ المصروف");
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      description: expense.description,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      date: expense.date,
      reference: expense.reference || '',
      recipient: expense.recipient || '',
      notes: expense.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
      try {
        await accountingService.deleteExpense(id);
        toast.success("تم حذف المصروف بنجاح");
        fetchExpenses();
      } catch (error) {
        console.error("Error deleting expense:", error);
        toast.error("حدث خطأ أثناء حذف المصروف");
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

  // حساب المجموع الكلي للمصروفات
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">إدارة المصروفات - Al-Saad Travels and Tourism</h1>
      
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
            onClick={() => { setShowForm(true); setEditingExpense(null); }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FaPlus className="mr-2" /> إضافة مصروف جديد
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
      
      {/* نموذج إضافة/تعديل المصروف */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">{editingExpense ? 'تعديل مصروف' : 'إضافة مصروف جديد'}</h2>
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
                <label className="block text-gray-700 mb-2">الفئة *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">اختر فئة المصروف</option>
                  {expenseCategories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
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
                <label className="block text-gray-700 mb-2">المستلم</label>
                <input
                  type="text"
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
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
                onClick={() => { setShowForm(false); setEditingExpense(null); }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                {editingExpense ? 'تحديث' : 'حفظ'}
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
            <label className="block text-sm text-gray-700 mb-1">الفئة</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="">الكل</option>
              {expenseCategories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
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
              placeholder="بحث عن وصف، مستلم، مرجع، أو ملاحظات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pr-10 border rounded-md"
            />
            <FaSearch className="absolute top-3 right-3 text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* عرض المصروفات */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">قائمة المصروفات</h2>
            <div className="text-lg font-bold text-red-600">
              المجموع: {formatCurrency(totalExpense)}
            </div>
          </div>
        </div>
        
        {permissionError ? (
          <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>
            <h2>صلاحيات غير كافية</h2>
            <p>{permissionError}</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">جاري التحميل...</span>
            </div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            لا توجد مصروفات مسجلة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الفئة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المستلم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">طريقة الدفع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المرجع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">بواسطة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expenseCategories.find(c => c.value === expense.category)?.label || expense.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.recipient || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPaymentMethodLabel(expense.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.reference || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.createdByName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-3">
                        {isAccountingAdmin && (
                          <button
                            onClick={() => handleDelete(expense.id)}
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

export default ExpensesPage;
