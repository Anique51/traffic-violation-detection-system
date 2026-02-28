-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'officer');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create violation_types table
CREATE TABLE public.violation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  default_fine NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number_plate TEXT UNIQUE NOT NULL,
  owner_name TEXT,
  owner_contact TEXT,
  total_fines NUMERIC DEFAULT 0,
  license_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create camera_locations table
CREATE TABLE public.camera_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('active', 'offline')) DEFAULT 'active',
  violation_count INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create violations table
CREATE TABLE public.violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT NOT NULL,
  violation_type TEXT NOT NULL,
  location TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'confirmed', 'dismissed')) DEFAULT 'pending',
  fine_amount NUMERIC NOT NULL,
  officer_id UUID REFERENCES public.profiles(id),
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_violations table
CREATE TABLE public.custom_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT NOT NULL,
  violation_type TEXT NOT NULL,
  location TEXT NOT NULL,
  remarks TEXT,
  image_url TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_violations INTEGER DEFAULT 0,
  total_fines NUMERIC DEFAULT 0,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camera_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  
  -- Assign default 'officer' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'officer');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for violation_types
CREATE POLICY "Anyone can view violation types"
  ON public.violation_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage violation types"
  ON public.violation_types FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for vehicles
CREATE POLICY "Anyone can view vehicles"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officers can create vehicles"
  ON public.vehicles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Officers can update vehicles"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for camera_locations
CREATE POLICY "Anyone can view cameras"
  ON public.camera_locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage cameras"
  ON public.camera_locations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for violations
CREATE POLICY "Anyone can view violations"
  ON public.violations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officers can create violations"
  ON public.violations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Officers can update violations"
  ON public.violations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can delete violations"
  ON public.violations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for custom_violations
CREATE POLICY "Anyone can view custom violations"
  ON public.custom_violations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officers can create custom violations"
  ON public.custom_violations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Officers can update own custom violations"
  ON public.custom_violations FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for reports
CREATE POLICY "Anyone can view reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officers can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Insert default violation types
INSERT INTO public.violation_types (name, default_fine, description) VALUES
  ('Red Light Violation', 5000, 'Running a red traffic light'),
  ('No Helmet', 500, 'Riding without helmet'),
  ('Triple Riding', 1000, 'More than two people on motorcycle'),
  ('Wrong Way', 2000, 'Driving in wrong direction'),
  ('Speed Violation', 3000, 'Exceeding speed limit'),
  ('No Seatbelt', 1500, 'Not wearing seatbelt'),
  ('Phone Usage', 2000, 'Using phone while driving');

-- Insert sample camera locations
INSERT INTO public.camera_locations (location_name, latitude, longitude, status, violation_count) VALUES
  ('Liberty Chowk', 31.5204, 74.3587, 'active', 45),
  ('Mall Road Junction', 31.5656, 74.3242, 'active', 32),
  ('Model Town', 31.4841, 74.3150, 'active', 28),
  ('Johar Town', 31.4695, 74.2705, 'offline', 0),
  ('DHA Phase 5', 31.4722, 74.4064, 'active', 19),
  ('Gulberg Main', 31.5081, 74.3440, 'active', 51);