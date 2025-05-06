// تعريف جميع الصلاحيات المتاحة في النظام
export const permissions = {
  // إدارة المستخدمين
  users: {
    id: 'users',
    title: 'إدارة المستخدمين',
    description: 'الوصول إلى إدارة المستخدمين',
    category: 'system',
    level: 'write'
  },

  // إدارة الموظفين
  employees: {
    id: 'employees',
    title: 'إدارة الموظفين',
    description: 'الوصول إلى إدارة الموظفين',
    category: 'system',
    level: 'write'
  },

  // إدارة العملاء
  customers: {
    id: 'customers',
    title: 'إدارة العملاء',
    description: 'الوصول إلى إدارة العملاء',
    category: 'customers',
    level: 'write'
  },

  // حجوزات الطيران
  flight_bookings: {
    id: 'flight_bookings',
    title: 'حجوزات الطيران',
    description: 'إدارة حجوزات الطيران',
    category: 'bookings',
    level: 'write'
  },

  // حجوزات الفنادق
  hotel_bookings: {
    id: 'hotel_bookings',
    title: 'حجوزات الفنادق',
    description: 'إدارة حجوزات الفنادق',
    category: 'bookings',
    level: 'write'
  },

  // حجوزات المركبات
  vehicle_bookings: {
    id: 'vehicle_bookings',
    title: 'حجوزات المركبات',
    description: 'إدارة حجوزات المركبات',
    category: 'bookings',
    level: 'write'
  },

  // التأشيرات
  visa_applications: {
    id: 'visa_applications',
    title: 'التأشيرات',
    description: 'إدارة طلبات التأشيرات',
    category: 'visas',
    level: 'write'
  },

  // البرامج السياحية
  tour_packages: {
    id: 'tour_packages',
    title: 'البرامج السياحية',
    description: 'إدارة البرامج السياحية',
    category: 'tours',
    level: 'write'
  },

  // المحاسبة
  accounting: {
    id: 'accounting',
    title: 'المحاسبة',
    description: 'إدارة الحسابات والمالية',
    category: 'finance',
    level: 'write'
  },

  // المصروفات
  expenses: {
    id: 'expenses',
    title: 'المصروفات',
    description: 'إدارة المصروفات',
    category: 'finance',
    level: 'write',
    parent: 'accounting'
  },

  // الإيرادات
  revenues: {
    id: 'revenues',
    title: 'الإيرادات',
    description: 'إدارة الإيرادات',
    category: 'finance',
    level: 'write',
    parent: 'accounting'
  },

  // الفواتير
  invoices: {
    id: 'invoices',
    title: 'الفواتير',
    description: 'إدارة الفواتير',
    category: 'finance',
    level: 'write',
    parent: 'accounting'
  },

  // الإيصالات
  receipts: {
    id: 'receipts',
    title: 'الإيصالات',
    description: 'إدارة الإيصالات',
    category: 'finance',
    level: 'write',
    parent: 'accounting'
  },

  // التقارير
  reports: {
    id: 'reports',
    title: 'التقارير',
    description: 'عرض وإدارة التقارير',
    category: 'reports',
    level: 'read'
  },

  // الإعدادات
  settings: {
    id: 'settings',
    title: 'الإعدادات',
    description: 'إدارة إعدادات النظام',
    category: 'system',
    level: 'write'
  },

  // الإشعارات
  notifications: {
    id: 'notifications',
    title: 'الإشعارات',
    description: 'إدارة الإشعارات',
    category: 'system',
    level: 'write'
  }
};

// تعريف فئات الصلاحيات
export const permissionCategories = {
  system: {
    id: 'system',
    title: 'إدارة النظام',
    description: 'صلاحيات إدارة النظام'
  },
  customers: {
    id: 'customers',
    title: 'العملاء',
    description: 'صلاحيات إدارة العملاء'
  },
  bookings: {
    id: 'bookings',
    title: 'الحجوزات',
    description: 'صلاحيات إدارة الحجوزات'
  },
  visas: {
    id: 'visas',
    title: 'التأشيرات',
    description: 'صلاحيات إدارة التأشيرات'
  },
  tours: {
    id: 'tours',
    title: 'البرامج السياحية',
    description: 'صلاحيات إدارة البرامج السياحية'
  },
  finance: {
    id: 'finance',
    title: 'المالية',
    description: 'صلاحيات إدارة المالية والمحاسبة'
  },
  reports: {
    id: 'reports',
    title: 'التقارير',
    description: 'صلاحيات عرض التقارير'
  }
};

// تعريف مستويات الصلاحيات
export const permissionLevels = {
  read: 'read',
  write: 'write',
  delete: 'delete'
};

// تعريف الأدوار الوظيفية المتاحة في النظام
const roles = {
  admin: {
    title: 'مسؤول النظام',
    description: 'يملك جميع الصلاحيات في النظام',
    permissions: Object.keys(permissions),
    sections: ['all']
  },
  general_manager: {
    title: 'مدير عام',
    description: 'يملك صلاحيات الإدارة العامة للنظام',
    permissions: Object.keys(permissions).filter(p => !permissions[p].id.startsWith('delete_')),
    sections: ['all']
  },
  executive_manager: {
    title: 'مدير تنفيذي',
    description: 'يملك صلاحيات الإدارة التنفيذية للنظام',
    permissions: Object.keys(permissions).filter(p => !permissions[p].id.startsWith('delete_')),
    sections: ['all']
  },
  branch_manager: {
    title: 'مدير فرع',
    description: 'يملك صلاحيات إدارة الفرع',
    permissions: Object.keys(permissions).filter(p => 
      !permissions[p].id.startsWith('delete_') && 
      ['users', 'bookings', 'reports', 'customers'].includes(permissions[p].category)
    ),
    sections: ['users', 'bookings', 'reports', 'customers']
  },
  shift_supervisor: {
    title: 'مسؤول الشفت',
    description: 'يملك صلاحيات إدارة الشفت',
    permissions: Object.keys(permissions).filter(p => 
      !permissions[p].id.startsWith('delete_') && 
      !permissions[p].id.startsWith('edit_') && 
      ['bookings', 'customers'].includes(permissions[p].category)
    ),
    sections: ['bookings', 'customers']
  },
  booking_agent: {
    title: 'موظف حجوزات',
    description: 'يملك صلاحيات إدارة الحجوزات',
    permissions: Object.keys(permissions).filter(p => 
      !permissions[p].id.startsWith('delete_') && 
      !permissions[p].id.startsWith('edit_') && 
      ['bookings', 'customers'].includes(permissions[p].category)
    ),
    sections: ['bookings', 'customers']
  },
  accountant: {
    title: 'محاسب',
    description: 'يملك صلاحيات إدارة الحسابات',
    permissions: Object.keys(permissions).filter(p => 
      !permissions[p].id.startsWith('delete_') && 
      !permissions[p].id.startsWith('edit_') && 
      ['finance', 'reports'].includes(permissions[p].category) ||
      ['expenses', 'revenues', 'invoices', 'receipts'].includes(permissions[p].id)
    ),
    sections: ['finance', 'reports']
  }
};

// التحقق من وجود صلاحية معينة
export const hasPermission = (userPermissions, permission) => {
  if (!userPermissions || !permission) return false;
  return userPermissions.includes(permission) || userPermissions.includes('all');
};

// التحقق من مستوى الصلاحية
export const hasPermissionLevel = (userPermissions, category, level) => {
  if (!userPermissions || !category || !level) return false;
  return userPermissions.some(p => p.startsWith(category) && p.endsWith(level));
};

// الحصول على قائمة الصلاحيات حسب التصنيف
export const getPermissionsByCategory = () => {
  const categorizedPermissions = {};
  
  Object.entries(permissionCategories).forEach(([categoryId, category]) => {
    categorizedPermissions[categoryId] = {
      ...category,
      permissions: Object.values(permissions).filter(
        permission => permission.category === categoryId
      )
    };
  });

  return categorizedPermissions;
};

// الحصول على الصلاحيات حسب المستوى
export const getPermissionsByLevel = (level) => {
  return Object.values(permissions).filter(
    permission => permission.level === level
  );
};

export default {
  permissions,
  permissionCategories,
  permissionLevels,
  roles,
  hasPermission,
  hasPermissionLevel,
  getPermissionsByCategory,
  getPermissionsByLevel
};
