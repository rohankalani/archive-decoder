/*
 * RosaIQ ESP32 Air Quality Monitor - Supabase Integrated Version
 * 
 * Features:
 * - Reads from multiple air quality sensors (PMS5003, SEN55, SGP41, SCD41)
 * - Sends real-time data to Blynk every 8 seconds
 * - Sends 60-second averaged data to Supabase via HTTPS
 * - Auto-registers device by MAC address
 * - Secure communication with SSL/TLS
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <time.h>

#include <SoftwareSerial.h>
#include <PMS.h>
#include <BlynkSimpleEsp32.h>
#include <RTClib.h>
#include <SPI.h>
#include <Adafruit_Sensor.h>
#include "Adafruit_AHTX0.h"
#include <Wire.h>
#include "DFRobot_SCD4X.h"
#include "DFRobot_SGP40.h"
#include "DFRobot_SEN5X.h"

// ============= SUPABASE CONFIGURATION =============
#define SUPABASE_URL "https://xunlqdiappgyokhknvoc.supabase.co/functions/v1/sensor-data-webhook"
#define DEVICE_SECRET "YOUR_SECRET_KEY_HERE"  // ⚠️ SET THIS TO MATCH SUPABASE SECRET
#define HTTPS_PUBLISH_INTERVAL 60000          // 60 seconds
#define HTTPS_AVERAGING_SAMPLES 7             // Collect 7 samples over 60 seconds

// Supabase Root CA Certificate for SSL/TLS
const char* supabase_root_ca = R"EOF(
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

// ============= BLYNK & WIFI CONFIGURATION =============
char auth[] = "YourAuthToken"; //Enter your Auth code
char ssid[] = "YourNetworkName";  //Your Network Name
char pass[] = "YourPassword";  //Your Password

// ============= GLOBAL VARIABLES =============
#define RXD2 16
#define TXD2 17

SoftwareSerial neosoftSerial(RXD2, TXD2);
PMS pms(neosoftSerial);
PMS::DATA data;

BlynkTimer timer;

//AHT20
Adafruit_AHTX0 aht;
float aht_humidity;
float aht_temperature;
float aht_humid_cld;
float aht_temp_cld;

//RTC
RTC_DS3231 rtc;
char daysOfTheWeek[7][12] = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
int ext_rtc_second;
int ext_rtc_minute;
int ext_rtc_hour;
int ext_rtc_date;
int ext_rtc_month;
int ext_rtc_year;

//SCD41
DFRobot_SCD4X scd4x;
float co2_disp;
float temperature_disp;
float humidity_disp;

//SGP41
DFRobot_SGP40 sgp40;
uint16_t srawVoc;
uint16_t srawNox;
float vocIndex_disp;
float noxIndex_disp;

//SEN55
DFRobot_SEN5X sen55;
float hcho_cld;
float pm01_avg_cld;
float pm25_avg_cld;
float pm10_avg_cld;
float pc01_avg_disp;
float pc03_avg_disp;
float pc05_avg_disp;
float pc1_avg_disp;
float pc25_avg_disp;
float pc5_avg_disp;
float pc10_avg_disp;

//AQI
int actual_aqi;
String aqi_desc;

//Timers
unsigned long currentMillis;
unsigned long previousMillis = 0;
unsigned long cloud_update_interval = 8000;
boolean cloud_update_flag = 0;
int present_minute;

//HTTPS Publishing variables
WiFiClientSecure httpsClient;
unsigned long lastHTTPSPublish = 0;
String deviceMacAddress;

// Averaging accumulators for 60-second window
float https_temp_sum = 0;
float https_humid_sum = 0;
float https_pm1_sum = 0;
float https_pm25_sum = 0;
float https_pm10_sum = 0;
float https_pc01_sum = 0;
float https_pc03_sum = 0;
float https_pc05_sum = 0;
float https_pc1_sum = 0;
float https_pc25_sum = 0;
float https_pc5_sum = 0;
float https_pc10_sum = 0;
float https_co2_sum = 0;
float https_voc_sum = 0;
float https_nox_sum = 0;
float https_hcho_sum = 0;
float https_aqi_sum = 0;
uint8_t https_sample_count = 0;

// ============= SETUP FUNCTION =============
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("   RosaIQ Air Quality Monitor");
  Serial.println("   Supabase Integrated Version");
  Serial.println("=================================\n");

  // Get MAC address for device identification
  deviceMacAddress = WiFi.macAddress();
  deviceMacAddress.replace(":", "");
  Serial.print("Device MAC: ");
  Serial.println(deviceMacAddress);

  //Initialize Blynk
  Blynk.begin(auth, ssid, pass);
  Serial.println("✓ Blynk connected");

  //AHT20 begin
  if (! aht.begin()) {
    Serial.println("✗ Could not find AHT? Check wiring");
    while (1) delay(10);
  }
  Serial.println("✓ AHT20 connected");

  //RTC
  if (! rtc.begin()) {
    Serial.println("✗ Couldn't find RTC");
    Serial.flush();
    abort();
  }
  if (rtc.lostPower()) {
    Serial.println("✓ RTC lost power, lets set the time!");
    // When time needs to be set on a new device, or after a power loss, the
    // following line may be uncommented to set the date and time to the compiler date and time.
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    // This line sets the RTC with an explicit date and time, for example to set
    // January 21, 2014 at 3am you would call:
    // rtc.adjust(DateTime(2014, 01, 21, 3, 0, 0));
  }
  Serial.println("✓ RTC connected");

  //SCD41
  while (scd4x.begin() != 0) {
    Serial.println("✗ SCD41 init failed!!!");
    delay(1000);
  }
  Serial.println("✓ SCD41 connected");

  //SGP41
  while (sgp40.begin() != 0) {
    Serial.println("✗ SGP41 init failed!!!");
    delay(1000);
  }
  Serial.println("✓ SGP41 connected");

  //SEN55
  while (sen55.begin() != 0) {
    Serial.println("✗ SEN55 init failed!!!");
    delay(1000);
  }
  Serial.println("✓ SEN55 connected");

  //PMS5003
  neosoftSerial.begin(9600);
  Serial.println("✓ PMS5003 connected");

  // Configure HTTPS client with SSL certificate
  httpsClient.setCACert(supabase_root_ca);
  
  // Initialize averaging variables
  https_sample_count = 0;
  
  Serial.println("✓ Supabase HTTPS client configured");
  Serial.println("✓ System ready!\n");
}

// ============= ACCUMULATE SENSOR DATA FOR HTTPS =============
void accumulateSensorDataForHTTPS() {
  // Accumulate current sensor readings for averaging
  https_temp_sum += aht_temp_cld;
  https_humid_sum += aht_humid_cld;
  https_pm1_sum += pm01_avg_cld;
  https_pm25_sum += pm25_avg_cld;
  https_pm10_sum += pm10_avg_cld;
  https_pc01_sum += pc01_avg_disp;
  https_pc03_sum += pc03_avg_disp;
  https_pc05_sum += pc05_avg_disp;
  https_pc1_sum += pc1_avg_disp;
  https_pc25_sum += pc25_avg_disp;
  https_pc5_sum += pc5_avg_disp;
  https_pc10_sum += pc10_avg_disp;
  https_co2_sum += co2_disp;
  https_voc_sum += vocIndex_disp;
  https_nox_sum += noxIndex_disp;
  https_hcho_sum += hcho_cld;
  https_aqi_sum += actual_aqi;
  
  https_sample_count++;
  
  Serial.print("✓ HTTPS Sample accumulated: ");
  Serial.print(https_sample_count);
  Serial.print("/");
  Serial.println(HTTPS_AVERAGING_SAMPLES);
}

// ============= PUBLISH AVERAGED DATA TO SUPABASE =============
void publishAveragedDataToHTTPS() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ Cannot publish to Supabase: WiFi not connected");
    resetHTTPSAveraging();
    return;
  }

  if (https_sample_count == 0) {
    Serial.println("⚠ No samples collected, skipping HTTPS publish");
    return;
  }

  // Calculate averages
  float avg_temp = https_temp_sum / https_sample_count;
  float avg_humid = https_humid_sum / https_sample_count;
  float avg_pm1 = https_pm1_sum / https_sample_count;
  float avg_pm25 = https_pm25_sum / https_sample_count;
  float avg_pm10 = https_pm10_sum / https_sample_count;
  float avg_pc01 = https_pc01_sum / https_sample_count;
  float avg_pc03 = https_pc03_sum / https_sample_count;
  float avg_pc05 = https_pc05_sum / https_sample_count;
  float avg_pc1 = https_pc1_sum / https_sample_count;
  float avg_pc25 = https_pc25_sum / https_sample_count;
  float avg_pc5 = https_pc5_sum / https_sample_count;
  float avg_pc10 = https_pc10_sum / https_sample_count;
  float avg_co2 = https_co2_sum / https_sample_count;
  float avg_voc = https_voc_sum / https_sample_count;
  float avg_nox = https_nox_sum / https_sample_count;
  float avg_hcho = https_hcho_sum / https_sample_count;
  float avg_aqi = https_aqi_sum / https_sample_count;

  HTTPClient http;
  http.begin(httpsClient, SUPABASE_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-secret", DEVICE_SECRET);
  http.setTimeout(10000);

  // Create JSON payload with averaged data
  StaticJsonDocument<1024> doc;
  doc["mac_address"] = deviceMacAddress;
  doc["timestamp"] = getISOTimestamp();
  
  // Add averaged sensor data (rounded for cleaner transmission)
  doc["temperature"] = round(avg_temp * 10) / 10.0;
  doc["humidity"] = round(avg_humid * 10) / 10.0;
  doc["pm1"] = round(avg_pm1 * 100) / 100.0;
  doc["pm25"] = round(avg_pm25 * 100) / 100.0;
  doc["pm10"] = round(avg_pm10 * 100) / 100.0;
  doc["pc01"] = round(avg_pc01);
  doc["pc03"] = round(avg_pc03);
  doc["pc05"] = round(avg_pc05);
  doc["pc1"] = round(avg_pc1);
  doc["pc25"] = round(avg_pc25);
  doc["pc5"] = round(avg_pc5);
  doc["pc10"] = round(avg_pc10);
  doc["co2"] = round(avg_co2);
  doc["voc"] = round(avg_voc);
  doc["nox"] = round(avg_nox);
  doc["hcho"] = round(avg_hcho * 100) / 100.0;
  doc["aqi_overall"] = round(avg_aqi);
  
  // Determine dominant pollutant based on which contributes most to AQI
  String dominantPollutant = "Unknown";
  float pm25_contribution = (avg_pm25 / 35.0) * 100;  // EPA breakpoint
  float pm10_contribution = (avg_pm10 / 150.0) * 100;
  float voc_contribution = (avg_voc / 500.0) * 100;
  float co2_contribution = (avg_co2 / 1000.0) * 100;
  
  float maxContribution = max(max(pm25_contribution, pm10_contribution), 
                               max(voc_contribution, co2_contribution));
  
  if (maxContribution == pm25_contribution) dominantPollutant = "PM2.5";
  else if (maxContribution == pm10_contribution) dominantPollutant = "PM10";
  else if (maxContribution == voc_contribution) dominantPollutant = "VOC";
  else if (maxContribution == co2_contribution) dominantPollutant = "CO2";
  
  doc["dominant_pollutant"] = dominantPollutant;

  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("\n========== Sending to Supabase ==========");
  Serial.print("Samples averaged: ");
  Serial.println(https_sample_count);
  Serial.print("Payload size: ");
  Serial.print(jsonPayload.length());
  Serial.println(" bytes");
  Serial.println(jsonPayload);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response Code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
    
    if (httpResponseCode == 200) {
      Serial.println("✓ SUCCESS: Data sent to Supabase!");
    } else if (httpResponseCode == 401) {
      Serial.println("✗ ERROR: Unauthorized - Check DEVICE_SECRET");
    } else {
      Serial.println("⚠ WARNING: Unexpected response code");
    }
  } else {
    Serial.print("✗ ERROR: HTTP POST failed - ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
  Serial.println("=========================================\n");
  
  // Reset averaging variables
  resetHTTPSAveraging();
}

// ============= RESET AVERAGING VARIABLES =============
void resetHTTPSAveraging() {
  https_temp_sum = 0;
  https_humid_sum = 0;
  https_pm1_sum = 0;
  https_pm25_sum = 0;
  https_pm10_sum = 0;
  https_pc01_sum = 0;
  https_pc03_sum = 0;
  https_pc05_sum = 0;
  https_pc1_sum = 0;
  https_pc25_sum = 0;
  https_pc5_sum = 0;
  https_pc10_sum = 0;
  https_co2_sum = 0;
  https_voc_sum = 0;
  https_nox_sum = 0;
  https_hcho_sum = 0;
  https_aqi_sum = 0;
  https_sample_count = 0;
}

// ============= GET ISO TIMESTAMP =============
String getISOTimestamp() {
  char buffer[30];
  snprintf(buffer, sizeof(buffer), "%04d-%02d-%02dT%02d:%02d:%02dZ", 
           ext_rtc_year, ext_rtc_month, ext_rtc_date, 
           ext_rtc_hour, ext_rtc_minute, ext_rtc_second);
  return String(buffer);
}

// ============= CLOUD UPDATE (BLYNK) - MODIFIED =============
void cloud_update()
{
  // Accumulate sample for HTTPS averaging (every 8 seconds with Blynk)
  accumulateSensorDataForHTTPS();
  
  DateTime now = rtc.now();
  ext_rtc_second = now.second();
  ext_rtc_minute = now.minute();
  ext_rtc_hour = now.hour();
  ext_rtc_date = now.day();
  ext_rtc_month = now.month();
  ext_rtc_year = now.year();

  aht_humidity = aht.readHumidity();
  aht_temperature = aht.readTemperature();
  aht_humid_cld = aht_humidity;
  aht_temp_cld = aht_temperature;

  vocIndex_disp = sgp40.getVocIndex();
  noxIndex_disp = sgp40.getNoxIndex();

  DFRobot_SEN5X::sSen5xData sen5x_data;
  sen55.measure();
  if (sen55.readData(sen5x_data) == 0)
  {
    hcho_cld = sen5x_data.hcho;
    pm01_avg_cld = sen5x_data.pm0p1;
    pm25_avg_cld = sen5x_data.pm2p5;
    pm10_avg_cld = sen5x_data.pm10p0;
    pc01_avg_disp = sen5x_data.numberConcentration0p1;
    pc03_avg_disp = sen5x_data.numberConcentration0p3;
    pc05_avg_disp = sen5x_data.numberConcentration0p5;
    pc1_avg_disp = sen5x_data.numberConcentration1p0;
    pc25_avg_disp = sen5x_data.numberConcentration2p5;
    pc5_avg_disp = sen5x_data.numberConcentration5p0;
    pc10_avg_disp = sen5x_data.numberConcentration10p0;
  }

  co2_disp = scd4x.getCO2();
  temperature_disp = scd4x.getTemperature();
  humidity_disp = scd4x.getHumidity();

  if (pms.readUntil(data)) {
    Serial.print("PM 1.0 (ug/m3): ");
    Serial.print(data.PM_AE_UG_1_0);
    Serial.print("\t\tPM 2.5 (ug/m3): ");
    Serial.print(data.PM_AE_UG_2_5);
    Serial.print("\t\tPM 10 (ug/m3): ");
    Serial.println(data.PM_AE_UG_10_0);
  }
  if(cloud_update_flag==0)
  {
    actual_aqi = map(pm25_avg_cld, 0, 500, 0, 500);
    if (actual_aqi <= 50)
    {
      aqi_desc = "Good";
    }
    else if (actual_aqi <= 100)
    {
      aqi_desc = "Moderate";
    }
    else if (actual_aqi <= 150)
    {
      aqi_desc = "Unhealthy for Sensitive Groups";
    }
    else if (actual_aqi <= 200)
    {
      aqi_desc = "Unhealthy";
    }
    else if (actual_aqi <= 300)
    {
      aqi_desc = "Very Unhealthy";
    }
    else
    {
      aqi_desc = "Hazardous";
    }

    Blynk.virtualWrite(V0, aht_humidity);
    Blynk.virtualWrite(V1, aht_temperature);
    Blynk.virtualWrite(V2, pm01_avg_cld);
    Blynk.virtualWrite(V3, pm25_avg_cld);
    Blynk.virtualWrite(V4, pm10_avg_cld);
    Blynk.virtualWrite(V5, co2_disp);
    Blynk.virtualWrite(V6, vocIndex_disp);
    Blynk.virtualWrite(V7, noxIndex_disp);
    Blynk.virtualWrite(V8, hcho_cld);
    Blynk.virtualWrite(V9, actual_aqi);
    Blynk.virtualWrite(V10, aqi_desc);
    Blynk.virtualWrite(V11, ext_rtc_hour);
    Blynk.virtualWrite(V12, ext_rtc_minute);
    Blynk.virtualWrite(V13, ext_rtc_second);
    Blynk.virtualWrite(V14, ext_rtc_date);
    Blynk.virtualWrite(V15, ext_rtc_month);
    Blynk.virtualWrite(V16, ext_rtc_year);
    Blynk.virtualWrite(V17, temperature_disp);
    Blynk.virtualWrite(V18, humidity_disp);
  }
}

// ============= MAIN LOOP - MODIFIED =============
void loop() 
{ 
  unsigned long start = millis();
  cloud_update_flag = 0;
  currentMillis = millis();
  if (currentMillis - previousMillis >= cloud_update_interval)
  {
    cloud_update_flag = 1;
    previousMillis = currentMillis;
    cloud_update();
  }
  
  if(WiFi.status()== WL_CONNECTED) { 
    Blynk.run(); 
  } 
  
  currentMillis = millis();
  present_minute = ext_rtc_minute;

  // *** Publish 60-second averaged data to Supabase ***
  if((currentMillis - lastHTTPSPublish) >= HTTPS_PUBLISH_INTERVAL) {
    lastHTTPSPublish = currentMillis;
    
    // Only publish if we have enough samples and WiFi is connected
    if(WiFi.status() == WL_CONNECTED && https_sample_count >= HTTPS_AVERAGING_SAMPLES) {
      publishAveragedDataToHTTPS();
    } else {
      Serial.println("⚠ Skipping HTTPS publish: insufficient samples or no WiFi");
    }
  }
  
  timer.run();
  unsigned long end = millis();
  Serial.print("Loop time = ");
  Serial.println(end - start);
}

/*
 * ============= INTEGRATION CHECKLIST =============
 * 
 * 1. ✅ Set DEVICE_SECRET to match your Supabase environment variable
 * 2. ✅ Verify WiFi credentials are correct
 * 3. ✅ Keep existing sensor initialization code
 * 4. ✅ Keep existing Blynk configuration
 * 5. ✅ Add accumulateSensorDataForHTTPS() call to cloud_update()
 * 6. ✅ Add HTTPS publishing check to loop()
 * 
 * DATA FLOW:
 * - Every 8 seconds: Send instant readings to Blynk + accumulate for averaging
 * - Every 60 seconds: Send averaged data to Supabase
 * 
 * EXPECTED BEHAVIOR:
 * - First data will be sent after ~60 seconds (when 7 samples collected)
 * - Console will show "✓ HTTPS Sample accumulated: X/7" every 8 seconds
 * - Console will show "✓ SUCCESS: Data sent to Supabase!" every 60 seconds
 * - Device auto-registers by MAC address on first connection
 * 
 * TROUBLESHOOTING:
 * - "Unauthorized" error → Check DEVICE_SECRET matches Supabase
 * - "HTTP POST failed" → Check WiFi connection and SSL certificate
 * - No data in dashboard → Check device auto-registration in Supabase logs
 */
