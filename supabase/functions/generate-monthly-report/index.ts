import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');
const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
    console.log('Generating monthly report...');

    // Get the previous month date range
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    console.log(`Report period: ${lastMonth.toISOString()} to ${lastMonthEnd.toISOString()}`);

    // Get sensor readings for the previous month
    const { data: readings, error: readingsError } = await supabase
      .from('sensor_readings')
      .select('*, devices!inner(*)')
      .gte('timestamp', lastMonth.toISOString())
      .lte('timestamp', lastMonthEnd.toISOString());

    if (readingsError) throw readingsError;

    // Get alerts for the previous month
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .gte('created_at', lastMonth.toISOString())
      .lte('created_at', lastMonthEnd.toISOString());

    if (alertsError) throw alertsError;

    if (!readings || readings.length === 0) {
      console.log('No data available for monthly report');
      return new Response(JSON.stringify({ 
        error: 'No data available for monthly report',
        period: `${lastMonth.toLocaleDateString()} - ${lastMonthEnd.toLocaleDateString()}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate report data
    const pm25Readings = readings.filter(r => r.sensor_type === 'pm25');
    const averagePm25 = pm25Readings.length > 0 
      ? pm25Readings.reduce((sum, r) => sum + Number(r.value), 0) / pm25Readings.length
      : null;
    
    // Calculate AQI
    const calculateAqi = (pm25: number): number => {
      if (pm25 <= 12) return (50 / 12) * pm25;
      if (pm25 <= 35.4) return 50 + ((100 - 50) / (35.4 - 12)) * (pm25 - 12);
      if (pm25 <= 55.4) return 100 + ((150 - 100) / (55.4 - 35.4)) * (pm25 - 35.4);
      if (pm25 <= 150.4) return 150 + ((200 - 150) / (150.4 - 55.4)) * (pm25 - 55.4);
      if (pm25 <= 250.4) return 200 + ((300 - 200) / (250.4 - 150.4)) * (pm25 - 150.4);
      return 300 + ((500 - 300) / (500.4 - 250.4)) * (pm25 - 250.4);
    };

    const averageAqi = averagePm25 ? calculateAqi(averagePm25) : null;

    // Find peak pollution event
    const sortedByValue = readings.sort((a, b) => Number(b.value) - Number(a.value));
    const peakPollution = sortedByValue.length > 0 ? {
      value: Number(sortedByValue[0].value),
      sensorType: sortedByValue[0].sensor_type,
      unit: sortedByValue[0].unit,
      timestamp: sortedByValue[0].timestamp,
    } : null;

    // Calculate sensor breakdown
    const sensorGroups = readings.reduce((acc, reading) => {
      const type = reading.sensor_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(Number(reading.value));
      return acc;
    }, {} as Record<string, number[]>);

    const sensorBreakdown = Object.entries(sensorGroups).map(([type, values]) => ({
      sensorType: type,
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
      count: values.length,
    }));

    const reportData = {
      totalReadings: readings.length,
      averageAqi,
      peakPollution,
      alertCount: alerts?.length || 0,
      sensorBreakdown,
      period: {
        from: lastMonth.toISOString(),
        to: lastMonthEnd.toISOString(),
      },
    };

    // Generate AI summary if Gemini API is available
    let aiSummary = '';
    if (geminiApiKey) {
      try {
        const monthName = lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const prompt = `Monthly Air Quality Report Analysis for ${monthName}

Data Summary:
- Total sensor readings: ${reportData.totalReadings}
- Average Air Quality Index (AQI): ${reportData.averageAqi?.toFixed(1) || 'N/A'}
- Total alerts generated: ${reportData.alertCount}
- Peak pollution event: ${reportData.peakPollution ? `${reportData.peakPollution.value.toFixed(2)} ${reportData.peakPollution.unit} (${reportData.peakPollution.sensorType}) at ${new Date(reportData.peakPollution.timestamp).toLocaleString()}` : 'None recorded'}

Sensor Performance:
${reportData.sensorBreakdown.map(sensor => 
  `- ${sensor.sensorType.toUpperCase()}: Avg ${sensor.average.toFixed(2)}, Range ${sensor.min.toFixed(2)} - ${sensor.max.toFixed(2)} (${sensor.count} readings)`
).join('\n')}

Please provide a comprehensive monthly air quality report that includes:

1. **Executive Summary**: Overall assessment of air quality for ${monthName}
2. **Monthly Trends**: Analysis of air quality patterns throughout the month
3. **Health Assessment**: Impact on occupant health and well-being
4. **Compliance Review**: Status against air quality standards and regulations
5. **Improvement Recommendations**: Specific actions to enhance air quality
6. **Outlook**: Predictions and recommendations for the coming month
7. **Key Performance Indicators**: Summary of important metrics and their trends

Format as a professional monthly report suitable for university administrators and health officials.`;

        const response = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiApiKey,
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        if (response.ok) {
          const geminiData = await response.json();
          if (geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content) {
            aiSummary = geminiData.candidates[0].content.parts[0].text;
          }
        }
      } catch (error) {
        console.error('Error generating AI summary:', error);
      }
    }

    // Get supervisor email for sending the report
    const { data: emailSettings } = await supabase
      .from('email_settings')
      .select('*');

    const supervisorEmail = emailSettings?.find(s => s.setting_key === 'supervisor_email')?.setting_value;

    // Send email report if configured
    if (supervisorEmail && resend) {
      const monthName = lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      let emailContent = `Monthly Air Quality Report - ${monthName}

${aiSummary || 'Automated monthly air quality report'}

=== DATA SUMMARY ===
• Total Readings: ${reportData.totalReadings}
• Average AQI: ${reportData.averageAqi?.toFixed(1) || 'N/A'}
• Total Alerts: ${reportData.alertCount}
• Peak Pollution: ${reportData.peakPollution?.value?.toFixed(2) || 'N/A'} ${reportData.peakPollution?.unit || ''}

=== SENSOR BREAKDOWN ===
${reportData.sensorBreakdown.map(sensor => 
  `• ${sensor.sensorType.toUpperCase()}: Avg ${sensor.average.toFixed(2)}, Range ${sensor.min.toFixed(2)}-${sensor.max.toFixed(2)} (${sensor.count} readings)`
).join('\n')}

Report Period: ${lastMonth.toLocaleDateString()} - ${lastMonthEnd.toLocaleDateString()}
Generated: ${new Date().toLocaleString()}

This is an automated monthly report from the Air Quality Monitoring System.`;

      try {
        await resend.emails.send({
          from: 'Air Quality System <reports@yourdomain.com>',
          to: [supervisorEmail],
          subject: `📊 Monthly Air Quality Report - ${monthName}`,
          text: emailContent,
        });
        console.log('Monthly report email sent successfully');
      } catch (emailError) {
        console.error('Error sending monthly report email:', emailError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      reportData,
      aiSummary,
      emailSent: supervisorEmail && resend ? 'yes' : 'no',
      period: `${lastMonth.toLocaleDateString()} - ${lastMonthEnd.toLocaleDateString()}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-monthly-report function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to generate monthly report'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});