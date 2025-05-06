export const addVehicleBooking = async (bookingData) => {
  // وظيفة وهمية لإضافة حجز مركبة
  return { success: true };
};

export const getVehicleBookings = async () => {
  try {
    // وظيفة وهمية لجلب بيانات حجوزات المركبات
    return {
      success: true,
      data: [
        { id: 1, bookingNumber: 'VB001', customerName: 'عميل 1', vehicleType: 'سيارة', bookingDate: '2025-01-01' },
        { id: 2, bookingNumber: 'VB002', customerName: 'عميل 2', vehicleType: 'دراجة', bookingDate: '2025-01-02' }
      ]
    };
  } catch (error) {
    return { success: false, message: 'خطأ في جلب بيانات حجوزات المركبات' };
  }
};

export const deleteVehicleBooking = async (bookingId) => {
  // Mock function to delete a vehicle booking
  return { success: true };
};
