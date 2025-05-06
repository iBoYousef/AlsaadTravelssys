// تعريف المسارات الخاصة بالمحاسبة
import React from 'react';
import { Route } from 'react-router-dom';
import JournalEntries from '../components/accounting/JournalEntries';
import AccountingReports from '../components/accounting/AccountingReports';

export const accountingRoutes = [
  <Route key="journal-entries" path="/accounting/journal-entries" element={<JournalEntries />} />,
  <Route key="accounting-reports" path="/accounting/reports" element={<AccountingReports />} />,
];
