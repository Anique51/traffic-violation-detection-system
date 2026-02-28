import { supabase } from "@/integrations/supabase/client";

export interface Vehicle {
  id: string;
  number_plate: string;
  owner_name?: string;
  owner_contact?: string;
  total_fines: number;
  license_points: number;
  created_at: string;
}

export const getVehicles = async () => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Vehicle[];
};

export const getVehicle = async (numberPlate: string) => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('number_plate', numberPlate)
    .maybeSingle();
  
  if (error) throw error;
  return data as Vehicle | null;
};

export const createOrUpdateVehicle = async (vehicle: Omit<Vehicle, 'id' | 'created_at'>) => {
  const existing = await getVehicle(vehicle.number_plate);
  
  if (existing) {
    const { data, error } = await supabase
      .from('vehicles')
      .update({
        total_fines: existing.total_fines + (vehicle.total_fines || 0),
        owner_name: vehicle.owner_name || existing.owner_name,
        owner_contact: vehicle.owner_contact || existing.owner_contact,
      })
      .eq('number_plate', vehicle.number_plate)
      .select()
      .single();
    
    if (error) throw error;
    return data as Vehicle;
  } else {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicle])
      .select()
      .single();
    
    if (error) throw error;
    return data as Vehicle;
  }
};
