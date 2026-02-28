-- Fix function search path for generate_ticket_number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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