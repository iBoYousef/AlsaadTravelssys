// تعريف هياكل البيانات للجداول

export const DB_SCHEMAS = {
  // جدول المستخدمين
  users: {
    fields: {
      email: 'string',
      name: 'string',
      phone: 'string',
      jobTitle: 'string',
      permissions: 'array',
      employeeId: 'number',
      isActive: 'boolean',
      lastLoginAt: 'timestamp',
      createdAt: 'timestamp',
      createdBy: 'string',
      updatedAt: 'timestamp',
      updatedBy: 'string'
    }
  },

  // جدول العملاء
  customers: {
    fields: {
      name: 'string',
      email: 'string',
      phone: 'string',
      nationality: 'string',
      passportNumber: 'string',
      passportExpiry: 'date',
      address: 'string',
      notes: 'string',
      isActive: 'boolean',
      createdAt: 'timestamp',
      createdBy: 'string',
      updatedAt: 'timestamp',
      updatedBy: 'string',
      isDemo: 'boolean'
    }
  },

  // جدول حجوزات الطيران
  flights: {
    fields: {
      customerId: 'string',
      from: 'string',
      to: 'string',
      departureDate: 'date',
      returnDate: 'date',
      airline: 'string',
      flightNumber: 'string',
      ticketNumber: 'string',
      price: 'number',
      status: 'string', // confirmed, cancelled, pending
      notes: 'string',
      createdAt: 'timestamp',
      createdBy: 'string',
      updatedAt: 'timestamp',
      updatedBy: 'string',
      isDemo: 'boolean'
    }
  },

  // جدول حجوزات الفنادق
  hotels: {
    fields: {
      customerId: 'string',
      hotelName: 'string',
      city: 'string',
      checkIn: 'date',
      checkOut: 'date',
      roomType: 'string',
      numberOfRooms: 'number',
      numberOfGuests: 'number',
      price: 'number',
      status: 'string', // confirmed, cancelled, pending
      notes: 'string',
      createdAt: 'timestamp',
      createdBy: 'string',
      updatedAt: 'timestamp',
      updatedBy: 'string',
      isDemo: 'boolean'
    }
  },

  // جدول حجوزات المركبات
  vehicles: {
    fields: {
      customerId: 'string',
      vehicleType: 'string',
      model: 'string',
      startDate: 'date',
      endDate: 'date',
      numberOfDays: 'number',
      price: 'number',
      status: 'string', // confirmed, cancelled, pending
      notes: 'string',
      createdAt: 'timestamp',
      createdBy: 'string',
      updatedAt: 'timestamp',
      updatedBy: 'string',
      isDemo: 'boolean'
    }
  },

  // جدول التأشيرات
  visas: {
    fields: {
      customerId: 'string',
      country: 'string',
      type: 'string',
      duration: 'string',
      startDate: 'date',
      endDate: 'date',
      status: 'string', // issued, pending, rejected
      price: 'number',
      notes: 'string',
      createdAt: 'timestamp',
      createdBy: 'string',
      updatedAt: 'timestamp',
      updatedBy: 'string',
      isDemo: 'boolean'
    }
  },

  // جدول الفعاليات
  events: {
    fields: {
      name: 'string',
      description: 'string',
      location: 'string',
      startDate: 'date',
      endDate: 'date',
      price: 'number',
      capacity: 'number',
      bookedCount: 'number',
      status: 'string', // active, cancelled, completed
      notes: 'string',
      createdAt: 'timestamp',
      createdBy: 'string',
      updatedAt: 'timestamp',
      updatedBy: 'string',
      isDemo: 'boolean'
    }
  },

  // جدول الإيرادات
  revenues: {
    fields: {
      type: 'string', // flight, hotel, vehicle, visa, event
      referenceId: 'string', // ID from the related collection
      customerId: 'string',
      description: 'string',
      amount: 'number',
      paymentMethod: 'string',
      paymentStatus: 'string', // paid, pending, refunded
      transactionDate: 'date',
      notes: 'string',
      createdAt: 'timestamp',
      createdBy: 'string',
      updatedAt: 'timestamp',
      updatedBy: 'string',
      isDemo: 'boolean'
    }
  },

  // جدول المصروفات
  expenses: {
    fields: {
      category: 'string',
      description: 'string',
      amount: 'number',
      paymentMethod: 'string',
      paymentStatus: 'string', // paid, pending
      transactionDate: 'date',
      notes: 'string',
      createdAt: 'timestamp',
      createdBy: 'string',
      updatedAt: 'timestamp',
      updatedBy: 'string',
      isDemo: 'boolean'
    }
  }
};

// دالة للحصول على هيكل بيانات فارغ لجدول معين
export const getEmptyDocument = (collectionName) => {
  const schema = DB_SCHEMAS[collectionName];
  if (!schema) {
    throw new Error(`Schema not found for collection: ${collectionName}`);
  }

  const emptyDoc = {};
  for (const [field, type] of Object.entries(schema.fields)) {
    switch (type) {
      case 'string':
        emptyDoc[field] = '';
        break;
      case 'number':
        emptyDoc[field] = 0;
        break;
      case 'boolean':
        emptyDoc[field] = false;
        break;
      case 'array':
        emptyDoc[field] = [];
        break;
      case 'date':
      case 'timestamp':
        emptyDoc[field] = null;
        break;
      default:
        emptyDoc[field] = null;
    }
  }
  return emptyDoc;
};

// دالة للتحقق من صحة البيانات
export const validateDocument = (collectionName, data) => {
  const schema = DB_SCHEMAS[collectionName];
  if (!schema) {
    throw new Error(`Schema not found for collection: ${collectionName}`);
  }

  const errors = [];
  for (const [field, type] of Object.entries(schema.fields)) {
    if (data[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    const value = data[field];
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Field ${field} must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          errors.push(`Field ${field} must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Field ${field} must be a boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`Field ${field} must be an array`);
        }
        break;
      case 'date':
        if (!(value instanceof Date) && value !== null) {
          errors.push(`Field ${field} must be a date`);
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
