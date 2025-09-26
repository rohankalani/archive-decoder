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

// WiFi and Blynk credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
char auth[] = "YOUR_BLYNK_TOKEN";

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

// Sensor pins (adjust based on your hardware)
#define PM25_PIN A0
#define PM10_PIN A1
#define CO2_PIN A2
#define TEMP_HUMIDITY_PIN 2

unsigned long lastSensorRead = 0;
unsigned long lastBlynkUpdate = 0;

void setup() {
  Serial.begin(115200);
  
  // Initialize sensors
  initSensors();
  
  // Connect to WiFi
  connectWiFi();
  
  // Set time for TLS certificates
  setDateTime();
  
  // Initialize Blynk
  Blynk.begin(auth, ssid, password);
  
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

void connectWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.print("Connected! IP: ");
  Serial.println(WiFi.localIP());
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