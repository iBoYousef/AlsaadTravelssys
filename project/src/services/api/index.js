// تصدير جميع خدمات API من ملف واحد لتسهيل الاستيراد

import customerService from './customerService';
import flightService from './flightService';
import hotelService from './hotelService';
import visaService from './visaService';
import tourPackageService from './tourPackageService';
import tourBookingService from './tourBookingService';
import employeeService from './employeeService';
import reportService from './reportService';
import notificationService from './notificationService';
import paymentService from './paymentService';
import documentService from './documentService';

// تصدير الخدمات كافتراضي
export default {
  customerService,
  flightService,
  hotelService,
  visaService,
  tourPackageService,
  tourBookingService,
  employeeService,
  reportService,
  notificationService,
  paymentService,
  documentService
};

// تصدير الخدمات بشكل منفصل
export {
  customerService,
  flightService,
  hotelService,
  visaService,
  tourPackageService,
  tourBookingService,
  employeeService,
  reportService,
  notificationService,
  paymentService,
  documentService
};
