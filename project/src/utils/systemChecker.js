/**
 * نظام فحص وتدقيق قاعدة البيانات
 * 
 * هذا الملف يحتوي على وظائف لفحص سلامة البيانات والترابط بين الجداول
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  getDoc,
  limit,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * فحص الترابط بين الجداول
 * @returns {Promise<Object>} - نتيجة الفحص
 */
export const checkDatabaseRelations = async () => {
  try {
    const results = {
      success: true,
      issues: [],
      stats: {}
    };

    // فحص ترابط العملاء مع الفواتير
    const customerInvoiceResults = await checkCustomerInvoiceRelations();
    results.stats.customerInvoices = customerInvoiceResults.stats;
    results.issues = [...results.issues, ...customerInvoiceResults.issues];

    // فحص ترابط العملاء مع الحجوزات
    const customerBookingResults = await checkCustomerBookingRelations();
    results.stats.customerBookings = customerBookingResults.stats;
    results.issues = [...results.issues, ...customerBookingResults.issues];

    // فحص ترابط البرامج السياحية مع الحجوزات
    const packageBookingResults = await checkPackageBookingRelations();
    results.stats.packageBookings = packageBookingResults.stats;
    results.issues = [...results.issues, ...packageBookingResults.issues];

    // فحص ترابط الفواتير مع سندات القبض
    const invoiceReceiptResults = await checkInvoiceReceiptRelations();
    results.stats.invoiceReceipts = invoiceReceiptResults.stats;
    results.issues = [...results.issues, ...invoiceReceiptResults.issues];

    // تحديد نجاح العملية بناءً على وجود مشاكل
    results.success = results.issues.length === 0;
    
    return results;
  } catch (error) {
    console.error('خطأ في فحص ترابط قاعدة البيانات:', error);
    return { 
      success: false, 
      error: error.message,
      issues: [{
        type: 'system',
        severity: 'error',
        message: 'حدث خطأ أثناء فحص قاعدة البيانات',
        details: error.message
      }]
    };
  }
};

/**
 * فحص ترابط العملاء مع الفواتير
 * @returns {Promise<Object>} - نتيجة الفحص
 */
const checkCustomerInvoiceRelations = async () => {
  const issues = [];
  const stats = {
    totalInvoices: 0,
    validRelations: 0,
    brokenRelations: 0
  };

  try {
    // الحصول على جميع الفواتير
    const invoicesQuery = query(collection(db, 'invoices'), limit(1000));
    const invoicesSnapshot = await getDocs(invoicesQuery);
    stats.totalInvoices = invoicesSnapshot.size;

    // فحص كل فاتورة
    for (const invoiceDoc of invoicesSnapshot.docs) {
      const invoice = invoiceDoc.data();
      
      if (invoice.customerId) {
        // التحقق من وجود العميل
        const customerRef = doc(db, 'customers', invoice.customerId);
        const customerDoc = await getDoc(customerRef);
        
        if (!customerDoc.exists()) {
          issues.push({
            type: 'relation',
            severity: 'warning',
            message: `فاتورة مرتبطة بعميل غير موجود`,
            details: `الفاتورة رقم ${invoice.invoiceNumber || invoiceDoc.id} مرتبطة بالعميل رقم ${invoice.customerId} الذي لم يعد موجوداً`
          });
          stats.brokenRelations++;
        } else {
          stats.validRelations++;
        }
      }
    }

    return { issues, stats };
  } catch (error) {
    console.error('خطأ في فحص ترابط العملاء مع الفواتير:', error);
    issues.push({
      type: 'system',
      severity: 'error',
      message: 'حدث خطأ أثناء فحص ترابط العملاء مع الفواتير',
      details: error.message
    });
    return { issues, stats };
  }
};

/**
 * فحص ترابط العملاء مع الحجوزات
 * @returns {Promise<Object>} - نتيجة الفحص
 */
const checkCustomerBookingRelations = async () => {
  const issues = [];
  const stats = {
    totalBookings: 0,
    validRelations: 0,
    brokenRelations: 0
  };

  try {
    // الحصول على جميع الحجوزات
    const bookingsQuery = query(collection(db, 'tourBookings'), limit(1000));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    stats.totalBookings = bookingsSnapshot.size;

    // فحص كل حجز
    for (const bookingDoc of bookingsSnapshot.docs) {
      const booking = bookingDoc.data();
      
      if (booking.customerId) {
        // التحقق من وجود العميل
        const customerRef = doc(db, 'customers', booking.customerId);
        const customerDoc = await getDoc(customerRef);
        
        if (!customerDoc.exists()) {
          issues.push({
            type: 'relation',
            severity: 'warning',
            message: `حجز مرتبط بعميل غير موجود`,
            details: `الحجز رقم ${booking.bookingNumber || bookingDoc.id} مرتبط بالعميل رقم ${booking.customerId} الذي لم يعد موجوداً`
          });
          stats.brokenRelations++;
        } else {
          stats.validRelations++;
        }
      }
    }

    return { issues, stats };
  } catch (error) {
    console.error('خطأ في فحص ترابط العملاء مع الحجوزات:', error);
    issues.push({
      type: 'system',
      severity: 'error',
      message: 'حدث خطأ أثناء فحص ترابط العملاء مع الحجوزات',
      details: error.message
    });
    return { issues, stats };
  }
};

/**
 * فحص ترابط البرامج السياحية مع الحجوزات
 * @returns {Promise<Object>} - نتيجة الفحص
 */
const checkPackageBookingRelations = async () => {
  const issues = [];
  const stats = {
    totalBookings: 0,
    validRelations: 0,
    brokenRelations: 0
  };

  try {
    // الحصول على جميع الحجوزات
    const bookingsQuery = query(collection(db, 'tourBookings'), limit(1000));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    stats.totalBookings = bookingsSnapshot.size;

    // فحص كل حجز
    for (const bookingDoc of bookingsSnapshot.docs) {
      const booking = bookingDoc.data();
      
      if (booking.packageId) {
        // التحقق من وجود البرنامج السياحي
        const packageRef = doc(db, 'tourPackages', booking.packageId);
        const packageDoc = await getDoc(packageRef);
        
        if (!packageDoc.exists()) {
          issues.push({
            type: 'relation',
            severity: 'warning',
            message: `حجز مرتبط ببرنامج سياحي غير موجود`,
            details: `الحجز رقم ${booking.bookingNumber || bookingDoc.id} مرتبط بالبرنامج السياحي رقم ${booking.packageId} الذي لم يعد موجوداً`
          });
          stats.brokenRelations++;
        } else {
          stats.validRelations++;
        }
      }
    }

    return { issues, stats };
  } catch (error) {
    console.error('خطأ في فحص ترابط البرامج السياحية مع الحجوزات:', error);
    issues.push({
      type: 'system',
      severity: 'error',
      message: 'حدث خطأ أثناء فحص ترابط البرامج السياحية مع الحجوزات',
      details: error.message
    });
    return { issues, stats };
  }
};

/**
 * فحص ترابط الفواتير مع سندات القبض
 * @returns {Promise<Object>} - نتيجة الفحص
 */
const checkInvoiceReceiptRelations = async () => {
  const issues = [];
  const stats = {
    totalReceipts: 0,
    validRelations: 0,
    brokenRelations: 0
  };

  try {
    // الحصول على جميع سندات القبض
    const receiptsQuery = query(collection(db, 'receipts'), limit(1000));
    const receiptsSnapshot = await getDocs(receiptsQuery);
    stats.totalReceipts = receiptsSnapshot.size;

    // فحص كل سند
    for (const receiptDoc of receiptsSnapshot.docs) {
      const receipt = receiptDoc.data();
      
      if (receipt.invoiceId) {
        // التحقق من وجود الفاتورة
        const invoiceRef = doc(db, 'invoices', receipt.invoiceId);
        const invoiceDoc = await getDoc(invoiceRef);
        
        if (!invoiceDoc.exists()) {
          issues.push({
            type: 'relation',
            severity: 'warning',
            message: `سند قبض مرتبط بفاتورة غير موجودة`,
            details: `سند القبض رقم ${receipt.receiptNumber || receiptDoc.id} مرتبط بالفاتورة رقم ${receipt.invoiceId} التي لم تعد موجودة`
          });
          stats.brokenRelations++;
        } else {
          stats.validRelations++;
        }
      }
    }

    return { issues, stats };
  } catch (error) {
    console.error('خطأ في فحص ترابط الفواتير مع سندات القبض:', error);
    issues.push({
      type: 'system',
      severity: 'error',
      message: 'حدث خطأ أثناء فحص ترابط الفواتير مع سندات القبض',
      details: error.message
    });
    return { issues, stats };
  }
};

/**
 * فحص سلامة البيانات في قاعدة البيانات
 * @returns {Promise<Object>} - نتيجة الفحص
 */
export const checkDataIntegrity = async () => {
  try {
    const results = {
      success: true,
      issues: [],
      stats: {}
    };

    // فحص سلامة بيانات العملاء
    const customerResults = await checkCustomerDataIntegrity();
    results.stats.customers = customerResults.stats;
    results.issues = [...results.issues, ...customerResults.issues];

    // فحص سلامة بيانات الفواتير
    const invoiceResults = await checkInvoiceDataIntegrity();
    results.stats.invoices = invoiceResults.stats;
    results.issues = [...results.issues, ...invoiceResults.issues];

    // فحص سلامة بيانات البرامج السياحية
    const packageResults = await checkTourPackageDataIntegrity();
    results.stats.tourPackages = packageResults.stats;
    results.issues = [...results.issues, ...packageResults.issues];

    // تحديد نجاح العملية بناءً على وجود مشاكل
    results.success = results.issues.length === 0;
    
    return results;
  } catch (error) {
    console.error('خطأ في فحص سلامة البيانات:', error);
    return { 
      success: false, 
      error: error.message,
      issues: [{
        type: 'system',
        severity: 'error',
        message: 'حدث خطأ أثناء فحص سلامة البيانات',
        details: error.message
      }]
    };
  }
};

/**
 * فحص سلامة بيانات العملاء
 * @returns {Promise<Object>} - نتيجة الفحص
 */
const checkCustomerDataIntegrity = async () => {
  const issues = [];
  const stats = {
    totalCustomers: 0,
    validCustomers: 0,
    invalidCustomers: 0
  };

  try {
    // الحصول على جميع العملاء
    const customersQuery = query(collection(db, 'customers'), limit(1000));
    const customersSnapshot = await getDocs(customersQuery);
    stats.totalCustomers = customersSnapshot.size;

    // فحص كل عميل
    for (const customerDoc of customersSnapshot.docs) {
      const customer = customerDoc.data();
      let isValid = true;
      
      // التحقق من وجود الحقول الإلزامية
      if (!customer.name) {
        issues.push({
          type: 'data',
          severity: 'warning',
          message: `عميل بدون اسم`,
          details: `العميل رقم ${customerDoc.id} ليس له اسم محدد`
        });
        isValid = false;
      }
      
      // التحقق من صحة رقم الهاتف
      if (customer.phone && !/^\d{7,15}$/.test(customer.phone.replace(/\D/g, ''))) {
        issues.push({
          type: 'data',
          severity: 'info',
          message: `رقم هاتف عميل غير صحيح`,
          details: `العميل ${customer.name || customerDoc.id} له رقم هاتف غير صحيح: ${customer.phone}`
        });
        isValid = false;
      }
      
      // التحقق من صحة البريد الإلكتروني
      if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
        issues.push({
          type: 'data',
          severity: 'info',
          message: `بريد إلكتروني غير صحيح`,
          details: `العميل ${customer.name || customerDoc.id} له بريد إلكتروني غير صحيح: ${customer.email}`
        });
        isValid = false;
      }
      
      if (isValid) {
        stats.validCustomers++;
      } else {
        stats.invalidCustomers++;
      }
    }

    return { issues, stats };
  } catch (error) {
    console.error('خطأ في فحص سلامة بيانات العملاء:', error);
    issues.push({
      type: 'system',
      severity: 'error',
      message: 'حدث خطأ أثناء فحص سلامة بيانات العملاء',
      details: error.message
    });
    return { issues, stats };
  }
};

/**
 * فحص سلامة بيانات الفواتير
 * @returns {Promise<Object>} - نتيجة الفحص
 */
const checkInvoiceDataIntegrity = async () => {
  const issues = [];
  const stats = {
    totalInvoices: 0,
    validInvoices: 0,
    invalidInvoices: 0
  };

  try {
    // الحصول على جميع الفواتير
    const invoicesQuery = query(collection(db, 'invoices'), limit(1000));
    const invoicesSnapshot = await getDocs(invoicesQuery);
    stats.totalInvoices = invoicesSnapshot.size;

    // فحص كل فاتورة
    for (const invoiceDoc of invoicesSnapshot.docs) {
      const invoice = invoiceDoc.data();
      let isValid = true;
      
      // التحقق من وجود رقم الفاتورة
      if (!invoice.invoiceNumber) {
        issues.push({
          type: 'data',
          severity: 'warning',
          message: `فاتورة بدون رقم`,
          details: `الفاتورة رقم ${invoiceDoc.id} ليس لها رقم فاتورة محدد`
        });
        isValid = false;
      }
      
      // التحقق من وجود تاريخ الفاتورة
      if (!invoice.date) {
        issues.push({
          type: 'data',
          severity: 'warning',
          message: `فاتورة بدون تاريخ`,
          details: `الفاتورة رقم ${invoice.invoiceNumber || invoiceDoc.id} ليس لها تاريخ محدد`
        });
        isValid = false;
      }
      
      // التحقق من وجود عناصر الفاتورة
      if (!invoice.items || !Array.isArray(invoice.items) || invoice.items.length === 0) {
        issues.push({
          type: 'data',
          severity: 'warning',
          message: `فاتورة بدون عناصر`,
          details: `الفاتورة رقم ${invoice.invoiceNumber || invoiceDoc.id} ليس لها عناصر محددة`
        });
        isValid = false;
      }
      
      // التحقق من صحة المبلغ الإجمالي
      if (typeof invoice.total !== 'number' || isNaN(invoice.total)) {
        issues.push({
          type: 'data',
          severity: 'warning',
          message: `مبلغ فاتورة غير صحيح`,
          details: `الفاتورة رقم ${invoice.invoiceNumber || invoiceDoc.id} لها مبلغ إجمالي غير صحيح: ${invoice.total}`
        });
        isValid = false;
      }
      
      if (isValid) {
        stats.validInvoices++;
      } else {
        stats.invalidInvoices++;
      }
    }

    return { issues, stats };
  } catch (error) {
    console.error('خطأ في فحص سلامة بيانات الفواتير:', error);
    issues.push({
      type: 'system',
      severity: 'error',
      message: 'حدث خطأ أثناء فحص سلامة بيانات الفواتير',
      details: error.message
    });
    return { issues, stats };
  }
};

/**
 * فحص سلامة بيانات البرامج السياحية
 * @returns {Promise<Object>} - نتيجة الفحص
 */
const checkTourPackageDataIntegrity = async () => {
  const issues = [];
  const stats = {
    totalPackages: 0,
    validPackages: 0,
    invalidPackages: 0
  };

  try {
    // الحصول على جميع البرامج السياحية
    const packagesQuery = query(collection(db, 'tourPackages'), limit(1000));
    const packagesSnapshot = await getDocs(packagesQuery);
    stats.totalPackages = packagesSnapshot.size;

    // فحص كل برنامج
    for (const packageDoc of packagesSnapshot.docs) {
      const tourPackage = packageDoc.data();
      let isValid = true;
      
      // التحقق من وجود اسم البرنامج
      if (!tourPackage.name) {
        issues.push({
          type: 'data',
          severity: 'warning',
          message: `برنامج سياحي بدون اسم`,
          details: `البرنامج السياحي رقم ${packageDoc.id} ليس له اسم محدد`
        });
        isValid = false;
      }
      
      // التحقق من وجود الوجهة
      if (!tourPackage.destination) {
        issues.push({
          type: 'data',
          severity: 'info',
          message: `برنامج سياحي بدون وجهة`,
          details: `البرنامج السياحي ${tourPackage.name || packageDoc.id} ليس له وجهة محددة`
        });
        isValid = false;
      }
      
      // التحقق من صحة السعر
      if (typeof tourPackage.price !== 'number' || isNaN(tourPackage.price)) {
        issues.push({
          type: 'data',
          severity: 'warning',
          message: `سعر برنامج سياحي غير صحيح`,
          details: `البرنامج السياحي ${tourPackage.name || packageDoc.id} له سعر غير صحيح: ${tourPackage.price}`
        });
        isValid = false;
      }
      
      if (isValid) {
        stats.validPackages++;
      } else {
        stats.invalidPackages++;
      }
    }

    return { issues, stats };
  } catch (error) {
    console.error('خطأ في فحص سلامة بيانات البرامج السياحية:', error);
    issues.push({
      type: 'system',
      severity: 'error',
      message: 'حدث خطأ أثناء فحص سلامة بيانات البرامج السياحية',
      details: error.message
    });
    return { issues, stats };
  }
};

// تصدير جميع الدوال
export default {
  checkDatabaseRelations,
  checkDataIntegrity
};
