# Arduino Integration Guide for 300-Device Architecture

## Overview
This guide shows how to integrate Arduino devices with the lightweight but stable architecture for 300 air quality sensors.

## Arduino Code Template

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <BlynkSimpleEsp32.h>
#include <time.h>
#include <FS.h>
#include <SPIFFS.h>
#include <WiFiClientSecure.h>
#include <Preferences.h>
#include <WebServer.h>
#include <DNSServer.h>

// Dynamic WiFi and Configuration Storage
Preferences preferences;
String stored_ssid = "";
String stored_password = "";
String stored_blynk_token = "";

// MQTT Configuration (TLS)
const char* mqtt_server = "your-cluster.hivemq.cloud"; // Your HiveMQ Cloud URL
const int mqtt_port = 8883; // TLS port
const char* mqtt_user = "YOUR_MQTT_USERNAME"; // From HiveMQ Cloud
const char* mqtt_password = "YOUR_MQTT_PASSWORD"; // From HiveMQ Cloud

// Device Configuration
const char* device_id = "ULTRA-ENG-001"; // Unique for each device
const int SENSOR_INTERVAL = 30000; // 30 seconds

// TLS MQTT Client
WiFiClientSecure espClient;
PubSubClient client(espClient);

// Configuration Portal
WebServer server(80);
DNSServer dnsServer;
const char* ap_ssid = "AirQualitySensor-Setup";
const char* ap_password = "setup123";

// Sensor pins (adjust based on your hardware)
#define PM25_PIN A0
#define PM10_PIN A1
#define CO2_PIN A2
#define TEMP_HUMIDITY_PIN 2

unsigned long lastSensorRead = 0;
unsigned long lastBlynkUpdate = 0;

void setup() {
  Serial.begin(115200);
  
  // Initialize preferences for storing credentials
  preferences.begin("wifi_config", false);
  
  // Load stored credentials
  loadStoredCredentials();
  
  // Initialize sensors
  initSensors();
  
  // Try to connect to stored WiFi, if fails start config portal
  if (!connectToStoredWiFi()) {
    startConfigPortal();
  }
  
  // Set time for TLS certificates
  setDateTime();
  
  // Initialize Blynk if token is available
  if (stored_blynk_token.length() > 0) {
    Blynk.begin(stored_blynk_token.c_str(), stored_ssid.c_str(), stored_password.c_str());
  }
  
  // Setup TLS MQTT
  espClient.setInsecure(); // For simplified TLS (not recommended for production)
  client.setServer(mqtt_server, mqtt_port);
  connectMQTT();
}

void loop() {
  // Run Blynk
  Blynk.run();
  
  // Maintain MQTT connection
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();
  
  // Read sensors every 30 seconds
  if (millis() - lastSensorRead >= SENSOR_INTERVAL) {
    readAndSendSensorData();
    lastSensorRead = millis();
  }
  
  // Update Blynk every 10 seconds (separate timing)
  if (millis() - lastBlynkUpdate >= 10000) {
    updateBlynk();
    lastBlynkUpdate = millis();
  }
  
  delay(1000);
}

void loadStoredCredentials() {
  stored_ssid = preferences.getString("ssid", "");
  stored_password = preferences.getString("password", "");
  stored_blynk_token = preferences.getString("blynk_token", "");
  
  Serial.println("Loaded stored credentials:");
  Serial.println("SSID: " + stored_ssid);
  Serial.println("Blynk Token: " + (stored_blynk_token.length() > 0 ? "Set" : "Not Set"));
}

bool connectToStoredWiFi() {
  if (stored_ssid.length() == 0) {
    Serial.println("No stored WiFi credentials");
    return false;
  }
  
  WiFi.begin(stored_ssid.c_str(), stored_password.c_str());
  Serial.print("Connecting to stored WiFi: " + stored_ssid);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("Connected! IP: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println();
    Serial.println("Failed to connect to stored WiFi");
    return false;
  }
}

void startConfigPortal() {
  Serial.println("Starting configuration portal...");
  
  // Start Access Point
  WiFi.softAP(ap_ssid, ap_password);
  
  // Setup DNS server
  dnsServer.start(53, "*", WiFi.softAPIP());
  
  // Setup web server routes
  server.on("/", handleConfigPage);
  server.on("/save", handleSaveConfig);
  server.onNotFound(handleConfigPage);
  
  server.begin();
  Serial.print("Config portal started. Connect to: ");
  Serial.println(ap_ssid);
  Serial.print("Visit: http://");
  Serial.println(WiFi.softAPIP());
  
  // Keep portal running until configured
  while (stored_ssid.length() == 0) {
    dnsServer.processNextRequest();
    server.handleClient();
    delay(100);
  }
}

void handleConfigPage() {
  String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <title>Air Quality Sensor Setup</title>
    <style>
        body { font-family: Arial; margin: 40px; }
        .container { max-width: 400px; margin: 0 auto; }
        input { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; }
        button { background-color: #4CAF50; color: white; padding: 14px 20px; border: none; cursor: pointer; width: 100%; }
        button:hover { background-color: #45a049; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Configure Air Quality Sensor</h2>
        <form action="/save" method="POST">
            <label>WiFi Network:</label>
            <input type="text" name="ssid" placeholder="WiFi Network Name" required>
            
            <label>WiFi Password:</label>
            <input type="password" name="password" placeholder="WiFi Password" required>
            
            <label>Blynk Token (Optional):</label>
            <input type="text" name="blynk_token" placeholder="Blynk Auth Token">
            
            <button type="submit">Save Configuration</button>
        </form>
    </div>
</body>
</html>
)rawliteral";
  
  server.send(200, "text/html", html);
}

void handleSaveConfig() {
  String ssid = server.arg("ssid");
  String password = server.arg("password");
  String blynk_token = server.arg("blynk_token");
  
  // Save to preferences
  preferences.putString("ssid", ssid);
  preferences.putString("password", password);
  preferences.putString("blynk_token", blynk_token);
  
  // Update stored variables
  stored_ssid = ssid;
  stored_password = password;
  stored_blynk_token = blynk_token;
  
  String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <title>Configuration Saved</title>
    <style>
        body { font-family: Arial; margin: 40px; text-align: center; }
        .success { color: green; }
    </style>
</head>
<body>
    <h2 class="success">Configuration Saved!</h2>
    <p>Device will restart and connect to your WiFi network.</p>
    <p>Device restarting in 5 seconds...</p>
</body>
</html>
)rawliteral";
  
  server.send(200, "text/html", html);
  
  delay(5000);
  ESP.restart();
}

void setDateTime() {
  // Configure time for TLS certificate validation
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  
  Serial.print("Waiting for NTP time sync: ");
  time_t now = time(nullptr);
  while (now < 8 * 3600 * 2) {
    delay(100);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println();
  
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  Serial.printf("Current time: %s", asctime(&timeinfo));
}

void connectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    
    if (client.connect(device_id, mqtt_user, mqtt_password)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void readAndSendSensorData() {
  // Read sensor values (implement based on your sensors)
  float pm25 = readPM25();
  float pm10 = readPM10();
  float co2 = readCO2();
  float temperature = readTemperature();
  float humidity = readHumidity();
  float voc = readVOC();
  float no2 = readNO2();
  
  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["device_id"] = device_id;
  doc["pm25"] = pm25;
  doc["pm10"] = pm10;
  doc["co2"] = co2;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["voc"] = voc;
  doc["no2"] = no2;
  doc["timestamp"] = getISOTimestamp();
  
  char buffer[512];
  serializeJson(doc, buffer);
  
  // Publish to MQTT
  String topic = "sensors/" + String(device_id) + "/data";
  if (client.publish(topic.c_str(), buffer)) {
    Serial.println("Data published to MQTT");
  } else {
    Serial.println("Failed to publish MQTT data");
  }
  
  // Also update Blynk (existing functionality)
  Blynk.virtualWrite(V1, pm25);
  Blynk.virtualWrite(V2, pm10);
  Blynk.virtualWrite(V3, co2);
  Blynk.virtualWrite(V4, temperature);
  Blynk.virtualWrite(V5, humidity);
}

void updateBlynk() {
  // Lightweight Blynk updates for dashboard compatibility
  float pm25 = readPM25();
  float pm10 = readPM10();
  
  Blynk.virtualWrite(V1, pm25);
  Blynk.virtualWrite(V2, pm10);
}

// Implement these functions based on your specific sensors
float readPM25() {
  // Your PM2.5 sensor reading logic
  return random(0, 50); // Placeholder
}

float readPM10() {
  // Your PM10 sensor reading logic
  return random(0, 100); // Placeholder
}

float readCO2() {
  // Your CO2 sensor reading logic
  return random(400, 1000); // Placeholder
}

float readTemperature() {
  // Your temperature sensor reading logic
  return random(20, 35); // Placeholder
}

float readHumidity() {
  // Your humidity sensor reading logic
  return random(30, 80); // Placeholder
}

float readVOC() {
  // Your VOC sensor reading logic
  return random(0, 500); // Placeholder
}

float readNO2() {
  // Your NO2 sensor reading logic
  return random(0, 40); // Placeholder
}

String getISOTimestamp() {
  // You might want to use NTP for accurate timestamps
  return String(millis()); // Simplified for now
}

void initSensors() {
  // Initialize your specific sensors here
  Serial.println("Sensors initialized");
}
```

## Architecture Benefits for 300 Devices

### 1. **Lightweight Data Flow**
- Each device sends data every 30 seconds
- Blynk updates every 10 seconds (lighter payload)
- MQTT handles 300 connections efficiently

### 2. **Fault Tolerance**
- MQTT auto-reconnection
- Separate Blynk and MQTT loops
- Graceful failure handling

### 3. **Scalability**
- HiveMQ Cloud handles 10,000+ concurrent connections
- Supabase Edge Functions auto-scale
- Database optimized for time-series data

### 4. **Monitoring**
- Device status tracked automatically
- Alert generation for thresholds
- Real-time dashboard updates

## Data Volume Calculation
- 300 devices × 30-second intervals × 7 sensors = 1,440 data points/minute
- Daily: ~2M data points
- Monthly: ~60M data points
- Well within Supabase limits

## Required Libraries
```
ArduinoJson (6.x)
PubSubClient (2.8)
Blynk (1.x)
WiFi (ESP32 built-in)
```

## Setup Instructions
1. Install HiveMQ Cloud (free tier)
2. Configure MQTT credentials
3. Flash this code to each device with unique device_id
4. Monitor via Supabase dashboard