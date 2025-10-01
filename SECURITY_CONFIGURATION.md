# Security Configuration Guide

This document outlines additional security configurations that need to be set up in your Supabase dashboard.

## ✅ Implemented Security Enhancements

The following security features have been implemented via database migrations:

### Phase 1: Audit & Monitoring
- ✅ **Audit Log Retention**: Automatic cleanup of logs older than 1 year
- ✅ **IP Anonymization**: GDPR-compliant IP address anonymization
- ✅ **Profile Access Logging**: Tracks when admins view user profiles
- ✅ **Configuration Audit Trail**: Logs all email_settings changes
- ✅ **Failed Login Tracking**: Monitors failed authentication attempts (90-day retention)
- ✅ **Security Events System**: Centralized security event logging with severity levels

### Phase 2: Monitoring & Alerts
- ✅ **Security Monitor Edge Function**: Automated security monitoring
- ✅ **Suspicious Activity Detection**: Alerts on multiple failed login attempts from same IP
- ✅ **Admin Notifications**: Automatic notifications for critical security events

## 🔧 Required Manual Configuration

### 1. Enable Leaked Password Protection (High Priority)

**Why**: Prevents users from setting passwords that have been compromised in data breaches.

**Steps**:
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/xunlqdiappgyokhknvoc/auth/policies
2. Navigate to **Authentication** → **Policies**
3. Under **Password Requirements**:
   - Enable **Check for leaked passwords**
   - Set minimum password length to at least 8 characters
   - Consider enabling password complexity requirements

**Documentation**: https://supabase.com/docs/guides/auth/password-security

---

### 2. Configure pg_cron for Automated Cleanup (Medium Priority)

**Why**: Ensures automatic deletion of old audit logs and failed login attempts.

**Steps**:
1. Go to **Database** → **Extensions**
2. Enable the `pg_cron` extension
3. The cleanup jobs are already scheduled in the migration:
   - Audit logs cleanup: Monthly (1st of each month at midnight)
   - Failed logins cleanup: Daily (2:00 AM)

**Note**: If `pg_cron` is not available in your Supabase tier, you can manually run the cleanup functions:
```sql
SELECT public.cleanup_old_audit_logs();
SELECT public.cleanup_old_failed_logins();
```

---

### 3. Set Up Security Monitoring Cron Job (Optional)

**Why**: Provides regular security checks and proactive threat detection.

**Steps**:
1. Enable `pg_cron` and `pg_net` extensions (see above)
2. Run this SQL in your database:

```sql
SELECT cron.schedule(
  'security-monitoring',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url:='https://xunlqdiappgyokhknvoc.supabase.co/functions/v1/security-monitor',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1bmxxZGlhcHBneW9raGtudm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzUwMTQsImV4cCI6MjA3NDQxMTAxNH0.yFpwOFX-as13l6ZXUOaVSa1Kr2CWWzAa9LZzXHB2JAo"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

---

### 4. Configure Rate Limiting (Recommended)

**Why**: Protects against brute force attacks and API abuse.

**Steps**:
1. Go to **Settings** → **API**
2. Under **Rate Limiting**, configure:
   - Authentication endpoints: 10 requests per minute
   - General API: 100 requests per minute
   - Custom rate limits for sensitive endpoints

---

### 5. Review and Harden RLS Policies (Ongoing)

**Why**: Ensures data access is properly restricted.

**Steps**:
1. Regularly review RLS policies using the security scanner
2. Test policies with different user roles
3. Monitor the `audit_logs` table for unusual access patterns

---

## 📊 Monitoring Your Security

### View Failed Login Attempts
```sql
SELECT * FROM public.failed_login_attempts 
ORDER BY attempted_at DESC 
LIMIT 50;
```

### View Security Events
```sql
SELECT * FROM public.security_events 
WHERE severity IN ('high', 'critical')
ORDER BY created_at DESC 
LIMIT 50;
```

### View Audit Logs
```sql
SELECT * FROM public.audit_logs 
WHERE action = 'VIEW' AND table_name = 'profiles'
ORDER BY created_at DESC 
LIMIT 50;
```

---

## 🚨 Security Incident Response

If suspicious activity is detected:

1. Check the `security_events` table for details
2. Review associated `failed_login_attempts`
3. Investigate affected user accounts in `audit_logs`
4. Consider temporarily disabling compromised accounts
5. Reset passwords for affected users
6. Review and strengthen RLS policies if needed

---

## 📝 Regular Security Tasks

- **Weekly**: Review high-severity security events
- **Monthly**: Audit admin access logs
- **Quarterly**: Review and update RLS policies
- **Annually**: Conduct full security audit

---

## 🔗 Useful Links

- [Supabase Auth Settings](https://supabase.com/dashboard/project/xunlqdiappgyokhknvoc/auth/providers)
- [Security Monitor Logs](https://supabase.com/dashboard/project/xunlqdiappgyokhknvoc/functions/security-monitor/logs)
- [Database Extensions](https://supabase.com/dashboard/project/xunlqdiappgyokhknvoc/database/extensions)
