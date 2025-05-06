-- مسح الجداول والوظائف القديمة
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
GRANT ALL ON public.employees TO anon;

-- إضافة بيانات مسؤول النظام
INSERT INTO public.employees (
  id, name, email, phone, role, active, join_date, password
) VALUES (
  '1001',
  'عبدالوهاب محمد السعد',
  'info@alsaadtravels.com',
  '96599123456',
  'admin',
  true,
  '2020-01-01',
  'admin1001'
);

-- إضافة بيانات الموظفين
INSERT INTO public.employees (
  id, name, email, phone, role, active, join_date, password
) VALUES 
  ('1002', 'فاطمة علي الكندري', 'fatima@alsaad.travel', '96599123457', 'manager', true, '2021-03-15', 'pass1002'),
  ('1003', 'خالد أحمد العنزي', 'khaled@alsaad.travel', '96599123458', 'agent', true, '2022-06-01', 'pass1003'),
  ('1004', 'نورة محمد العجمي', 'noura@alsaad.travel', '96599123459', 'accountant', true, '2023-01-10', 'pass1004'),
  ('1005', 'عبدالله سعد المطيري', 'abdullah@alsaad.travel', '96599123460', 'agent', true, '2023-09-01', 'pass1005');