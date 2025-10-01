/*
 * ROSAQI ESP32 Air Quality Monitor - Updated for Consolidated JSON Payload
 * Sends single consolidated JSON payload to HiveMQ MQTT broker
 * Compatible with Supabase mqtt-webhook Edge Function
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ArduinoJson.h>

// Sensor Libraries
#include <Adafruit_BME280.h>
#include <MHZ19.h>
#include <Adafruit_PM25AQI.h>
#include <DFRobot_MultiGasSensor.h>
#include "PMS.h"

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker settings
const char* mqtt_server = "your-cluster.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_username = "YOUR_MQTT_USERNAME";
const char* mqtt_password = "YOUR_MQTT_PASSWORD";

// MQTT Topic - uses MAC address for unique identification
String mqttTopic = "sensors/"; // Will append MAC address

// HiveMQ Cloud Root CA Certificate
const char* root_ca = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)EOF";

// Sensor objects
Adafruit_BME280 bme;
MHZ19 co2Sensor;
Adafruit_PM25AQI aqi;
DFRobot_MultiGasSensor noxSensor;
PMS pms(Serial2);

// WiFi and MQTT clients
WiFiClientSecure espClient;
PubSubClient client(espClient);

// NTP Client
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000);

// Device MAC Address (unique identifier)
String deviceMAC;

// Timing
unsigned long lastPublish = 0;
const long publishInterval = 60000; // 60 seconds

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600); // For PMS sensor
  
  // Get MAC address for device identification
  deviceMAC = WiFi.macAddress();
  mqttTopic += deviceMAC + "/data";
  
  Serial.println("ROSAQI ESP32 Air Quality Monitor - Consolidated JSON");
  Serial.println("Device MAC: " + deviceMAC);
  Serial.println("MQTT Topic: " + mqttTopic);
  
  // Initialize sensors
  Wire.begin();
  if (!bme.begin(0x76)) {
    Serial.println("BME280 sensor not found!");
  }
  
  co2Sensor.begin(Serial2);
  co2Sensor.autoCalibration(true);
  
  if (!aqi.begin_I2C()) {
    Serial.println("PM2.5 sensor not found!");
  }
  
  noxSensor.begin(Wire, 0x74);
  noxSensor.changeAcquireMode(noxSensor.PASSIVITY);
  
  pms.passiveMode();
  
  // Connect to WiFi
  connectWiFi();
  
  // Initialize NTP
  timeClient.begin();
  
  // Set time for SSL validation
  setDateTime();
  
  // Setup MQTT
  espClient.setCACert(root_ca);
  client.setServer(mqtt_server, mqtt_port);
  client.setBufferSize(2048); // Increase buffer for larger payload
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  // Update NTP time
  timeClient.update();
  
  // Publish consolidated sensor data every interval
  unsigned long now = millis();
  if (now - lastPublish >= publishInterval) {
    lastPublish = now;
    publishConsolidatedSensorData();
  }
  
  delay(100);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

void setDateTime() {
  Serial.print("Setting system time from NTP...");
  timeClient.forceUpdate();
  
  unsigned long epochTime = timeClient.getEpochTime();
  
  struct timeval tv;
  tv.tv_sec = epochTime;
  tv.tv_usec = 0;
  settimeofday(&tv, NULL);
  
  Serial.println(" Done!");
  Serial.println("Current time: " + timeClient.getFormattedTime());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection to ");
    Serial.print(mqtt_server);
    Serial.print(":");
    Serial.println(mqtt_port);
    
    String clientId = "ESP32-" + deviceMAC;
    
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("MQTT connected!");
    } else {
      Serial.print("MQTT connection failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds...");
      
      if (client.state() == -2) {
        Serial.println("CF Error: SSL handshake failed - checking time sync");
        setDateTime(); // Re-sync time if SSL fails
      }
      
      delay(5000);
    }
  }
}

void publishConsolidatedSensorData() {
  Serial.println("\n=== Reading all sensors ===");
  
  // Create JSON document (size adjusted for all sensor data)
  StaticJsonDocument<1024> doc;
  
  // Add device identification
  doc["mac_address"] = deviceMAC;
  
  // Add timestamp in ISO 8601 format
  timeClient.update();
  unsigned long epochTime = timeClient.getEpochTime();
  char timestamp[25];
  struct tm* timeinfo;
  time_t rawtime = epochTime;
  timeinfo = gmtime(&rawtime);
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", timeinfo);
  doc["timestamp"] = timestamp;
  
  // Read BME280 (Temperature, Humidity, Pressure)
  float temperature = bme.readTemperature();
  float humidity = bme.readHumidity();
  doc["temperature"] = round(temperature * 10) / 10.0;
  doc["humidity"] = round(humidity * 10) / 10.0;
  
  // Read MH-Z19 CO2
  int co2 = co2Sensor.getCO2();
  doc["co2"] = co2;
  
  // Read PM2.5 sensor
  PM25_AQI_Data data;
  if (aqi.read(&data)) {
    doc["pm25"] = data.pm25_env;
    doc["pm10"] = data.pm100_env;
  }
  
  // Read PMS5003 sensor
  pms.requestRead();
  if (pms.readUntil(data)) {
    doc["pm03"] = data.PM_AE_UG_1_0;  // PM0.3 (was pm01)
    doc["pm05"] = data.PM_AE_UG_2_5;  // PM0.5 (new)
    doc["pm1"] = data.PM_AE_UG_10_0;  // PM1.0
    doc["pm5"] = data.PM_AE_UG_10_0;  // PM5.0 (approximation)
    
    // Particle counts
    doc["pc03"] = data.particles_03um;
    doc["pc05"] = data.particles_05um;
    doc["pc1"] = data.particles_10um;
    doc["pc25"] = data.particles_25um;
    doc["pc5"] = data.particles_50um;
  }
  
  // Read NOx sensor (rename from nox to no2)
  float noxValue = noxSensor.readGasConcentrationPPM();
  doc["no2"] = round(noxValue * 10) / 10.0;
  
  // Add VOC and HCHO (if available, otherwise use defaults)
  doc["voc"] = 0;  // Add actual VOC sensor reading if available
  doc["hcho"] = 0; // Add actual HCHO sensor reading if available
  
  // Calculate overall AQI (simplified - use proper AQI calculation)
  int aqi_overall = calculateAQI(doc["pm25"], doc["pm10"], doc["co2"]);
  doc["aqi_overall"] = aqi_overall;
  
  // Determine dominant pollutant
  String dominant = determineDominantPollutant(doc);
  doc["dominant_pollutant"] = dominant;
  
  // Serialize JSON to string
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Consolidated JSON Payload:");
  Serial.println(jsonPayload);
  
  // Publish to MQTT
  if (client.publish(mqttTopic.c_str(), jsonPayload.c_str(), false)) {
    Serial.println("✓ Published successfully to: " + mqttTopic);
  } else {
    Serial.println("✗ Publish failed!");
  }
}

int calculateAQI(float pm25, float pm10, int co2) {
  // Simplified AQI calculation - implement proper EPA AQI formula
  int aqi = 0;
  
  // PM2.5 based AQI
  if (pm25 <= 12.0) aqi = map(pm25, 0, 12, 0, 50);
  else if (pm25 <= 35.4) aqi = map(pm25, 12.1, 35.4, 51, 100);
  else if (pm25 <= 55.4) aqi = map(pm25, 35.5, 55.4, 101, 150);
  else if (pm25 <= 150.4) aqi = map(pm25, 55.5, 150.4, 151, 200);
  else if (pm25 <= 250.4) aqi = map(pm25, 150.5, 250.4, 201, 300);
  else aqi = map(pm25, 250.5, 500, 301, 500);
  
  return aqi;
}

String determineDominantPollutant(JsonDocument& doc) {
  // Determine which pollutant is contributing most to poor air quality
  float pm25 = doc["pm25"] | 0;
  float pm10 = doc["pm10"] | 0;
  int co2 = doc["co2"] | 0;
  float no2 = doc["no2"] | 0;
  
  String dominant = "pm25"; // Default
  
  if (pm10 > 150) dominant = "pm10";
  else if (co2 > 1000) dominant = "co2";
  else if (no2 > 100) dominant = "no2";
  else if (pm25 > 35) dominant = "pm25";
  
  return dominant;
}
