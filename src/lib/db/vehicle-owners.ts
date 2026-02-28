import { supabase } from "@/integrations/supabase/client";

export interface VehicleOwner {
  registration_no: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  father_name: string | null;
  address: string | null;
  city: string | null;
  phone_number: string | null;
  email: string;
  vehicle_make_year: number | null;
  vehicle_make: string | null;
  vehicle_color: string | null;
  chassis_no: string | null;
  engine_no: string | null;
  created_at?: string;
}

export const getVehicleOwner = async (registrationNo: string): Promise<VehicleOwner | null> => {
  const { data, error } = await supabase
    .from('vehicle_owners')
    .select('*')
    .eq('registration_no', registrationNo)
    .maybeSingle();
  
  if (error) throw error;
  return data as VehicleOwner | null;
};

export const getVehicleOwners = async (): Promise<VehicleOwner[]> => {
  const { data, error } = await supabase
    .from('vehicle_owners')
    .select('*')
    .order('registration_no');
  
  if (error) throw error;
  return data as VehicleOwner[];
};

export const createVehicleOwner = async (owner: Omit<VehicleOwner, 'created_at'>): Promise<VehicleOwner> => {
  const { data, error } = await supabase
    .from('vehicle_owners')
    .insert([owner])
    .select()
    .single();
  
  if (error) throw error;
  return data as VehicleOwner;
};

export const updateVehicleOwner = async (registrationNo: string, updates: Partial<VehicleOwner>): Promise<VehicleOwner> => {
  const { data, error } = await supabase
    .from('vehicle_owners')
    .update(updates)
    .eq('registration_no', registrationNo)
    .select()
    .single();
  
  if (error) throw error;
  return data as VehicleOwner;
};