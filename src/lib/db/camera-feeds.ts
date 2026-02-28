import { supabase } from "@/integrations/supabase/client";

export interface CameraFeed {
  id: string;
  camera_location_id: string;
  feed_url: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  camera_locations?: {
    location_name: string;
    latitude: number;
    longitude: number;
    status: string;
  };
}

export const getCameraFeeds = async () => {
  const { data, error } = await supabase
    .from('camera_feeds')
    .select(`
      *,
      camera_locations (
        location_name,
        latitude,
        longitude,
        status
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as CameraFeed[];
};

export const getCameraFeed = async (id: string) => {
  const { data, error } = await supabase
    .from('camera_feeds')
    .select(`
      *,
      camera_locations (
        location_name,
        latitude,
        longitude,
        status
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as CameraFeed;
};

export const createCameraFeed = async (feed: Omit<CameraFeed, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('camera_feeds')
    .insert([feed])
    .select()
    .single();
  
  if (error) throw error;
  return data as CameraFeed;
};

export const updateCameraFeed = async (id: string, updates: Partial<CameraFeed>) => {
  const { data, error } = await supabase
    .from('camera_feeds')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as CameraFeed;
};

export const deleteCameraFeed = async (id: string) => {
  const { error } = await supabase
    .from('camera_feeds')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
