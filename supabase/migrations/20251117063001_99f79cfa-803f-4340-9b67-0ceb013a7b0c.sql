-- Create camera_feeds table
CREATE TABLE IF NOT EXISTS public.camera_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_location_id UUID NOT NULL REFERENCES public.camera_locations(id) ON DELETE CASCADE,
  feed_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on camera_feeds
ALTER TABLE public.camera_feeds ENABLE ROW LEVEL SECURITY;

-- Anyone can view camera feeds
CREATE POLICY "Anyone can view camera feeds"
ON public.camera_feeds
FOR SELECT
USING (true);

-- Admins can manage camera feeds
CREATE POLICY "Admins can manage camera feeds"
ON public.camera_feeds
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for camera_feeds
ALTER PUBLICATION supabase_realtime ADD TABLE public.camera_feeds;

-- Clean up violation_types - keep only 4 types
DELETE FROM public.violation_types 
WHERE name NOT IN ('Red Light Violation', 'Helmetless Rider', 'Black Mirror', 'Wrong Way');

-- Insert the 4 violation types if they don't exist
INSERT INTO public.violation_types (name, default_fine, description)
VALUES 
  ('Red Light Violation', 5000, 'Vehicle crossed red light signal')
ON CONFLICT DO NOTHING;

INSERT INTO public.violation_types (name, default_fine, description)
VALUES 
  ('Helmetless Rider', 2000, 'Motorcycle rider without helmet')
ON CONFLICT DO NOTHING;

INSERT INTO public.violation_types (name, default_fine, description)
VALUES 
  ('Black Mirror', 1500, 'Vehicle with black/tinted mirrors')
ON CONFLICT DO NOTHING;

INSERT INTO public.violation_types (name, default_fine, description)
VALUES 
  ('Wrong Way', 3000, 'Vehicle driving in wrong direction')
ON CONFLICT DO NOTHING;

-- Delete all existing violations
DELETE FROM public.violations;

-- Get a user_id for violations (use first admin or officer)
DO $$
DECLARE
  v_user_id UUID;
  v_camera_ids UUID[];
BEGIN
  -- Get first user
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- Get camera location IDs
  SELECT ARRAY_AGG(id) INTO v_camera_ids FROM public.camera_locations LIMIT 5;
  
  -- Insert dummy violations for the 4 types
  -- Red Light Violations
  INSERT INTO public.violations (vehicle_number, violation_type, location, timestamp, status, fine_amount, officer_id, image_url)
  VALUES 
    ('ABC-123', 'Red Light Violation', 'Mall Road Intersection', NOW() - INTERVAL '2 hours', 'confirmed', 5000, v_user_id, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000'),
    ('XYZ-789', 'Red Light Violation', 'Jail Road Signal', NOW() - INTERVAL '5 hours', 'pending', 5000, v_user_id, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000'),
    ('LHR-456', 'Red Light Violation', 'Model Town', NOW() - INTERVAL '1 day', 'confirmed', 5000, v_user_id, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000'),
    ('KHI-321', 'Red Light Violation', 'Gulberg Main Blvd', NOW() - INTERVAL '2 days', 'confirmed', 5000, v_user_id, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000'),
    ('ISB-654', 'Red Light Violation', 'DHA Phase 5', NOW() - INTERVAL '3 days', 'dismissed', 5000, v_user_id, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000');
  
  -- Helmetless Rider violations
  INSERT INTO public.violations (vehicle_number, violation_type, location, timestamp, status, fine_amount, officer_id, image_url)
  VALUES 
    ('MH-1234', 'Helmetless Rider', 'Ferozepur Road', NOW() - INTERVAL '3 hours', 'confirmed', 2000, v_user_id, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64'),
    ('LHE-987', 'Helmetless Rider', 'Canal Road', NOW() - INTERVAL '6 hours', 'pending', 2000, v_user_id, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64'),
    ('KHI-555', 'Helmetless Rider', 'Liberty Market', NOW() - INTERVAL '12 hours', 'confirmed', 2000, v_user_id, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64'),
    ('RWP-222', 'Helmetless Rider', 'MM Alam Road', NOW() - INTERVAL '1 day', 'confirmed', 2000, v_user_id, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64'),
    ('FSD-888', 'Helmetless Rider', 'Johar Town', NOW() - INTERVAL '2 days', 'pending', 2000, v_user_id, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64');
  
  -- Black Mirror violations
  INSERT INTO public.violations (vehicle_number, violation_type, location, timestamp, status, fine_amount, officer_id, image_url)
  VALUES 
    ('CAR-111', 'Black Mirror', 'Main Boulevard', NOW() - INTERVAL '4 hours', 'confirmed', 1500, v_user_id, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7'),
    ('SUV-222', 'Black Mirror', 'Thokar Niaz Baig', NOW() - INTERVAL '8 hours', 'pending', 1500, v_user_id, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7'),
    ('VAN-333', 'Black Mirror', 'Ring Road', NOW() - INTERVAL '1 day', 'confirmed', 1500, v_user_id, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7'),
    ('PKG-444', 'Black Mirror', 'Allama Iqbal Town', NOW() - INTERVAL '3 days', 'dismissed', 1500, v_user_id, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7');
  
  -- Wrong Way violations
  INSERT INTO public.violations (vehicle_number, violation_type, location, timestamp, status, fine_amount, officer_id, image_url)
  VALUES 
    ('WRG-101', 'Wrong Way', 'Kalma Chowk', NOW() - INTERVAL '1 hour', 'pending', 3000, v_user_id, 'https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7'),
    ('WRG-202', 'Wrong Way', 'Defence Morr', NOW() - INTERVAL '7 hours', 'confirmed', 3000, v_user_id, 'https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7'),
    ('WRG-303', 'Wrong Way', 'Township', NOW() - INTERVAL '10 hours', 'confirmed', 3000, v_user_id, 'https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7'),
    ('WRG-404', 'Wrong Way', 'Wapda Town', NOW() - INTERVAL '2 days', 'pending', 3000, v_user_id, 'https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7'),
    ('WRG-505', 'Wrong Way', 'EME Society', NOW() - INTERVAL '4 days', 'confirmed', 3000, v_user_id, 'https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7');

  -- Insert dummy camera feeds with local MP4 paths
  INSERT INTO public.camera_feeds (camera_location_id, feed_url, description, is_active)
  SELECT 
    id,
    CASE 
      WHEN location_name LIKE '%Mall Road%' THEN '/videos/redlight1.mp4'
      WHEN location_name LIKE '%Jail Road%' THEN '/videos/redlight2.mp4'
      WHEN location_name LIKE '%Model Town%' THEN '/videos/helmetless1.mp4'
      WHEN location_name LIKE '%Gulberg%' THEN '/videos/wrongway1.mp4'
      ELSE '/videos/demo.mp4'
    END,
    'Demo video feed for ' || location_name,
    true
  FROM public.camera_locations;
END $$;