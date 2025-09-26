import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Alert {
  id: string;
  device_id: string;
  sensor_type: string;
  severity: string;
  value: number;
  threshold_value: number;
  message: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const resolveAlert = async (alertId: string, resolvedBy: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          is_resolved: true,
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
      
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, is_resolved: true, resolved_by: resolvedBy, resolved_at: new Date().toISOString() }
          : alert
      ));
      
      toast.success('Alert resolved successfully');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Set up real-time subscription for alerts
    const channel = supabase
      .channel('alerts-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts'
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    alerts,
    isLoading,
    resolveAlert,
    refetch: fetchAlerts,
  };
}