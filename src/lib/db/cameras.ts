import { supabase } from "@/integrations/supabase/client";

export interface Camera {
  id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'offline';
  violation_count: number;
  last_active: string;
}

export const getCameras = async () => {
  const { data, error } = await supabase
    .from('camera_locations')
    .select('*')
    .order('location_name', { ascending: true });
  
  if (error) throw error;
  return data as Camera[];
};

export const getCamera = async (id: string) => {
  const { data, error } = await supabase
    .from('camera_locations')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Camera;
};

export const updateCameraStatus = async (id: string, status: 'active' | 'offline') => {
  const { data, error } = await supabase
    .from('camera_locations')
    .update({ status, last_active: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Camera;
};
