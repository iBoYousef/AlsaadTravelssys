import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';

export default function CustomerSearch({ onSelect, selectedCustomer, disabled = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchCustomers = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const customersRef = collection(db, 'customers');
        
        // البحث في قاعدة البيانات
        const searchTermLower = searchQuery.toLowerCase();
        
        // جلب جميع العملاء (يمكن تحسين هذا لاحقًا باستخدام فهرسة أفضل)
        const q = query(customersRef, orderBy('created_at', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        
        // تصفية النتائج محليًا
        const results = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(customer => {
            const fullName = `${customer.nameAr1} ${customer.nameAr2} ${customer.nameAr3}`.toLowerCase();
            const fullNameEn = `${customer.nameEn1 || ''} ${customer.nameEn2 || ''} ${customer.nameEn3 || ''}`.toLowerCase();
            const code = customer.code?.toLowerCase() || '';
            const phone = customer.phoneNumber?.toLowerCase() || '';
            const passport = customer.passportNumber?.toLowerCase() || '';
            
            return fullName.includes(searchTermLower) || 
                   fullNameEn.includes(searchTermLower) || 
                   code.includes(searchTermLower) || 
                   phone.includes(searchTermLower) || 
                   passport.includes(searchTermLower);
          });
        
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    const delaySearch = setTimeout(() => {
      searchCustomers();
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleSelectCustomer = (customer) => {
    onSelect(customer);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">بيانات العميل</h3>
      <div className="relative" ref={searchRef}>
        {!selectedCustomer && (
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="ابحث بالرقم الكودي أو رقم الهاتف أو الاسم أو رقم الجواز"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled}
              />
              <FaSearch className="absolute right-3 top-3.5 text-gray-400" />
              {loading && (
                <div className="absolute left-3 top-3.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowResults(false);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                disabled={disabled}
              >
                <FaTimes />
              </button>
            )}
          </div>
        )}

        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-80 overflow-y-auto">
            {searchResults.map(customer => (
              <div
                key={customer.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleSelectCustomer(customer)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">
                      {`${customer.nameAr1} ${customer.nameAr2} ${customer.nameAr3}`}
                    </div>
                    <div className="text-sm text-gray-500 flex gap-3">
                      <span>{customer.phoneNumber}</span>
                      <span className="font-mono">{customer.passportNumber}</span>
                    </div>
                  </div>
                  <div className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {customer.code}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showResults && searchResults.length === 0 && searchQuery && (
          <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
            <div className="p-3 text-center text-gray-500">
              لا توجد نتائج للبحث
            </div>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="bg-gray-50 p-4 rounded-lg mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">الرقم الكودي:</span>
              <span className="font-mono mr-2 bg-gray-100 px-2 py-1 rounded">{selectedCustomer.code}</span>
            </div>
            <div>
              <span className="text-gray-600">اسم العميل:</span>
              <span className="mr-2 font-semibold">
                {`${selectedCustomer.nameAr1} ${selectedCustomer.nameAr2} ${selectedCustomer.nameAr3}`}
              </span>
            </div>
            <div>
              <span className="text-gray-600">رقم الجواز:</span>
              <span className="font-mono mr-2">{selectedCustomer.passportNumber}</span>
            </div>
            <div>
              <span className="text-gray-600">الجنسية:</span>
              <span className="mr-2">{selectedCustomer.nationality}</span>
            </div>
            <div>
              <span className="text-gray-600">رقم الهاتف:</span>
              <span className="font-mono mr-2">{selectedCustomer.phoneNumber}</span>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="mt-4 text-red-500 hover:text-red-700"
            >
              تغيير العميل
            </button>
          )}
        </div>
      )}
    </div>
  );
}