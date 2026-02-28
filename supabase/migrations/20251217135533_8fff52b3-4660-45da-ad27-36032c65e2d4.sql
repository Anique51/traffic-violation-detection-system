-- Add ticket_no and due_date columns to violations table
ALTER TABLE public.violations 
ADD COLUMN IF NOT EXISTS ticket_no TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Create vehicle_owners table for owner/driver details
CREATE TABLE IF NOT EXISTS public.vehicle_owners (
  registration_no TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  father_name TEXT,
  address TEXT,
  city TEXT,
  phone_number TEXT,
  email TEXT NOT NULL,
  vehicle_make_year INTEGER,
  vehicle_make TEXT,
  vehicle_color TEXT,
  chassis_no TEXT,
  engine_no TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on vehicle_owners
ALTER TABLE public.vehicle_owners ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicle_owners
CREATE POLICY "Anyone can view vehicle owners"
ON public.vehicle_owners
FOR SELECT
USING (true);

CREATE POLICY "Officers can insert vehicle owners"
ON public.vehicle_owners
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Officers can update vehicle owners"
ON public.vehicle_owners
FOR UPDATE
USING (true);

-- Insert dummy data matching existing violation vehicle numbers
INSERT INTO public.vehicle_owners (registration_no, first_name, middle_name, last_name, father_name, address, city, phone_number, email, vehicle_make_year, vehicle_make, vehicle_color, chassis_no, engine_no)
VALUES 
  ('LER-8600', 'Muhammad', 'Ahmed', 'Khan', 'Abdul Khan', '123 Mall Road, Model Town', 'Lahore', '+92-321-1234567', 'ahmed.khan@email.com', 2019, 'Honda Civic', 'White', 'JE997793', '6305771'),
  ('XYZ-789', 'Ali', NULL, 'Raza', 'Raza Ahmed', '456 Garden Town', 'Lahore', '+92-300-9876543', 'ali.raza@email.com', 2020, 'Toyota Corolla', 'Silver', 'JE887654', '6201234'),
  ('LHE-987', 'Fatima', NULL, 'Bibi', 'Noor Muhammad', '789 DHA Phase 5', 'Lahore', '+92-333-5551234', 'fatima.bibi@email.com', 2018, 'Suzuki Alto', 'Red', 'JE776543', '6109876'),
  ('ABC-123', 'Hassan', 'Ali', 'Shah', 'Shah Muhammad', '321 Johar Town', 'Lahore', '+92-345-1112233', 'hassan.shah@email.com', 2021, 'Honda City', 'Black', 'JE665432', '6008765'),
  ('LHR-456', 'Ayesha', NULL, 'Malik', 'Malik Tariq', '654 Gulberg III', 'Lahore', '+92-311-4445566', 'ayesha.malik@email.com', 2017, 'Toyota Yaris', 'Blue', 'JE554321', '5907654'),
  ('KHI-321', 'Usman', 'Tariq', 'Qureshi', 'Qureshi Sahab', '987 Clifton Block 5', 'Karachi', '+92-322-7778899', 'usman.qureshi@email.com', 2022, 'Kia Sportage', 'Grey', 'JE443210', '5806543'),
  ('ISB-654', 'Zainab', NULL, 'Hussain', 'Hussain Ahmed', '147 F-10 Markaz', 'Islamabad', '+92-334-2223344', 'zainab.hussain@email.com', 2020, 'Hyundai Tucson', 'White', 'JE332109', '5705432'),
  ('MH-1234', 'Imran', 'Khan', 'Niazi', 'Niazi Khan', '258 Blue Area', 'Islamabad', '+92-301-8889900', 'imran.niazi@email.com', 2019, 'Mercedes C180', 'Black', 'JE221098', '5604321'),
  ('KHI-555', 'Sara', NULL, 'Ahmed', 'Ahmed Raza', '369 Defence Phase 6', 'Karachi', '+92-312-6667788', 'sara.ahmed@email.com', 2021, 'BMW 3 Series', 'Navy', 'JE110987', '5503210'),
  ('RWP-222', 'Bilal', 'Hassan', 'Mirza', 'Mirza Ghulam', '741 Saddar', 'Rawalpindi', '+92-336-3334455', 'bilal.mirza@email.com', 2018, 'Suzuki Swift', 'Orange', 'JE009876', '5402109')
ON CONFLICT (registration_no) DO NOTHING;

-- Create function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  ticket TEXT;
  year_part TEXT;
  random_part TEXT;
BEGIN
  year_part := to_char(now(), 'YY');
  random_part := lpad(floor(random() * 1000000)::text, 6, '0');
  ticket := 'PTP-' || year_part || '-' || random_part;
  RETURN ticket;
END;
$$;