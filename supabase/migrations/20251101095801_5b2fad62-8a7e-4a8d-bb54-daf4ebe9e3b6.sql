-- Clear ALL existing data
DELETE FROM public.violations;
DELETE FROM public.vehicles;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;
DELETE FROM auth.users;


-- Insert dummy vehicles with meaningful data
INSERT INTO public.vehicles (number_plate, owner_name, owner_contact, total_fines, license_points) VALUES
('ABC-1234', 'Muhammad Ahmed', '+92-300-1234567', 15000, 3),
('XYZ-5678', 'Fatima Khan', '+92-321-9876543', 8000, 2),
('DEF-9012', 'Ali Raza', '+92-333-4567890', 25000, 5),
('GHI-3456', 'Sara Malik', '+92-345-1122334', 12000, 4),
('JKL-7890', 'Hassan Tariq', '+92-301-9988776', 5000, 1),
('MNO-2345', 'Ayesha Noor', '+92-322-5566778', 18000, 3),
('PQR-6789', 'Usman Sheikh', '+92-334-7788990', 0, 0),
('STU-1122', 'Zainab Ali', '+92-346-3344556', 10000, 2),
('VWX-3344', 'Bilal Ahmed', '+92-302-6677889', 22000, 4),
('YZA-5566', 'Mariam Siddiqui', '+92-323-8899001', 7000, 1);

-- Insert dummy violations
INSERT INTO public.violations (vehicle_number, violation_type, location, timestamp, status, fine_amount, image_url) VALUES
('ABC-1234', 'Red Light Violation', 'Liberty Chowk, Lahore', NOW() - INTERVAL '2 hours', 'confirmed', 5000, 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d'),
('XYZ-5678', 'Speed Limit Exceeded', 'Mall Road, Lahore', NOW() - INTERVAL '5 hours', 'pending', 3000, 'https://images.unsplash.com/photo-1486326658981-ed68abe5868e'),
('DEF-9012', 'Wrong Way Driving', 'Canal Road, Lahore', NOW() - INTERVAL '1 day', 'confirmed', 8000, 'https://images.unsplash.com/photo-1502877338535-766e1452684a'),
('ABC-1234', 'No Helmet', 'Jail Road, Lahore', NOW() - INTERVAL '3 days', 'confirmed', 5000, 'https://images.unsplash.com/photo-1558981852-426c6c22a060'),
('GHI-3456', 'Mobile Phone Usage', 'Ferozepur Road, Lahore', NOW() - INTERVAL '5 days', 'pending', 2000, 'https://images.unsplash.com/photo-1519003722824-194d4455a60c'),
('JKL-7890', 'Red Light Violation', 'Kalma Chowk, Lahore', NOW() - INTERVAL '1 week', 'confirmed', 5000, 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d'),
('MNO-2345', 'Speed Limit Exceeded', 'Gulberg Main Boulevard', NOW() - INTERVAL '10 days', 'confirmed', 3000, 'https://images.unsplash.com/photo-1486326658981-ed68abe5868e'),
('DEF-9012', 'Illegal Parking', 'MM Alam Road, Lahore', NOW() - INTERVAL '12 days', 'dismissed', 2000, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a'),
('STU-1122', 'Red Light Violation', 'Liberty Chowk, Lahore', NOW() - INTERVAL '15 days', 'confirmed', 5000, 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d'),
('VWX-3344', 'No Seat Belt', 'DHA Phase 5, Lahore', NOW() - INTERVAL '18 days', 'confirmed', 1500, 'https://images.unsplash.com/photo-1551830820-330a71b99059'),
('ABC-1234', 'Speed Limit Exceeded', 'Ring Road, Lahore', NOW() - INTERVAL '20 days', 'confirmed', 5000, 'https://images.unsplash.com/photo-1486326658981-ed68abe5868e'),
('YZA-5566', 'Wrong Way Driving', 'Thokar Niaz Baig', NOW() - INTERVAL '25 days', 'pending', 7000, 'https://images.unsplash.com/photo-1502877338535-766e1452684a'),
('MNO-2345', 'Red Light Violation', 'Garden Town, Lahore', NOW() - INTERVAL '28 days', 'confirmed', 5000, 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d'),
('VWX-3344', 'Speed Limit Exceeded', 'Ferozepur Road, Lahore', NOW() - INTERVAL '30 days', 'confirmed', 7000, 'https://images.unsplash.com/photo-1486326658981-ed68abe5868e'),
('XYZ-5678', 'Mobile Phone Usage', 'Jail Road, Lahore', NOW() - INTERVAL '35 days', 'confirmed', 2000, 'https://images.unsplash.com/photo-1519003722824-194d4455a60c');