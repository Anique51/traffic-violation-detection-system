import { supabase } from "@/integrations/supabase/client";

export interface VehiclePenaltySummary {
  id: string;
  vehicle_number: string;
  month: string;
  total_penalty_points: number;
  last_updated: string;
  created_at: string;
}

export const getCurrentMonthPenalty = async (vehicleNumber: string) => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  const { data, error } = await supabase
    .from('vehicle_penalty_summary')
    .select('*')
    .eq('vehicle_number', vehicleNumber)
    .eq('month', currentMonth)
    .maybeSingle();
  
  if (error) throw error;
  return data as VehiclePenaltySummary | null;
};

export const getVehiclePenaltyHistory = async (vehicleNumber: string) => {
  const { data, error } = await supabase
    .from('vehicle_penalty_summary')
    .select('*')
    .eq('vehicle_number', vehicleNumber)
    .order('month', { ascending: false });
  
  if (error) throw error;
  return data as VehiclePenaltySummary[];
};
