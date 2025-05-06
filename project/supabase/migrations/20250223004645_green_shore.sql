-- إضافة حقل employee_id لجدول الموظفين
ALTER TABLE public.employees
ADD COLUMN employee_id text UNIQUE;

-- تحديث البيانات الحالية
UPDATE public.employees
SET employee_id = id;

-- جعل الحقل إجباري
ALTER TABLE public.employees
ALTER COLUMN employee_id SET NOT NULL;

-- تحديث سياسات الأمان
DROP POLICY IF EXISTS "Allow full access to all users" ON public.employees;

CREATE POLICY "Allow full access to all users"
  ON public.employees
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- تحديث بيانات المستخدمين في نظام المصادقة
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{employee_id}',
  to_jsonb(e.employee_id)
)
FROM public.employees e
WHERE raw_user_meta_data->>'employee_id' = e.id;