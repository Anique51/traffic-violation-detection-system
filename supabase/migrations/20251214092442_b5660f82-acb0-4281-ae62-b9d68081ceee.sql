-- Fix trigger to lookup penalty points from violation_types table
CREATE OR REPLACE FUNCTION public.update_vehicle_penalty_on_confirm()
RETURNS TRIGGER AS $$
DECLARE
  current_month text;
  v_penalty_points integer;
BEGIN
  -- Only trigger when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Set confirmed_at timestamp
    NEW.confirmed_at = now();
    
    -- Get penalty points from violation_types table
    SELECT penalty_points INTO v_penalty_points
    FROM public.violation_types
    WHERE name = NEW.violation_type;
    
    -- If not found, use the penalty_points from the violation record
    IF v_penalty_points IS NULL THEN
      v_penalty_points = COALESCE(NEW.penalty_points, 0);
    END IF;
    
    -- Update the violation's penalty_points field
    NEW.penalty_points = v_penalty_points;
    
    -- Get current month in YYYY-MM format
    current_month := to_char(now(), 'YYYY-MM');
    
    -- Insert or update vehicle penalty summary
    INSERT INTO public.vehicle_penalty_summary (vehicle_number, month, total_penalty_points, last_updated)
    VALUES (NEW.vehicle_number, current_month, v_penalty_points, now())
    ON CONFLICT (vehicle_number, month)
    DO UPDATE SET 
      total_penalty_points = vehicle_penalty_summary.total_penalty_points + v_penalty_points,
      last_updated = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
