import { db } from '../firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

// الحصول على قائمة حجوزات التأشيرات
export const getVisaBookings = async (filters = {}) => {
  try {
    let visaQuery = collection(db, 'visaBookings');
    
    // إضافة الفلاتر إذا وجدت
    if (filters.customerId) {
      visaQuery = query(visaQuery, where('customerId', '==', filters.customerId));
    }
    if (filters.status) {
      visaQuery = query(visaQuery, where('status', '==', filters.status));
    }
    if (filters.fromDate && filters.toDate) {
      visaQuery = query(
        visaQuery,
        where('createdAt', '>=', Timestamp.fromDate(new Date(filters.fromDate))),
        where('createdAt', '<=', Timestamp.fromDate(new Date(filters.toDate)))
      );
    }

    // ترتيب النتائج
    visaQuery = query(visaQuery, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(visaQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting visa bookings:', error);
    throw error;
  }
};

// إضافة أو تحديث حجز تأشيرة
export const addVisaBooking = async (bookingData, bookingId = null) => {
  try {
    const finalData = {
      ...bookingData,
      updatedAt: Timestamp.now(),
      status: bookingData.status || 'pending'
    };

    if (bookingId) {
      // تحديث حجز موجود
      await updateDoc(doc(db, 'visaBookings', bookingId), finalData);
      return bookingId;
    } else {
      // إضافة حجز جديد
      finalData.createdAt = Timestamp.now();
      const docRef = await addDoc(collection(db, 'visaBookings'), finalData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error adding/updating visa booking:', error);
    throw error;
  }
};

// حذف حجز تأشيرة
export const deleteVisaBooking = async (bookingId) => {
  try {
    await deleteDoc(doc(db, 'visaBookings', bookingId));
  } catch (error) {
    console.error('Error deleting visa booking:', error);
    throw error;
  }
};

// تحديث حالة التأشيرة
export const updateVisaStatus = async (bookingId, status, notes = '') => {
  try {
    await updateDoc(doc(db, 'visaBookings', bookingId), {
      status,
      statusNotes: notes,
      statusUpdatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating visa status:', error);
    throw error;
  }
};

// الحصول على إحصائيات التأشيرات
export const getVisaStats = async (fromDate, toDate) => {
  try {
    const visaQuery = query(
      collection(db, 'visaBookings'),
      where('createdAt', '>=', Timestamp.fromDate(new Date(fromDate))),
      where('createdAt', '<=', Timestamp.fromDate(new Date(toDate)))
    );

    const querySnapshot = await getDocs(visaQuery);
    const bookings = querySnapshot.docs.map(doc => doc.data());

    return {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, booking) => sum + (parseFloat(booking.price) || 0), 0),
      totalCost: bookings.reduce((sum, booking) => sum + (parseFloat(booking.cost) || 0), 0),
      byStatus: bookings.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {}),
      byType: bookings.reduce((acc, booking) => {
        acc[booking.visaType] = (acc[booking.visaType] || 0) + 1;
        return acc;
      }, {}),
      byCountry: bookings.reduce((acc, booking) => {
        acc[booking.country] = (acc[booking.country] || 0) + 1;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error getting visa statistics:', error);
    throw error;
  }
};
