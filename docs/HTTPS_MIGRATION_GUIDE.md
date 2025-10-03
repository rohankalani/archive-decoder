# HTTPS Migration Guide - RosaIQ Air Quality System

## Overview
This guide documents the migration from MQTT (HiveMQ) to direct HTTPS communication with Supabase Edge Functions.

## Architecture Change

### Before (MQTT)
```
ESP32 → HiveMQ MQTT Broker → Supabase Webhook → mqtt-webhook Edge Function → mqtt-processor Edge Function → Database
```

### After (HTTPS)
```
ESP32 → Supabase Edge Function (sensor-data-webhook) → Database
```

## Benefits
- ✅ **Simpler Architecture**: No external broker dependency
- ✅ **Lower Latency**: Direct communication to Supabase
- ✅ **Better Debugging**: Easier to trace issues in Edge Function logs
- ✅ **Cost Savings**: No HiveMQ subscription required
- ✅ **More Reliable**: Fewer points of failure
- ✅ **Enhanced Security**: Device secret authentication

## Setup Instructions

### 1. Configure Device Secret in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Add a new secret:
   - Name: `DEVICE_SECRET`
   - Value: Generate a strong random string (e.g., use `openssl rand -hex 32`)

### 2. Update ESP32 Code

1. Open `docs/Rosaiq_V2-2_HTTPS.ino` in Arduino IDE
2. Update the configuration section:

```cpp
const char* WIFI_SSID = "YourWiFiSSID";
const char* WIFI_PASSWORD = "YourWiFiPassword";
const char* DEVICE_SECRET = "YourDeviceSecretFromSupabase";
```

3. Upload to your ESP32 device

### 3. Deploy Edge Function

The `sensor-data-webhook` Edge Function is automatically deployed with your Supabase project.

**Endpoint URL:**
```
https://xunlqdiappgyokhknvoc.supabase.co/functions/v1/sensor-data-webhook
```

### 4. Test the Setup

#### Test with curl:
```bash
curl -X POST https://xunlqdiappgyokhknvoc.supabase.co/functions/v1/sensor-data-webhook \
  -H "Content-Type: application/json" \
  -H "x-device-secret: YOUR_DEVICE_SECRET" \
  -d '{
    "mac_address": "AABBCCDDEEFF",
    "pm25": 15.5,
    "pm10": 25.0,
    "co2": 450,
    "temperature": 23.5,
    "humidity": 55.0,
    "voc": 120,
    "aqi_overall": 45,
    "dominant_pollutant": "PM2.5",
    "timestamp": "2025-01-01T12:00:00Z"
  }'
```

#### Expected Response:
```json
{
  "success": true,
  "device_id": "uuid-here",
  "readings_processed": 14
}
```

### 5. Monitor Edge Function Logs

View logs in Supabase Dashboard:
- **Project** → **Edge Functions** → **sensor-data-webhook** → **Logs**

Or use Supabase CLI:
```bash
supabase functions logs sensor-data-webhook
```

## Data Format

### Request Payload (from ESP32)

```json
{
  "mac_address": "AABBCCDDEEFF",
  "pm03": 5.2,
  "pm05": 7.8,
  "pm1": 10.5,
  "pm25": 15.5,
  "pm5": 20.0,
  "pm10": 25.0,
  "co2": 450,
  "temperature": 23.5,
  "humidity": 55.0,
  "voc": 120,
  "nox": 80,
  "hcho": 10,
  "pc03": 1500,
  "pc05": 800,
  "pc1": 400,
  "pc25": 200,
  "pc5": 50,
  "aqi_overall": 45,
  "dominant_pollutant": "PM2.5",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

### Authentication

Include device secret in request header:
```
x-device-secret: YOUR_DEVICE_SECRET
```

## Device Auto-Registration

The system automatically registers new devices based on MAC address:

1. **First Connection**: 
   - Device sends data with MAC address
   - System creates new device record
   - Assigns to default floor
   - Names device as "Device [LAST6_MAC]"

2. **Subsequent Connections**:
   - System finds existing device by MAC
   - Updates sensor readings
   - Updates device status to 'online'

## Alert Monitoring

The Edge Function checks sensor values against thresholds and creates alerts for:
- PM2.5 exceeding safe levels
- PM10 exceeding safe levels  
- CO2 exceeding safe levels

Severity levels:
- `high`: Exceeds unhealthy threshold
- `critical`: Exceeds hazardous threshold

## Troubleshooting

### Device Can't Connect
1. Check WiFi credentials in ESP32 code
2. Verify device secret matches Supabase secret
3. Check ESP32 serial monitor for errors
4. Ensure Supabase Edge Function is deployed

### No Data Appearing in Dashboard
1. Check Edge Function logs for errors
2. Verify device is sending correct JSON format
3. Check device MAC address is being sent
4. Ensure RLS policies allow data insertion

### HTTP Error Codes
- `401 Unauthorized`: Device secret is incorrect or missing
- `500 Internal Server Error`: Check Edge Function logs for details
- `timeout`: Check network connection and Supabase availability

## Cleanup Completed

The following MQTT components have been removed:
- ✅ `mqtt-webhook` Edge Function
- ✅ `mqtt-processor` Edge Function
- ✅ MQTT entries in `supabase/config.toml`

### MQTT Secrets (Can be removed from Supabase)
You can now safely delete these secrets from Supabase Dashboard:
- `MQTT_USERNAME`
- `MQTT_PASSWORD`
- `MQTT_BROKER_URL`
- `MQTT_BROKER_PORT`

### Archived Documentation
Old MQTT documentation files remain in `docs/` for reference:
- `docs/ESP32_MQTT_CHANGES_SUMMARY.md`
- `docs/ROSAQI_ESP32_PROGRAM_TLS_MQTT.ino`
- `docs/ROSAQI_ESP32_PROGRAM_TLS_MQTT_CONSOLIDATED.ino`
- `docs/ROSAQI_ESP32_PROGRAM_TLS_MQTT_UPDATED.ino`
- `docs/Rosaiq_V2-2_MQTT_FIXED.ino`

These can be deleted once you confirm the HTTPS solution is working properly.

## Next Steps

1. ✅ Set up `DEVICE_SECRET` in Supabase
2. ✅ Update and upload ESP32 code
3. ✅ Test with one device first
4. ✅ Monitor Edge Function logs
5. ✅ Verify data in dashboard
6. ✅ Roll out to additional devices
7. ✅ Delete MQTT secrets from Supabase
8. ✅ Cancel HiveMQ subscription (if applicable)

## Support

For issues or questions:
- Check Edge Function logs in Supabase Dashboard
- Review ESP32 serial monitor output
- Verify network connectivity
- Ensure all configuration values are correct
