import React from 'react';
import { formatDate } from '../../utils/dateUtils';
import { getPaymentMethodLabel } from '../../constants/paymentMethods';

// مكون لإنشاء محتوى الإيصال القابل للطباعة
const PrintReceipt = ({ bookingData, onClose }) => {
  const { customerName, events, payment, createdAt, employeeName } = bookingData;
  
  // حساب المجاميع
  const totalCost = events.reduce((sum, event) => sum + parseFloat(event.cost || 0), 0);
  const totalPrice = events.reduce((sum, event) => sum + parseFloat(event.price || 0), 0);
  
  // تنسيق التاريخ
  const formattedDate = createdAt ? 
    (typeof createdAt === 'object' && createdAt.toDate ? 
      formatDate(createdAt.toDate()) : 
      formatDate(new Date(createdAt))) : 
    formatDate(new Date());

  // طباعة الإيصال
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>إيصال حجز فعاليات - ${payment.receiptCode}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              direction: rtl;
            }
            .receipt {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #ddd;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .info-item {
              margin-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: right;
            }
            th {
              background-color: #f2f2f2;
            }
            .total-row {
              font-weight: bold;
              background-color: #f9f9f9;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
            }
            .signature {
              width: 45%;
              border-top: 1px solid #000;
              padding-top: 10px;
              text-align: center;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="logo">شركة السعد للسياحة والسفر</div>
              <div>إيصال حجز فعاليات</div>
            </div>
            
            <div class="info">
              <div>
                <div class="info-item"><strong>رقم الإيصال:</strong> ${payment.receiptNumber}</div>
                <div class="info-item"><strong>الرقم الكودي:</strong> ${payment.receiptCode}</div>
                <div class="info-item"><strong>التاريخ:</strong> ${formattedDate}</div>
              </div>
              <div>
                <div class="info-item"><strong>اسم العميل:</strong> ${customerName}</div>
                <div class="info-item"><strong>طريقة الدفع:</strong> ${getPaymentMethodLabel(payment.paymentMethod)}</div>
                <div class="info-item"><strong>الموظف:</strong> ${employeeName || 'غير محدد'}</div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم الفعالية</th>
                  <th>نوع الفعالية</th>
                  <th>التاريخ</th>
                  <th>الوقت</th>
                  <th>الموقع</th>
                  <th>عدد التذاكر</th>
                  <th>نوع التذكرة</th>
                  <th>سعر البيع (د.ك)</th>
                </tr>
              </thead>
              <tbody>
                ${events.map((event, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${event.eventName}</td>
                    <td>${event.eventType}</td>
                    <td>${event.eventDate}</td>
                    <td>${event.eventTime}</td>
                    <td>${event.location}</td>
                    <td>${event.ticketCount}</td>
                    <td>${event.ticketType}</td>
                    <td>${parseFloat(event.price).toFixed(3)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="8" style="text-align: left;">المجموع:</td>
                  <td>${totalPrice.toFixed(3)} د.ك</td>
                </tr>
              </tfoot>
            </table>
            
            ${payment.paymentMethod === 'installments' ? `
              <div>
                <h3>تفاصيل الأقساط:</h3>
                <table>
                  <tr>
                    <th>القسط الأول</th>
                    <th>القسط الثاني</th>
                    <th>القسط الثالث</th>
                  </tr>
                  <tr>
                    <td>${parseFloat(payment.firstInstallment).toFixed(3)} د.ك</td>
                    <td>${parseFloat(payment.secondInstallment).toFixed(3)} د.ك</td>
                    <td>${parseFloat(payment.thirdInstallment).toFixed(3)} د.ك</td>
                  </tr>
                </table>
              </div>
            ` : ''}
            
            ${payment.paymentMethod === 'deferred' ? `
              <div>
                <h3>تفاصيل الدفع الآجل:</h3>
                <p><strong>تاريخ الاستحقاق:</strong> ${payment.deferredPaymentDate}</p>
              </div>
            ` : ''}
            
            ${payment.notes ? `
              <div>
                <h3>ملاحظات:</h3>
                <p>${payment.notes}</p>
              </div>
            ` : ''}
            
            <div class="signatures">
              <div class="signature">توقيع الموظف</div>
              <div class="signature">توقيع العميل</div>
            </div>
            
            <div class="footer">
              <p>شكراً لاختياركم شركة السعد للسياحة والسفر</p>
              <p>هاتف: 123456789 | البريد الإلكتروني: info@alsaadtravels.com</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // طباعة بعد تحميل المحتوى
    printWindow.onload = function() {
      printWindow.print();
      // إغلاق النافذة بعد الطباعة أو الإلغاء (اختياري)
      // printWindow.onafterprint = function() {
      //   printWindow.close();
      // };
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4 text-center">معاينة الإيصال</h2>
        <p className="mb-6 text-center">انقر على زر الطباعة لطباعة الإيصال أو حفظه كملف PDF</p>
        
        <div className="flex justify-center gap-4">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            طباعة الإيصال
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;
