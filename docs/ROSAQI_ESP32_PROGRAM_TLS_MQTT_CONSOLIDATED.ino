// ============= UPDATED ROSAIQ ESP32 WITH CONSOLIDATED MQTT PAYLOAD =============
// This version consolidates all 3 separate JSON payloads into ONE comprehensive payload
// Uses MAC address for device identification
// Includes NTP-synchronized timestamps

#include <FRAM.h>
#include <stdlib.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <BlynkSimpleEsp32.h>
#include <Wire.h>
#include <SensirionI2CSen5x.h>
#include <SensirionI2CSfa3x.h>
#include <IpsI2C.h>
#include "HardwareSerial.h"
#include "BluetoothSerial.h"
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "time.h"
#include <EEPROM.h>
#include <ezTime.h>
#include <AHTxx.h>

// ===================== MQTT Configuration =====================
#define MQTT_BROKER_URL     "7bba9cf2fb494182aa5f5959dba3d631.s1.eu.hivemq.cloud"
#define MQTT_BROKER_PORT    8883
#define MQTT_USERNAME       "rosaiq_new"
#define MQTT_PASSWORD       "Rosaiq123$"
#define MQTT_PUBLISH_INTERVAL 60000  // 60 seconds
#define MQTT_MAX_PACKET_SIZE 2048  // Increased for consolidated payload

// MQTT Topic Structure - now uses MAC address
#define MQTT_TOPIC_PREFIX   "sensors/DEVICE-"
#define MQTT_TOPIC_SUFFIX   "/data"

// ===================== Sensor Definitions =====================
// Define sensor pins and variables here
#define IPS_SDA 21
#define IPS_SCL 22
#define IPS_RST 12
#define IPS_INT 14

// ===================== WiFi Configuration =====================
// Store WiFi credentials in EEPROM
#define EEPROM_SIZE 128
#define SSID_ADDR 0
#define PASS_ADDR 64

char eep_ssid[64] = "";
char eep_pass[64] = "";

// ===================== AQI Ranges =====================
// AQI Ranges
#define AQI_GOOD_MAX 50
#define AQI_MODERATE_MAX 100
#define AQI_UNHEALTHY_SENSITIVE_MAX 150
#define AQI_UNHEALTHY_MAX 200
#define AQI_VERY_UNHEALTHY_MAX 300
#define AQI_HAZARDOUS_MAX 500

// ===================== Global Variables =====================
// Sensor data variables
float sen_temp_cld = 0;
float sen_humid_cld = 0;
float sen_pm1_cld = 0;
float sen_pm25_cld = 0;
float sen_pm4_cld = 0;
float sen_pm10_cld = 0;
float aht_temp_cld = 0;
float aht_humid_cld = 0;
float co2_cld = 0;
float voc_cld = 0;
float nox_cld = 0;
float hcho_cld = 0;
float pm1_avg_cld = 0;
float pm25_avg_cld = 0;
float pm10_avg_cld = 0;
float pm03_avg_cld = 0;
float pm05_avg_cld = 0;
float pm5_avg_cld = 0;
float pc03_avg_disp = 0;
float pc05_avg_disp = 0;
float pc1_avg_disp = 0;
float pc25_avg_disp = 0;
float pc5_avg_disp = 0;
float pc10_avg_disp = 0;
int pm25_actual_aqi = 0;
int pm10_actual_aqi = 0;
int voc_actual_aqi = 0;
int nox_actual_aqi = 0;
int hcho_actual_aqi = 0;
int actual_aqi = 0;
float pressure_value = 0;

const char* hivemq_root_ca PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVQQoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----
)EOF";

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000); // UTC, update every 60s
FRAM32 fram;
BluetoothSerial SerialBT;
AHTxx aht20(AHTXX_ADDRESS_X38, AHT2x_SENSOR);

// ===================== MQTT Variables =====================
WiFiClientSecure espClientSecure;
PubSubClient mqttClient(espClientSecure);
unsigned long lastMqttPublish = 0;
String deviceId = "";  // Will be populated with MAC address
String mqttTopic = "";  // Will be constructed with MAC address
bool mqttConnected = false;

// ===================== Function Declarations =====================
void saveWiFiCredentials(const char* ssid, const char* password);
void loadWiFiCredentials();
void reconnectMQTT();
void publishSensorData();
void readSen5x();
void readAHT20();
void readIps7100();
void calculateAqi();
int calculateIndividualAQI(float concentration, int pollutantType);
String determineDominantPollutant();
void publishConsolidatedSensorData();

void setup() {
  Serial.begin(115200);
  
  // Get MAC address and construct device ID and topic
  deviceId = WiFi.macAddress();
  deviceId.replace(":", "");  // Remove colons from MAC address
  mqttTopic = String(MQTT_TOPIC_PREFIX) + deviceId + String(MQTT_TOPIC_SUFFIX);
  
  Serial.println("Device MAC: " + deviceId);
  Serial.println("MQTT Topic: " + mqttTopic);
  
  // Initialize EEPROM
  EEPROM.begin(EEPROM_SIZE);
  loadWiFiCredentials();

  // Initialize WiFi
  WiFi.begin(eep_ssid, eep_pass);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  
  // Initialize NTP
  timeClient.begin();
  timeClient.update();
  
  // Configure MQTT
  espClientSecure.setCACert(hivemq_root_ca);
  mqttClient.setServer(MQTT_BROKER_URL, MQTT_BROKER_PORT);
  mqttClient.setBufferSize(MQTT_MAX_PACKET_SIZE);
  
  // Initialize Sensors
  Wire.begin();
  
  // Initialize SEN5x
  SensirionI2CSen5x sen5x;
  sen5x.begin(Wire);
  uint16_t error;
  char errorMessage[256];
  error = sen5x.deviceReset();
  if (error) {
    Serial.print("Error executing deviceReset(): ");
    sen5x.getErrorMessage(error, errorMessage, 256);
    Serial.println(errorMessage);
  }
  
  // Initialize AHT20
  aht20.begin();
  delay(500);
  
  // Initialize IPS-7100
  ips_init(IPS_SDA, IPS_SCL, IPS_RST, IPS_INT);
  ips_wakeup();
}

void loop() {
  // Keep MQTT connection alive
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();
  
  // Update NTP time
  timeClient.update();
  
  // Read sensor data
  readSen5x();
  readAHT20();
  readIps7100();
  calculateAqi();
  
  // Publish consolidated data at interval
  if (millis() - lastMqttPublish >= MQTT_PUBLISH_INTERVAL) {
    publishConsolidatedSensorData();
    lastMqttPublish = millis();
  }
}

void saveWiFiCredentials(const char* ssid, const char* password) {
  // Clear old credentials
  for (int i = 0; i < 64; i++) {
    EEPROM.write(SSID_ADDR + i, 0);
    EEPROM.write(PASS_ADDR + i, 0);
  }

  // Save new SSID
  for (int i = 0; i < strlen(ssid); i++) {
    EEPROM.write(SSID_ADDR + i, ssid[i]);
  }

  // Save new password
  for (int i = 0; i < strlen(password); i++) {
    EEPROM.write(PASS_ADDR + i, password[i]);
  }

  EEPROM.commit();
  Serial.println("WiFi credentials saved to EEPROM");
}

void loadWiFiCredentials() {
  // Load SSID
  for (int i = 0; i < 64; i++) {
    eep_ssid[i] = EEPROM.read(SSID_ADDR + i);
  }

  // Load password
  for (int i = 0; i < 64; i++) {
    eep_pass[i] = EEPROM.read(PASS_ADDR + i);
  }

  Serial.println("WiFi credentials loaded from EEPROM");
  Serial.print("SSID: ");
  Serial.println(eep_ssid);
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32-" + deviceId;
    
    if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println("connected");
      mqttConnected = true;
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void readSen5x() {
  SensirionI2CSen5x sen5x;
  uint16_t error;
  char errorMessage[256];
  float temperature, humidity, pm1p0, pm2p5, pm4p0, pm10p0, voc, nox;

  error = sen5x.readMeasuredValues(temperature, humidity, pm1p0, pm2p5, pm4p0, pm10p0, voc, nox);
  if (error) {
    Serial.print("Error executing readMeasuredValues(): ");
    sen5x.getErrorMessage(error, errorMessage, 256);
    Serial.println(errorMessage);
  } else {
    sen_temp_cld = temperature;
    sen_humid_cld = humidity;
  }
}

void readAHT20() {
  AHTxx aht20(AHTXX_ADDRESS_X38, AHT2x_SENSOR);
  aht20.read();
  aht_temp_cld = aht20.temperature;
  aht_humid_cld = aht20.humidity;
}

void readIps7100() {
  if (ips_data_ready()) {
    ips_read();
    pm1_avg_cld = ips_get_pm1_avg();
    pm25_avg_cld = ips_get_pm25_avg();
    pm10_avg_cld = ips_get_pm10_avg();
    pm03_avg_cld = ips_get_pm03_avg();
    pm05_avg_cld = ips_get_pm05_avg();
    pm5_avg_cld = ips_get_pm5_avg();
    pc03_avg_disp = ips_get_pc03_avg();
    pc05_avg_disp = ips_get_pc05_avg();
    pc1_avg_disp = ips_get_pc1_avg();
    pc25_avg_disp = ips_get_pc25_avg();
    pc5_avg_disp = ips_get_pc5_avg();
    pc10_avg_disp = ips_get_pc10_avg();
  }
}

void calculateAqi() {
  pm25_actual_aqi = calculateIndividualAQI(pm25_avg_cld, 1);
  pm10_actual_aqi = calculateIndividualAQI(pm10_avg_cld, 2);
  voc_actual_aqi = calculateIndividualAQI(voc_cld, 3);
  nox_actual_aqi = calculateIndividualAQI(nox_cld, 4);
  hcho_actual_aqi = calculateIndividualAQI(hcho_cld, 5);

  actual_aqi = pm25_actual_aqi;
  if (pm10_actual_aqi > actual_aqi) actual_aqi = pm10_actual_aqi;
  if (voc_actual_aqi > actual_aqi) actual_aqi = voc_actual_aqi;
  if (nox_actual_aqi > actual_aqi) actual_aqi = nox_actual_aqi;
  if (hcho_actual_aqi > actual_aqi) actual_aqi = hcho_actual_aqi;
}

int calculateIndividualAQI(float concentration, int pollutantType) {
  float c = concentration;
  int aqi = 0;
  float breakpoints[5][2];

  switch (pollutantType) {
    case 1: // PM2.5
      breakpoints[0][0] = 0.0;   breakpoints[0][1] = 12.0;
      breakpoints[1][0] = 12.1;  breakpoints[1][1] = 35.4;
      breakpoints[2][0] = 35.5;  breakpoints[2][1] = 55.4;
      breakpoints[3][0] = 55.5;  breakpoints[3][1] = 150.4;
      breakpoints[4][0] = 150.5; breakpoints[4][1] = 250.4;
      break;
    case 2: // PM10
      breakpoints[0][0] = 0;   breakpoints[0][1] = 54;
      breakpoints[1][0] = 55;  breakpoints[1][1] = 154;
      breakpoints[2][0] = 155;  breakpoints[2][1] = 254;
      breakpoints[3][0] = 255;  breakpoints[3][1] = 354;
      breakpoints[4][0] = 355; breakpoints[4][1] = 424;
      break;
    case 3: // VOC (Placeholder - needs specific VOC AQI)
      breakpoints[0][0] = 0.0;   breakpoints[0][1] = 1.0;
      breakpoints[1][0] = 1.1;  breakpoints[1][1] = 2.0;
      breakpoints[2][0] = 2.1;  breakpoints[2][1] = 3.0;
      breakpoints[3][0] = 3.1;  breakpoints[3][1] = 4.0;
      breakpoints[4][0] = 4.1; breakpoints[4][1] = 5.0;
      break;
    case 4: // NOX (Placeholder - needs specific NOX AQI)
      breakpoints[0][0] = 0.0;   breakpoints[0][1] = 1.0;
      breakpoints[1][0] = 1.1;  breakpoints[1][1] = 2.0;
      breakpoints[2][0] = 2.1;  breakpoints[2][1] = 3.0;
      breakpoints[3][0] = 3.1;  breakpoints[3][1] = 4.0;
      breakpoints[4][0] = 4.1; breakpoints[4][1] = 5.0;
      break;
    case 5: // HCHO (Placeholder - needs specific HCHO AQI)
      breakpoints[0][0] = 0.0;   breakpoints[0][1] = 0.05;
      breakpoints[1][0] = 0.06;  breakpoints[1][1] = 0.1;
      breakpoints[2][0] = 0.11;  breakpoints[2][1] = 0.2;
      breakpoints[3][0] = 0.21;  breakpoints[3][1] = 0.3;
      breakpoints[4][0] = 0.31; breakpoints[4][1] = 0.4;
      break;
    default:
      return 0;
  }

  int aqiValues[] = {0, 51, 101, 151, 201, 301};
  float bpLow, bpHigh;
  int aqiLow, aqiHigh;

  if (c >= breakpoints[4][0]) {
    bpLow = breakpoints[4][0];
    bpHigh = 500;
    aqiLow = aqiValues[4];
    aqiHigh = 500;
  } else if (c >= breakpoints[3][0]) {
    bpLow = breakpoints[3][0];
    bpHigh = breakpoints[4][1];
    aqiLow = aqiValues[3];
    aqiHigh = aqiValues[4];
  } else if (c >= breakpoints[2][0]) {
    bpLow = breakpoints[2][0];
    bpHigh = breakpoints[3][1];
    aqiLow = aqiValues[2];
    aqiHigh = aqiValues[3];
  } else if (c >= breakpoints[1][0]) {
    bpLow = breakpoints[1][0];
    bpHigh = breakpoints[2][1];
    aqiLow = aqiValues[1];
    aqiHigh = aqiValues[2];
  } else {
    bpLow = breakpoints[0][0];
    bpHigh = breakpoints[1][1];
    aqiLow = aqiValues[0];
    aqiHigh = aqiValues[1];
  }

  aqi = ((aqiHigh - aqiLow) / (bpHigh - bpLow)) * (c - bpLow) + aqiLow;
  return aqi;
}

void publishConsolidatedSensorData() {
  // Create JSON document with all sensor data
  StaticJsonDocument<1536> doc;
  
  // Device identification
  doc["deviceId"] = deviceId;
  
  // Timestamp in ISO 8601 format
  unsigned long epochTime = timeClient.getEpochTime();
  char timestamp[25];
  time_t rawtime = epochTime;
  struct tm * ti;
  ti = gmtime(&rawtime);
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", ti);
  doc["timestamp"] = timestamp;
  
  // Environmental sensors (from AHT20 or SEN5x)
  if (aht_temp_cld > 0) {
    doc["temperature"] = aht_temp_cld;
    doc["humidity"] = aht_humid_cld;
  } else if (sen_temp_cld > 0) {
    doc["temperature"] = sen_temp_cld;
    doc["humidity"] = sen_humid_cld;
  }
  
  // Atmospheric pressure (if available from BMP280)
  // doc["pressure"] = pressure_value;
  
  // Particle Matter (from IPS sensor)
  if (pm1_avg_cld > 0) doc["pm1"] = pm1_avg_cld;
  if (pm25_avg_cld > 0) doc["pm25"] = pm25_avg_cld;
  if (pm10_avg_cld > 0) doc["pm10"] = pm10_avg_cld;
  if (pm03_avg_cld > 0) doc["pm03"] = pm03_avg_cld;
  if (pm05_avg_cld > 0) doc["pm05"] = pm05_avg_cld;
  if (pm5_avg_cld > 0) doc["pm5"] = pm5_avg_cld;
  
  // Particle Counts (from IPS sensor)
  if (pc03_avg_disp > 0) doc["pc03"] = pc03_avg_disp;
  if (pc05_avg_disp > 0) doc["pc05"] = pc05_avg_disp;
  if (pc1_avg_disp > 0) doc["pc1"] = pc1_avg_disp;
  if (pc25_avg_disp > 0) doc["pc25"] = pc25_avg_disp;
  if (pc5_avg_disp > 0) doc["pc5"] = pc5_avg_disp;
  if (pc10_avg_disp > 0) doc["pc10"] = pc10_avg_disp;
  
  // Gas sensors
  if (co2_cld > 0) doc["co2"] = co2_cld;
  if (voc_cld > 0) doc["voc"] = voc_cld;
  if (nox_cld > 0) doc["nox"] = nox_cld;
  if (hcho_cld > 0) doc["hcho"] = hcho_cld;
  
  // AQI calculation
  if (actual_aqi > 0) {
    doc["aqi_overall"] = actual_aqi;
    doc["dominant_pollutant"] = determineDominantPollutant();
  }
  
  // Serialize to JSON string
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Publishing consolidated data:");
  Serial.println(jsonPayload);
  
  // Publish to MQTT
  if (mqttClient.publish(mqttTopic.c_str(), jsonPayload.c_str())) {
    Serial.println("✓ Published successfully");
  } else {
    Serial.println("✗ Publish failed");
  }
}

String determineDominantPollutant() {
  // Simple logic to determine which pollutant is worst
  int maxAqi = 0;
  String dominant = "none";
  
  if (pm25_actual_aqi > maxAqi) {
    maxAqi = pm25_actual_aqi;
    dominant = "pm25";
  }
  if (pm10_actual_aqi > maxAqi) {
    maxAqi = pm10_actual_aqi;
    dominant = "pm10";
  }
  if (voc_actual_aqi > maxAqi) {
    maxAqi = voc_actual_aqi;
    dominant = "voc";
  }
  if (nox_actual_aqi > maxAqi) {
    maxAqi = nox_actual_aqi;
    dominant = "nox";
  }
  if (hcho_actual_aqi > maxAqi) {
    maxAqi = hcho_actual_aqi;
    dominant = "hcho";
  }
  
  return dominant;
}
