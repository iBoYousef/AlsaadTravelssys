-- حذف الجدول القديم إذا كان موجوداً
DROP TABLE IF EXISTS public.employees CASCADE;

-- إنشاء جدول الموظفين
CREATE TABLE public.employees (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  role text CHECK (role IN ('admin', 'general_manager', 'manager', 'agent', 'accountant')) NOT NULL,
  active boolean DEFAULT true,
  join_date date NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- تفعيل نظام RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- إنشاء trigger لتحديث حقول التتبع
CREATE OR REPLACE FUNCTION public.update_employee_tracking_fields()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    NEW.created_by = auth.uid();
  END IF;
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لتحديث حقول التتبع
CREATE TRIGGER employees_tracking
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_employee_tracking_fields();

-- سياسات الأمان للموظفين
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

-- منح الصلاحيات للجدول
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;

-- إضافة بيانات مسؤول النظام
INSERT INTO public.employees (
  id, name, email, phone, role, active, join_date, password
) VALUES (
  '8587',
  'عبدالوهاب محمد السعد',
  'info@alsaadtravels.com',
  '96599123456',
  'admin',
  true,
  '2020-01-01',
  'admin8587'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  active = EXCLUDED.active,
  join_date = EXCLUDED.join_date,
  password = EXCLUDED.password;