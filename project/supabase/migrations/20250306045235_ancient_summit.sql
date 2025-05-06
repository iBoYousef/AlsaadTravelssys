/*
  # Add Auto-incrementing IDs to Tables

  1. Changes
    - Add auto-incrementing ID columns to all tables
    - Create sequences for auto-increment
    - Add proper indexes and constraints
    - Handle table dependencies correctly
    - Drop existing RLS policies before recreating them

  2. Tables Modified
    - employees
    - customers 
    - flight_bookings
    - hotel_bookings
    - event_bookings
    - visa_applications
    - visa_documents
    - companions
*/

-- Create sequences for auto-incrementing IDs
CREATE SEQUENCE IF NOT EXISTS employees_id_seq;
CREATE SEQUENCE IF NOT EXISTS customers_id_seq;
CREATE SEQUENCE IF NOT EXISTS flight_bookings_id_seq;
CREATE SEQUENCE IF NOT EXISTS hotel_bookings_id_seq;
CREATE SEQUENCE IF NOT EXISTS event_bookings_id_seq;
CREATE SEQUENCE IF NOT EXISTS visa_applications_id_seq;
CREATE SEQUENCE IF NOT EXISTS visa_documents_id_seq;
CREATE SEQUENCE IF NOT EXISTS companions_id_seq;

-- Create trigger function for auto_id
CREATE OR REPLACE FUNCTION update_auto_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.auto_id IS NULL THEN
    NEW.auto_id := nextval(TG_ARGV[0]::regclass);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update employees table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'auto_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN auto_id INTEGER DEFAULT nextval('employees_id_seq');
    CREATE UNIQUE INDEX IF NOT EXISTS employees_auto_id_idx ON employees(auto_id);
    
    CREATE TRIGGER set_employees_auto_id
      BEFORE INSERT ON employees
      FOR EACH ROW
      EXECUTE FUNCTION update_auto_id('employees_id_seq');
  END IF;
END $$;

-- Update customers table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'auto_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN auto_id INTEGER DEFAULT nextval('customers_id_seq');
    CREATE UNIQUE INDEX IF NOT EXISTS customers_auto_id_idx ON customers(auto_id);
    
    CREATE TRIGGER set_customers_auto_id
      BEFORE INSERT ON customers
      FOR EACH ROW
      EXECUTE FUNCTION update_auto_id('customers_id_seq');
  END IF;
END $$;

-- Update flight_bookings table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'flight_bookings'
  ) THEN
    CREATE TABLE flight_bookings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      auto_id INTEGER DEFAULT nextval('flight_bookings_id_seq'),
      booking_code TEXT UNIQUE NOT NULL,
      customer_id uuid REFERENCES customers(id),
      booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
      booking_number TEXT NOT NULL,
      booking_type TEXT NOT NULL CHECK (booking_type IN ('roundtrip', 'oneway', 'multicity')),
      travel_class TEXT NOT NULL CHECK (travel_class IN ('economy', 'business', 'first')),
      tickets_count INTEGER NOT NULL CHECK (tickets_count > 0),
      adults_count INTEGER NOT NULL CHECK (adults_count > 0),
      children_count INTEGER NOT NULL DEFAULT 0,
      airline TEXT NOT NULL,
      booking_system TEXT NOT NULL CHECK (booking_system IN ('أميديوس', 'جاليليو', 'أون لاين')),
      route TEXT NOT NULL,
      segments_count INTEGER NOT NULL CHECK (segments_count > 0),
      departure_date DATE NOT NULL,
      return_date DATE,
      receipt_code TEXT NOT NULL,
      receipt_number TEXT NOT NULL,
      cost_amount NUMERIC(10,3) NOT NULL CHECK (cost_amount >= 0),
      selling_price NUMERIC(10,3) NOT NULL CHECK (selling_price >= 0),
      payment_method TEXT NOT NULL CHECK (payment_method IN ('knet', 'cash', 'tabby', 'credit', 'later')),
      payment_date DATE,
      employee_id uuid REFERENCES employees(id),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT valid_dates CHECK (
        (booking_type = 'oneway' AND return_date IS NULL) OR
        (booking_type <> 'oneway' AND return_date > departure_date)
      ),
      CONSTRAINT valid_payment_date CHECK (
        (payment_method = 'later' AND payment_date IS NOT NULL) OR
        (payment_method <> 'later' AND payment_date IS NULL)
      )
    );

    CREATE UNIQUE INDEX IF NOT EXISTS flight_bookings_auto_id_idx ON flight_bookings(auto_id);
    CREATE INDEX IF NOT EXISTS idx_flight_bookings_customer_id ON flight_bookings(customer_id);
    CREATE INDEX IF NOT EXISTS idx_flight_bookings_employee_id ON flight_bookings(employee_id);
    CREATE INDEX IF NOT EXISTS idx_flight_bookings_booking_date ON flight_bookings(booking_date);
    CREATE INDEX IF NOT EXISTS idx_flight_bookings_departure_date ON flight_bookings(departure_date);

    CREATE TRIGGER set_flight_bookings_auto_id
      BEFORE INSERT ON flight_bookings
      FOR EACH ROW
      EXECUTE FUNCTION update_auto_id('flight_bookings_id_seq');

    -- Enable RLS on flight_bookings
    ALTER TABLE flight_bookings ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Employees can read flight bookings" ON flight_bookings;
    DROP POLICY IF EXISTS "Employees can create flight bookings" ON flight_bookings;
    DROP POLICY IF EXISTS "Admins and managers can update flight bookings" ON flight_bookings;
    DROP POLICY IF EXISTS "Only admins can delete flight bookings" ON flight_bookings;

    -- Create new policies
    CREATE POLICY "Employees can read flight bookings"
      ON flight_bookings
      FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM employees WHERE id = auth.uid() AND active = true
      ));

    CREATE POLICY "Employees can create flight bookings"
      ON flight_bookings
      FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() AND active = true 
        AND role IN ('admin', 'general_manager', 'manager', 'agent')
      ));

    CREATE POLICY "Admins and managers can update flight bookings"
      ON flight_bookings
      FOR UPDATE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() AND active = true 
        AND role IN ('admin', 'general_manager', 'manager')
      ));

    CREATE POLICY "Only admins can delete flight bookings"
      ON flight_bookings
      FOR DELETE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() AND active = true 
        AND role = 'admin'
      ));
  END IF;
END $$;