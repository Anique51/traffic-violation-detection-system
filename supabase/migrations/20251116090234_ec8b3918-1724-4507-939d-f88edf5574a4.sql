-- Insert dummy violation types if not exists
INSERT INTO violation_types (name, description, default_fine) VALUES
('Speeding', 'Exceeding speed limit', 150.00),
('Red Light', 'Running a red light', 200.00),
('Illegal Parking', 'Parking in restricted zone', 100.00),
('No Seatbelt', 'Not wearing seatbelt', 75.00),
('Phone Usage', 'Using phone while driving', 125.00),
('Wrong Lane', 'Driving in wrong lane', 100.00)
ON CONFLICT DO NOTHING;

-- Insert dummy vehicles
INSERT INTO vehicles (number_plate, owner_name, owner_contact, total_fines, license_points) VALUES
('ABC-1234', 'John Smith', '+92-300-1234567', 450.00, 6),
('XYZ-5678', 'Sarah Johnson', '+92-301-9876543', 200.00, 2),
('DEF-9012', 'Michael Brown', '+92-302-5551234', 350.00, 4),
('GHI-3456', 'Emily Davis', '+92-303-7778888', 100.00, 1),
('JKL-7890', 'David Wilson', '+92-304-3334444', 525.00, 7),
('MNO-2345', 'Lisa Anderson', '+92-305-9990000', 150.00, 2),
('PQR-6789', 'Robert Taylor', '+92-306-1112222', 275.00, 3),
('STU-0123', 'Jennifer Moore', '+92-307-5556666', 0.00, 0)
ON CONFLICT (number_plate) DO NOTHING;

-- Insert dummy camera locations
INSERT INTO camera_locations (location_name, latitude, longitude, status, violation_count) VALUES
('Main Street & 5th Ave', 31.5204, 74.3587, 'active', 45),
('Highway Exit 12', 31.5497, 74.3436, 'active', 67),
('Shopping Mall Entrance', 31.5324, 74.3587, 'active', 23),
('School Zone - Park Road', 31.5125, 74.3698, 'offline', 12),
('Downtown Plaza', 31.5546, 74.3572, 'active', 89),
('Airport Road Junction', 31.5204, 74.4044, 'active', 54)
ON CONFLICT DO NOTHING;

-- Insert dummy violations (last 30 days)
INSERT INTO violations (vehicle_number, violation_type, location, timestamp, status, fine_amount, officer_id, image_url) VALUES
('ABC-1234', 'Speeding', 'Main Street & 5th Ave', NOW() - INTERVAL '2 hours', 'pending', 150.00, (SELECT id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d'),
('XYZ-5678', 'Red Light', 'Highway Exit 12', NOW() - INTERVAL '5 hours', 'confirmed', 200.00, (SELECT id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1502877338535-766e1452684a'),
('ABC-1234', 'Phone Usage', 'Shopping Mall Entrance', NOW() - INTERVAL '1 day', 'confirmed', 125.00, (SELECT id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1580654712603-eb43273aff33'),
('DEF-9012', 'Illegal Parking', 'Downtown Plaza', NOW() - INTERVAL '2 days', 'confirmed', 100.00, (SELECT id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a'),
('GHI-3456', 'No Seatbelt', 'School Zone - Park Road', NOW() - INTERVAL '3 days', 'dismissed', 75.00, (SELECT id FROM profiles LIMIT 1), NULL),
('JKL-7890', 'Speeding', 'Airport Road Junction', NOW() - INTERVAL '4 days', 'confirmed', 150.00, (SELECT id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d'),
('ABC-1234', 'Wrong Lane', 'Main Street & 5th Ave', NOW() - INTERVAL '5 days', 'confirmed', 100.00, (SELECT id FROM profiles LIMIT 1), NULL),
('MNO-2345', 'Speeding', 'Highway Exit 12', NOW() - INTERVAL '6 days', 'pending', 150.00, (SELECT id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1502877338535-766e1452684a'),
('PQR-6789', 'Phone Usage', 'Shopping Mall Entrance', NOW() - INTERVAL '7 days', 'confirmed', 125.00, (SELECT id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1580654712603-eb43273aff33'),
('DEF-9012', 'Red Light', 'Downtown Plaza', NOW() - INTERVAL '8 days', 'confirmed', 200.00, (SELECT id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a'),
('JKL-7890', 'Illegal Parking', 'Main Street & 5th Ave', NOW() - INTERVAL '10 days', 'confirmed', 100.00, (SELECT id FROM profiles LIMIT 1), NULL),
('XYZ-5678', 'Speeding', 'Airport Road Junction', NOW() - INTERVAL '12 days', 'pending', 150.00, (SELECT id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d'),
('DEF-9012', 'Wrong Lane', 'Highway Exit 12', NOW() - INTERVAL '14 days', 'confirmed', 100.00, (SELECT id FROM profiles LIMIT 1), NULL),
('PQR-6789', 'Phone Usage', 'Downtown Plaza', NOW() - INTERVAL '15 days', 'confirmed', 125.00, (SELECT id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1580654712603-eb43273aff33'),
('JKL-7890', 'Red Light', 'Shopping Mall Entrance', NOW() - INTERVAL '18 days', 'confirmed', 200.00, (SELECT id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1502877338535-766e1452684a'),
('ABC-1234', 'No Seatbelt', 'Main Street & 5th Ave', NOW() - INTERVAL '20 days', 'dismissed', 75.00, (SELECT id FROM profiles LIMIT 1), NULL),
('MNO-2345', 'Speeding', 'Highway Exit 12', NOW() - INTERVAL '22 days', 'pending', 150.00, (SELECT id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d'),
('GHI-3456', 'Illegal Parking', 'Airport Road Junction', NOW() - INTERVAL '25 days', 'confirmed', 100.00, (SELECT id FROM profiles LIMIT 1), NULL),
('STU-0123', 'Phone Usage', 'Downtown Plaza', NOW() - INTERVAL '28 days', 'pending', 125.00, (SELECT id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1580654712603-eb43273aff33')
ON CONFLICT DO NOTHING;

-- Enable realtime for violations table
ALTER PUBLICATION supabase_realtime ADD TABLE violations;
ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE camera_locations;