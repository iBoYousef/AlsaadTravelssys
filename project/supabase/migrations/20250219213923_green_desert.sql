/*
  # إضافة عملاء تجريبيين

  1. العمليات
    - مسح البيانات الحالية من جدول العملاء والمرافقين
    - إضافة 10 عملاء تجريبيين مع بياناتهم الكاملة
    - إضافة مرافقين لبعض العملاء
*/

-- مسح البيانات الحالية
TRUNCATE TABLE companions CASCADE;
TRUNCATE TABLE customers CASCADE;

DO $$
DECLARE
  customer_id uuid;
BEGIN
  -- عميل 1
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-001', 'محمد', 'عبدالله', 'السالم', 'Mohammed', 'Abdullah', 'AlSalem',
    '96550123456', 'P123456789', 'كويتي', 'حضوري'
  );

  -- عميل 2 مع مرافقين
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, phone_number2, passport_number, nationality, client_type
  ) VALUES (
    'CUS-002', 'سارة', 'أحمد', 'العنزي', 'Sarah', 'Ahmad', 'AlEnezi',
    '96555123456', '96599123456', 'P234567890', 'كويتي', 'هاتفيا'
  ) RETURNING id INTO customer_id;

  INSERT INTO companions (
    customer_id, name_ar1, name_ar2, name_ar3,
    passport_number, nationality, relation_type
  ) VALUES (
    customer_id, 'نورة', 'أحمد', 'العنزي',
    'P234567891', 'كويتي', 'ابن/ابنة'
  );

  -- عميل 3
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-003', 'عبدالرحمن', 'خالد', 'المطيري', 'Abdulrahman', 'Khaled', 'AlMutairi',
    '96566123456', 'P345678901', 'سعودي', 'حضوري'
  );

  -- عميل 4 مع مرافقين
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-004', 'فاطمة', 'يوسف', 'الكندري', 'Fatima', 'Yousef', 'AlKandari',
    '96577123456', 'P456789012', 'كويتي', 'شبكات التواصل الإجتماعي'
  ) RETURNING id INTO customer_id;

  INSERT INTO companions (
    customer_id, name_ar1, name_ar2, name_ar3,
    passport_number, nationality, relation_type
  ) VALUES (
    customer_id, 'يوسف', 'محمد', 'الكندري',
    'P456789013', 'كويتي', 'زوج/زوجة'
  );

  -- عميل 5
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-005', 'عبدالعزيز', 'سعد', 'الرشيدي', 'Abdulaziz', 'Saad', 'AlRashidi',
    '96588123456', 'P567890123', 'كويتي', 'معرفة شخصية'
  );

  -- عميل 6 مع مرافقين
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-006', 'نوف', 'محمد', 'العجمي', 'Nouf', 'Mohammed', 'AlAjmi',
    '96599123458', 'P678901234', 'كويتي', 'حضوري'
  ) RETURNING id INTO customer_id;

  INSERT INTO companions (
    customer_id, name_ar1, name_ar2, name_ar3,
    passport_number, nationality, relation_type
  ) VALUES (
    customer_id, 'محمد', 'فهد', 'العجمي',
    'P678901235', 'كويتي', 'والد/والدة'
  );

  -- عميل 7
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-007', 'خالد', 'عبدالله', 'الدوسري', 'Khaled', 'Abdullah', 'AlDosari',
    '96550123457', 'P789012345', 'سعودي', 'هاتفيا'
  );

  -- عميل 8
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-008', 'مريم', 'فيصل', 'المري', 'Mariam', 'Faisal', 'AlMarri',
    '96555123457', 'P890123456', 'قطري', 'شبكات التواصل الإجتماعي'
  );

  -- عميل 9 مع مرافقين
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, phone_number2, passport_number, nationality, client_type
  ) VALUES (
    'CUS-009', 'فهد', 'ناصر', 'العتيبي', 'Fahad', 'Nasser', 'AlOtaibi',
    '96566123457', '96599123459', 'P901234567', 'كويتي', 'حضوري'
  ) RETURNING id INTO customer_id;

  INSERT INTO companions (
    customer_id, name_ar1, name_ar2, name_ar3,
    passport_number, nationality, relation_type
  ) VALUES (
    customer_id, 'منيرة', 'سعد', 'العتيبي',
    'P901234568', 'كويتي', 'زوج/زوجة'
  );

  -- عميل 10
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-010', 'لطيفة', 'جاسم', 'الهاجري', 'Latifa', 'Jassim', 'AlHajri',
    '96577123457', 'P012345678', 'كويتي', 'معرفة شخصية'
  );

END $$;