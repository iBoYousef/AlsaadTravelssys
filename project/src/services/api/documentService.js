import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import firebaseServices from '../../firebase';

const { db, storage } = firebaseServices;
const COLLECTION_NAME = 'documents';

/**
 * خدمة إدارة المستندات والملفات
 * توفر واجهة موحدة للتعامل مع المستندات والملفات في النظام
 */
class DocumentService {
  /**
   * رفع ملف جديد
   * @param {File} file - الملف المراد رفعه
   * @param {string} path - المسار في التخزين
   * @returns {Promise<string>} - رابط الملف
   */
  async uploadFile(file, path) {
    try {
      // إنشاء مرجع للملف في التخزين
      const storageRef = ref(storage, path);
      
      // رفع الملف
      const snapshot = await uploadBytes(storageRef, file);
      
      // الحصول على رابط التنزيل
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('خطأ في رفع الملف:', error);
      throw error;
    }
  }

  /**
   * حذف ملف
   * @param {string} path - مسار الملف في التخزين
   * @returns {Promise<boolean>} - نجاح العملية
   */
  async deleteFile(path) {
    try {
      // إنشاء مرجع للملف في التخزين
      const storageRef = ref(storage, path);
      
      // حذف الملف
      await deleteObject(storageRef);
      
      return true;
    } catch (error) {
      console.error('خطأ في حذف الملف:', error);
      throw error;
    }
  }

  /**
   * إنشاء سجل مستند جديد
   * @param {Object} documentData - بيانات المستند
   * @returns {Promise<Object>} - بيانات المستند المنشأ
   */
  async createDocument(documentData) {
    try {
      // التحقق من البيانات الأساسية
      if (!documentData.name || !documentData.type || !documentData.url) {
        throw new Error('اسم ونوع ورابط المستند مطلوبة');
      }
      
      const document = {
        ...documentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), document);
      
      return {
        id: docRef.id,
        ...document
      };
    } catch (error) {
      console.error('خطأ في إنشاء سجل المستند:', error);
      throw error;
    }
  }

  /**
   * رفع ملف وإنشاء سجل مستند
   * @param {File} file - الملف المراد رفعه
   * @param {Object} metadata - بيانات المستند
   * @returns {Promise<Object>} - بيانات المستند المنشأ
   */
  async uploadDocument(file, metadata) {
    try {
      // التحقق من البيانات الأساسية
      if (!metadata.name || !metadata.type) {
        throw new Error('اسم ونوع المستند مطلوبة');
      }
      
      // إنشاء مسار للملف
      const path = this._generateFilePath(file.name, metadata);
      
      // رفع الملف
      const url = await this.uploadFile(file, path);
      
      // إنشاء سجل المستند
      const documentData = {
        ...metadata,
        url,
        path,
        size: file.size,
        mimeType: file.type
      };
      
      return this.createDocument(documentData);
    } catch (error) {
      console.error('خطأ في رفع المستند:', error);
      throw error;
    }
  }

  /**
   * الحصول على مستند بواسطة المعرف
   * @param {string} id - معرف المستند
   * @returns {Promise<Object|null>} - بيانات المستند
   */
  async getDocumentById(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`خطأ في جلب بيانات المستند (${id}):`, error);
      throw error;
    }
  }

  /**
   * البحث عن المستندات
   * @param {Object} filters - معايير البحث
   * @returns {Promise<Array>} - نتائج البحث
   */
  async searchDocuments(filters = {}) {
    try {
      let q = collection(db, COLLECTION_NAME);
      
      // إنشاء الاستعلام بناءً على المعايير المقدمة
      const queryConstraints = [];
      
      if (filters.entityId) {
        queryConstraints.push(where('entityId', '==', filters.entityId));
      }
      
      if (filters.entityType) {
        queryConstraints.push(where('entityType', '==', filters.entityType));
      }
      
      if (filters.type) {
        queryConstraints.push(where('type', '==', filters.type));
      }
      
      if (filters.category) {
        queryConstraints.push(where('category', '==', filters.category));
      }
      
      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status));
      }
      
      // إضافة الترتيب والحد الأقصى
      queryConstraints.push(orderBy('createdAt', 'desc'));
      queryConstraints.push(limit(filters.limit || 100));
      
      q = query(q, ...queryConstraints);
      
      const querySnapshot = await getDocs(q);
      let results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // تصفية إضافية على جانب العميل إذا لزم الأمر
      if (filters.name) {
        const searchTerm = filters.name.toLowerCase();
        results = results.filter(doc => 
          doc.name && doc.name.toLowerCase().includes(searchTerm)
        );
      }
      
      return results;
    } catch (error) {
      console.error('خطأ في البحث عن المستندات:', error);
      throw error;
    }
  }

  /**
   * تحديث بيانات مستند
   * @param {string} id - معرف المستند
   * @param {Object} documentData - بيانات المستند المحدثة
   * @returns {Promise<Object>} - بيانات المستند المحدثة
   */
  async updateDocument(id, documentData) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      await updateDoc(docRef, {
        ...documentData,
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        ...documentData
      };
    } catch (error) {
      console.error(`خطأ في تحديث بيانات المستند (${id}):`, error);
      throw error;
    }
  }

  /**
   * حذف مستند
   * @param {string} id - معرف المستند
   * @returns {Promise<boolean>} - نجاح العملية
   */
  async deleteDocument(id) {
    try {
      // الحصول على بيانات المستند
      const document = await this.getDocumentById(id);
      
      if (!document) {
        throw new Error('المستند غير موجود');
      }
      
      // حذف الملف من التخزين إذا كان له مسار
      if (document.path) {
        await this.deleteFile(document.path);
      }
      
      // حذف سجل المستند
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      
      return true;
    } catch (error) {
      console.error(`خطأ في حذف المستند (${id}):`, error);
      throw error;
    }
  }

  /**
   * تغيير حالة مستند
   * @param {string} id - معرف المستند
   * @param {string} status - الحالة الجديدة
   * @param {string} notes - ملاحظات إضافية (اختياري)
   * @returns {Promise<Object>} - بيانات المستند المحدثة
   */
  async changeDocumentStatus(id, status, notes = '') {
    try {
      const validStatuses = ['pending', 'approved', 'rejected', 'expired'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('حالة المستند غير صالحة');
      }
      
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData = {
        status,
        updatedAt: serverTimestamp(),
        statusHistory: {
          date: new Date(),
          status,
          notes
        }
      };
      
      await updateDoc(docRef, updateData);
      
      return {
        id,
        status,
        notes
      };
    } catch (error) {
      console.error(`خطأ في تغيير حالة المستند (${id}):`, error);
      throw error;
    }
  }

  /**
   * الحصول على مستندات كيان
   * @param {string} entityId - معرف الكيان
   * @param {string} entityType - نوع الكيان
   * @returns {Promise<Array>} - قائمة المستندات
   */
  async getEntityDocuments(entityId, entityType) {
    try {
      return this.searchDocuments({ entityId, entityType });
    } catch (error) {
      console.error(`خطأ في جلب مستندات الكيان (${entityType}/${entityId}):`, error);
      throw error;
    }
  }

  /**
   * إنشاء مسار للملف
   * @param {string} fileName - اسم الملف
   * @param {Object} metadata - بيانات المستند
   * @returns {string} - مسار الملف
   * @private
   */
  _generateFilePath(fileName, metadata) {
    // الحصول على امتداد الملف
    const extension = fileName.split('.').pop();
    
    // إنشاء اسم فريد للملف
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${extension}`;
    
    // إنشاء المسار بناءً على نوع الكيان ومعرفه
    let path = 'documents';
    
    if (metadata.entityType && metadata.entityId) {
      path += `/${metadata.entityType}/${metadata.entityId}`;
    }
    
    if (metadata.category) {
      path += `/${metadata.category}`;
    }
    
    path += `/${uniqueFileName}`;
    
    return path;
  }

  /**
   * رفع مستندات متعددة
   * @param {Array} files - قائمة الملفات
   * @param {Object} baseMetadata - البيانات الأساسية المشتركة
   * @returns {Promise<Array>} - قائمة المستندات المنشأة
   */
  async uploadMultipleDocuments(files, baseMetadata) {
    try {
      const uploadPromises = [];
      
      for (const file of files) {
        // دمج البيانات الأساسية مع بيانات الملف الحالي
        const metadata = {
          ...baseMetadata,
          name: file.name || baseMetadata.name
        };
        
        uploadPromises.push(this.uploadDocument(file, metadata));
      }
      
      return Promise.all(uploadPromises);
    } catch (error) {
      console.error('خطأ في رفع مستندات متعددة:', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المستندات
   * @param {Object} filters - معايير التصفية
   * @returns {Promise<Object>} - إحصائيات المستندات
   */
  async getDocumentStats(filters = {}) {
    try {
      // الحصول على المستندات المطابقة للمعايير
      const documents = await this.searchDocuments(filters);
      
      // تهيئة الإحصائيات
      const stats = {
        totalDocuments: documents.length,
        byStatus: {
          pending: 0,
          approved: 0,
          rejected: 0,
          expired: 0
        },
        byType: {},
        byCategory: {},
        byEntityType: {}
      };
      
      // حساب الإحصائيات
      documents.forEach(doc => {
        // عد الحالات
        if (doc.status) {
          stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
        }
        
        // عد الأنواع
        if (doc.type) {
          stats.byType[doc.type] = (stats.byType[doc.type] || 0) + 1;
        }
        
        // عد الفئات
        if (doc.category) {
          stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
        }
        
        // عد أنواع الكيانات
        if (doc.entityType) {
          stats.byEntityType[doc.entityType] = (stats.byEntityType[doc.entityType] || 0) + 1;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المستندات:', error);
      throw error;
    }
  }
}

// إنشاء نسخة واحدة من الخدمة للاستخدام في جميع أنحاء التطبيق
const documentService = new DocumentService();

export default documentService;
