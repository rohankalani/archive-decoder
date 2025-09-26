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
  activityInsights?: {
    averageCO2: number;
    realEstateMetrics: {
      roomUsageHours: number;
      peakOccupancyPeriod: { start: number; end: number; description: string };
      roomEfficiencyScore: number;
      actualOccupancyRate: number;
    };
    occupancyTimeline: Array<{ hour: number; avgCO2: number; occupancyLevel: string; isOccupied: boolean }>;
    airQualityDuringClasses: {
      classHours: { avgCO2: number; avgAQI: number };
      offHours: { avgCO2: number; avgAQI: number };
    };
    ventilationEffectiveness: {
      recoveryTimeMinutes: number;
      maxCO2Reached: number;
      ventilationScore: number;
    };
    facilitiesInsights: {
      energyCostPerHour: number;
      hvacEfficiencyRating: string;
      maintenanceStatus: string;
    };
  };
  externalComparison?: {
    outdoorPM25: number;
    indoorAdvantage: number;
    protectionValue: string;
    airQualityAdvantage: number;
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

    // Prepare activity insights and external comparison sections
    let activitySection = '';
    if (reportData.activityInsights) {
      const insights = reportData.activityInsights;
      activitySection = `

🏫 **CLASSROOM INTELLIGENCE & REAL ESTATE ANALYTICS** (Advanced CO2-Based Analytics):
- Average CO2 Levels: ${insights.averageCO2.toFixed(0)} ppm
- Room Usage Hours: ${insights.realEstateMetrics.roomUsageHours.toFixed(1)} hours/day
- Room Efficiency Score: ${insights.realEstateMetrics.roomEfficiencyScore}/100
- Peak Occupancy Period: ${insights.realEstateMetrics.peakOccupancyPeriod.start}:00-${insights.realEstateMetrics.peakOccupancyPeriod.end}:00 (${insights.realEstateMetrics.peakOccupancyPeriod.description})

🎯 **VENTILATION EFFECTIVENESS INTELLIGENCE**:
- Ventilation Performance Score: ${insights.ventilationEffectiveness.ventilationScore}/100
- Maximum CO2 Reached: ${insights.ventilationEffectiveness.maxCO2Reached.toFixed(0)} ppm
- Estimated Recovery Time: ${insights.ventilationEffectiveness.recoveryTimeMinutes} minutes

💰 **FACILITIES COST INTELLIGENCE**:
- HVAC Cost per Usage Hour: $${insights.facilitiesInsights.energyCostPerHour.toFixed(2)}
- System Efficiency Rating: ${insights.facilitiesInsights.hvacEfficiencyRating}
- Maintenance Status: ${insights.facilitiesInsights.maintenanceStatus}
- Occupancy Rate: ${insights.realEstateMetrics.actualOccupancyRate.toFixed(1)}%

🕐 Class Hours vs Off-Hours Air Quality:
- During Classes (8AM-6PM): ${insights.airQualityDuringClasses.classHours.avgCO2.toFixed(0)} ppm CO2, AQI ${insights.airQualityDuringClasses.classHours.avgAQI.toFixed(0)}
- Off-Hours: ${insights.airQualityDuringClasses.offHours.avgCO2.toFixed(0)} ppm CO2, AQI ${insights.airQualityDuringClasses.offHours.avgAQI.toFixed(0)}`;
    }

    let externalSection = '';
    if (reportData.externalComparison) {
      const ext = reportData.externalComparison;
      externalSection = `

🌍 **EXTERNAL AIR QUALITY ADVANTAGE ANALYSIS**:
- Abu Dhabi Outdoor PM2.5: ${ext.outdoorPM25.toFixed(1)} µg/m³
- Indoor Air Quality Advantage: ${ext.airQualityAdvantage.toFixed(0)}% cleaner than outdoor
- Protection Multiplier: ${ext.indoorAdvantage}x cleaner indoor environment
- Value Proposition: ${ext.protectionValue}

💰 **QUANTIFIED BUSINESS BENEFITS**:
- Reduced exposure to outdoor pollutants saves estimated health costs
- Enhanced productivity environment with controlled air quality
- Compliance with international indoor air quality standards`;
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
).join('\n')}${activitySection}${externalSection}

**ANALYSIS REQUIREMENTS FOR TOP MANAGEMENT:**

Please provide a comprehensive, executive-level air quality and occupancy intelligence report that demonstrates clear ROI for sensor deployment expansion. Include:

1. **💼 EXECUTIVE DASHBOARD**: Key performance indicators and ROI metrics for university leadership
2. **🎯 COMPETITIVE AIR QUALITY ADVANTAGE**: How our indoor environment compares to Abu Dhabi outdoor conditions  
3. **💰 QUANTIFIED BUSINESS VALUE**: HVAC optimization savings, productivity gains, health cost avoidance calculations
4. **📊 SPACE INTELLIGENCE**: Advanced activity patterns, ventilation effectiveness, room-specific performance metrics
5. **⚠️ RISK MITIGATION**: Compliance status, liability reduction, proactive health protection measures
6. **🏗️ STRATEGIC EXPANSION ROADMAP**: Data-driven sensor deployment priorities with specific ROI projections
7. **📈 PERFORMANCE BENCHMARKING**: Establish measurable KPIs for continuous improvement tracking
8. **🎓 ACADEMIC EXCELLENCE CORRELATION**: Direct link between optimal air quality and enhanced learning environments
9. **🌍 SUSTAINABILITY LEADERSHIP**: Environmental responsibility and energy efficiency achievements
10. **🚀 INNOVATION SHOWCASE**: Smart building capabilities and IoT infrastructure value demonstration

**Executive Focus Areas:**
- **Air Quality Advantage**: Quantify how much cleaner indoor air is vs. Abu Dhabi outdoor pollution
- **HVAC Intelligence**: Show CO2 patterns reveal optimal ventilation schedules and energy savings opportunities  
- **Space Optimization**: Identify underutilized areas and overcrowding patterns for better space planning
- **Health Cost Avoidance**: Calculate potential healthcare savings from maintaining superior indoor air quality
- **Expansion ROI**: Present compelling financial case for scaling sensor network with specific payback periods
- **Predictive Insights**: Use AI to forecast maintenance needs and prevent air quality issues before they occur

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
    
    if (!geminiData.candidates || geminiData.candidates.length === 0 || 
        !geminiData.candidates[0] || !geminiData.candidates[0].content || 
        !geminiData.candidates[0].content.parts || geminiData.candidates[0].content.parts.length === 0) {
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