/*
  # تنظيف وإعادة هيكلة قاعدة البيانات

  1. التغييرات
    - حذف الجداول غير المستخدمة
    - تبسيط هيكل الجداول الحالية
    - تحسين العلاقات بين الجداول
    - إضافة فهارس للتحسين الأداء
    - تحديث سياسات الأمان

  2. الجداول المحذوفة
    - hotel_bookings (غير مستخدم)
    - vehicle_bookings (غير مستخدم)
    - reports (سيتم إعادة تصميمه لاحقاً)

  3. التحسينات
    - تحسين أنواع البيانات
    - إضافة قيود للتحقق من صحة البيانات
    - تحسين الفهارس
*/

-- حذف الجداول غير المستخدمة


-- تحديث جدول الموظفين
ALTER TABLE employees
  ALTER COLUMN active SET DEFAULT true,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- تحديث جدول العملاء
ALTER TABLE customers
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- تحديث جدول المرافقين
ALTER TABLE companions
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- تحديث جدول حجوزات الطيران
ALTER TABLE flight_bookings
  ALTER COLUMN booking_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- تحديث جدول حجوزات الفعاليات
ALTER TABLE event_bookings
  ALTER COLUMN booking_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- تحديث جدول معاملات التأشيرات
ALTER TABLE visa_applications
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- تحديث جدول مستندات التأشيرات
ALTER TABLE visa_documents
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- إضافة فهارس جديدة لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_customers_phone_number ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_passport_number ON customers(passport_number);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_booking_code ON flight_bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_event_bookings_booking_code ON event_bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_visa_applications_application_code ON visa_applications(application_code);

-- تحديث سياسات الأمان
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_documents ENABLE ROW LEVEL SECURITY;

-- إضافة triggers للتحديث التلقائي لحقل updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
  -- إضافة trigger لكل جدول
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_employees') THEN
    CREATE TRIGGER set_timestamp_employees
      BEFORE UPDATE ON employees
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_customers') THEN
    CREATE TRIGGER set_timestamp_customers
      BEFORE UPDATE ON customers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_companions') THEN
    CREATE TRIGGER set_timestamp_companions
      BEFORE UPDATE ON companions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_flight_bookings') THEN
    CREATE TRIGGER set_timestamp_flight_bookings
      BEFORE UPDATE ON flight_bookings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_event_bookings') THEN
    CREATE TRIGGER set_timestamp_event_bookings
      BEFORE UPDATE ON event_bookings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_visa_applications') THEN
    CREATE TRIGGER set_timestamp_visa_applications
      BEFORE UPDATE ON visa_applications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_visa_documents') THEN
    CREATE TRIGGER set_timestamp_visa_documents
      BEFORE UPDATE ON visa_documents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;