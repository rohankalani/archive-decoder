import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting prolonged alerts check...');

    // Get email settings
    const { data: emailSettings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*');

    if (settingsError) {
      console.error('Error fetching email settings:', settingsError);
      throw settingsError;
    }

    const adminEmail = emailSettings?.find(s => s.setting_key === 'admin_email')?.setting_value;
    const supervisorEmail = emailSettings?.find(s => s.setting_key === 'supervisor_email')?.setting_value;
    const thresholdHours = parseFloat(emailSettings?.find(s => s.setting_key === 'alert_threshold_hours')?.setting_value || '1');

    if (!adminEmail && !supervisorEmail) {
      console.log('No email addresses configured for alerts');
      return new Response(JSON.stringify({ message: 'No email addresses configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get air quality thresholds for critical levels
    const { data: thresholds, error: thresholdError } = await supabase
      .from('air_quality_thresholds')
      .select('*');

    if (thresholdError) {
      console.error('Error fetching thresholds:', thresholdError);
      throw thresholdError;
    }

    // Check for devices with prolonged critical readings
    const thresholdTime = new Date(Date.now() - (thresholdHours * 60 * 60 * 1000));
    
    const { data: recentReadings, error: readingsError } = await supabase
      .from('sensor_readings')
      .select(`
        *,
        devices(name, id)
      `)
      .gte('timestamp', thresholdTime.toISOString())
      .order('timestamp', { ascending: false });

    if (readingsError) {
      console.error('Error fetching sensor readings:', readingsError);
      throw readingsError;
    }

    // Group readings by device and sensor type
    const deviceSensorGroups: Record<string, Record<string, any[]>> = {};
    
    recentReadings?.forEach(reading => {
      const deviceId = reading.device_id;
      const sensorType = reading.sensor_type;
      
      if (!deviceSensorGroups[deviceId]) {
        deviceSensorGroups[deviceId] = {};
      }
      if (!deviceSensorGroups[deviceId][sensorType]) {
        deviceSensorGroups[deviceId][sensorType] = [];
      }
      
      deviceSensorGroups[deviceId][sensorType].push(reading);
    });

    const prolongedAlerts = [];

    // Check each device/sensor combination for prolonged critical levels
    for (const [deviceId, sensorGroups] of Object.entries(deviceSensorGroups)) {
      for (const [sensorType, readings] of Object.entries(sensorGroups)) {
        // Get threshold for this sensor type
        const threshold = thresholds?.find(t => t.sensor_type === sensorType);
        if (!threshold) continue;

        // Check if all readings in the time period exceed hazardous level
        const criticalReadings = readings.filter(r => 
          threshold.hazardous_min && parseFloat(r.value) >= threshold.hazardous_min
        );

        // If we have critical readings spanning the entire threshold period
        if (criticalReadings.length > 0) {
          const oldestReading = criticalReadings[criticalReadings.length - 1];
          const newestReading = criticalReadings[0];
          
          const timeDiff = new Date(newestReading.timestamp).getTime() - new Date(oldestReading.timestamp).getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          if (hoursDiff >= thresholdHours) {
            prolongedAlerts.push({
              deviceId,
              deviceName: readings[0].devices?.name || deviceId,
              sensorType,
              value: parseFloat(newestReading.value),
              threshold: threshold.hazardous_min,
              duration: hoursDiff,
              unit: newestReading.unit,
            });
          }
        }
      }
    }

    console.log(`Found ${prolongedAlerts.length} prolonged alerts`);

    // Send email notifications if there are prolonged alerts
    if (prolongedAlerts.length > 0) {
      console.log('Would send email alerts for:', prolongedAlerts);
      // TODO: Implement email sending with Resend when configured
      
      // Create in-app notifications for admins and supervisors
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'super_admin', 'supervisor']);

      if (adminUsers && adminUsers.length > 0) {
        const notifications = adminUsers.map(user => ({
          user_id: user.id,
          title: 'Prolonged Critical Air Quality Alert',
          message: `${prolongedAlerts.length} sensor(s) have been in critical range for over ${thresholdHours} hour(s). Immediate attention required.`,
          type: 'error',
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      prolongedAlerts: prolongedAlerts.length,
      emailsSent: 'not_configured',
      message: `Found ${prolongedAlerts.length} prolonged critical alerts`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-prolonged-alerts function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to check prolonged alerts'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});