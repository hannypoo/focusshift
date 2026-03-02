import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useProfileId } from './useProfileId';
import type { Location } from '../types/database';
import { toast } from 'sonner';

export function useLocations() {
  const profileId = useProfileId();
  return useQuery({
    queryKey: ['locations', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('profile_id', profileId)
        .order('is_home', { ascending: false });
      if (error) throw error;
      return data as Location[];
    },
  });
}

export function useCreateLocation() {
  const profileId = useProfileId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (loc: { name: string; address?: string; is_home?: boolean }) => {
      const { data, error } = await supabase
        .from('locations')
        .insert({ ...loc, profile_id: profileId })
        .select()
        .single();
      if (error) throw error;
      return data as Location;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location added');
    },
    onError: () => {
      toast.error('Failed to add location');
    },
  });
}

export function useDeleteLocation() {
  const profileId = useProfileId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id)
        .eq('profile_id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location removed');
    },
  });
}
