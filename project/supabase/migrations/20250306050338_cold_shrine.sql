/*
  # Add Flight Details and Booking Status
  
  1. Changes
    - Add new columns for detailed flight information
    - Add indexes for better performance
    - Update RLS policies
    
  2. New Fields
    - Flight number and operating airline
    - Departure/arrival times and airports
    - Flight duration and stopovers
    - Booking status and seat numbers
    - Special requests and notes
    - Payment status and booking expiry
*/

-- Drop existing table if exists
DROP TABLE IF EXISTS flight_bookings;

-- Create sequence for auto-incrementing IDs
CREATE SEQUENCE IF NOT EXISTS flight_bookings_id_seq;

-- Create flight_bookings table
CREATE TABLE flight_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

  -- New fields for detailed flight information
  flight_number TEXT,
  operating_airline TEXT,
  departure_time TIME,
  arrival_time TIME,
  departure_airport TEXT,
  arrival_airport TEXT,
  flight_duration INTERVAL,
  stopovers TEXT[],
  booking_status TEXT DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'pending', 'cancelled')),
  seat_numbers TEXT[],
  special_requests TEXT,
  confirmation_number TEXT,
  payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
  booking_expiry TIMESTAMPTZ,
  notes TEXT,
  auto_id INTEGER DEFAULT nextval('flight_bookings_id_seq'),

  CONSTRAINT valid_dates CHECK (
    (booking_type = 'oneway' AND return_date IS NULL) OR
    (booking_type <> 'oneway' AND return_date > departure_date)
  ),
  CONSTRAINT valid_payment_date CHECK (
    (payment_method = 'later' AND payment_date IS NOT NULL) OR
    (payment_method <> 'later' AND payment_date IS NULL)
  )
);

-- Create indexes
CREATE UNIQUE INDEX flight_bookings_auto_id_idx ON flight_bookings(auto_id);
CREATE INDEX idx_flight_bookings_customer_id ON flight_bookings(customer_id);
CREATE INDEX idx_flight_bookings_employee_id ON flight_bookings(employee_id);
CREATE INDEX idx_flight_bookings_booking_date ON flight_bookings(booking_date);
CREATE INDEX idx_flight_bookings_departure_date ON flight_bookings(departure_date);
CREATE INDEX idx_flight_bookings_booking_status ON flight_bookings(booking_status);
CREATE INDEX idx_flight_bookings_payment_status ON flight_bookings(payment_status);
CREATE INDEX idx_flight_bookings_airline ON flight_bookings(airline);
CREATE INDEX idx_flight_bookings_flight_number ON flight_bookings(flight_number);

-- Enable RLS
ALTER TABLE flight_bookings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DO $$ 
BEGIN
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
END $$;