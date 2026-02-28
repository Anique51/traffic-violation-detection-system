
-- First, add penalty_points column to violation_types
ALTER TABLE public.violation_types ADD COLUMN IF NOT EXISTS penalty_points integer NOT NULL DEFAULT 0;

-- Add penalty_points and confirmed_at to violations table
ALTER TABLE public.violations ADD COLUMN IF NOT EXISTS penalty_points integer NOT NULL DEFAULT 0;
ALTER TABLE public.violations ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone;

-- Create vehicle_penalty_summary table for monthly tracking
CREATE TABLE IF NOT EXISTS public.vehicle_penalty_summary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number text NOT NULL,
  month text NOT NULL, -- YYYY-MM format
  total_penalty_points integer NOT NULL DEFAULT 0,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(vehicle_number, month)
);

-- Enable RLS on vehicle_penalty_summary
ALTER TABLE public.vehicle_penalty_summary ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicle_penalty_summary
CREATE POLICY "Anyone can view vehicle penalty summary" 
ON public.vehicle_penalty_summary 
FOR SELECT 
USING (true);

CREATE POLICY "Officers can insert vehicle penalty summary" 
ON public.vehicle_penalty_summary 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Officers can update vehicle penalty summary" 
ON public.vehicle_penalty_summary 
FOR UPDATE 
USING (true);

-- Delete all existing violation types and insert the exact 6
DELETE FROM public.violation_types;

INSERT INTO public.violation_types (name, default_fine, penalty_points, description) VALUES
  ('No Helmet', 500, 2, 'Riding without wearing a helmet'),
  ('Pillion Riding', 750, 3, 'Unauthorized pillion riding'),
  ('Red Light Violation', 1000, 4, 'Running a red traffic light'),
  ('Black Mirror', 500, 2, 'Missing or obscured mirrors'),
  ('Seatbelt Violation', 500, 2, 'Not wearing a seatbelt'),
  ('Wrong Way Driving', 1000, 4, 'Driving against traffic flow');

-- Create function to update vehicle penalty summary
CREATE OR REPLACE FUNCTION public.update_vehicle_penalty_on_confirm()
RETURNS TRIGGER AS $$
DECLARE
  current_month text;
BEGIN
  -- Only trigger when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Set confirmed_at timestamp
    NEW.confirmed_at = now();
    
    -- Get current month in YYYY-MM format
    current_month := to_char(now(), 'YYYY-MM');
    
    -- Insert or update vehicle penalty summary
    INSERT INTO public.vehicle_penalty_summary (vehicle_number, month, total_penalty_points, last_updated)
    VALUES (NEW.vehicle_number, current_month, NEW.penalty_points, now())
    ON CONFLICT (vehicle_number, month)
    DO UPDATE SET 
      total_penalty_points = vehicle_penalty_summary.total_penalty_points + NEW.penalty_points,
      last_updated = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for penalty tracking
DROP TRIGGER IF EXISTS trigger_update_penalty_on_confirm ON public.violations;
CREATE TRIGGER trigger_update_penalty_on_confirm
  BEFORE UPDATE ON public.violations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vehicle_penalty_on_confirm();

-- Enable realtime for vehicle_penalty_summary
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_penalty_summary;
