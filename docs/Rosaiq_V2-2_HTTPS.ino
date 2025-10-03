/*
 * RosaIQ Air Quality Monitor - HTTPS Version
 * 
 * This version uses direct HTTPS POST to Supabase Edge Function
 * No MQTT broker required - simpler and more reliable
 * 
 * Hardware: ESP32 with PMS5003, SEN55, SGP41, SCD41 sensors
 * Communication: WiFi + HTTPS to Supabase
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <time.h>

// ============================================
// CONFIGURATION - Update these values
// ============================================
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Supabase Edge Function URL
const char* SUPABASE_URL = "https://xunlqdiappgyokhknvoc.supabase.co/functions/v1/sensor-data-webhook";
const char* DEVICE_SECRET = "YOUR_DEVICE_SECRET_HERE"; // Get from Supabase secrets

// NTP Server for timestamps
const char* NTP_SERVER = "pool.ntp.org";
const long GMT_OFFSET = 14400; // UAE: GMT+4 (4 * 3600)
const int DAYLIGHT_OFFSET = 0;

// Sensor update interval (milliseconds)
const unsigned long SENSOR_INTERVAL = 30000; // 30 seconds

// ============================================
// SENSOR LIBRARIES
// ============================================
#include <Adafruit_PM25AQI.h>
#include <SensirionI2CSen5x.h>
#include <SensirionI2CSgp41.h>
#include <SensirionI2CScd4x.h>

// ============================================
// GLOBAL OBJECTS
// ============================================
Adafruit_PM25AQI pms5003;
SensirionI2CSen5x sen55;
SensirionI2CSgp41 sgp41;
SensirionI2CScd4x scd41;

WiFiClientSecure wifiClient;
String deviceMacAddress;

// Root CA Certificate for HTTPS validation (Let's Encrypt/ISRG Root X1)
// Used by Supabase for secure connections
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
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hvc1CLQJ13hef4Y53CI
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

// Timing
unsigned long lastSensorRead = 0;

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n=================================");
  Serial.println("RosaIQ Air Quality Monitor v2.2");
  Serial.println("HTTPS Direct Connection");
  Serial.println("=================================\n");

  // Get MAC address for device identification
  deviceMacAddress = WiFi.macAddress();
  deviceMacAddress.replace(":", "");
  Serial.println("Device MAC: " + deviceMacAddress);

  // Initialize sensors
  initSensors();

  // Connect to WiFi
  connectWiFi();

  // Initialize time (REQUIRED for HTTPS certificate validation)
  configTime(GMT_OFFSET, DAYLIGHT_OFFSET, NTP_SERVER);
  Serial.println("Waiting for NTP time sync...");
  
  // Wait for time to be set (required for certificate validation)
  time_t now = time(nullptr);
  int retry = 0;
  while (now < 1000000000 && retry < 20) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    retry++;
  }
  Serial.println();
  
  if (now < 1000000000) {
    Serial.println("WARNING: Failed to sync time! Certificate validation may fail.");
  } else {
    Serial.println("Time synchronized successfully!");
  }

  // PRODUCTION: Use proper SSL certificate validation
  wifiClient.setCACert(root_ca);
  Serial.println("SSL certificate validation enabled");

  Serial.println("\nSetup complete! Starting sensor readings...\n");
}

// ============================================
// MAIN LOOP
// ============================================
void loop() {
  unsigned long currentMillis = millis();

  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    connectWiFi();
  }

  // Read sensors and publish data at interval
  if (currentMillis - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = currentMillis;
    
    // Read all sensors
    StaticJsonDocument<1024> sensorData;
    readAllSensors(sensorData);
    
    // Add MAC address and timestamp
    sensorData["mac_address"] = deviceMacAddress;
    sensorData["timestamp"] = getISOTimestamp();
    
    // Calculate and add AQI
    calculateAQI(sensorData);
    
    // Publish to Supabase via HTTPS
    publishToHTTPS(sensorData);
  }

  delay(100);
}

// ============================================
// WIFI CONNECTION
// ============================================
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
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
    Serial.print("Signal strength (RSSI): ");
    Serial.println(WiFi.RSSI());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

// ============================================
// SENSOR INITIALIZATION
// ============================================
void initSensors() {
  Serial.println("Initializing sensors...");
  
  Wire.begin();

  // Initialize PMS5003
  Serial.print("- PMS5003: ");
  if (pms5003.begin_UART(&Serial2)) {
    Serial.println("OK");
  } else {
    Serial.println("FAILED");
  }

  // Initialize SEN55
  Serial.print("- SEN55: ");
  sen55.begin(Wire);
  if (sen55.deviceReset() == 0) {
    sen55.startMeasurement();
    Serial.println("OK");
  } else {
    Serial.println("FAILED");
  }

  // Initialize SGP41
  Serial.print("- SGP41: ");
  sgp41.begin(Wire);
  Serial.println("OK");

  // Initialize SCD41
  Serial.print("- SCD41: ");
  scd41.begin(Wire);
  scd41.stopPeriodicMeasurement();
  scd41.startPeriodicMeasurement();
  Serial.println("OK");
  
  Serial.println("Sensor initialization complete!\n");
}

// ============================================
// READ ALL SENSORS
// ============================================
void readAllSensors(JsonDocument& data) {
  // Read PMS5003
  PM25_AQI_Data pmsData;
  if (pms5003.read(&pmsData)) {
    data["pm03"] = pmsData.pm03_standard;
    data["pm05"] = pmsData.pm05_standard;
    data["pm1"] = pmsData.pm10_standard;
    data["pm25"] = pmsData.pm25_standard;
    data["pm5"] = pmsData.pm50_standard;
    data["pm10"] = pmsData.pm100_standard;
    data["pc03"] = pmsData.particles_03um;
    data["pc05"] = pmsData.particles_05um;
    data["pc1"] = pmsData.particles_10um;
    data["pc25"] = pmsData.particles_25um;
    data["pc5"] = pmsData.particles_50um;
  }

  // Read SEN55
  float massConcentrationPm1p0, massConcentrationPm2p5, massConcentrationPm4p0, massConcentrationPm10p0;
  float ambientHumidity, ambientTemperature, vocIndex, noxIndex;
  
  uint16_t error = sen55.readMeasuredValues(
    massConcentrationPm1p0, massConcentrationPm2p5, 
    massConcentrationPm4p0, massConcentrationPm10p0,
    ambientHumidity, ambientTemperature, 
    vocIndex, noxIndex
  );
  
  if (error == 0) {
    data["temperature"] = ambientTemperature;
    data["humidity"] = ambientHumidity;
    data["voc"] = (int)vocIndex;
    data["nox"] = (int)noxIndex;
  }

  // Read SCD41 (CO2)
  uint16_t co2;
  float temp, hum;
  if (scd41.readMeasurement(co2, temp, hum) == 0) {
    if (co2 > 0) {
      data["co2"] = co2;
    }
  }

  // Read SGP41 (TVOC, formaldehyde approximation)
  uint16_t srawVoc, srawNox;
  if (sgp41.measureRawSignals(ambientHumidity, ambientTemperature, srawVoc, srawNox) == 0) {
    // Approximate formaldehyde from VOC raw signal
    float hcho = (srawVoc - 20000) / 100.0;
    if (hcho < 0) hcho = 0;
    data["hcho"] = (int)hcho;
  }
}

// ============================================
// CALCULATE AQI
// ============================================
void calculateAQI(JsonDocument& data) {
  float pm25 = data["pm25"] | 0.0;
  float pm10 = data["pm10"] | 0.0;
  int co2 = data["co2"] | 0;
  int voc = data["voc"] | 0;
  
  // Simple AQI calculation (0-500 scale)
  int pm25_aqi = map(constrain(pm25, 0, 250), 0, 250, 0, 500);
  int pm10_aqi = map(constrain(pm10, 0, 430), 0, 430, 0, 500);
  int co2_aqi = map(constrain(co2, 400, 5000), 400, 5000, 0, 500);
  int voc_aqi = map(constrain(voc, 0, 500), 0, 500, 0, 500);
  
  // Take the maximum as overall AQI
  int overallAQI = max(max(pm25_aqi, pm10_aqi), max(co2_aqi, voc_aqi));
  data["aqi_overall"] = overallAQI;
  
  // Determine dominant pollutant
  if (pm25_aqi >= overallAQI) {
    data["dominant_pollutant"] = "PM2.5";
  } else if (pm10_aqi >= overallAQI) {
    data["dominant_pollutant"] = "PM10";
  } else if (co2_aqi >= overallAQI) {
    data["dominant_pollutant"] = "CO2";
  } else {
    data["dominant_pollutant"] = "VOC";
  }
}

// ============================================
// PUBLISH TO SUPABASE VIA HTTPS
// ============================================
void publishToHTTPS(JsonDocument& data) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot publish: WiFi not connected");
    return;
  }

  HTTPClient http;
  http.begin(wifiClient, SUPABASE_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-secret", DEVICE_SECRET);
  http.setTimeout(10000); // 10 second timeout

  // Serialize JSON
  String jsonPayload;
  serializeJson(data, jsonPayload);
  
  Serial.println("\n--- Sending Data to Supabase ---");
  Serial.println(jsonPayload);
  
  // POST request
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
    
    if (httpResponseCode == 200) {
      Serial.println("✓ Data successfully sent!");
    } else {
      Serial.println("✗ Server returned error");
    }
  } else {
    Serial.print("✗ Error sending POST: ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
  Serial.println("--------------------------------\n");
}

// ============================================
// GET ISO 8601 TIMESTAMP
// ============================================
String getISOTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return "1970-01-01T00:00:00Z";
  }
  
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}
