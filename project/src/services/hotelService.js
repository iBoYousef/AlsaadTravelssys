// بيانات وهمية للحجوزات
const mockHotelBookings = [
  { 
    id: 1, 
    bookingNumber: 'HB001',
    customerName: 'أحمد محمد',
    hotelName: 'فندق المكة الريتز كارلتون',
    checkIn: '2025-03-20',
    checkOut: '2025-03-25',
    roomType: 'غرفة ديلوكس',
    guests: 2,
    status: 'مؤكد'
  },
  { 
    id: 2, 
    bookingNumber: 'HB002',
    customerName: 'سارة عبدالله',
    hotelName: 'فندق المدينة هيلتون',
    checkIn: '2025-04-01',
    checkOut: '2025-04-05',
    roomType: 'جناح عائلي',
    guests: 4,
    status: 'مؤكد'
  }
];

const getHotelBookings = async () => {
  try {
    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: mockHotelBookings
    };
  } catch (error) {
    console.error('خطأ في جلب حجوزات الفنادق:', error);
    return { 
      success: false, 
      error: 'حدث خطأ أثناء جلب حجوزات الفنادق' 
    };
  }
};

const getHotelBooking = async (id) => {
  try {
    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 300));
    const booking = mockHotelBookings.find(b => b.id === id);
    
    if (!booking) {
      throw new Error('لم يتم العثور على الحجز');
    }

    return {
      success: true,
      data: booking
    };
  } catch (error) {
    console.error('خطأ في جلب بيانات الحجز:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء جلب بيانات الحجز' 
    };
  }
};

const deleteHotelBooking = async (id) => {
  try {
    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const bookingIndex = mockHotelBookings.findIndex(b => b.id === id);
    if (bookingIndex === -1) {
      throw new Error('لم يتم العثور على الحجز');
    }

    // في التطبيق الفعلي، سنقوم بحذف الحجز من قاعدة البيانات
    return { 
      success: true,
      message: 'تم حذف الحجز بنجاح'
    };
  } catch (error) {
    console.error('خطأ في حذف الحجز:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء حذف الحجز' 
    };
  }
};

export const addHotelBooking = async (bookingData) => {
  try {
    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 500));

    // التحقق من البيانات المطلوبة
    const requiredFields = ['customerName', 'hotelName', 'checkIn', 'checkOut', 'roomType', 'guests'];
    const missingFields = requiredFields.filter(field => !bookingData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
    }

    // في التطبيق الفعلي، سنقوم بإضافة الحجز إلى قاعدة البيانات
    const newBooking = {
      id: mockHotelBookings.length + 1,
      bookingNumber: `HB${String(mockHotelBookings.length + 1).padStart(3, '0')}`,
      status: 'مؤكد',
      ...bookingData
    };

    return { 
      success: true,
      data: newBooking,
      message: 'تم إضافة الحجز بنجاح'
    };
  } catch (error) {
    console.error('خطأ في إضافة الحجز:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء إضافة الحجز' 
    };
  }
};

const updateHotelBooking = async (id, bookingData) => {
  try {
    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 500));

    const bookingIndex = mockHotelBookings.findIndex(b => b.id === id);
    if (bookingIndex === -1) {
      throw new Error('لم يتم العثور على الحجز');
    }

    // في التطبيق الفعلي، سنقوم بتحديث الحجز في قاعدة البيانات
    const updatedBooking = {
      ...mockHotelBookings[bookingIndex],
      ...bookingData,
      updatedAt: new Date().toISOString()
    };

    return { 
      success: true,
      data: updatedBooking,
      message: 'تم تحديث الحجز بنجاح'
    };
  } catch (error) {
    console.error('خطأ في تحديث الحجز:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء تحديث الحجز' 
    };
  }
};
