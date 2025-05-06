/*
  # Create Visa Applications System

  1. New Tables
    - `visa_applications`
      - `id` (uuid, primary key)
      - `application_code` (text, unique)
      - `customer_id` (uuid, references customers)
      - `visa_type` (text)
      - `destination_country` (text)
      - `purpose` (text)
      - `duration` (integer)
      - `status` (text)
      - `submission_date` (date)
      - `expected_travel_date` (date)
      - `passport_number` (text)
      - `passport_issue_date` (date)
      - `passport_expiry_date` (date)
      - `embassy_appointment_date` (date)
      - `embassy_reference` (text)
      - `cost_amount` (decimal)
      - `selling_price` (decimal)
      - `payment_method` (text)
      - `payment_date` (date)
      - `notes` (text)
      - `employee_id` (uuid)
      - Timestamps (created_at, updated_at)

    - `visa_documents`
      - `id` (uuid, primary key)
      - `application_id` (uuid, references visa_applications)
      - `document_type` (text)
      - `document_number` (text)
      - `issue_date` (date)
      - `expiry_date` (date)
      - `notes` (text)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users based on role
*/

-- إنشاء جدول معاملات التأشيرات
CREATE TABLE IF NOT EXISTS visa_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_code text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) NOT NULL,
  visa_type text CHECK (visa_type IN ('tourist', 'business', 'visit', 'transit', 'umrah', 'student')) NOT NULL,
  destination_country text NOT NULL,
  purpose text NOT NULL,
  duration integer NOT NULL CHECK (duration > 0),
  status text CHECK (status IN ('new', 'processing', 'approved', 'rejected', 'issued', 'delivered')) NOT NULL DEFAULT 'new',
  submission_date date NOT NULL,
  expected_travel_date date NOT NULL,
  passport_number text NOT NULL,
  passport_issue_date date NOT NULL,
  passport_expiry_date date NOT NULL,
  embassy_appointment_date date,
  embassy_reference text,
  cost_amount decimal(10,3) NOT NULL CHECK (cost_amount >= 0),
  selling_price decimal(10,3) NOT NULL CHECK (selling_price >= 0),
  payment_method text CHECK (payment_method IN ('knet', 'cash', 'tabby', 'credit', 'later')) NOT NULL,
  payment_date date,
  notes text,
  employee_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- التحقق من صحة التواريخ
  CONSTRAINT valid_passport_dates CHECK (passport_expiry_date > passport_issue_date),
  CONSTRAINT valid_travel_date CHECK (expected_travel_date >= submission_date),
  CONSTRAINT valid_payment_date CHECK (
    (payment_method = 'later' AND payment_date IS NOT NULL) OR
    (payment_method != 'later' AND payment_date IS NULL)
  )
);

-- إنشاء جدول مستندات التأشيرة
CREATE TABLE IF NOT EXISTS visa_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES visa_applications(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  document_number text,
  issue_date date,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- التحقق من صحة التواريخ
  CONSTRAINT valid_document_dates CHECK (
    (issue_date IS NULL AND expiry_date IS NULL) OR
    (issue_date IS NOT NULL AND expiry_date IS NOT NULL AND expiry_date > issue_date)
  )
);

-- تفعيل نظام RLS
ALTER TABLE visa_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_documents ENABLE ROW LEVEL SECURITY;

-- إنشاء trigger لتحديث تاريخ التعديل
CREATE TRIGGER update_visa_applications_updated_at
  BEFORE UPDATE ON visa_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_visa_documents_updated_at
  BEFORE UPDATE ON visa_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- سياسات الأمان لمعاملات التأشيرات
CREATE POLICY "Employees can read all visa applications"
  ON visa_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

CREATE POLICY "Employees can create visa applications"
  ON visa_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

CREATE POLICY "Employees can update visa applications"
  ON visa_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

CREATE POLICY "Only admins can delete visa applications"
  ON visa_applications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- سياسات الأمان لمستندات التأشيرة
CREATE POLICY "Employees can read all visa documents"
  ON visa_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

CREATE POLICY "Employees can manage visa documents"
  ON visa_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );