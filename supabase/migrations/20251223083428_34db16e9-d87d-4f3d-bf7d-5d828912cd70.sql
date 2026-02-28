-- Add email_status column to violations table
ALTER TABLE public.violations 
ADD COLUMN email_status text DEFAULT 'not_sent' CHECK (email_status IN ('not_sent', 'sent', 'failed'));