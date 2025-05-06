-- مسح الجداول والوظائف القديمة
DROP TABLE IF EXISTS public.employees CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.create_auth_user() CASCADE;

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
  updated_at timestamptz DEFAULT now()
);

-- تفعيل نظام RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للموظفين
CREATE POLICY "Allow full access to all users"
  ON public.employees
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

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