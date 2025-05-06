-- تحديث سياسات الأمان للموظفين
DROP POLICY IF EXISTS "Only admins and general managers can read employees" ON employees;
DROP POLICY IF EXISTS "Only admins can manage employees" ON employees;

CREATE POLICY "Employees can read their own data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (
    id = (auth.jwt() ->> 'employee_id')::text
  );

CREATE POLICY "Admins and managers can read all employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        raw_user_meta_data->>'role' IN ('admin', 'general_manager')
      )
    )
  );

CREATE POLICY "Only admins can manage employees"
  ON employees
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- إضافة حقل employee_id لجدول المستخدمين
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS employee_id text REFERENCES employees(id);

-- تحديث trigger لإضافة employee_id عند إنشاء المستخدم
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- تحديث employee_id في جدول المستخدمين
  UPDATE auth.users
  SET employee_id = NEW.raw_user_meta_data->>'id'
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لتحديث employee_id
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- تحديث سياسات الأمان للعملاء
DROP POLICY IF EXISTS "Employees can read all customers" ON customers;
DROP POLICY IF EXISTS "Employees can create customers" ON customers;
DROP POLICY IF EXISTS "Employees can update customers" ON customers;
DROP POLICY IF EXISTS "Only admins can delete customers" ON customers;

CREATE POLICY "Employees can read customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'general_manager', 'manager', 'agent')
    )
  );

CREATE POLICY "Employees can create and update customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'general_manager', 'manager', 'agent')
    )
  );

CREATE POLICY "Only admins and managers can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'general_manager')
    )
  );

-- إضافة حقول التتبع
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

ALTER TABLE companions
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- تحديث trigger لتحديث حقول التتبع
CREATE OR REPLACE FUNCTION update_tracking_fields()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    NEW.created_by = auth.uid();
  END IF;
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء triggers لتحديث حقول التتبع
DROP TRIGGER IF EXISTS customers_tracking ON customers;
CREATE TRIGGER customers_tracking
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_tracking_fields();

DROP TRIGGER IF EXISTS companions_tracking ON companions;
CREATE TRIGGER companions_tracking
  BEFORE INSERT OR UPDATE ON companions
  FOR EACH ROW EXECUTE FUNCTION update_tracking_fields();