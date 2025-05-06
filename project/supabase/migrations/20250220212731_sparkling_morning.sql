/*
  # Create events booking tables

  1. New Tables
    - `event_bookings`
      - `id` (uuid, primary key)
      - `booking_code` (text, unique)
      - `customer_id` (uuid, references customers)
      - `booking_date` (date)
      - `event_name` (text)
      - `event_type` (text)
      - `event_date` (date)
      - `event_time` (time)
      - `venue` (text)
      - `tickets_count` (integer)
      - `category` (text)
      - `seat_numbers` (text)
      - `notes` (text)
      - `receipt_code` (text)
      - `receipt_number` (text)
      - `cost_amount` (decimal)
      - `selling_price` (decimal)
      - `payment_method` (text)
      - `payment_date` (date)
      - `employee_id` (uuid)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on role
*/

-- إنشاء دالة لتوليد الرقم الكودي للحجز
CREATE OR REPLACE FUNCTION generate_event_booking_code()
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
  FROM event_bookings 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF last_code IS NULL THEN
    -- إذا لم يكن هناك حجوزات سابقة، ابدأ من 001
    RETURN 'EVT-001';
  ELSE
    -- استخراج الرقم من آخر رقم كودي وزيادته
    new_number := CAST(SUBSTRING(last_code FROM 5) AS integer) + 1;
    RETURN 'EVT-' || LPAD(new_number::text, 3, '0');
  END IF;
END;
$$;

-- إنشاء دالة لتعيين الرقم الكودي
CREATE OR REPLACE FUNCTION set_event_booking_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := generate_event_booking_code();
  END IF;
  RETURN NEW;
END;
$$;

-- إنشاء جدول حجوزات الفعاليات
CREATE TABLE IF NOT EXISTS event_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) NOT NULL,
  booking_date date NOT NULL DEFAULT CURRENT_DATE,
  event_name text NOT NULL,
  event_type text NOT NULL,
  event_date date NOT NULL,
  event_time time NOT NULL,
  venue text NOT NULL,
  tickets_count integer NOT NULL CHECK (tickets_count > 0),
  category text CHECK (category IN ('VIP', 'عادي', 'مميز', 'عائلي')) NOT NULL,
  seat_numbers text,
  notes text,
  receipt_code text NOT NULL,
  receipt_number text NOT NULL,
  cost_amount decimal(10,3) NOT NULL CHECK (cost_amount >= 0),
  selling_price decimal(10,3) NOT NULL CHECK (selling_price >= 0),
  payment_method text CHECK (payment_method IN ('knet', 'cash', 'tabby', 'credit', 'later')) NOT NULL,
  payment_date date,
  employee_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- التحقق من أن تاريخ الفعالية بعد تاريخ الحجز
  CONSTRAINT valid_event_date CHECK (event_date >= booking_date),
  
  -- التحقق من تاريخ السداد عندما تكون طريقة الدفع آجل
  CONSTRAINT valid_payment_date CHECK (
    (payment_method = 'later' AND payment_date IS NOT NULL) OR
    (payment_method != 'later' AND payment_date IS NULL)
  )
);

-- إنشاء trigger لتحديث تاريخ التعديل
CREATE TRIGGER update_event_bookings_updated_at
  BEFORE UPDATE ON event_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- إنشاء trigger لتعيين الرقم الكودي تلقائياً
CREATE TRIGGER set_event_booking_code
  BEFORE INSERT ON event_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_event_booking_code();

-- تفعيل نظام RLS
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للحجوزات

-- القراءة: يمكن للموظفين المصرح لهم قراءة جميع الحجوزات
CREATE POLICY "Employees can read all event bookings"
  ON event_bookings
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
CREATE POLICY "Employees can create event bookings"
  ON event_bookings
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
CREATE POLICY "Admins and managers can update event bookings"
  ON event_bookings
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
CREATE POLICY "Only admins can delete event bookings"
  ON event_bookings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );