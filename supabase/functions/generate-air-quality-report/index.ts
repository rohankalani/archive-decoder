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
  occupancyInsights?: {
    averageCO2: number;
    peakOccupancyHours: Array<{ hour: number; avgCO2: number; estimatedOccupancy: number }>;
    classroomUtilization: number;
    busyDays: Array<{ day: string; avgCO2: number; occupancyScore: number }>;
    airQualityDuringClasses: {
      classHours: { avgCO2: number; avgAQI: number };
      offHours: { avgCO2: number; avgAQI: number };
    };
    spaceEfficiency: {
      underutilizedRooms: number;
      overCrowdedPeriods: number;
      optimalCapacityPercentage: number;
    };
  };
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

    // Check if we have enough data to generate a meaningful report
    if (reportData.totalReadings === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No data available for the selected period',
          details: 'Please select a different date range or ensure devices are collecting data'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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

    // Prepare occupancy insights section
    let occupancySection = '';
    if (reportData.occupancyInsights) {
      const insights = reportData.occupancyInsights;
      occupancySection = `

🏫 **OCCUPANCY & SPACE UTILIZATION ANALYSIS** (CO2-Based Intelligence):
- Average CO2 Levels: ${insights.averageCO2.toFixed(0)} ppm
- Classroom Utilization Rate: ${insights.classroomUtilization.toFixed(1)}%
- Peak Activity Hours: ${insights.peakOccupancyHours.slice(0, 3).map(h => `${h.hour}:00 (${h.estimatedOccupancy} people, ${h.avgCO2.toFixed(0)} ppm)`).join(', ')}

📊 Space Efficiency Metrics:
- Optimal Capacity Periods: ${insights.spaceEfficiency.optimalCapacityPercentage}%
- Under-utilized Rooms: ${insights.spaceEfficiency.underutilizedRooms}% of readings
- Overcrowded Periods: ${insights.spaceEfficiency.overCrowdedPeriods}% of readings

📅 Busiest Days: ${insights.busyDays.slice(0, 3).map(d => `${d.day} (${d.occupancyScore.toFixed(0)}% utilization)`).join(', ')}

🕐 Class Hours vs Off-Hours Air Quality:
- During Classes (8AM-6PM): ${insights.airQualityDuringClasses.classHours.avgCO2.toFixed(0)} ppm CO2, AQI ${insights.airQualityDuringClasses.classHours.avgAQI.toFixed(0)}
- Off-Hours: ${insights.airQualityDuringClasses.offHours.avgCO2.toFixed(0)} ppm CO2, AQI ${insights.airQualityDuringClasses.offHours.avgAQI.toFixed(0)}`;
    }

    const prompt = `${contextInfo}

📈 **COMPREHENSIVE AIR QUALITY & OCCUPANCY INTELLIGENCE REPORT**

Data Summary:
- Total sensor readings collected: ${reportData.totalReadings}
- Average Air Quality Index (AQI): ${reportData.averageAqi?.toFixed(1) || 'N/A'}
- Number of alerts generated: ${reportData.alertCount}
- Peak pollution event: ${reportData.peakPollution ? `${reportData.peakPollution.value.toFixed(2)} ${reportData.peakPollution.unit} (${reportData.peakPollution.sensorType}) at ${new Date(reportData.peakPollution.timestamp).toLocaleString()}` : 'None recorded'}

Sensor Breakdown:
${reportData.sensorBreakdown.map(sensor => 
  `- ${sensor.sensorType.toUpperCase()}: Average ${sensor.average.toFixed(2)}, Range ${sensor.min.toFixed(2)} - ${sensor.max.toFixed(2)} (${sensor.count} readings)`
).join('\n')}${occupancySection}

**ANALYSIS REQUIREMENTS FOR TOP MANAGEMENT:**

Please provide a comprehensive, executive-level air quality and occupancy intelligence report that demonstrates clear ROI for sensor deployment expansion. Include:

1. **💼 EXECUTIVE DASHBOARD**: Key performance indicators that matter to university leadership
2. **🎯 BUSINESS IMPACT**: How air quality correlates with student performance, class attendance, and facility efficiency
3. **💰 COST-BENEFIT ANALYSIS**: Potential savings from optimized HVAC, reduced sick days, improved productivity
4. **📊 OCCUPANCY INTELLIGENCE**: Detailed insights on space utilization, peak hours, classroom efficiency
5. **⚠️ COMPLIANCE & LIABILITY**: Risk mitigation and regulatory compliance status
6. **🏗️ EXPANSION RECOMMENDATIONS**: Specific recommendations for additional sensor deployment with ROI projections
7. **📈 PERFORMANCE METRICS**: Baseline establishment for measuring improvement after sensor network expansion
8. **🎓 STUDENT HEALTH & PERFORMANCE**: Direct correlation between air quality and academic environment quality

**Special Focus Areas:**
- Demonstrate how CO2 data reveals classroom overcrowding and scheduling inefficiencies
- Show correlation between poor air quality and potential health/productivity impacts
- Highlight revenue opportunities (energy savings, space optimization, health cost reduction)
- Present compelling case for scaling the sensor network across more locations

Use professional language suitable for C-suite executives, university board members, and facility investment committees. Include specific ROI calculations and implementation timeline recommendations.

**AQI & CO2 Reference Standards:**
- AQI: 0-50 (Good), 51-100 (Moderate), 101-150 (Unhealthy for Sensitive), 151+ (Unhealthy)
- CO2: <400ppm (Outdoor), 400-1000ppm (Acceptable), 1000-5000ppm (Drowsiness), >5000ppm (Dangerous)
- Occupancy Estimation: Each person adds ~100ppm CO2 in typical classroom environment`;

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