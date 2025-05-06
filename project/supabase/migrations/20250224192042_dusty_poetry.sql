-- إعادة تسمية الجدول القديم
ALTER TABLE public.employees RENAME TO employees_old;

-- إنشاء جدول الموظفين الجديد
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT UNIQUE ,
  employee_id serial NOT NULL UNIQUE,
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

-- نقل البيانات من الجدول القديم إلى الجديد
INSERT INTO public.employees (
  employee_id,
  name,
  email,
  phone,
  role,
  active,
  join_date,
  password,
  created_at,
  updated_at
)
SELECT 
  CAST(id AS integer),
  name,
  email,
  phone,
  role,
  active,
  join_date,
  password,
  created_at,
  updated_at
FROM public.employees_old;

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

-- منح الصلاحيات على التسلسل
GRANT USAGE, SELECT ON SEQUENCE employees_employee_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE employees_employee_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE employees_employee_id_seq TO anon;

-- حذف الجدول القديم
DROP TABLE public.employees_old;