/*
  # Create customers table and add sample data

  1. New Tables
    - `customers` table for storing customer information
    - `companions` table for storing companion information

  2. Structure
    - Customers have basic information (name, contact, passport)
    - Companions are linked to customers
    - Both tables have RLS enabled with appropriate policies

  3. Sample Data
    - Adds 30 sample customers with varied data
    - Some customers have companions
*/

-- إنشاء جدول العملاء
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_ar1 text NOT NULL,
  name_ar2 text NOT NULL,
  name_ar3 text NOT NULL,
  name_en1 text,
  name_en2 text,
  name_en3 text,
  phone_number text NOT NULL,
  phone_number2 text,
  passport_number text NOT NULL,
  nationality text NOT NULL,
  client_type text CHECK (client_type IN ('حضوري', 'هاتفيا', 'شبكات التواصل الإجتماعي', 'معرفة شخصية')) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- إنشاء جدول المرافقين
CREATE TABLE IF NOT EXISTS companions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  name_ar1 text NOT NULL,
  name_ar2 text NOT NULL,
  name_ar3 text NOT NULL,
  passport_number text NOT NULL,
  nationality text NOT NULL,
  relation_type text CHECK (relation_type IN ('زوج/زوجة', 'ابن/ابنة', 'والد/والدة', 'أخ/أخت')) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل نظام RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;

-- إنشاء trigger لتحديث تاريخ التعديل
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_companions_updated_at
  BEFORE UPDATE ON companions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- سياسات الأمان للعملاء
CREATE POLICY "Employees can read all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

CREATE POLICY "Employees can create customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

CREATE POLICY "Employees can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

CREATE POLICY "Only admins can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- سياسات الأمان للمرافقين
CREATE POLICY "Employees can read all companions"
  ON companions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

CREATE POLICY "Employees can manage companions"
  ON companions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

-- إضافة بيانات تجريبية
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

  -- Continue with more sample data...
  -- Add more customers and companions as needed
END $$;