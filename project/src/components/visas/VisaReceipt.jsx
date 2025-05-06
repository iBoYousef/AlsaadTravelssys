import React from 'react';
import { formatCurrency } from '../../utils/formatters';
const logo = '/logo.png';

const VisaReceipt = React.forwardRef(({ booking, visas, customer }, ref) => {
  // حساب المجاميع
  const totalCost = visas.reduce((sum, visa) => sum + parseFloat(visa.cost || 0), 0);
  const totalPrice = visas.reduce((sum, visa) => sum + parseFloat(visa.price || 0), 0);
  
  // تنسيق التاريخ
  const formatDate = (date) => {
    if (!date) return '-';
    if (typeof date === 'object' && date.toDate) {
      date = date.toDate();
    }
    if (date instanceof Date) {
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return date;
  };
  
  // تحويل طريقة الدفع إلى نص عربي
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'knet': return 'كي نت';
      case 'cash': return 'نقدي';
      case 'visa': return 'فيزا';
      case 'mastercard': return 'ماستر كارد';
      case 'deferred': return 'آجل';
      case 'installments': return 'أقساط';
      default: return method || '-';
    }
  };
  
  return (
    <div ref={ref} className="p-8 max-w-4xl mx-auto bg-white">
      {/* ترويسة الإيصال */}
      <div className="text-center mb-6 border-b pb-6">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="شركة السعد للسياحة والسفر" className="h-16" />
        </div>
        <h1 className="text-2xl font-bold">شركة السعد للسياحة والسفر</h1>
        <p className="text-gray-600">الكويت - شارع فهد السالم - مجمع الصالحية - الدور الثاني</p>
        <p className="text-gray-600">هاتف: 22400900 - 22400600</p>
        <h2 className="text-xl font-bold mt-4">إيصال حجز تأشيرة</h2>
      </div>
      
      {/* معلومات الإيصال */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p><strong>رقم الإيصال:</strong> {booking.payment?.receiptNumber || '-'}</p>
          <p><strong>تاريخ الإصدار:</strong> {formatDate(booking.createdAt)}</p>
          <p><strong>حالة الحجز:</strong> {booking.status === 'pending' ? 'قيد الانتظار' : booking.status === 'completed' ? 'مكتمل' : booking.status || '-'}</p>
        </div>
        <div>
          <p><strong>طريقة الدفع:</strong> {getPaymentMethodText(booking.payment?.paymentMethod)}</p>
          <p><strong>تاريخ الدفع:</strong> {formatDate(booking.payment?.paymentDate)}</p>
          {booking.payment?.paymentMethod === 'deferred' && (
            <p><strong>تاريخ الدفع الآجل:</strong> {formatDate(booking.payment?.deferredPaymentDate)}</p>
          )}
        </div>
      </div>
      
      {/* معلومات العميل */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">معلومات العميل</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>الاسم:</strong> {customer.name}</p>
            <p><strong>رقم الهاتف:</strong> {customer.phone}</p>
          </div>
          <div>
            <p><strong>البريد الإلكتروني:</strong> {customer.email || '-'}</p>
            <p><strong>الرقم المدني:</strong> {customer.civilId || '-'}</p>
          </div>
        </div>
      </div>
      
      {/* تفاصيل التأشيرات */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">تفاصيل التأشيرات</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-right">#</th>
              <th className="border p-2 text-right">نوع التأشيرة</th>
              <th className="border p-2 text-right">الدولة</th>
              <th className="border p-2 text-right">المدة</th>
              <th className="border p-2 text-right">السعر</th>
            </tr>
          </thead>
          <tbody>
            {visas.map((visa, index) => (
              <tr key={index} className="border-b">
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{visa.visaType}</td>
                <td className="border p-2">{visa.country}</td>
                <td className="border p-2">{visa.duration}</td>
                <td className="border p-2">{formatCurrency(visa.price)}</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-50">
              <td colSpan="4" className="border p-2 text-left">الإجمالي</td>
              <td className="border p-2">{formatCurrency(totalPrice)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* تفاصيل الدفع */}
      {booking.payment?.paymentMethod === 'installments' && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">تفاصيل الأقساط</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-right">القسط</th>
                <th className="border p-2 text-right">المبلغ</th>
                <th className="border p-2 text-right">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {booking.payment.firstInstallment && (
                <tr className="border-b">
                  <td className="border p-2">الدفعة الأولى</td>
                  <td className="border p-2">{formatCurrency(booking.payment.firstInstallment)}</td>
                  <td className="border p-2">{formatDate(booking.payment.paymentDate)}</td>
                </tr>
              )}
              {booking.payment.secondInstallment && (
                <tr className="border-b">
                  <td className="border p-2">الدفعة الثانية</td>
                  <td className="border p-2">{formatCurrency(booking.payment.secondInstallment)}</td>
                  <td className="border p-2">-</td>
                </tr>
              )}
              {booking.payment.thirdInstallment && (
                <tr className="border-b">
                  <td className="border p-2">الدفعة الثالثة</td>
                  <td className="border p-2">{formatCurrency(booking.payment.thirdInstallment)}</td>
                  <td className="border p-2">-</td>
                </tr>
              )}
              <tr className="font-bold bg-gray-50">
                <td colSpan="1" className="border p-2 text-left">الإجمالي</td>
                <td className="border p-2">
                  {formatCurrency(
                    parseFloat(booking.payment.firstInstallment || 0) +
                    parseFloat(booking.payment.secondInstallment || 0) +
                    parseFloat(booking.payment.thirdInstallment || 0)
                  )}
                </td>
                <td className="border p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      {/* ملاحظات */}
      {booking.payment?.notes && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">ملاحظات</h3>
          <p className="p-3 bg-gray-50 rounded-lg">{booking.payment.notes}</p>
        </div>
      )}
      
      {/* التذييل */}
      <div className="mt-12 pt-6 border-t text-center text-gray-600">
        <p>نشكركم على ثقتكم بنا</p>
        <p>شركة السعد للسياحة والسفر - خدمة على مدار الساعة</p>
        <p className="mt-2">www.bolt-travel.com</p>
      </div>
      
      {/* أسلوب الطباعة */}
      <style jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            font-family: 'Arial', sans-serif;
          }
        }
      `}</style>
    </div>
  );
});

export default VisaReceipt;
