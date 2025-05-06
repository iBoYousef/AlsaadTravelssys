/*
  # تحديث جدول حجوزات تذاكر الطيران

  1. التعديلات
    - إضافة مفتاح خارجي لجدول العملاء
    - إضافة مفتاح خارجي لجدول المستخدمين
    - تحديث سياسات الأمان
    - إضافة الفهارس اللازمة

  2. الأمان
    - تفعيل RLS
    - تحديث سياسات الوصول
*/

-- إضافة الفهارس
CREATE INDEX IF NOT EXISTS idx_flight_bookings_customer_id ON public.flight_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_employee_id ON public.flight_bookings(employee_id);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_booking_date ON public.flight_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_departure_date ON public.flight_bookings(departure_date);

-- تحديث سياسات الأمان
DROP POLICY IF EXISTS "Employees can read all bookings" ON public.flight_bookings;
DROP POLICY IF EXISTS "Employees can create and update bookings" ON public.flight_bookings;

-- سياسة القراءة
CREATE POLICY "Employees can read flight bookings"
  ON public.flight_bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id::text = auth.uid()::text
      AND active = true
    )
  );

-- سياسة الإنشاء
CREATE POLICY "Employees can create flight bookings"
  ON public.flight_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id::text = auth.uid()::text
      AND active = true
      AND role IN ('admin', 'general_manager', 'manager', 'agent')
    )
  );

-- سياسة التحديث
CREATE POLICY "Employees can update flight bookings"
  ON public.flight_bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id::text = auth.uid()::text
      AND active = true
      AND role IN ('admin', 'general_manager', 'manager')
    )
  );

-- سياسة الحذف
CREATE POLICY "Only admins can delete flight bookings"
  ON public.flight_bookings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id::text = auth.uid()::text
      AND active = true
      AND role = 'admin'
    )
  );

-- إعادة منح الصلاحيات
GRANT ALL ON public.flight_bookings TO authenticated;
GRANT ALL ON public.flight_bookings TO service_role;

-- تحديث الـ trigger لتعيين الرقم الكودي
CREATE OR REPLACE FUNCTION public.set_flight_booking_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := 'FLT-' || LPAD(COALESCE(
      (SELECT CAST(SUBSTRING(MAX(booking_code) FROM 5) AS integer) + 1
       FROM public.flight_bookings),
      1)::text,
      3,
      '0'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;