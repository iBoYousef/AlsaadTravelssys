-- إضافة حقول التتبع لجدول الموظفين
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- تحديث trigger لتحديث حقول التتبع
CREATE OR REPLACE FUNCTION public.update_employee_tracking_fields()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    NEW.created_by = auth.uid();
  END IF;
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لتحديث حقول التتبع
DROP TRIGGER IF EXISTS employees_tracking ON public.employees;
CREATE TRIGGER employees_tracking
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_employee_tracking_fields();

-- تحديث سياسات الأمان للموظفين
DROP POLICY IF EXISTS "Employees can read their own data" ON public.employees;
DROP POLICY IF EXISTS "Admins and managers can read all employees" ON public.employees;
DROP POLICY IF EXISTS "Only admins can manage employees" ON public.employees;

CREATE POLICY "Employees can read their own data"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()::text OR
    created_by = auth.uid() OR
    updated_by = auth.uid()
  );

CREATE POLICY "Admins and managers can read all employees"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'general_manager')
    )
  );

CREATE POLICY "Only admins can manage employees"
  ON public.employees
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- إضافة حقل employee_id لجدول المستخدمين إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE auth.users 
    ADD COLUMN employee_id text REFERENCES public.employees(id);
  END IF;
END $$;

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