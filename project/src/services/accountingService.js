import { getFirestore } from 'firebase/firestore';
import { 
  collection, 
  query, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  where, 
  orderBy, 
  Timestamp, 
  serverTimestamp 
} from 'firebase/firestore';
import { getApp } from 'firebase/app';

// الحصول على مثيل Firestore
const app = getApp();
const db = getFirestore(app);

// ===== خدمات المصروفات =====
export const getExpenses = async (filters = {}) => {
  try {
    let expenseQuery = collection(db, "expenses");
    
    // إنشاء استعلام مع الفلاتر
    const constraints = [];
    
    if (filters.startDate) {
      constraints.push(where("date", ">=", filters.startDate));
    }
    
    if (filters.endDate) {
      constraints.push(where("date", "<=", filters.endDate));
    }
    
    if (filters.category) {
      constraints.push(where("category", "==", filters.category));
    }
    
    if (filters.paymentMethod) {
      constraints.push(where("paymentMethod", "==", filters.paymentMethod));
    }
    
    // إضافة الترتيب حسب التاريخ
    constraints.push(orderBy("date", "desc"));
    
    // تنفيذ الاستعلام
    const q = constraints.length > 0 
      ? query(expenseQuery, ...constraints)
      : query(expenseQuery, orderBy("date", "desc"));
      
    const querySnapshot = await getDocs(q);
    
    // تحويل البيانات
    const expenseData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: expenseData
    };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return { 
      success: false, 
      error: error.message,
      data: []
    };
  }
};

export const addExpense = async (expenseData) => {
  try {
    const dataToSave = {
      ...expenseData,
      amount: parseFloat(expenseData.amount),
      createdBy: expenseData.createdBy,
      createdByName: expenseData.createdByName,
      createdAt: expenseData.createdAt || serverTimestamp(),
      updatedAt: expenseData.updatedAt || serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "expenses"), dataToSave);
    
    return {
      success: true,
      id: docRef.id,
      data: {
        id: docRef.id,
        ...dataToSave
      }
    };
  } catch (error) {
    console.error("Error adding expense:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

export const updateExpense = async (expenseId, expenseData) => {
  try {
    const dataToUpdate = {
      ...expenseData,
      amount: parseFloat(expenseData.amount),
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, "expenses", expenseId), dataToUpdate);
    
    return {
      success: true,
      id: expenseId,
      data: {
        id: expenseId,
        ...dataToUpdate
      }
    };
  } catch (error) {
    console.error("Error updating expense:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

export const deleteExpense = async (expenseId) => {
  try {
    await deleteDoc(doc(db, "expenses", expenseId));
    
    return {
      success: true,
      id: expenseId
    };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

// ===== خدمات الإيرادات =====
export const getRevenues = async (filters = {}) => {
  try {
    let revenueQuery = collection(db, "revenues");
    
    // إنشاء استعلام مع الفلاتر
    const constraints = [];
    
    if (filters.startDate) {
      constraints.push(where("date", ">=", filters.startDate));
    }
    
    if (filters.endDate) {
      constraints.push(where("date", "<=", filters.endDate));
    }
    
    if (filters.serviceType) {
      constraints.push(where("serviceType", "==", filters.serviceType));
    }
    
    if (filters.paymentMethod) {
      constraints.push(where("paymentMethod", "==", filters.paymentMethod));
    }
    
    // إضافة الترتيب حسب التاريخ
    constraints.push(orderBy("date", "desc"));
    
    // تنفيذ الاستعلام
    const q = constraints.length > 0 
      ? query(revenueQuery, ...constraints)
      : query(revenueQuery, orderBy("date", "desc"));
      
    const querySnapshot = await getDocs(q);
    
    // تحويل البيانات
    const revenueData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: revenueData
    };
  } catch (error) {
    console.error("Error fetching revenues:", error);
    return { 
      success: false, 
      error: error.message,
      data: []
    };
  }
};

// إضافة إيراد مرتبط بحجز
export const addRevenueForBooking = async (bookingId, revenueData) => {
  return await addRevenue({ ...revenueData, bookingId });
};

export const addRevenue = async (revenueData) => {
  try {
    const dataToSave = {
      ...revenueData,
      amount: parseFloat(revenueData.amount),
      createdBy: revenueData.createdBy,
      createdByName: revenueData.createdByName,
      createdAt: revenueData.createdAt || serverTimestamp(),
      updatedAt: revenueData.updatedAt || serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "revenues"), dataToSave);
    
    return {
      success: true,
      id: docRef.id,
      data: {
        id: docRef.id,
        ...dataToSave
      }
    };
  } catch (error) {
    console.error("Error adding revenue:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

export const updateRevenue = async (revenueId, revenueData) => {
  try {
    const dataToUpdate = {
      ...revenueData,
      amount: parseFloat(revenueData.amount),
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, "revenues", revenueId), dataToUpdate);
    
    return {
      success: true,
      id: revenueId,
      data: {
        id: revenueId,
        ...dataToUpdate
      }
    };
  } catch (error) {
    console.error("Error updating revenue:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

export const deleteRevenue = async (revenueId) => {
  try {
    await deleteDoc(doc(db, "revenues", revenueId));
    
    return {
      success: true,
      id: revenueId
    };
  } catch (error) {
    console.error("Error deleting revenue:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

// ===== خدمات الفواتير =====
export const getInvoices = async (filters = {}) => {
  try {
    let invoiceQuery = collection(db, "invoices");
    
    // إنشاء استعلام مع الفلاتر
    const constraints = [];
    
    if (filters.startDate) {
      constraints.push(where("date", ">=", filters.startDate));
    }
    
    if (filters.endDate) {
      constraints.push(where("date", "<=", filters.endDate));
    }
    
    if (filters.status) {
      constraints.push(where("status", "==", filters.status));
    }
    
    if (filters.type) {
      constraints.push(where("type", "==", filters.type));
    }
    
    // إضافة الترتيب حسب التاريخ
    constraints.push(orderBy("date", "desc"));
    
    // تنفيذ الاستعلام
    const q = constraints.length > 0 
      ? query(invoiceQuery, ...constraints)
      : query(invoiceQuery, orderBy("date", "desc"));
      
    const querySnapshot = await getDocs(q);
    
    // تحويل البيانات
    const invoiceData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: invoiceData
    };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return { 
      success: false, 
      error: error.message,
      data: []
    };
  }
};

export const getInvoiceById = async (invoiceId) => {
  try {
    const docRef = doc(db, "invoices", invoiceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        success: true,
        data: {
          id: docSnap.id,
          ...docSnap.data()
        }
      };
    } else {
      return {
        success: false,
        error: "الفاتورة غير موجودة"
      };
    }
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

// إضافة فاتورة مرتبطة بحجز
export const addInvoiceForBooking = async (bookingId, invoiceData) => {
  return await addInvoice({ ...invoiceData, bookingId });
};

export const addInvoice = async (invoiceData) => {
  try {
    const dataToSave = {
      ...invoiceData,
      createdBy: invoiceData.createdBy,
      createdByName: invoiceData.createdByName,
      createdAt: invoiceData.createdAt || serverTimestamp(),
      updatedAt: invoiceData.updatedAt || serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "invoices"), dataToSave);
    
    return {
      success: true,
      id: docRef.id,
      data: {
        id: docRef.id,
        ...dataToSave
      }
    };
  } catch (error) {
    console.error("Error adding invoice:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

export const updateInvoice = async (invoiceId, invoiceData) => {
  try {
    const dataToUpdate = {
      ...invoiceData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, "invoices", invoiceId), dataToUpdate);
    
    return {
      success: true,
      id: invoiceId,
      data: {
        id: invoiceId,
        ...dataToUpdate
      }
    };
  } catch (error) {
    console.error("Error updating invoice:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

export const deleteInvoice = async (invoiceId) => {
  try {
    await deleteDoc(doc(db, "invoices", invoiceId));
    
    return {
      success: true,
      id: invoiceId
    };
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

// ===== خدمات سندات القبض =====
export const getReceipts = async (filters = {}) => {
  try {
    let receiptQuery = collection(db, "receipts");
    
    // إنشاء استعلام مع الفلاتر
    const constraints = [];
    
    if (filters.startDate) {
      constraints.push(where("date", ">=", filters.startDate));
    }
    
    if (filters.endDate) {
      constraints.push(where("date", "<=", filters.endDate));
    }
    
    if (filters.paymentMethod) {
      constraints.push(where("paymentMethod", "==", filters.paymentMethod));
    }
    
    // إضافة الترتيب حسب التاريخ
    constraints.push(orderBy("created_at", "desc"));
    
    // تنفيذ الاستعلام
    const q = constraints.length > 0 
      ? query(receiptQuery, ...constraints)
      : query(receiptQuery, orderBy("created_at", "desc"));
      
    const querySnapshot = await getDocs(q);
    
    // تحويل البيانات
    const receiptData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: receiptData
    };
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return { 
      success: false, 
      error: error.message,
      data: []
    };
  }
};

export const getReceiptById = async (receiptId) => {
  try {
    const docRef = doc(db, "receipts", receiptId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        success: true,
        data: {
          id: docSnap.id,
          ...docSnap.data()
        }
      };
    } else {
      return {
        success: false,
        error: "السند غير موجود"
      };
    }
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

// إضافة سند قبض مرتبط بحجز
export const addReceiptForBooking = async (bookingId, receiptData) => {
  return await addReceipt({ ...receiptData, bookingId });
};

export const addReceipt = async (receiptData) => {
  try {
    const dataToSave = {
      ...receiptData,
      amount: parseFloat(receiptData.amount),
      createdBy: receiptData.createdBy,
      createdByName: receiptData.createdByName,
      created_at: receiptData.created_at || serverTimestamp(),
      updated_at: receiptData.updated_at || serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "receipts"), dataToSave);
    
    return {
      success: true,
      id: docRef.id,
      data: {
        id: docRef.id,
        ...dataToSave
      }
    };
  } catch (error) {
    console.error("Error adding receipt:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

export const updateReceipt = async (receiptId, receiptData) => {
  try {
    const dataToUpdate = {
      ...receiptData,
      amount: parseFloat(receiptData.amount),
      updated_at: serverTimestamp()
    };

    await updateDoc(doc(db, "receipts", receiptId), dataToUpdate);
    
    return {
      success: true,
      id: receiptId,
      data: {
        id: receiptId,
        ...dataToUpdate
      }
    };
  } catch (error) {
    console.error("Error updating receipt:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

export const deleteReceipt = async (receiptId) => {
  try {
    await deleteDoc(doc(db, "receipts", receiptId));
    
    return {
      success: true,
      id: receiptId
    };
  } catch (error) {
    console.error("Error deleting receipt:", error);
    return { 
      success: false, 
      error: error.message,
      data: {}
    };
  }
};

export const getNextReceiptCode = async () => {
  try {
    const receiptsRef = collection(db, "receipts");
    const q = query(receiptsRef, orderBy("receiptNumber", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 'R0001';
    }
    
    const lastReceipt = querySnapshot.docs[0].data();
    const lastNumber = lastReceipt.receiptNumber || 'R0000';
    const numericPart = parseInt(lastNumber.substring(1), 10);
    const nextNumber = numericPart + 1;
    
    return `R${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error getting next receipt code:', error);
    return 'R0001';
  }
};
