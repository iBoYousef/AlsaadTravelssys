/*
  # إنشاء جدول الموظفين وإضافة بيانات تجريبية

  1. العمليات
    - إنشاء جدول الموظفين
    - إضافة 5 موظفين تجريبيين
    - تفعيل نظام RLS
    - إضافة سياسات الأمان
*/

-- إنشاء جدول الموظفين
CREATE TABLE IF NOT EXISTS employees (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  role text CHECK (role IN ('admin', 'manager', 'agent', 'accountant')) NOT NULL,
  active boolean DEFAULT true,
  join_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل نظام RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- إنشاء trigger لتحديث تاريخ التعديل
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- سياسات الأمان للموظفين
CREATE POLICY "Only admins can manage employees"
  ON employees
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- إضافة بيانات تجريبية
INSERT INTO employees (id, name, email, phone, role, active, join_date) VALUES
  ('1001', 'عبدالوهاب محمد السعد', 'abdulwahab@alsaad.travel', '96599123456', 'admin', true, '2020-01-01'),
  ('1002', 'فاطمة علي الكندري', 'fatima@alsaad.travel', '96599123457', 'manager', true, '2021-03-15'),
  ('1003', 'خالد أحمد العنزي', 'khaled@alsaad.travel', '96599123458', 'agent', true, '2022-06-01'),
  ('1004', 'نورة محمد العجمي', 'noura@alsaad.travel', '96599123459', 'accountant', true, '2023-01-10'),
  ('1005', 'عبدالله سعد المطيري', 'abdullah@alsaad.travel', '96599123460', 'agent', true, '2023-09-01');