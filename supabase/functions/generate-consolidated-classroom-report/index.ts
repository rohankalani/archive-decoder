import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClassroomData {
  classroomId: string;
  classroomName: string;
  building: string;
  floor: number;
  roomEfficiencyScore: number;
  ventilationScore: number;
  operatingHoursAqi: number;
  afterHoursAqi: number;
  operatingHoursCO2: number;
  afterHoursCO2: number;
  operatingHoursTemp: number;
  afterHoursTemp: number;
  temperatureStability: number;
  alertCount: number;
  status: string;
  recommendations: string[];
}

interface ConsolidatedData {
  totalClassrooms: number;
  averageEfficiency: number;
  excellentClassrooms: number;
  needsAttentionClassrooms: number;
  totalAlerts: number;
  topPerformer: {
    name: string;
    building: string;
    efficiency: number;
    ventilation: number;
  };
  bottomPerformer: {
    name: string;
    building: string;
    efficiency: number;
    issues: string;
  };
  temperatureInsights: {
    avgOperatingTemp: number;
    avgAfterHoursTemp: number;
    maxTempVariation: number;
    energySavingOpportunity: string;
  };
  operatingHours: { start: number; end: number };
  dateRange: { from: string; to: string };
}

interface RequestBody {
  consolidatedData: ConsolidatedData;
  classroomsData: ClassroomData[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { consolidatedData, classroomsData }: RequestBody = await req.json();
    
    console.log('Generating consolidated classroom report for', consolidatedData.totalClassrooms, 'classrooms');

    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Google Gemini API key not found');
    }

    // Prepare the comprehensive prompt for AI analysis
    const fromDate = new Date(consolidatedData.dateRange.from).toLocaleDateString();
    const toDate = new Date(consolidatedData.dateRange.to).toLocaleDateString();
    
    const prompt = `🏫 **COMPREHENSIVE UNIVERSITY CLASSROOM INTELLIGENCE REPORT**

**EXECUTIVE DASHBOARD SUMMARY**
Report Period: ${fromDate} to ${toDate}
Operating Hours: ${consolidatedData.operatingHours.start}:00 - ${consolidatedData.operatingHours.end}:00

**📊 CAMPUS-WIDE PERFORMANCE METRICS:**
- Total Classrooms Monitored: ${consolidatedData.totalClassrooms}
- Average Efficiency Score: ${consolidatedData.averageEfficiency.toFixed(1)}%
- Excellent Performing Classrooms: ${consolidatedData.excellentClassrooms}/${consolidatedData.totalClassrooms} (${((consolidatedData.excellentClassrooms/consolidatedData.totalClassrooms)*100).toFixed(1)}%)
- Classrooms Needing Attention: ${consolidatedData.needsAttentionClassrooms}/${consolidatedData.totalClassrooms}
- Total Air Quality Alerts: ${consolidatedData.totalAlerts}

**🏆 PERFORMANCE CHAMPIONS & CHALLENGES:**

Top Performer: ${consolidatedData.topPerformer.name} (${consolidatedData.topPerformer.building})
- Room Efficiency: ${consolidatedData.topPerformer.efficiency}%
- Ventilation Score: ${consolidatedData.topPerformer.ventilation}/100

Needs Immediate Attention: ${consolidatedData.bottomPerformer.name} (${consolidatedData.bottomPerformer.building})
- Room Efficiency: ${consolidatedData.bottomPerformer.efficiency}%
- Key Issues: ${consolidatedData.bottomPerformer.issues}

**🌡️ TEMPERATURE & HVAC INTELLIGENCE:**
- Average Operating Hours Temperature: ${consolidatedData.temperatureInsights.avgOperatingTemp.toFixed(1)}°C
- Average After-Hours Temperature: ${consolidatedData.temperatureInsights.avgAfterHoursTemp.toFixed(1)}°C
- Maximum Temperature Variation: ${consolidatedData.temperatureInsights.maxTempVariation.toFixed(1)}°C
- Energy Saving Opportunity: ${consolidatedData.temperatureInsights.energySavingOpportunity}

**📈 DETAILED CLASSROOM ANALYSIS:**
${classroomsData.map((classroom, index) => `
${index + 1}. ${classroom.classroomName} (${classroom.building}, Floor ${classroom.floor})
   - Status: ${classroom.status.toUpperCase()}
   - Efficiency: ${classroom.roomEfficiencyScore}% | Ventilation: ${classroom.ventilationScore}/100
   - Operating Hours: AQI ${classroom.operatingHoursAqi}, CO₂ ${classroom.operatingHoursCO2.toFixed(0)}ppm, ${classroom.operatingHoursTemp.toFixed(1)}°C
   - After Hours: AQI ${classroom.afterHoursAqi}, CO₂ ${classroom.afterHoursCO2.toFixed(0)}ppm, ${classroom.afterHoursTemp.toFixed(1)}°C
   - Temperature Stability: ±${classroom.temperatureStability.toFixed(1)}°C | Alerts: ${classroom.alertCount}
   - Key Recommendations: ${classroom.recommendations.slice(0, 2).join('; ')}`).join('')}

**🎯 STRATEGIC ANALYSIS REQUIREMENTS:**

Please provide a comprehensive C-suite executive report that delivers actionable intelligence for university leadership. Focus on:

**1. 💼 EXECUTIVE SUMMARY & ROI DASHBOARD**
- Strategic performance overview with key financial implications
- Classroom utilization efficiency trends and revenue optimization opportunities
- Critical incidents and proactive risk management insights

**2. 🌡️ ADVANCED TEMPERATURE & HVAC INTELLIGENCE**
- Operating vs after-hours temperature patterns revealing HVAC optimization opportunities
- Energy cost savings calculations based on temperature differential analysis
- Predictive maintenance recommendations from temperature stability data
- Seasonal adjustment strategies for optimal energy efficiency

**3. 📊 COMPARATIVE CLASSROOM PERFORMANCE ANALYTICS**
- Best-in-class vs underperforming classroom analysis with specific improvement actions
- Building-level performance comparisons and resource allocation recommendations
- Occupancy pattern insights revealing space optimization opportunities

**4. 🚨 PROACTIVE RISK MANAGEMENT & COMPLIANCE**
- Air quality alert pattern analysis and prevention strategies
- Health and safety compliance status with regulatory implications
- Predictive analytics for preventing air quality incidents

**5. 💰 FINANCIAL IMPACT & EXPANSION ROADMAP**
- Quantified cost savings from HVAC optimization (focus on temperature differentials)
- ROI calculations for sensor network expansion to remaining classrooms
- Student health and productivity correlation with measurable business impact

**6. 🌍 SUSTAINABILITY & ENVIRONMENTAL LEADERSHIP**
- Carbon footprint reduction achievements through smart HVAC management
- Environmental compliance status and green building certification opportunities
- Competitive positioning in sustainable education infrastructure

**7. 🎓 ACADEMIC EXCELLENCE CORRELATION**
- Air quality impact on learning environment optimization
- Seasonal performance variations and adaptation strategies
- Evidence-based recommendations for academic calendar alignment

**8. 🔮 PREDICTIVE INSIGHTS & STRATEGIC RECOMMENDATIONS**
- Machine learning insights from after-hours activity patterns
- Expansion priorities based on current performance data
- Long-term facility management strategy with specific implementation timelines

**KEY EXECUTIVE FOCUS AREAS:**
- **Temperature Intelligence**: Leverage operating vs after-hours temperature data for energy optimization
- **After-Hours Activity Analysis**: Understand unexpected occupancy patterns for better resource planning
- **Cross-Building Performance**: Identify best practices from top performers for system-wide implementation
- **Cost Optimization**: Calculate specific energy savings opportunities from HVAC efficiency improvements
- **Risk Mitigation**: Proactive air quality management to prevent health incidents and compliance issues
- **Expansion Strategy**: Data-driven sensor deployment roadmap with clear ROI projections

**DELIVERABLE REQUIREMENTS:**
- Professional language suitable for university board presentations
- Specific financial calculations with implementation timelines
- Actionable recommendations with clear responsibility assignments
- Competitive benchmarking and industry leadership positioning
- Risk assessment with mitigation strategies

Use the temperature differential data, after-hours activity patterns, and cross-classroom comparisons to provide insights not available from individual classroom reports. Focus on university-wide optimization opportunities and strategic competitive advantages.`;

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
            maxOutputTokens: 3000,
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
    
    console.log('Consolidated classroom report generated successfully');

    return new Response(
      JSON.stringify({ 
        summary: aiSummary,
        generatedAt: new Date().toISOString(),
        classroomCount: consolidatedData.totalClassrooms,
        averageEfficiency: consolidatedData.averageEfficiency,
        temperatureInsights: consolidatedData.temperatureInsights
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-consolidated-classroom-report function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to generate consolidated classroom report'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});