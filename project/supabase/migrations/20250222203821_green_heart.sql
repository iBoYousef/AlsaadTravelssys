/*
  # إصلاح جدول الموظفين

  1. التغييرات
    - إعادة إنشاء جدول الموظفين في public schema
    - تبسيط الجدول وإزالة الحقول غير الضرورية
    - تحديث سياسات الأمان للسماح بالوصول الكامل للمستخدمين المصادقين
    - إضافة البيانات الأولية للموظفين

  2. الأمان
    - تفعيل نظام RLS
    - منح الصلاحيات الكاملة للمستخدمين المصادقين
*/

-- مسح الجداول والوظائف القديمة
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public."Employees" CASCADE;
DROP FUNCTION IF EXISTS public.update_employee_tracking_fields() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

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

-- إضافة بيانات الموظفين
INSERT INTO public.employees (
  id, name, email, phone, role, active, join_date, password
) VALUES 
  ('1001', 'فاطمة علي الكندري', 'fatima@alsaad.travel', '96599123457', 'manager', true, '2021-03-15', 'pass1001'),
  ('1002', 'خالد أحمد العنزي', 'khaled@alsaad.travel', '96599123458', 'agent', true, '2022-06-01', 'pass1002'),
  ('1003', 'نورة محمد العجمي', 'noura@alsaad.travel', '96599123459', 'accountant', true, '2023-01-10', 'pass1003'),
  ('1004', 'عبدالله سعد المطيري', 'abdullah@alsaad.travel', '96599123460', 'agent', true, '2023-09-01', 'pass1004')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  active = EXCLUDED.active,
  join_date = EXCLUDED.join_date,
  password = EXCLUDED.password;