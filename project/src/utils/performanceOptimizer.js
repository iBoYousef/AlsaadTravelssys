// أدوات لتحسين أداء التطبيق
import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * هوك لتخزين البيانات مؤقتًا وتقليل عدد الطلبات إلى Firestore
 * @param {Function} fetchFunction - دالة لجلب البيانات
 * @param {Array} dependencies - المتغيرات التي تؤثر على البيانات
 * @param {number} cacheTime - مدة صلاحية البيانات المخزنة بالدقائق (الافتراضي: 5 دقائق)
 * @returns {Object} - البيانات والحالة وإعادة التحميل
 */
export const useCachedData = (fetchFunction, dependencies = [], cacheTime = 5) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastFetchTime = useRef(null);
  const cacheTimeMs = cacheTime * 60 * 1000; // تحويل الدقائق إلى مللي ثانية
  
  const fetchData = useCallback(async (forceRefresh = false) => {
    // التحقق من وجود بيانات مخزنة صالحة
    const now = Date.now();
    const isCacheValid = lastFetchTime.current && 
                        (now - lastFetchTime.current < cacheTimeMs);
    
    // استخدام البيانات المخزنة إذا كانت صالحة ولم يتم طلب تحديث إجباري
    if (data && isCacheValid && !forceRefresh) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const result = await fetchFunction();
      setData(result);
      setError(null);
      lastFetchTime.current = Date.now();
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, cacheTimeMs, data]);
  
  // إعادة تحميل البيانات عند تغير المتغيرات المؤثرة
  useEffect(() => {
    fetchData();
  }, [...dependencies, fetchData]);
  
  return { data, loading, error, refetch: () => fetchData(true) };
};

/**
 * هوك لتحميل البيانات بشكل تدريجي (pagination)
 * @param {Function} fetchFunction - دالة لجلب البيانات (تأخذ limit و startAfter)
 * @param {number} pageSize - عدد العناصر في الصفحة الواحدة
 * @returns {Object} - البيانات والحالة ودوال التحكم
 */
export const usePaginatedData = (fetchFunction, pageSize = 10) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const lastDoc = useRef(null);
  
  const loadPage = useCallback(async (reset = false) => {
    if (loading) return;
    
    // إعادة تعيين البيانات إذا تم طلب ذلك
    if (reset) {
      setData([]);
      lastDoc.current = null;
      setHasMore(true);
    }
    
    // عدم تحميل المزيد إذا لم يكن هناك المزيد
    if (!hasMore && !reset) return;
    
    setLoading(true);
    try {
      const result = await fetchFunction(pageSize, lastDoc.current);
      
      if (result.items.length < pageSize) {
        setHasMore(false);
      }
      
      if (result.lastDoc) {
        lastDoc.current = result.lastDoc;
      }
      
      setData(prev => reset ? result.items : [...prev, ...result.items]);
      setError(null);
    } catch (err) {
      console.error('Error loading paginated data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, pageSize, loading, hasMore]);
  
  // تحميل الصفحة الأولى عند التهيئة
  useEffect(() => {
    loadPage(true);
  }, []);
  
  return {
    data,
    loading,
    error,
    hasMore,
    loadMore: () => loadPage(false),
    refresh: () => loadPage(true)
  };
};

/**
 * هوك لتأخير تنفيذ البحث لتقليل عدد الطلبات
 * @param {Function} searchFunction - دالة البحث
 * @param {number} delay - التأخير بالمللي ثانية (الافتراضي: 500)
 * @returns {Function} - دالة البحث المؤجلة
 */
export const useDebounce = (searchFunction, delay = 500) => {
  const timerRef = useRef(null);
  
  const debouncedSearch = useCallback((...args) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    return new Promise(resolve => {
      timerRef.current = setTimeout(async () => {
        try {
          const result = await searchFunction(...args);
          resolve(result);
        } catch (error) {
          console.error('Error in debounced search:', error);
          resolve([]);
        }
      }, delay);
    });
  }, [searchFunction, delay]);
  
  // تنظيف المؤقت عند إزالة المكون
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  return debouncedSearch;
};

/**
 * تحسين حجم الصور قبل رفعها
 * @param {File} file - ملف الصورة
 * @param {Object} options - خيارات التحسين
 * @returns {Promise<Blob>} - الصورة المحسنة
 */
export const optimizeImage = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'jpeg'
  } = options;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // حساب الأبعاد الجديدة مع الحفاظ على النسبة
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // إنشاء canvas لرسم الصورة المحسنة
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // تحويل الصورة إلى blob
        canvas.toBlob(
          (blob) => resolve(blob),
          `image/${format}`,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('فشل تحميل الصورة'));
      };
      
      img.src = event.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('فشل قراءة الملف'));
    };
    
    reader.readAsDataURL(file);
  });
};

export default {
  useCachedData,
  usePaginatedData,
  useDebounce,
  optimizeImage
};
