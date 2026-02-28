import { supabase } from "@/integrations/supabase/client";

export interface Violation {
  id: string;
  vehicle_number: string;
  violation_type: string;
  location: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'dismissed';
  fine_amount: number;
  penalty_points: number;
  officer_id?: string;
  image_url?: string;
  video_url?: string;
  confirmed_at?: string;
  ticket_no?: string;
  due_date?: string;
  email_status?: 'not_sent' | 'sent' | 'failed';
  created_at: string;
}

export const getViolations = async () => {
  const { data, error } = await supabase
    .from('violations')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (error) throw error;
  return data as Violation[];
};

export const getViolation = async (id: string) => {
  const { data, error } = await supabase
    .from('violations')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Violation;
};

export const createViolation = async (violation: Omit<Violation, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('violations')
    .insert([violation])
    .select()
    .single();
  
  if (error) throw error;
  return data as Violation;
};

export const updateViolation = async (id: string, updates: Partial<Violation>) => {
  const { data, error } = await supabase
    .from('violations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Violation;
};

export const deleteViolation = async (id: string) => {
  const { error } = await supabase
    .from('violations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getViolationsByDateRange = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('violations')
    .select('*')
    .gte('timestamp', startDate)
    .lte('timestamp', endDate)
    .order('timestamp', { ascending: false });
  
  if (error) throw error;
  return data as Violation[];
};

export const getViolationsByVehicle = async (vehicleNumber: string) => {
  const { data, error } = await supabase
    .from('violations')
    .select('*')
    .eq('vehicle_number', vehicleNumber)
    .order('timestamp', { ascending: false });
  
  if (error) throw error;
  return data as Violation[];
};
