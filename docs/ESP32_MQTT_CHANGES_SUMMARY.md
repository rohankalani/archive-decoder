# ESP32 MQTT Integration - Changes Summary

## Overview
Updated the Rosaiq ESP32 code to consolidate MQTT payloads and use MAC address-based device identification for seamless integration with the Supabase mqtt-webhook function.

## Key Changes Made

### 1. **Device Identification (Lines 240-245, 609-616)**
**Before:**
```cpp
String deviceId = "device01";
```

**After:**
```cpp
String deviceId = "";  // Will be set to MAC address in setup()

// In setup():
deviceId = WiFi.macAddress();
deviceId.replace(":", "");  // "AA:BB:CC:DD:EE:FF" -> "AABBCCDDEEFF"
```

### 2. **MQTT Topic Structure (Lines 89-91)**
**Before:**
```cpp
#define MQTT_TOPIC_PREFIX   "sensors/"
#define MQTT_TOPIC_SUFFIX   "/data"
```

**After:**
```cpp
#define MQTT_TOPIC_PREFIX   "sensors/DEVICE-"
#define MQTT_TOPIC_SUFFIX   "/data"
```

**Result:** Topic becomes `sensors/DEVICE-AABBCCDDEEFF/data`

### 3. **Consolidated MQTT Payload (Lines 2682-2760)**
**Before:** 3 separate JSON payloads sent sequentially
- Payload 1: Main air quality (pm25, co2, voc, nox, hcho, aqi)
- Payload 2: PM1, PM3, PM5 and counts
- Payload 3: PM5, PM10, humidity, temperature, event

**After:** Single comprehensive JSON payload with:
```json
{
  "deviceId": "AABBCCDDEEFF",
  "timestamp": "2025-01-01T12:00:00Z",
  "temperature": 25.5,
  "humidity": 60.0,
  "pm01": 1.2,
  "pm03": 2.5,
  "pm05": 3.1,
  "pm1": 4.5,
  "pm25": 12.3,
  "pm5": 15.6,
  "pm10": 20.1,
  "pc01": 1234,
  "pc03": 2345,
  "pc05": 3456,
  "pc1": 4567,
  "pc25": 5678,
  "pc5": 6789,
  "pc10": 7890,
  "co2": 450,
  "voc": 120,
  "nox": 80,
  "hcho": 15,
  "aqi_overall": 45,
  "dominant_pollutant": "pm25"
}
```

### 4. **Timestamp Addition**
Added NTP-synchronized timestamp in ISO 8601 format:
```cpp
timeClient.update();
unsigned long epochTime = timeClient.getEpochTime();
struct tm * ti = gmtime(&rawtime);
strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", ti);
```

### 5. **Dominant Pollutant Calculation**
Automatically determines which pollutant has the highest AQI:
```cpp
String dominant = "none";
int maxAqi = 0;
if (pm25_actual_aqi > maxAqi) { maxAqi = pm25_actual_aqi; dominant = "pm25"; }
if (pm10_actual_aqi > maxAqi) { maxAqi = pm10_actual_aqi; dominant = "pm10"; }
// ... checks for voc, nox, hcho
```

### 6. **Enhanced MQTT Initialization (Lines 2631-2648)**
**Added:**
- NTP time client initialization
- Larger buffer size (2048 bytes) for consolidated payload
- Re-enabled secure TLS connection with CA certificate
- Better debug logging

```cpp
void initMQTT() {
  espClientSecure.setCACert(hivemq_root_ca);
  mqttClient.setBufferSize(MQTT_MAX_PACKET_SIZE);
  mqttClient.setServer(MQTT_BROKER_URL, MQTT_BROKER_PORT);
  timeClient.begin();
  timeClient.update();
  // ...
}
```

## Benefits

### Before (3 Payloads)
- ❌ 3 separate MQTT publishes per cycle
- ❌ Higher bandwidth usage
- ❌ No timestamp
- ❌ Static device ID ("device01")
- ❌ Backend needs to aggregate 3 messages

### After (1 Consolidated Payload)
- ✅ Single MQTT publish per cycle
- ✅ Reduced bandwidth (1 publish vs 3)
- ✅ NTP-synchronized timestamp
- ✅ MAC-based unique device ID
- ✅ Backend receives complete data in one message

## Integration with Supabase

The mqtt-webhook Edge Function now handles both formats:
1. **Legacy format:** Topic `sensors/device01/data` → looks up by device name
2. **New format:** Topic `sensors/DEVICE-AABBCCDDEEFF/data` → looks up by MAC address

Devices are auto-registered if not found in the database.

## Configuration

### HiveMQ Webhook Setup
- **URL:** `https://xunlqdiappgyokhknvoc.supabase.co/functions/v1/mqtt-webhook`
- **Topic Filter:** `sensors/+/data`
- **Method:** POST
- **Content Type:** application/json

### ESP32 Settings
- **MQTT Broker:** `7bba9cf2fb494182aa5f5959dba3d631.s1.eu.hivemq.cloud`
- **Port:** 8883 (TLS)
- **Publish Interval:** 60 seconds
- **Buffer Size:** 2048 bytes

## Files Modified
- `docs/Rosaiq_V2-2_MQTT_FIXED.ino` - Updated ESP32 code
- `supabase/functions/mqtt-webhook/index.ts` - Updated webhook handler

## Next Steps
1. Upload `Rosaiq_V2-2_MQTT_FIXED.ino` to your ESP32
2. Verify MAC address is displayed in serial monitor
3. Check MQTT topic format in HiveMQ console
4. Monitor mqtt-webhook logs in Supabase dashboard
5. Verify sensor data appears in `sensor_readings` table
