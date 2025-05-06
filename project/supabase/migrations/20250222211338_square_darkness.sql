-- تحديث سياسات الأمان للموظفين
DROP POLICY IF EXISTS "Employees can read their own data" ON public.employees;
DROP POLICY IF EXISTS "Only admins can manage employees" ON public.employees;

CREATE POLICY "Employees can read their own data"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (
    id = current_setting('request.jwt.claims')::json->>'employee_id'
    OR role = 'admin'
  );

CREATE POLICY "Only admins can manage employees"
  ON public.employees
  FOR ALL
  TO authenticated
  USING (
    role = 'admin'
  )
  WITH CHECK (
    role = 'admin'
  );

-- إضافة دالة للتحقق من صحة بيانات الدخول
CREATE OR REPLACE FUNCTION check_employee_credentials(p_id text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.employees
    WHERE id = p_id
    AND password = p_password
    AND active = true
  );
END;
$$;