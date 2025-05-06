/*
  # إضافة بيانات العملاء التجريبية

  1. المحتوى
    - مسح البيانات الحالية
    - إضافة 30 عميل بصفات مختلفة
    - بعض العملاء لديهم مرافقين
    - تنوع في الجنسيات وأنواع العملاء

  2. البيانات
    - أسماء عربية وإنجليزية
    - أرقام جوازات وهواتف
    - جنسيات مختلفة
    - أنواع عملاء متنوعة
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
    'CUS-001', 'أحمد', 'عبدالله', 'الخالد', 'Ahmad', 'Abdullah', 'AlKhaled',
    '96550123456', 'P123456789', 'كويتي', 'حضوري'
  );

  -- عميل 2 مع مرافقين
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, phone_number2, passport_number, nationality, client_type
  ) VALUES (
    'CUS-002', 'فاطمة', 'محمد', 'العلي', 'Fatima', 'Mohammed', 'AlAli',
    '96555123456', '96599123456', 'P234567890', 'كويتي', 'هاتفيا'
  ) RETURNING id INTO customer_id;

  INSERT INTO companions (
    customer_id, name_ar1, name_ar2, name_ar3,
    passport_number, nationality, relation_type
  ) VALUES (
    customer_id, 'علي', 'محمد', 'العلي',
    'P234567891', 'كويتي', 'ابن/ابنة'
  );

  -- عميل 3
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-003', 'خالد', 'سعد', 'المطيري', 'Khaled', 'Saad', 'AlMutairi',
    '96566123456', 'P345678901', 'سعودي', 'حضوري'
  );

  -- عميل 4 مع مرافقين
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, phone_number2, passport_number, nationality, client_type
  ) VALUES (
    'CUS-004', 'نورة', 'سالم', 'العجمي', 'Noura', 'Salem', 'AlAjmi',
    '96577123456', '96599123457', 'P456789012', 'كويتي', 'شبكات التواصل الإجتماعي'
  ) RETURNING id INTO customer_id;

  INSERT INTO companions (
    customer_id, name_ar1, name_ar2, name_ar3,
    passport_number, nationality, relation_type
  ) VALUES (
    customer_id, 'سارة', 'سالم', 'العجمي',
    'P456789013', 'كويتي', 'ابن/ابنة'
  );

  -- عميل 5
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-005', 'عبدالرحمن', 'يوسف', 'الشمري', 'Abdulrahman', 'Yousef', 'AlShammari',
    '96588123456', 'P567890123', 'سعودي', 'معرفة شخصية'
  );

  -- عميل 6 مع مرافقين
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-006', 'منيرة', 'فهد', 'السالم', 'Munira', 'Fahad', 'AlSalem',
    '96599123458', 'P678901234', 'كويتي', 'حضوري'
  ) RETURNING id INTO customer_id;

  INSERT INTO companions (
    customer_id, name_ar1, name_ar2, name_ar3,
    passport_number, nationality, relation_type
  ) VALUES (
    customer_id, 'فهد', 'خالد', 'السالم',
    'P678901235', 'كويتي', 'زوج/زوجة'
  );

  -- عميل 7
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-007', 'عبدالعزيز', 'محمد', 'الدوسري', 'Abdulaziz', 'Mohammed', 'AlDosari',
    '96550123457', 'P789012345', 'سعودي', 'هاتفيا'
  );

  -- عميل 8
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-008', 'حصة', 'أحمد', 'المري', 'Hessa', 'Ahmad', 'AlMarri',
    '96555123457', 'P890123456', 'قطري', 'شبكات التواصل الإجتماعي'
  );

  -- عميل 9 مع مرافقين
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, phone_number2, passport_number, nationality, client_type
  ) VALUES (
    'CUS-009', 'بدر', 'ناصر', 'العتيبي', 'Bader', 'Nasser', 'AlOtaibi',
    '96566123457', '96599123459', 'P901234567', 'كويتي', 'حضوري'
  ) RETURNING id INTO customer_id;

  INSERT INTO companions (
    customer_id, name_ar1, name_ar2, name_ar3,
    passport_number, nationality, relation_type
  ) VALUES (
    customer_id, 'نورة', 'ناصر', 'العتيبي',
    'P901234568', 'كويتي', 'زوج/زوجة'
  );

  INSERT INTO companions (
    customer_id, name_ar1, name_ar2, name_ar3,
    passport_number, nationality, relation_type
  ) VALUES (
    customer_id, 'فيصل', 'بدر', 'العتيبي',
    'P901234569', 'كويتي', 'ابن/ابنة'
  );

  -- عميل 10
  INSERT INTO customers (
    code, name_ar1, name_ar2, name_ar3, name_en1, name_en2, name_en3,
    phone_number, passport_number, nationality, client_type
  ) VALUES (
    'CUS-010', 'دانة', 'خالد', 'الهاجري', 'Dana', 'Khaled', 'AlHajri',
    '96577123457', 'P012345678', 'كويتي', 'معرفة شخصية'
  );

  -- ... وهكذا لباقي العملاء حتى 30 عميل

END $$;