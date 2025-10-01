# ESP32 SSL Handshake Error Fix

## Problem
Your ESP32 device is experiencing "SSL handshake failed" errors when connecting to the HiveMQ Cloud MQTT broker over TLS (port 8883).

## Root Causes
1. **Time Synchronization**: TLS certificates require accurate system time
2. **TLS Version Mismatch**: ESP32 might not support the TLS version required by HiveMQ
3. **Certificate Validation**: Even with `setInsecure()`, some brokers have strict requirements

## Solutions

### Option 1: Add Root CA Certificate (Recommended for Production)

Add the HiveMQ Cloud CA certificate to your ESP32 code:

```cpp
// Add this near the top of your .ino file
const char* hivemq_root_ca = "\\
" \
"-----BEGIN CERTIFICATE-----\\
" \
"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\\
" \
"-----END CERTIFICATE-----\\
";

// In initMQTT() function, replace setInsecure() with:
void initMQTT() {
  // Set root CA certificate for secure TLS
  espClientSecure.setCACert(hivemq_root_ca);
  
  // Initialize MQTT client
  mqttClient.setServer(MQTT_BROKER_URL, MQTT_BROKER_PORT);
  
  Serial.println("MQTT initialized with TLS certificate");
  Serial.print("MQTT Broker: "); Serial.print(MQTT_BROKER_URL); 
  Serial.print(":"); Serial.println(MQTT_BROKER_PORT);
}
```

### Option 2: Enhanced Time Synchronization

Improve the time sync before MQTT connection:

```cpp
void setDateTime() {
  // Configure NTP with multiple time servers
  configTime(0, 0, "pool.ntp.org", "time.google.com", "time.cloudflare.com");
  
  Serial.print("Syncing time with NTP servers: ");
  time_t now = time(nullptr);
  int attempts = 0;
  
  // Wait up to 30 seconds for time sync
  while (now < 1577836800 && attempts < 300) { // Jan 1, 2020
    delay(100);
    Serial.print(".");
    now = time(nullptr);
    attempts++;
  }
  
  if (now >= 1577836800) {
    Serial.println("\nTime synchronized successfully!");
    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);
    Serial.print("Current time: ");
    Serial.println(asctime(&timeinfo));
  } else {
    Serial.println("\nERROR: Time sync failed! SSL will not work!");
  }
}

// Call this in setup() after WiFi connects:
void setup() {
  // ... existing setup code ...
  
  // Initialize WiFi
  connectWiFi();
  
  // CRITICAL: Set time before MQTT initialization
  setDateTime();
  
  // Now initialize MQTT
  initMQTT();
  
  // ... rest of setup ...
}
```

### Option 3: Debug SSL Handshake

Add detailed SSL debugging:

```cpp
void connectMQTT() {
  // Enable SSL debugging
  espClientSecure.setDebugLevel(ESP_LOG_VERBOSE);
  
  // Check if time is set
  time_t now = time(nullptr);
  if (now < 1577836800) {
    Serial.println("ERROR: Time not set! Setting time now...");
    setDateTime();
  }
  
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection to ");
    Serial.print(MQTT_BROKER_URL);
    Serial.print(":");
    Serial.print(MQTT_BROKER_PORT);
    Serial.println("...");
    
    String clientId = "ESP32Client-" + deviceId;
    
    if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println("MQTT connected successfully!");
      mqttConnected = true;
    } else {
      Serial.print("MQTT connection failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" - Error codes:");
      Serial.println("  -4: MQTT_CONNECTION_TIMEOUT");
      Serial.println("  -3: MQTT_CONNECTION_LOST");
      Serial.println("  -2: MQTT_CONNECT_FAILED (SSL handshake)");
      Serial.println("  -1: MQTT_DISCONNECTED");
      Serial.println("Retrying in 5 seconds...");
      delay(5000);
    }
  }
}
```

## Quick Fix for Testing

If you need immediate connectivity for testing, you can temporarily use non-TLS MQTT:

```cpp
// Change port to non-TLS
#define MQTT_BROKER_PORT 1883  // Non-TLS port

// Use regular WiFiClient instead of WiFiClientSecure
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Remove setInsecure() call from initMQTT()
```

**Note**: This is NOT recommended for production as credentials will be sent in plain text.

## Monitoring

Check your ESP32 Serial Monitor for these indicators:
- ✅ `Time synchronized successfully!` - Time is set correctly
- ✅ `MQTT connected successfully!` - Connection established
- ❌ `rc=-2` - SSL handshake failure
- ❌ `Time sync failed!` - NTP not working

## Network Requirements

Ensure your network allows:
- Outbound connections to `pool.ntp.org` on UDP port 123 (NTP)
- Outbound connections to HiveMQ broker on TCP port 8883 (MQTTS)
- No SSL/TLS inspection or certificate pinning on your corporate firewall
