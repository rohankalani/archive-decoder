import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting device health monitoring...');

    // Find devices that have sent data in the last 5 minutes
    const offlineThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentReadings, error: readingsError } = await supabase
      .from('sensor_readings')
      .select('device_id')
      .gte('created_at', offlineThreshold);

    if (readingsError) {
      console.error('Error fetching recent readings:', readingsError);
      throw readingsError;
    }

    // Get all devices
    const { data: allDevices, error: devicesError } = await supabase
      .from('devices')
      .select('id, name, status');

    if (devicesError) {
      console.error('Error fetching devices:', devicesError);
      throw devicesError;
    }

    const recentDeviceIds = new Set(recentReadings?.map((r: any) => r.device_id) || []);
    const devicesGoingOffline = [];
    const devicesComingOnline = [];

    for (const device of allDevices || []) {
      const hasRecentData = recentDeviceIds.has(device.id);
      
      if (!hasRecentData && device.status === 'online') {
        // Device should go offline
        devicesGoingOffline.push(device);
      } else if (hasRecentData && device.status === 'offline') {
        // Device should come online
        devicesComingOnline.push(device);
      }
    }

    // Update offline devices
    if (devicesGoingOffline.length > 0) {
      const offlineIds = devicesGoingOffline.map(d => d.id);
      const { error: offlineError } = await supabase
        .from('devices')
        .update({ 
          status: 'offline',
          updated_at: new Date().toISOString()
        })
        .in('id', offlineIds);

      if (offlineError) {
        console.error('Error updating offline devices:', offlineError);
      } else {
        console.log(`Updated ${devicesGoingOffline.length} devices to offline`);
        
        // Create notifications for critical devices going offline
        const notifications = devicesGoingOffline.map(device => ({
          user_id: null, // Will be handled by admin notification system
          title: 'Device Offline',
          message: `Device ${device.name} has gone offline`,
          type: 'warning'
        }));

        // Insert notifications (system can insert without user_id for admin notifications)
        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }
    }

    // Update online devices
    if (devicesComingOnline.length > 0) {
      const onlineIds = devicesComingOnline.map(d => d.id);
      const { error: onlineError } = await supabase
        .from('devices')
        .update({ 
          status: 'online',
          updated_at: new Date().toISOString()
        })
        .in('id', onlineIds);

      if (onlineError) {
        console.error('Error updating online devices:', onlineError);
      } else {
        console.log(`Updated ${devicesComingOnline.length} devices to online`);
      }
    }

    // Health report
    const healthReport = {
      timestamp: new Date().toISOString(),
      total_devices: allDevices?.length || 0,
      online_devices: (allDevices?.filter(d => recentDeviceIds.has(d.id)) || []).length,
      offline_devices: (allDevices?.length || 0) - (allDevices?.filter(d => recentDeviceIds.has(d.id)) || []).length,
      devices_went_offline: devicesGoingOffline.length,
      devices_came_online: devicesComingOnline.length,
      data_points_last_5min: recentReadings?.length || 0
    };

    console.log('Health report:', healthReport);

    return new Response(
      JSON.stringify({
        success: true,
        report: healthReport
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in device health monitoring:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});