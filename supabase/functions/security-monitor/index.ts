import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityCheckResult {
  failedLogins: number
  suspiciousActivity: any[]
  recentSecurityEvents: any[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Check for failed login attempts in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: failedLogins, error: failedLoginsError } = await supabaseClient
      .from('failed_login_attempts')
      .select('*')
      .gte('attempted_at', oneHourAgo)

    if (failedLoginsError) {
      console.error('Error fetching failed logins:', failedLoginsError)
    }

    // Check for suspicious patterns (e.g., multiple failed attempts from same IP)
    const suspiciousActivity = []
    if (failedLogins && failedLogins.length > 0) {
      const ipCounts = failedLogins.reduce((acc, login) => {
        const ip = login.ip_address
        if (!ip) return acc
        acc[ip] = (acc[ip] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      for (const [ip, count] of Object.entries(ipCounts)) {
        if (count >= 5) {
          suspiciousActivity.push({
            ip,
            failedAttempts: count,
            severity: 'high',
          })

          // Log security event for excessive failed logins
          await supabaseClient.rpc('log_security_event', {
            p_event_type: 'excessive_failed_logins',
            p_severity: 'high',
            p_ip_address: ip,
            p_details: { failed_attempts: count },
          })
        }
      }
    }

    // Get recent critical security events
    const { data: securityEvents, error: eventsError } = await supabaseClient
      .from('security_events')
      .select('*')
      .in('severity', ['high', 'critical'])
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(10)

    if (eventsError) {
      console.error('Error fetching security events:', eventsError)
    }

    // Create notifications for admins if there are critical events
    if (securityEvents && securityEvents.length > 0) {
      // Get all admin users
      const { data: admins } = await supabaseClient
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'super_admin'])

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          title: 'Security Alert',
          message: `${securityEvents.length} critical security events detected in the last hour`,
          type: 'security',
        }))

        await supabaseClient
          .from('notifications')
          .insert(notifications)
      }
    }

    const result: SecurityCheckResult = {
      failedLogins: failedLogins?.length || 0,
      suspiciousActivity,
      recentSecurityEvents: securityEvents || [],
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    console.error('Error in security-monitor:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      },
    )
  }
})
