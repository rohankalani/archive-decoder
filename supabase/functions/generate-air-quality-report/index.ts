import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportData {
  totalReadings: number;
  averageAqi: number | null;
  peakPollution: {
    value: number;
    sensorType: string;
    unit: string;
    timestamp: string;
  } | null;
  alertCount: number;
  sensorBreakdown: Array<{
    sensorType: string;
    average: number;
    max: number;
    min: number;
    count: number;
  }>;
}

interface RequestBody {
  reportData: ReportData;
  dateRange: {
    from: string;
    to: string;
  };
  deviceId?: string;
  locationId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportData, dateRange, deviceId, locationId }: RequestBody = await req.json();
    
    console.log('Generating AI report for data:', {
      totalReadings: reportData.totalReadings,
      averageAqi: reportData.averageAqi,
      alertCount: reportData.alertCount,
      dateRange,
    });

    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Google Gemini API key not found');
    }

    // Prepare the prompt for AI analysis
    const fromDate = new Date(dateRange.from).toLocaleDateString();
    const toDate = new Date(dateRange.to).toLocaleDateString();
    
    let contextInfo = `Air Quality Monitoring Report Analysis
Period: ${fromDate} to ${toDate}`;

    if (deviceId && deviceId !== 'all') {
      contextInfo += `\nDevice: Specific device (${deviceId})`;
    } else {
      contextInfo += `\nScope: All devices`;
    }

    if (locationId && locationId !== 'all') {
      contextInfo += `\nLocation: Specific location (${locationId})`;
    } else {
      contextInfo += `\nLocation: All locations`;
    }

    const prompt = `${contextInfo}

Data Summary:
- Total sensor readings collected: ${reportData.totalReadings}
- Average Air Quality Index (AQI): ${reportData.averageAqi?.toFixed(1) || 'N/A'}
- Number of alerts generated: ${reportData.alertCount}
- Peak pollution event: ${reportData.peakPollution ? `${reportData.peakPollution.value.toFixed(2)} ${reportData.peakPollution.unit} (${reportData.peakPollution.sensorType}) at ${new Date(reportData.peakPollution.timestamp).toLocaleString()}` : 'None recorded'}

Sensor Breakdown:
${reportData.sensorBreakdown.map(sensor => 
  `- ${sensor.sensorType.toUpperCase()}: Average ${sensor.average.toFixed(2)}, Range ${sensor.min.toFixed(2)} - ${sensor.max.toFixed(2)} (${sensor.count} readings)`
).join('\n')}

Please provide a comprehensive air quality report analysis that includes:

1. **Executive Summary**: Overall air quality assessment for the period
2. **Key Findings**: Notable trends, patterns, or concerning measurements
3. **Health Implications**: What these readings mean for occupants/visitors
4. **Compliance Status**: Assessment against standard air quality guidelines (WHO, EPA)
5. **Recommendations**: Specific actionable improvements for air quality management
6. **Risk Assessment**: Identification of any immediate or long-term health risks
7. **Trend Analysis**: If patterns suggest improving or deteriorating conditions

Format the response in clear sections with bullet points where appropriate. Use professional language suitable for facility managers and health officials. Include specific numerical references to the data provided.

AQI Reference Levels:
- 0-50: Good (Green)
- 51-100: Moderate (Yellow) 
- 101-150: Unhealthy for Sensitive Groups (Orange)
- 151-200: Unhealthy (Red)
- 201-300: Very Unhealthy (Purple)
- 301+: Hazardous (Maroon)`;

    // Call Google Gemini API
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const geminiData = await response.json();
    
    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      console.error('Unexpected Gemini response structure:', geminiData);
      throw new Error('Invalid response from Gemini API');
    }

    const aiSummary = geminiData.candidates[0].content.parts[0].text;
    
    console.log('AI report generated successfully');

    return new Response(
      JSON.stringify({ 
        summary: aiSummary,
        generatedAt: new Date().toISOString(),
        dataPoints: reportData.totalReadings,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-air-quality-report function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to generate AI report'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});