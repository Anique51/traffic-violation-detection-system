import { supabase } from "@/integrations/supabase/client";

export interface ViolationType {
  id: string;
  name: string;
  default_fine: number;
  penalty_points: number;
  description?: string;
  created_at: string;
}

export const getViolationTypes = async () => {
  const { data, error } = await supabase
    .from('violation_types')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data as ViolationType[];
};

export const updateViolationType = async (
  id: string, 
  updates: { default_fine?: number; penalty_points?: number }
) => {
  const { data, error } = await supabase
    .from('violation_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as ViolationType;
};
