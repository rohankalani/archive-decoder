-- Create cron job to generate sensor data every 6 seconds
SELECT cron.schedule(
  'generate-sensor-data-6sec',
  '*/6 * * * * *', -- Every 6 seconds 
  $$
  SELECT
    net.http_post(
        url:='https://xunlqdiappgyokhknvoc.functions.supabase.co/functions/v1/generate-sensor-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1bmxxZGlhcHBneW9raGtudm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzUwMTQsImV4cCI6MjA3NDQxMTAxNH0.yFpwOFX-as13l6ZXUOaVSa1Kr2CWWzAa9LZzXHB2JAo"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);