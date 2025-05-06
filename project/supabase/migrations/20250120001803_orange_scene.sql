/*
  # Create flight bookings schema

  1. New Tables
    - `user_roles`
      - User ID (references auth.users)
      - Role (enum: admin, manager, agent, accountant)
    - `flight_bookings`
      - Primary key: booking_code (text, unique)
      - Foreign keys: customer_id, employee_id (references auth.users)
      - Timestamps: created_at, updated_at
      - Booking details: booking number, type, class, counts, etc.
      - Payment details: receipt info, amounts, payment method
      - Constraints for dates and payment validation
  
  2. Functions
    - Auto-generate booking codes
    - Auto-update timestamps
  
  3. Security
    - Enable RLS
    - Policies for different user roles
*/

-- إنشاء جدول أدوار المستخدمين
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid REFERENCES auth.users(id) PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'agent', 'accountant')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل نظام RLS لجدول الأدوار
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول الأدوار
CREATE POLICY "Only admins can manage roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- إنشاء دالة لتوليد الرقم الكودي التلقائي
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  last_code text;
  new_number integer;
BEGIN
  -- الحصول على آخر رقم كودي
  SELECT booking_code 
  INTO last_code 
  FROM flight_bookings 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF last_code IS NULL THEN
    -- إذا لم يكن هناك حجوزات سابقة، ابدأ من 001
    RETURN 'BK-001';
  ELSE
    -- استخراج الرقم من آخر رقم كودي وزيادته
    new_number := CAST(SUBSTRING(last_code FROM 4) AS integer) + 1;
    RETURN 'BK-' || LPAD(new_number::text, 3, '0');
  END IF;
END;
$$;

-- إنشاء دالة لتعيين الرقم الكودي
CREATE OR REPLACE FUNCTION set_booking_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$;

-- إنشاء دالة لتحديث تاريخ التعديل
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء جدول حجوزات تذاكر الطيران
CREATE TABLE IF NOT EXISTS flight_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text UNIQUE NOT NULL,
  customer_id uuid REFERENCES auth.users(id) NOT NULL,
  booking_date timestamptz DEFAULT now(),
  booking_number text NOT NULL,
  booking_type text CHECK (booking_type IN ('roundtrip', 'oneway', 'multicity')) NOT NULL,
  travel_class text CHECK (travel_class IN ('economy', 'business', 'first')) NOT NULL,
  tickets_count integer NOT NULL CHECK (tickets_count > 0),
  adults_count integer NOT NULL CHECK (adults_count > 0),
  children_count integer NOT NULL DEFAULT 0,
  airline text NOT NULL,
  booking_system text CHECK (booking_system IN ('أميديوس', 'جاليليو', 'أون لاين')) NOT NULL,
  route text NOT NULL,
  segments_count integer NOT NULL CHECK (segments_count > 0),
  departure_date date NOT NULL,
  return_date date,
  receipt_code text NOT NULL,
  receipt_number text NOT NULL,
  cost_amount decimal(10,3) NOT NULL CHECK (cost_amount >= 0),
  selling_price decimal(10,3) NOT NULL CHECK (selling_price >= 0),
  payment_method text CHECK (payment_method IN ('knet', 'cash', 'tabby', 'credit', 'later')) NOT NULL,
  payment_date date,
  employee_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- التحقق من أن تاريخ العودة بعد تاريخ المغادرة
  CONSTRAINT valid_dates CHECK (
    (booking_type = 'oneway' AND return_date IS NULL) OR
    (booking_type != 'oneway' AND return_date > departure_date)
  ),
  
  -- التحقق من تاريخ السداد عندما تكون طريقة الدفع آجل
  CONSTRAINT valid_payment_date CHECK (
    (payment_method = 'later' AND payment_date IS NOT NULL) OR
    (payment_method != 'later' AND payment_date IS NULL)
  )
);

-- إنشاء trigger لتحديث تاريخ التعديل للحجوزات
CREATE TRIGGER update_flight_bookings_updated_at
  BEFORE UPDATE ON flight_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- إنشاء trigger لتحديث تاريخ التعديل للأدوار
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- إنشاء trigger لتعيين الرقم الكودي تلقائياً
CREATE TRIGGER set_booking_code
  BEFORE INSERT ON flight_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_code();

-- تفعيل نظام RLS للحجوزات
ALTER TABLE flight_bookings ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للحجوزات

-- القراءة: يمكن للموظفين المصرح لهم قراءة جميع الحجوزات
CREATE POLICY "Employees can read all bookings"
  ON flight_bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

-- الإنشاء: يمكن للموظفين المصرح لهم إنشاء حجوزات جديدة
CREATE POLICY "Employees can create bookings"
  ON flight_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

-- التعديل: يمكن للمدراء والمسؤولين فقط تعديل الحجوزات
CREATE POLICY "Admins and managers can update bookings"
  ON flight_bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- الحذف: يمكن للمسؤولين فقط حذف الحجوزات
CREATE POLICY "Only admins can delete bookings"
  ON flight_bookings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );