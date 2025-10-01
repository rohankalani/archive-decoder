#include <FRAM.h>

/* Comment this out to disable prints and save space */
/*********************************************/
//#define BLYNK_PRINT Serial
// #define BLYNK_TEMPLATE_ID "TMPLSxg2bHZL"
// #define BLYNK_TEMPLATE_NAME "AQM"
// #define BLYNK_AUTH_TOKEN "Yr8FrOmAvymKJQN82CeELo_rfQ0yyRuS"
/**********************************************/
#include <stdlib.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <BlynkSimpleEsp32.h>
#include <Wire.h>
//#include <Arduino.h>
#include <SensirionI2CSen5x.h>
#include <SensirionI2CSfa3x.h>
#include <IpsI2C.h>
#include "HardwareSerial.h"
#include "BluetoothSerial.h"

//#include <Adafruit_BMP280.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "time.h"
#include <EEPROM.h>
#include <ezTime.h>
#include <AHTxx.h>
/**********************************************/
#define SERIAL1             1     
#define SERIAL2             2
HardwareSerial              ESP32Serial2(SERIAL2);
#define sam                 ESP32Serial2

#define PM_UNIT_EEP_START_ADDR          0x00
#define TEMP_UNIT_EEP_START_ADDR        0x01
#define AUTH_EEP_START_ADDR             0x02

#define SOC                         0xAA 
#define EOC                         0xBB 
#define SUCCESS_STATUS              0x01 
#define UNSUCCESS_STATUS            0x00
#define DEFAULT_RESPONSE_LENGTH     0x05 

#define ESP_I2C 25
#define ESP_I2C_ON digitalWrite(ESP_I2C, HIGH);
#define ESP_I2C_OFF digitalWrite(ESP_I2C, LOW);
#define ESP_I2C_TGL digitalWrite(ESP_I2C, !digitalRead(ESP_I2C));

#define SAM_RESET_PIN 13
#define INIT_SAM_RESET_PIN pinMode(SAM_RESET_PIN, OUTPUT);
#define SAM_RESET_EN  digitalWrite(SAM_RESET_PIN, LOW);
#define SAM_RESET_DIS digitalWrite(SAM_RESET_PIN, HIGH);
#define SAM_RESET_TGL digitalWrite(SAM_RESET_PIN, !digitalRead(ESP_I2C));

#define SAM_I2C_READ_IP  26
#define SAM_I2C_READ    digitalRead(SAM_I2C_READ_IP);

#define T6793_ADDRESS 0x15      //T6793 i2C Address   
#define SFA_ADDRESS 0x5D        //SFA30 i2c Address
#define SEN5X_ADDRESS 0x69      //SEN5X i2c Address 
//#define RENESAS_ADDRESS 0x64  //RENESAS i2c Address 
#define PIERA_ADDRESS 0x4B      //PIERA i2c Address   
#define BMP280_ADDRESS 0x76     //BMP280 i2c Address  
// Define AHT10 register addresses
#define AHT10_ADDR 0x38
#define CMD_MEASURE 0xAC
#define CMD_SOFTRESET 0xBA
#define STATUS_BUSY_MASK 0x80

#define SAM_LIVE_CHECK_CNT_INCREMENT_INTERVAL_TIME  1000
#define SENSOR_READING_TIME  3000
#define WIFI_CHECK_TIME      10000
#define EXT_UPDATE_TIME      10000
#define CLOUD_UPDATE_TIME    8000
#define SMOKE_VAPE_INDICATION_TIME    5*60*1000

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

#define TEMP_C_MAX_LIMIT  99
#define TEMP_C_MIN_LIMIT  -99

#define TEMP_F_MAX_LIMIT  210
#define TEMP_F_MIN_LIMIT  -18

#define HUMIDITY_MAX_LIMIT 100
#define HUMIDITY_MIN_LIMIT 0

#define MAXBUF_REQUIREMENT   48

#define MAX_FRAM_SIZE 600
#define LOG_FRAMR_SIZE 80
#define LOG_FRAMR_END_ADDR  120000
#define FRAM_PACK_SIZE_ADDR 120001   //125002
#define FRAM_ADDRESS_ADDR   120003    //125004
#define TZ_OFFSET_MS_ADDR   120005    //125008
#define SAM_RST_CNT_ADDR    120009    //125009

// ------------------- AQI Ranges -------------------
#define AQI_R1_LOW   0
#define AQI_R1_HIGH  50
#define AQI_R2_LOW   51
#define AQI_R2_HIGH  100
#define AQI_R3_LOW   101
#define AQI_R3_HIGH  150
#define AQI_R4_LOW   151
#define AQI_R4_HIGH  200
#define AQI_R5_LOW   201
#define AQI_R5_HIGH  300
#define AQI_R6_LOW   301
#define AQI_R6_HIGH  500

// ------------------- PM2.5 Ranges -------------------
#define PM25_R1_LOW  0.0
#define PM25_R1_HIGH 50.4
#define PM25_R2_LOW  50.5
#define PM25_R2_HIGH 60.4
#define PM25_R3_LOW  60.5
#define PM25_R3_HIGH 75.4
#define PM25_R4_LOW  75.5
#define PM25_R4_HIGH 150.4
#define PM25_R5_LOW  150.5
#define PM25_R5_HIGH 250.4
#define PM25_R6_LOW  250.5
#define PM25_R6_HIGH 500.4

// ------------------- PM10 Ranges -------------------
#define PM10_R1_LOW  0.0
#define PM10_R1_HIGH 75.0
#define PM10_R2_LOW  75.1
#define PM10_R2_HIGH 150.0
#define PM10_R3_LOW  150.1
#define PM10_R3_HIGH 250.0
#define PM10_R4_LOW  250.1
#define PM10_R4_HIGH 350.0
#define PM10_R5_LOW  350.1
#define PM10_R5_HIGH 420.0
#define PM10_R6_LOW  420.1
#define PM10_R6_HIGH 600.0

// ------------------- HCHO Ranges -------------------
#define HCHO_R1_LOW  0.0
#define HCHO_R1_HIGH 30.0
#define HCHO_R2_LOW  30.1
#define HCHO_R2_HIGH 80.0
#define HCHO_R3_LOW  80.1
#define HCHO_R3_HIGH 120.0
#define HCHO_R4_LOW  120.1
#define HCHO_R4_HIGH 200.0
#define HCHO_R5_LOW  200.1
#define HCHO_R5_HIGH 300.0
#define HCHO_R6_LOW  300.1
#define HCHO_R6_HIGH 500.0

// ------------------- VOC Ranges -------------------
#define VOC_R1_LOW   0.0
#define VOC_R1_HIGH  100.0
#define VOC_R2_LOW   100.1
#define VOC_R2_HIGH  200.0
#define VOC_R3_LOW   200.1
#define VOC_R3_HIGH  300.0
#define VOC_R4_LOW   300.1
#define VOC_R4_HIGH  400.0
#define VOC_R5_LOW   400.1
#define VOC_R5_HIGH  450.0
#define VOC_R6_LOW   450.1
#define VOC_R6_HIGH  500.0

// ------------------- NOx Ranges -------------------
#define NOx_R1_LOW   0.0
#define NOx_R1_HIGH  100.0
#define NOx_R2_LOW   100.1
#define NOx_R2_HIGH  200.0
#define NOx_R3_LOW   200.1
#define NOx_R3_HIGH  300.0
#define NOx_R4_LOW   300.1
#define NOx_R4_HIGH  400.0
#define NOx_R5_LOW   400.1
#define NOx_R5_HIGH  450.0
#define NOx_R6_LOW   450.1
#define NOx_R6_HIGH  500.0


#define MAX(a, b) ((a) > (b) ? (a) : (b))

#if (defined(I2C_BUFFER_LENGTH) &&                 \
     (I2C_BUFFER_LENGTH >= MAXBUF_REQUIREMENT)) || \
    (defined(BUFFER_LENGTH) && BUFFER_LENGTH >= MAXBUF_REQUIREMENT)
#define USE_PRODUCT_INFO
#endif

// for bluetooth
#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled! Please run `make menuconfig` to and enable it
#endif
//

const char* hivemq_root_ca PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
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
NTPClient timeClient(ntpUDP);
FRAM32 fram;
BluetoothSerial SerialBT;
AHTxx aht20(AHTXX_ADDRESS_X38, AHT2x_SENSOR); //sensor address, sensor type

// ===================== MQTT Variables =====================
WiFiClientSecure espClientSecure;
PubSubClient mqttClient(espClientSecure);
unsigned long lastMqttPublish = 0;
String deviceId = "";  // Will be set to MAC address in setup()
bool mqttConnected = false;


//MCP794xx rtc1;
//Adafruit_BMP280 bmp; // I2C
///////////////////VARIABLES/////////////////
// You should get Auth Token in the Blynk App.
// Go to the Project Settings (nut icon).
//char auth[] = BLYNK_AUTH_TOKEN;//Paste auth token you copied

char auth[40] ="";
//char template_id[20] ="";
//char template_name[10] ="";

char eep_ssid[32]={0},eep_pass[32]={0};
String prev_ssid = "";
String prev_pass = "";
String bt_data = "";
unsigned int new_ssid_flag=0;
unsigned int new_pass_flag=0;
unsigned int new_wifi_flag=0;


char* token1; char* token2; char* token3; char* token4; char* token5; char* token6; char* token7;
int16_t temp_year=0;
int8_t  temp_month=0;
int8_t  temp_date=0;
int8_t  temp_hour=0;
int8_t  temp_minute=0;
int8_t  temp_second=0;
int32_t  tz_offset_ms=0;
int32_t  prev_tz_offset_ms=0;

unsigned int blynk_begin_flag=0;
unsigned int wifi_status_print_flag=0;
unsigned long wifi_check_base_time=0;
/*************************************/
unsigned int wifi_reconnect_count=0;
unsigned int wifi_auto_disconnect_count=0;
unsigned int wifi_strength_disconnect_count=0;
unsigned int server_no_resp=0;

IpsSensor ips_sensor;
uint32_t pc01=0,pc03=0,pc05=0,pc1=0,pc25=0,pc5=0,pc10=0;
uint32_t pc01_avg=0,pc03_avg=0,pc05_avg=0,pc1_avg=0,pc25_avg=0,pc5_avg=0,pc10_avg=0;
uint32_t pc01_avg_disp=0,pc03_avg_disp=0,pc05_avg_disp=0,pc1_avg_disp=0,pc25_avg_disp=0,pc5_avg_disp,pc10_avg_disp=0;
float pm01=0,pm03=0,pm05=0,pm1=0,pm25=0,pm5=0,pm10=0;
float pm01_avg=0,pm03_avg=0,pm05_avg=0,pm1_avg=0,pm25_avg=0,pm5_avg=0,pm10_avg=0;
float pm01_avg_disp=0,pm03_avg_disp=0,pm05_avg_disp=0,pm1_avg_disp=0,pm25_avg_disp=0,pm5_avg_disp,pm10_avg_disp=0;
float pm01_avg_cld=0,pm03_avg_cld=0,pm05_avg_cld=0,pm1_avg_cld=0,pm25_avg_cld=0,pm5_avg_cld,pm10_avg_cld=0;
uint32_t check_pm25_disp=0;
uint32_t sen_pm25_disp=0;
uint8_t ips_read_flag = 1;//pm sensor
uint16_t event_count=0;
uint16_t event_status=0;
uint16_t event_status_disp=0;
uint16_t event_status_cld=0;

float pm25_avg_aqi=0.0;

uint16_t aqi_add=0;
uint16_t actual_aqi=0; 
uint16_t pm25_actual_aqi=0; 
uint16_t pm10_actual_aqi=0; 
uint16_t voc_actual_aqi=0; 
uint16_t nox_actual_aqi=0; 
uint16_t hcho_actual_aqi=0; 

uint32_t tvoc_disp=0;
float tvoc=0;

//SFA30 HCHO Sensor Variables
uint8_t sfa_i2c_fail_count=0;
float hcho=0; float hcho_disp=0; float hcho_cld=0; float hcho_mavg_arr[8]={0};
uint8_t hcho_data_count = 0; uint8_t sfa_hcho_limit_fail_count=0;

//SFA30 Temperature Sensor Variables
float sfa_temp=0; float sfa_temp_disp=0; float sfa_temp_cld=0; float sfa_temp_mavg_arr[8]={0};
uint8_t sfa_temp_data_count = 0; uint8_t sfa_temp_limit_fail_count=0;

//SFA30 Humidity Sensor Variables
float sfa_humid=0; float sfa_humid_disp=0; float sfa_humid_cld=0; float sfa_humid_mavg_arr[8]={0}; 
uint8_t sfa_humid_data_count = 0; uint8_t sfa_humid_limit_fail_count=0;

//Amphenol CO2 Sensor Variables
int co2_data [4]={0};
uint32_t co2_ppmValue=0; uint32_t co2_disp=0; uint32_t co2_cld=0; uint32_t co2_mavg_arr[8]={0};
uint8_t co2_data_count = 0; uint8_t co2_limit_fail_count=0; 

//SEN5x VOC Sensor Variables
uint32_t vocIndex=0; uint32_t vocIndex_disp=0; uint32_t voc_cld=0; uint32_t voc_mavg_arr[8]={0};
uint8_t voc_data_count = 0; uint8_t voc_limit_fail_count=0;

//SEN5x Nox Sensor Variables
uint32_t noxIndex=0; uint32_t noxIndex_disp=0; uint32_t nox_cld=0; uint32_t nox_mavg_arr[8]={0};
uint8_t nox_data_count = 0; uint8_t nox_limit_fail_count=0;

//SEN5x Nox Sensor Variables
float sen5x_pm10_mvg_avg[8] ={0};
float sen5x_pm10_avg=0;

//SEN5x Humidity Sensor Variables
uint32_t sen_humid=0; uint32_t sen_humid_disp=0; uint32_t sen_humid_cld=0; uint32_t sen_humid_mavg_arr[8]={0};
uint8_t sen_humid_data_count = 0; uint8_t sen_humid_limit_fail_count=0;

//SEN5x Temperature Sensor Variables
uint32_t sen_temp=0; uint32_t sen_temp_disp=0; uint32_t sen_temp_cld=0; uint32_t sen_temp_mavg_arr[8]={0};
uint8_t sen_temp_data_count = 0; uint8_t sen_temp_limit_fail_count=0;

//aht Humidity sensor Variables
float aht_humid=0; float aht_humid_disp=0; float aht_humid_cld=0; float aht_humid_mavg_arr[8]={0};
uint8_t aht_humid_data_count = 0; uint8_t aht_humid_limit_fail_count=0;

//aht Temperature sensor Variables
float aht_temp=0; float aht_temp_disp=0; float aht_temp_cld=0; float aht_temp_mavg_arr[8]={0};
uint8_t aht_temp_data_count = 0; uint8_t aht_temp_limit_fail_count=0;


uint32_t i2c_resp_wait_time=0;
uint8_t i2c_read_complete_flag=0;

uint32_t sensor_read_base_time=0; 
uint32_t main_loop_count_increment_base_time=0; 
uint32_t main_loop_count=0;
uint32_t cloud_update_base_time=0;
uint32_t smoke_vape_indication_base_time=0;

int sam_ip_status;
uint8_t i2c_int_flag=0;
uint8_t cloud_update_flag=0;
uint8_t minute_change_flag=0;
uint8_t esp_update_flag=0;
uint8_t pm_sensor_unit_change_flag=0;
uint8_t bt_received_flag=0;
uint8_t aqi_disp_limit_flag=0;
uint8_t move_avg_limit_flag=0;

boolean sam_data_received = false; 
int a[60] ={0};
int aqi[10] ={0};
int aqi_avg_array[8] ={0};
uint32_t pc01_mvg_avg[8] ={0};
uint32_t pc03_mvg_avg[8] ={0};
uint32_t pc05_mvg_avg[8] ={0};
uint32_t pc1_mvg_avg[8] ={0};
uint32_t pc25_mvg_avg[8] ={0};
uint32_t pc5_mvg_avg[8] ={0};
uint32_t pc10_mvg_avg[8] ={0};
float pm01_mvg_avg[8] ={0};
float pm03_mvg_avg[8] ={0};
float pm05_mvg_avg[8] ={0};
float pm1_mvg_avg[8] ={0};
float pm25_mvg_avg[8] ={0};
float pm5_mvg_avg[8] ={0};
float pm10_mvg_avg[8] ={0};

uint8_t ai=0; // array index

uint8_t ips_i2c_reconnect_flag=0;
uint8_t sen5x_i2c_reconnect_flag=0;
uint8_t sfa_i2c_reconnect_flag=0;
uint8_t aht_i2c_reconnect_flag=0;
uint16_t aht_i2c_read_cnt=0;

char bt_a[60] = {0};
int recv_func_code=0,soc_flag=0,eoc_flag=0,data_len=0,i=0,len=0,j=0,bt_len=0;
int data_rx[50] = {0};
byte log_array[80] ={0};
byte fram_log_array[80] ={0};
uint8_t sam_handshake_ok=0;
int bc=0;
int aqi_a=0;
int aqi_b=0;
int ntp_server_flag=0;
int esp_handshake_flag=0;

uint8_t pm_unit=0; uint8_t new_pm_unit=0;
uint8_t prev_pm_unit=0;
uint8_t temp_unit=0; uint8_t new_temperature_unit=0;
uint8_t blth_status=0;
uint8_t wifi_on_off_status=0;

int8_t nox_Index=0;
int16_t voc_Index=0;

// Variables to save date and time
// String formattedDate;
// String dayStamp;
// String timeStamp;

struct tm timeinfo;

uint8_t ext_rtc_date=0;
uint8_t ext_rtc_month=0;
uint16_t ext_rtc_year=0;
uint8_t ext_rtc_hour=0;
uint8_t ext_rtc_minute=0;
uint8_t ext_rtc_second=0;
uint8_t rtc_time_updated_flag=0;
uint8_t present_minute=0;
uint8_t previous_minute=0;

uint16_t	fram_pack_size=0;
uint16_t fram_address=0;
uint8_t log_date=0;      
uint8_t log_month=0;     
uint16_t log_year=0;  
uint8_t log_hour=0;    
uint8_t log_minute=0; 
uint64_t timestampmillis=0;
uint64_t ts=0;

uint8_t fram_log_date=0;
uint8_t fram_log_month=0;
uint16_t fram_log_year=0;
uint8_t fram_log_hour=0;
uint8_t fram_log_minute=0;
uint8_t fram_sen_temp_cld=0;
uint8_t fram_sen_humid_cld=0;
uint8_t fram_temp_unit=0;
uint8_t fram_pm_unit=0;
uint8_t fram_co2_disp=0;
uint8_t fram_vocIndex_disp=0;
uint8_t fram_noxIndex_disp=0;
uint8_t fram_actual_aqi=0;
uint32_t fram_pc01_avg_disp=0;
uint32_t fram_pc03_avg_disp=0;
uint32_t fram_pc05_avg_disp=0;
uint32_t fram_pc1_avg_disp=0;
uint32_t fram_pc25_avg_disp=0;
uint32_t fram_pc5_avg_disp=0;
uint32_t fram_pc10_avg_disp=0;
float fram_pm01_avg_cld=0.0;
float fram_pm03_avg_cld=0.0;
float fram_pm05_avg_cld=0.0;
float fram_pm1_avg_cld=0.0;
float fram_pm25_avg_cld=0.0;
float fram_pm5_avg_cld=0.0;
float fram_pm10_avg_cld=0.0;
float fram_hcho_cld=0.0;
uint16_t fram_event_status_cld=0;

uint32_t sam_live_check_cnt_inc_basetime=0;
uint32_t sam_live_check_cnt=0;
uint32_t sam_reset_cnt=0;
uint8_t sam_reset_flag=0;
uint8_t i2c_live_check_count=0;
/*******************************/
void wifi_connection_check();
int wifi_connected();
void wifi_disconnected();
void get_ext_rtc_time();  
void smoke_and_vape_tx_to_sam();
void wifi_status_strength();
void error_resp();
void ssid_change_resp();
void password_change_resp();
void ip_address_resp();
void mac_address_resp();
void send_ntp_time();
void ips_sensor_init();
void sen5x_sensor_init();
void sfa_sensor_init();

void read_ips_data();
void read_amphenol_data();
void read_sfa_data();
void read_sen5x_data();
void SEN5x_temp_calc();
void SEN5x_humid_calc();
void SEN5x_nox_calc();
void SEN5x_voc_calc();
void read_AHT10_data();
void AHT2415C_humid_calc(); 
void AHT2415C_temp_calc();
void printStatus();
void check_pm10_value();
void cloud_update();
void error_resp();
void sam_handshake();
void unit_change_resp();
void pm_sensor_unit_change();
void bluetooth_mode_resp();
void bluetooth_data_receive();
void esp_send_data1_to_sam();
void esp_send_data2_to_sam();
void get_sam_data();
void sam_live_check();
void eep_read();
void ips_aqi_calculation();  // from pm2.5
void aqi_calculation(); 
void sensor_data_upload_to_blynk_or_save_in_fram();
void log_data_save_in_fram();
void save_log_array_in_fram();
void fram_data_upload_to_blynk();
void log_data_merge_from_fram_log_array();
void read_fram_log_data_array();
void log_data_split_to_log_array();
void increment_fram_pack_size();
void decrement_fram_pack_size();
void fram_pack_clear();
void past_data_upload_to_blynk();
void tz_offset_values_update();
void read_tz_offset_values();
long long convertToEpoch(uint16_t year, uint8_t month, uint8_t day, uint8_t hour, uint8_t minute);
uint16_t calculate_aqi(uint32_t reading, uint32_t aqi_low, uint32_t aqi_high, float bp_low, float bp_high);
uint16_t calculate_pm25_aqi(float value);
uint16_t calculate_pm10_aqi(float value);
uint16_t calculate_voc_aqi(float value);
uint16_t calculate_nox_aqi(float value);
uint16_t calculate_hcho_aqi(float value);
//void sen_aqi_calculation();
//void read_pres_sensor();

char* split_char(char* token);
uint8_t check_i2c_for(uint8_t address);

// ===================== MQTT Function Declarations =====================
void initMQTT();
void connectMQTT();
void publishSensorData();
void setDateTime();
String createMQTTPayload();
void handleMQTTConnection();
//void update_mqtt_averaging();
//void calculate_mqtt_averages();

/******************************/
//////////////////////////////////////////////////////////////////////////////////////////
SensirionI2CSen5x sen5x;
SensirionI2CSfa3x sfa3x;
//////////////////////////////////////////////////////////////////////////////////////////
void setup()
{
  pinMode(ESP_I2C, OUTPUT);
  pinMode(SAM_I2C_READ_IP, INPUT);
  pinMode(SAM_I2C_READ_IP, INPUT_PULLUP);
  

  ESP_I2C_ON;
  // Initiate USB serial at 115200 baud
  Serial.begin(115200);
  EEPROM.begin(512);
  Serial.println("System initializing ...");

  sam.begin(9600, SERIAL_8N2, 16, 17);       // Pins 16[RX], 17[TX] are assigned to the ESPSerial2 port
  sam.flush();
  eep_read();
  Wire.begin(21, 22);
  Wire.setClock(100000);
  aht20.begin();
  ips_sensor_init();
  sen5x_sensor_init();
  sfa_sensor_init();
  fram_address=fram.read16(FRAM_ADDRESS_ADDR);
  fram_pack_size=fram.read16(FRAM_PACK_SIZE_ADDR);
  sam_reset_cnt=fram.read8(SAM_RST_CNT_ADDR);
  read_tz_offset_values();
  Serial.print("tz_offset_ms:      "); Serial.print(tz_offset_ms); Serial.println(" ms");
  Serial.print("\nfram_pack_size : "); Serial.println(fram_pack_size);
  Serial.print("\nfram_address : "); Serial.println(fram_address);
 /***********************************************************************************************************/                 
  ESP_I2C_OFF;
  Serial.println("ESP32 releases I2C bus!");
  /*******************************************************************/
  WiFi.mode(WIFI_STA);
  // Get MAC address and set as device ID (remove colons)
  deviceId = WiFi.macAddress();
  deviceId.replace(":", "");  // Remove colons: "AA:BB:CC:DD:EE:FF" -> "AABBCCDDEEFF"
  Serial.print("ESP Board MAC Address:  "); Serial.println(WiFi.macAddress());
  Serial.print("Device ID: "); Serial.println(deviceId);
  // Initialize MQTT
  initMQTT();
  /*******************************************************************/
  delay(1000);
  // module is not outputing HCHO for the first 10 s after powering up
  Serial.println("System Begin...");
}
unsigned long currentMillis = 0;
void loop() 
{ 
  if((currentMillis - main_loop_count_increment_base_time) >= 1000)
  {
    main_loop_count_increment_base_time=millis();
    main_loop_count++;
    //main_loop_count>4294967290
    if (main_loop_count>0XFFFFFFFA) {main_loop_count=1;}
     Serial.print("\nmain_loop_count     : "); Serial.println(main_loop_count);
  }
  // put your main code here, to run repeatedly:
  // Run Blynk
  if(WiFi.status()== WL_CONNECTED) { Blynk.run(); } 
  currentMillis = millis();

  present_minute=ext_rtc_minute;

  tz_offset_values_update(); 

  get_sam_data();

  sam_live_check();

  if(pm_sensor_unit_change_flag==1) { pm_sensor_unit_change(); }

  if(((currentMillis - wifi_check_base_time) >= WIFI_CHECK_TIME)||((new_ssid_flag==1)&&(new_pass_flag==1)))  
  {
    wifi_connection_check(); wifi_check_base_time=millis();   
  }
  handleMQTTConnection();
  if((currentMillis - sensor_read_base_time) >= SENSOR_READING_TIME)
  {
    sam_ip_status=digitalRead(SAM_I2C_READ_IP);
    Serial.print("\nsam_I2Cip_status     : "); Serial.println(sam_ip_status);
    if (i2c_live_check_count>=20) { sam_reset_flag=1; i2c_live_check_count=0; }
    if (sam_ip_status==HIGH) { i2c_live_check_count++; } 
    if (sam_ip_status==LOW)
    {
      uint8_t temp_i2c_nolive_check_count=0;
      Serial.println("read_sensor_data");
      ESP_I2C_ON;
      if(check_i2c_for(PIERA_ADDRESS))  { read_ips_data(); }   
      else {ips_i2c_reconnect_flag=1; temp_i2c_nolive_check_count++; }
      if(check_i2c_for(SFA_ADDRESS))    { read_sfa_data(); }
      else {sfa_i2c_reconnect_flag=1; temp_i2c_nolive_check_count++; }  
      if(check_i2c_for(SEN5X_ADDRESS))  { read_sen5x_data(); }
      else {sen5x_i2c_reconnect_flag=1; temp_i2c_nolive_check_count++;} 
      if(check_i2c_for(T6793_ADDRESS))  { read_amphenol_data(); } //There is no Initiaisation routine for amphenol sensor
      else { temp_i2c_nolive_check_count++; }
      aht_i2c_read_cnt++;
      if (aht_i2c_read_cnt<5)     {                     if(check_i2c_for(AHT10_ADDR))  { read_AHT10_data(); }  else { aht_i2c_reconnect_flag=1; temp_i2c_nolive_check_count++; }   }
      if (aht_i2c_read_cnt>10)    { aht_i2c_read_cnt=5; if(check_i2c_for(AHT10_ADDR))  { read_AHT10_data(); }  else { aht_i2c_reconnect_flag=1; temp_i2c_nolive_check_count++; }   }
      
      ESP_I2C_OFF;
      check_pm10_value();  
      aqi_calculation(); 
      if(temp_i2c_nolive_check_count==4){ i2c_live_check_count++;}
      else {i2c_live_check_count=0;}
      /******************** DEBUG PRINT ************************/
      // Serial.print("\nfram_pack_size : "); Serial.println(fram_pack_size);
      // Serial.print("\nfram_address   : "); Serial.println(fram_address);
      Serial.print("\nEVENT_STATUS     : "); Serial.println(event_status);
      Serial.print("\nEVENT_STATUS_disp: "); Serial.println(event_status_disp);
      Serial.print("\nevent_status_cld : "); Serial.print(event_status_cld); 
      if (event_count!=0) {Serial.print("\nEVENT_CNT        : "); Serial.println(event_count); }     
      Serial.print("\n SAM RESET CNT   : "); Serial.println(sam_reset_cnt); 
      Serial.print("\n SAM LIVE CNT    : "); Serial.print(sam_live_check_cnt); Serial.println("/60");

      /********************************************************/  
    }
    sensor_read_base_time=millis();   
  }
  sensor_data_upload_to_blynk_or_save_in_fram();

  if(blth_status==1)  {  bluetooth_data_receive();  }       // auth token receive via bluetooth
  /***********************************************************************/  
}

///////////////////////////////////////////////////////////// GET_SAM_DATA /////////////////////////////////////////////////////////////
  void get_sam_data()
  {
    i=0;
    while (sam.available())
    {
      if (i==0){delay(100);}
      a[i] = (int)sam.read();
   //   Serial.print("a[");Serial.print(i);Serial.print("] :");Serial.println(a[i]);
      i++;
    }
    
    if (i>=1)                  { if(a[0]==0xAA)           {soc_flag=1;} else {soc_flag=2;}}
    if (i>=2)                  { data_len=a[1];}
    if (i>=3)                  { recv_func_code=a[2];}
    if ((i>=3)&&(i>=data_len)) { if(a[data_len-1]==0xBB)  {eoc_flag=1;} else {eoc_flag=2;}}
    
    if ((soc_flag==1) && (eoc_flag==1))
    {
      for(int i=3;i<data_len;i++) { data_rx[i-3]=a[i];len++; }
      for(int i=0;i<60;i++){a[i]=0;}
      sam_data_received = true;
      sam_live_check_cnt=0;
//      Serial.print("data_len");Serial.println(data_len);
//      for(int i=0;i<(data_len-4);i++) { Serial.print("Data[");Serial.print(i);Serial.print("] :");Serial.println(data_rx[i]);}
      soc_flag=0; eoc_flag=0; data_len=0; 
    }
            
    if (soc_flag==2) {error_resp();Serial.println("SOC Failed"); soc_flag=0; data_len=0;}
    if (eoc_flag==2) {error_resp();Serial.println("EOC Failed"); eoc_flag=0; data_len=0;}
    
    if (sam_data_received == true)
    {
      if (recv_func_code==6)        {  sam_handshake();           } 
      else if (recv_func_code==2)   {  ssid_change_resp();        } // ssid
      else if (recv_func_code==3)   {  password_change_resp();    } // password
      else if (recv_func_code==4)   {  unit_change_resp();        }
      else if (recv_func_code==5)   {  bluetooth_mode_resp();     }
      else if (recv_func_code==8)   {  wifi_status_strength();    } // wifi status & strength 
      else if (recv_func_code==9)   {  send_ntp_time();           } // instead of ntp blynk tz used
      else if (recv_func_code==10)  {  ip_address_resp();         } // ip address
      else if (recv_func_code==11)  {  mac_address_resp();        } // mac address
      else if (recv_func_code==12)  {  esp_send_data1_to_sam();   } // sensor data1 
      else if (recv_func_code==13)  {  esp_send_data2_to_sam();   } // sensor data1
      else if (recv_func_code==14)  {  wifi_disconnected();       } // Wi-fi connect & disconnect from hmi 
      else if (recv_func_code==15)  {  get_ext_rtc_time();        } // to get external rtc time from SAM controller. 
      else if (recv_func_code==16)  {  smoke_and_vape_tx_to_sam();} // to send smoke and vape detect to SAM controller. 
      else if (recv_func_code==18)  {  reset_sam(); } // to reset SAM controller.
      sam_data_received = false;    
      for(int i=0;i<50;i++){data_rx[i]=0;}
      len=0;   
    }
  }
///////////////////////////////////////////////////////////// ESP_SEND_DATA_TO_SAM /////////////////////////////////////////////////////////////
  void esp_send_data1_to_sam() // DATA 1
  {
    sam.write(SOC);             sam.write(18);                sam.write(recv_func_code);       sam.write((int)aht_temp_disp);  sam.write((int)aht_humid_disp); 
    sam.write((int)hcho_disp ); sam.write((int)hcho_disp>>8);      sam.write((int)hcho_disp>>16);        sam.write((int)hcho_disp>>24);     sam.write(co2_disp);   
    sam.write(co2_disp>>8);     sam.write(vocIndex_disp);        sam.write(vocIndex_disp>>8);     sam.write(noxIndex_disp);   sam.write(noxIndex_disp>>8);   sam.write(sen_pm25_disp); 
    sam.write(sen_pm25_disp>>8);              sam.write(EOC);
  }
  void esp_send_data2_to_sam() // DATA 2
  {
    pc01_avg_disp=0; pc01_avg_disp=(new_pm_unit|(new_temperature_unit<<8));
    sam.write(SOC);          sam.write(62);            sam.write(recv_func_code);  sam.write(pc01_avg_disp );  sam.write(pc01_avg_disp>>8); sam.write(pc01_avg_disp>>16);  sam.write(pc01_avg_disp>>24);  sam.write(pc03_avg_disp );
    sam.write(pc03_avg_disp>>8);  sam.write(pc03_avg_disp>>16);  sam.write(pc03_avg_disp>>24);    sam.write(pc05_avg_disp );  sam.write(pc05_avg_disp>>8); sam.write(pc05_avg_disp>>16);  sam.write(pc05_avg_disp>>24);  sam.write(pc1_avg_disp );
    sam.write(pc1_avg_disp>>8);   sam.write(pc1_avg_disp>>16);   sam.write(pc1_avg_disp>>24);     sam.write(pc25_avg_disp );  sam.write(pc25_avg_disp>>8); sam.write(pc25_avg_disp>>16);  sam.write(pc25_avg_disp>>24);  sam.write(pc5_avg_disp );
    sam.write(pc5_avg_disp>>8);   sam.write(pc5_avg_disp>>16);   sam.write(pc5_avg_disp>>24);     sam.write(pc10_avg_disp );  sam.write(pc10_avg_disp>>8); sam.write(pc10_avg_disp>>16);  sam.write(pc10_avg_disp>>24);  sam.write((int)pm01_avg_disp );
    sam.write((int)pm01_avg_disp>>8); sam.write((int)pm01_avg_disp>>16); sam.write((int)pm01_avg_disp>>24);   sam.write((int)pm03_avg_disp ); sam.write((int)pm03_avg_disp>>8);sam.write((int)pm03_avg_disp>>16); sam.write((int)pm03_avg_disp>>24); sam.write((int)pm05_avg_disp );
    sam.write((int)pm05_avg_disp>>8); sam.write((int)pm05_avg_disp>>16); sam.write((int)pm05_avg_disp>>24);   sam.write((int)pm1_avg_disp );  sam.write((int)pm1_avg_disp>>8); sam.write((int)pm1_avg_disp>>16);  sam.write((int)pm1_avg_disp>>24);  sam.write((int)pm25_avg_disp );
    sam.write((int)pm25_avg_disp>>8); sam.write((int)pm25_avg_disp>>16); sam.write((int)pm25_avg_disp>>24);   sam.write((int)pm5_avg_disp );  sam.write((int)pm5_avg_disp>>8); sam.write((int)pm5_avg_disp>>16);  sam.write((int)pm5_avg_disp>>24);  sam.write((int)pm10_avg_disp );
    sam.write((int)pm10_avg_disp>>8); sam.write((int)pm10_avg_disp>>16); sam.write((int)pm10_avg_disp>>24);   sam.write(actual_aqi );  sam.write(actual_aqi>>8); sam.write(EOC);
  }    
  ///////////////////////////////////////////////////////////// WIFI-STATUS CHECK /////////////////////////////////////////////////////////////
int wifi_connected()
{
  if(WiFi.status()== WL_CONNECTED) { return (1); } 
  else { return (0); }
}
///////////////////////////////////////////////////////////// ERROR_CODE RESPONSE /////////////////////////////////////////////////////////////
void error_resp()
{
  sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);     sam.write(recv_func_code);    sam.write(UNSUCCESS_STATUS);       sam.write(EOC);
  Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);  Serial.print(recv_func_code); Serial.print(UNSUCCESS_STATUS);   Serial.println(EOC);
}
///////////////////////////////////////////////////////////// SENSOR UNIT CHANGE //////////////////////////////////////////////////////////
void unit_change_resp()
{
  pm_unit=data_rx[0];
  temp_unit=data_rx[1];
  if(prev_pm_unit!=pm_unit)
  {
    prev_pm_unit=pm_unit;
    pm_sensor_unit_change_flag=1;  
  }
  EEPROM.write(PM_UNIT_EEP_START_ADDR, pm_unit);
  EEPROM.write(TEMP_UNIT_EEP_START_ADDR, temp_unit);
  EEPROM.commit();
  sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);     sam.write(recv_func_code);    sam.write(SUCCESS_STATUS);       sam.write(EOC);
  Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);  Serial.print(recv_func_code); Serial.print(SUCCESS_STATUS);   Serial.println(EOC);
   Serial.println("\nget unit change response from sam");
}

void pm_sensor_unit_change()
{
  sam_ip_status=digitalRead(SAM_I2C_READ_IP);
  if (sam_ip_status==LOW)
  {
      ESP_I2C_ON;
      Serial.println("IPS Sensor unit changing......");
      Wire.beginTransmission(PIERA_ADDRESS);
      Wire.write(0x24); // Data Unit Setting Command 
      if(pm_unit==0)      { Wire.write(0x01); }//  0x00=[Counts/L & ug/m3]    0x01=[Counts/ft3 & ug/ft3]   0x02=[Counts/m3 & ug/m3]   0x03=[Counts/L & ug/L]
      else if(pm_unit==1) { Wire.write(0x02); }
      Wire.endTransmission();
      if(pm_unit==0)      { Serial.println("---CURRENT PM UNIT IS ft3----");}//  0x00=[Counts/L & ug/m3]    0x01=[Counts/ft3 & ug/ft3]   0x02=[Counts/m3 & ug/m3]   0x03=[Counts/L & ug/L]
      else if(pm_unit==1) { Serial.println("---CURRENT PM UNIT IS m3----");}
      Serial.println("--------IPS Sensor unit changed successfully--------");
      ESP_I2C_OFF;
      pm_sensor_unit_change_flag=0; 
      for (ai=1; ai<=4; ai++) 
      { pc01_mvg_avg[ai] = 0; pc03_mvg_avg[ai] = 0; pc05_mvg_avg[ai] = 0; pc1_mvg_avg[ai] = 0; pc25_mvg_avg[ai] = 0; 
      pc5_mvg_avg[ai] = 0; pc10_mvg_avg[ai] = 0;  
      pm01_mvg_avg[ai] = 0; pm03_mvg_avg[ai] = 0; pm05_mvg_avg[ai] = 0; pm1_mvg_avg[ai] = 0; pm25_mvg_avg[ai] = 0; 
      pm5_mvg_avg[ai] = 0; pm10_mvg_avg[ai] = 0;  }

      pc01=0; pc03=0; pc05=0; pc1=0; pc25=0; pc5=0; pc10=0;
      pc01_avg=0; pc03_avg=0; pc05_avg=0; pc1_avg=0; pc25_avg=0; pc5_avg=0; pc10_avg=0;
      pc01_avg_disp=0; pc03_avg_disp=0; pc05_avg_disp=0; pc1_avg_disp=0; pc25_avg_disp=0; pc5_avg_disp; pc10_avg_disp=0;

      pm01=0; pm03=0; pm05=0; pm1=0; pm25=0; pm5=0; pm10=0;
      pm01_avg=0; pm03_avg=0; pm05_avg=0; pm1_avg=0; pm25_avg=0; pm5_avg=0; pm10_avg=0;
      pm01_avg_disp=0; pm03_avg_disp=0; pm05_avg_disp=0; pm1_avg_disp=0; pm25_avg_disp=0; pm5_avg_disp; pm10_avg_disp=0;

      new_pm_unit=pm_unit;
  } 
}
///////////////////////////////////////////////////////////// WIFI-DISCONNECT /////////////////////////////////////////////////////////////
void wifi_disconnected()
{
  wifi_on_off_status=data_rx[0];
  // Serial.print("wifi_status :");Serial.println(wifi_status);
  if(wifi_on_off_status==0)
  {
    WiFi.disconnect(true);
    Serial.println("----succesfully wifi disconnected");
    sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);     sam.write(recv_func_code);    sam.write(0);       sam.write(EOC);
    Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);  Serial.print(recv_func_code); Serial.print(0);   Serial.println(EOC);
  }
  else if(wifi_on_off_status==1)
  {
    sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);     sam.write(recv_func_code);    sam.write(1);       sam.write(EOC);
    Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);  Serial.print(recv_func_code); Serial.print(1);   Serial.println(EOC);
    // WiFi.begin(eep_ssid, eep_pass);
    // Blynk.config(auth,"blynk.cloud", 80);//[70854] Connecting to blynk.cloud:80 
    // Blynk.connect();
    Serial.println("---- wifi gets ON");
  }
  //  else{    sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);     sam.write(recv_func_code);    sam.write(UNSUCCESS_STATUS);       sam.write(EOC);    }
}
///////////////////////////////////////////////////////////// WIFI-DISCONNECT /////////////////////////////////////////////////////////////
void get_ext_rtc_time()
{
  uint8_t got_time_flag=0XFF;
  got_time_flag=data_rx[0];
  if(got_time_flag==1)
  {
    ext_rtc_second=data_rx[1];
    ext_rtc_minute=data_rx[2];
    ext_rtc_hour=data_rx[3];
    ext_rtc_date=data_rx[4];
    ext_rtc_month=data_rx[5];
    ext_rtc_year=((data_rx[7]<<8)|data_rx[6]);
    rtc_time_updated_flag=1;
    got_time_flag=0;
    Serial.println("\n Got ext-rtc time from SAM : ");
    Serial.print("Date:");  Serial.print(ext_rtc_date); Serial.print("-"); Serial.print(ext_rtc_month); Serial.print("-"); Serial.println(ext_rtc_year);
    Serial.print("Time:");  Serial.print(ext_rtc_hour); Serial.print("-"); Serial.print(ext_rtc_minute); Serial.print("-"); Serial.println(ext_rtc_second);
    sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);     sam.write(recv_func_code);    sam.write(1);       sam.write(EOC);
    Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);  Serial.print(recv_func_code); Serial.print(1);   Serial.println(EOC);
  }
  else if(got_time_flag==0)
  {
    //rtc_time_updated_flag=0;
    sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);     sam.write(recv_func_code);    sam.write(1);       sam.write(EOC);
    Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);  Serial.print(recv_func_code); Serial.print(1);   Serial.println(EOC);
  }
}
void smoke_and_vape_tx_to_sam()
{
  sam.write(SOC);     sam.write(6);     sam.write(recv_func_code);    sam.write(event_status_disp);     sam.write(event_status_disp>>8); sam.write(EOC);
  Serial.print(SOC);  Serial.print(6);  Serial.print(recv_func_code); Serial.print(event_status_disp); sam.write(event_status_disp>>8);  Serial.println(EOC);
  event_status_disp=0;
}
///////////////////////////////////////////////////////////// BLUETOOTH MODE RESPONSE //////////////////////////////////////////////////////////
void bluetooth_mode_resp()
{
  blth_status=data_rx[0];
  Serial.print("blth_status :");Serial.println(blth_status);
  if(blth_status==1)
  {
    SerialBT.begin("ROSAIQ"); //Bluetooth device name
    Serial.println("The device started, now you can pair it with bluetooth!");
  }
  else if(blth_status==0){SerialBT.disconnect();}
  sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);     sam.write(recv_func_code);    sam.write(SUCCESS_STATUS);       sam.write(EOC);
  Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);  Serial.print(recv_func_code); Serial.print(SUCCESS_STATUS);   Serial.println(EOC);
  Serial.println("\nbluetooth response from sam");  
}

///////////////////////////////////////////////////////////// BLUETOOTH DATA RECEIVE //////////////////////////////////////////////////////////
void bluetooth_data_receive()
{
  while (SerialBT.available())
  {             
    if (j==0){delay(100);}
    bt_a[j] = (char)SerialBT.read();
 //   SerialBT.print("bt_a[");SerialBT.print(j);SerialBT.print("] :");SerialBT.println(bt_a[j]);
    j++;
    bt_received_flag=1;
  }
  if(bt_received_flag==1)
  {
    bt_len=j;
    j=0;
    bt_received_flag=0;
    if ((bt_a[0]=='{')&&(bt_len>=5)) //recieved data should contain atleast {"":}
    {
      char* temp_bt_a = bt_a;
      char* token1; char* token2; char* token3; char* token4;
      token1=strtok(temp_bt_a,":");
      if(strcmp(token1,"{\"AUTH TOKEN\"")==0) // {"AUTH TOKEN":"gfcytdkhHfdzsSEEgffdyrddf"}
      {
        token2=strtok(NULL,"}");
        split_char(token2);
        for(int i=0;i<40;i++){auth[i]='\0';}
        strcpy(auth,token2);
        SerialBT.print("AUTH TOKEN : ");  SerialBT.println(auth);
        Serial.print("EEPROM WRITE AUTH TOKEN :");
        for(int i=0;i<40;i++){EEPROM.write(i+AUTH_EEP_START_ADDR, auth[i]);Serial.print(auth[i]);}
        EEPROM.commit();
      }
      else { SerialBT.println("INVALID COMMAND");}
    }
    else { SerialBT.println("INVALID FRAME FORMAT");}  
  }   
}
///////////////////////////////////////////////////////////// IP_ADDRESS_RESPONSE-10 //////////////////////////////////////////////////////////
void ip_address_resp()
{
  String ip_address = WiFi.localIP().toString();
  // Length (with one extra character for the null terminator)
  int str_len = ip_address.length()+1; 
  // Prepare the character array (the buffer) 
  char char_array[str_len];
  
  // Copy it over 
  ip_address.toCharArray(char_array, str_len);
  Serial.print("IP ADDRESS:");
  for(int i=0;i<str_len;i++){Serial.print(char_array[i]);}
  Serial.println();
  int ip_length=str_len-1;
  ip_length=ip_length+4;
  
  sam.write(SOC);     sam.write(ip_length);     sam.write(recv_func_code);
  for(int i=0;i<str_len-1;i++){sam.write(char_array[i]);}
  sam.write(EOC);
  
  Serial.print(SOC);  Serial.print(ip_length);  Serial.print(recv_func_code); 
  for(int i=0;i<str_len;i++){Serial.print(char_array[i]);}
  Serial.println(EOC);
}
///////////////////////////////////////////////////////////// MAC_ADDRESS_RESPONSE-11 /////////////////////////////////////////////////////////////
void mac_address_resp()
{
  String mac_address = WiFi.macAddress();
  // Length (with one extra character for the null terminator)
  int str_len = mac_address.length()+1; 
  
  // Prepare the character array (the buffer) 
  char char_array[str_len];
  
  // Copy it over 
  mac_address.toCharArray(char_array, str_len);
  Serial.print("MAC ADDRESS:");
  for(int i=0;i<str_len;i++){Serial.print(char_array[i]);}
  Serial.println();
  int mac_length=str_len-1;
  mac_length=mac_length+4;
  
  sam.write(SOC);     sam.write(mac_length);     sam.write(recv_func_code);    
  for(int i=0;i<str_len-1;i++){sam.write(char_array[i]);}
  sam.write(EOC); 
       
  Serial.print(SOC);  Serial.print(mac_length);  Serial.print(recv_func_code);
  for(int i=0;i<str_len;i++){Serial.print(char_array[i]);} 
  Serial.println(EOC);
}
  
///////////////////////////////////////////////////////////// HAND_SHAKE_RESPONSE /////////////////////////////////////////////////////////////
void sam_handshake()
{
  sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);       sam.write(6);    sam.write(SUCCESS_STATUS);     sam.write(EOC);
  Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);    Serial.print(6); Serial.print(SUCCESS_STATUS);  Serial.println(EOC);  
  Serial.println("\n\t\t handshake okay\n\n");
}

///////////////////////////////////////////////////////////// SSID_CHANGE_RESPONSE /////////////////////////////////////////////////////////////
void ssid_change_resp()
{
  String ss="";
  for(int i=0;i<len-1;i++){ss=ss+(char)data_rx[i];}
  if(prev_ssid != ss)
  {
    if(ss != "")
    {
      prev_ssid = ss;
      for(int i=0;i<32;i++){eep_ssid[i]='\0';}
      // Length (with one extra character for the null terminator)
      int str_len = ss.length()+1; 
      
      // Prepare the character array (the buffer) 
      char char_array[str_len];
    
      // Copy it over 
      ss.toCharArray(char_array, str_len);
      //Serial.print("EEPROM WRITE SSID :");
      //for(int i=0;i<str_len;i++){EEPROM.write(i, char_array[i]);Serial.print(char_array[i]);}
      //EEPROM.commit();
      Serial.print("NEW SSID :");
      for(int i=0;i<str_len-1;i++){eep_ssid[i]=char_array[i];Serial.print(eep_ssid[i]);}
      Serial.println();
      new_ssid_flag=1;
      sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);       sam.write(recv_func_code);    sam.write(SUCCESS_STATUS);     sam.write(EOC);
      Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);    Serial.print(recv_func_code); Serial.print(SUCCESS_STATUS);  Serial.println(EOC);
    }
    else
    {
      Serial.println("NO SSID");
      sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);       sam.write(recv_func_code);    sam.write(SUCCESS_STATUS);     sam.write(EOC);
      Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);    Serial.print(recv_func_code); Serial.print(SUCCESS_STATUS);  Serial.println(EOC);
    }
  }
  else
  {
    Serial.print("SAME SSID");
    sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);       sam.write(recv_func_code);    sam.write(SUCCESS_STATUS);     sam.write(EOC);
    Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);    Serial.print(recv_func_code); Serial.print(SUCCESS_STATUS);  Serial.println(EOC);
  }
}
///////////////////////////////////////////////////////////// PASSWORD_CHANGE_RESPONSE /////////////////////////////////////////////////////////////
void password_change_resp()
{ 
  String ps="";
  for(int i=0;i<len-1;i++){ps=ps+(char)data_rx[i];}
  if (prev_pass != ps)
  {
    if (ps != "")
    {
      prev_pass = ps;
      for(int i=0;i<32;i++){eep_pass[i]='\0';}
      // Length (with one extra character for the null terminator)
      int str_len = ps.length()+1; 
      
      // Prepare the character array (the buffer) 
      char char_array[str_len];
      
      // Copy it over 
      ps.toCharArray(char_array, str_len);
      //Serial.print("EEPROM WRITE PASSWORD :");
      //for(int i=0;i<str_len;i++){EEPROM.write(i+33, char_array[i]);Serial.print(char_array[i]);}
      //EEPROM.commit();
      Serial.print("NEW PASSWORD :");
      for(int i=0;i<str_len-1;i++){eep_pass[i]=char_array[i];Serial.print(eep_pass[i]);}
      Serial.println();
      new_pass_flag=1;
      sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);       sam.write(recv_func_code);    sam.write(SUCCESS_STATUS);     sam.write(EOC);
      Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);    Serial.print(recv_func_code); Serial.print(SUCCESS_STATUS);  Serial.println(EOC);
    }
    else
    {
      Serial.println("NO PASSWORD");
      sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);       sam.write(recv_func_code);    sam.write(SUCCESS_STATUS);     sam.write(EOC);
      Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);    Serial.print(recv_func_code); Serial.print(SUCCESS_STATUS);  Serial.println(EOC);
    }
  }
  else
  {
    Serial.println("SAME PASSWORD");
    sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);       sam.write(recv_func_code);    sam.write(SUCCESS_STATUS);     sam.write(EOC);
    Serial.print(SOC);  Serial.print(DEFAULT_RESPONSE_LENGTH);    Serial.print(recv_func_code); Serial.print(SUCCESS_STATUS);  Serial.println(EOC);
  }
  
}
///////////////////////////////////////////////// WIFI-STATUS & SIGNAL STRENGTH CHECK //////////////////////////////////////////////////////
void wifi_status_strength()
{
  float b=0;
  int a=0;  int wifi_status=0; int wifi_strength=0;
  if(wifi_connected()) 
  {
   wifi_status=1; Serial.println("\nWIFI STATUS: CONNECTED");
   a=WiFi.RSSI(); Serial.print("SIGNAL STRENGTH: ");  Serial.print(a);  Serial.print(" dB");//-30dB/-25dB(good/high) to -90dB(bad/poor) 
   a=a+90;                //to get the corresponding positive value  
   b=(((float)a/60)*100); //convert to percentage 
   if(b<=5){b=5;}
   else if(b>=100){b=100;}
   wifi_strength=(int)b;  Serial.print(" || ");  Serial.print(wifi_strength);Serial.println("%");
  }  
  else { wifi_status=0;Serial.println("\nWIFI STATUS: DISCONNECTED");wifi_strength=0; }
  sam.write(SOC);     sam.write(9);     sam.write(recv_func_code);    sam.write(wifi_status);    sam.write(wifi_strength);    sam.write(wifi_auto_disconnect_count);    sam.write(wifi_strength_disconnect_count);    sam.write(wifi_reconnect_count);    sam.write(EOC);
  Serial.print(SOC);  Serial.print(9);  Serial.print(recv_func_code); Serial.print(wifi_status); Serial.print(wifi_strength); Serial.print(wifi_auto_disconnect_count); Serial.print(wifi_strength_disconnect_count); Serial.print(wifi_reconnect_count); Serial.println(EOC);
  wifi_auto_disconnect_count=0;
  wifi_strength_disconnect_count=0;
  wifi_reconnect_count=0; 
}
///////////////////////////////////////////////////////////// WIFI_CONNECTION_CHECKING ///////////////////////////////////////////////////////////////////
void wifi_connection_check()
{
  if ((new_ssid_flag==1)&&(new_pass_flag==1))
  {
    //eep_ssid_pass_read();
    WiFi.disconnect(true);Serial.println("WiFi Disconnected"); delay(500);Serial.println("Connecting to New Network...");
    //WiFi.begin(eep_ssid, eep_pass);
    new_ssid_flag=0;    new_pass_flag=0;
    new_wifi_flag=1;
  }
  if (wifi_connected()) 
  { 
    if (wifi_status_print_flag==0)
    { 
      wifi_status_print_flag=1;
      Serial.print("Connected to WiFi network with IP Address: "); Serial.println(WiFi.localIP());
      Serial.print("ESP Board MAC Address:  "); Serial.println(WiFi.macAddress());
      //init and get the NETWORK time & update INT-RTC
      // configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
      
      new_wifi_flag=0;
      if(blynk_begin_flag==0)
      {
        blynk_begin_flag=1; 
        if(auth[0]!=0)
        { 
          Serial.print("auth:"); Serial.println(auth); 
          Blynk.config(auth,"blynk.cloud", 80);//[70854] Connecting to blynk.cloud:80 
          Blynk.connect();     
        }
      }
    } 
  }
  else if(wifi_on_off_status==1)  //WIFI NOT CONNECTED BUT WIFI IS ON
  {
    if (new_wifi_flag==0)
    {
      if (wifi_status_print_flag==1){ wifi_status_print_flag=0; wifi_auto_disconnect_count++; Serial.println("WiFi Disconnected");}
      WiFi.disconnect(true);
      delay(1000);
      Serial.println("Reconnecting");
    }
    else if (new_wifi_flag==1)    {Serial.println("Connecting");}
    Serial.println("Wifi_Begin Initiated");
    WiFi.begin(eep_ssid, eep_pass);
    blynk_begin_flag=0;
    wifi_reconnect_count++; 
  }
}
void send_ntp_time()
{
 // Blynk.begin(auth, eep_ssid, eep_pass);
  if(temp_date!=0)
  {
    sam.write(SOC);sam.write(11);sam.write(recv_func_code);sam.write(SUCCESS_STATUS);
    sam.write((temp_year%2000));sam.write(temp_month);sam.write(temp_date);sam.write(temp_hour);sam.write(temp_minute);sam.write(temp_second);sam.write(EOC);
    Serial.print(SOC); Serial.print(11); Serial.print(recv_func_code);Serial.print(SUCCESS_STATUS); Serial.print(temp_year); Serial.print(temp_month); Serial.print(temp_date); 
    Serial.print(temp_hour); Serial.print(temp_minute); Serial.print(temp_second); 
  }
  else
  {
    sam.write(SOC);     sam.write(DEFAULT_RESPONSE_LENGTH);     sam.write(recv_func_code);    sam.write(UNSUCCESS_STATUS);       sam.write(EOC);
    Serial.print(SOC); Serial.print(DEFAULT_RESPONSE_LENGTH); Serial.print(recv_func_code); Serial.print(UNSUCCESS_STATUS); Serial.print(EOC);
  }
}
/////////////////////////////////////////////////////////// IPS SENSOR INIT///////////////////////////////////////////////////////
void ips_sensor_init()
{
  /***************************************PM Sensor Initialization ************************************************/
  ips_sensor.begin(Wire);
  Serial.println("Warming up IPS Sensor...");
  Wire.beginTransmission(PIERA_ADDRESS);
  Wire.write(0x24); // Data Unit Setting Command 
  if(pm_unit==0)      { Wire.write(0x01); }//  0x00=[Counts/L & ug/m3]    0x01=[Counts/ft3 & ug/ft3]   0x02=[Counts/m3 & ug/m3]   0x03=[Counts/L & ug/L]
  else if(pm_unit==1) { Wire.write(0x02); }
  Wire.endTransmission();
  delay(1000);
  if(pm_unit==0)      { Serial.println("---CURRENT PM UNIT IS ft3----");}//  0x00=[Counts/L & ug/m3]    0x01=[Counts/ft3 & ug/ft3]   0x02=[Counts/m3 & ug/m3]   0x03=[Counts/L & ug/L]
  else if(pm_unit==1) { Serial.println("---CURRENT PM UNIT IS m3----");}
  delay(100);
}

void sen5x_sensor_init()
{
  /**************************************sen5x sensor initialization***********************/
  Serial.println("Warming up Sen5x Sensor...");
  sen5x.begin(Wire);
  uint16_t error=0;
  char errorMessage[256];
  error = sen5x.deviceReset();
  if (error) {  Serial.print("Error trying to execute deviceReset(): ");  errorToString(error, errorMessage, 256);  Serial.println(errorMessage);  }
  // Start Measurement
  error = sen5x.startMeasurement();
  if (error) {  Serial.print("Error trying to execute startMeasurement(): ");   errorToString(error, errorMessage, 256);    Serial.println(errorMessage);  }
  Serial.println("");
  delay(100);
}

void sfa_sensor_init()
{
  /***************************************SFA Sensor Initialization ************************************************/
  // start SFA measurement in periodic mode, will update every 0.5 s
  Serial.println("Warming up SFA Sensor....");
  Wire.beginTransmission(SFA_ADDRESS);
  Wire.write(0x00);
  Wire.write(0x06);
  Wire.endTransmission();
  delay(100);
//    uint16_t error=0;
//    char errorMessage[256];
//    sfa3x.begin(Wire);
//    // Start Measurement
//    error = sfa3x.startContinuousMeasurement();
//    if (error) {
//        Serial.print("Error trying to execute startContinuousMeasurement(): ");
//        errorToString(error, errorMessage, 256);
//        Serial.println(errorMessage);
//    }
}

/////////////////////////////////////////////////////////// IPS SENSOR ///////////////////////////////////////////////////////
void read_ips_data()
{ 
  if(ips_i2c_reconnect_flag==0)
  { 
    uint32_t uint32_temp_add=0; float float_temp_add=0;
    ips_sensor.update(); 
    pc01 = ips_sensor.getPC01(); 
    //if(pc01>0)  && (pc01<100)
    {
      uint32_temp_add = 0;
      for (ai=1; ai<4; ai++) { pc01_mvg_avg[ai] = pc01_mvg_avg[ai+1]; } pc01_mvg_avg[4]=pc01;
      for (ai=1; ai<=4; ai++) { uint32_temp_add = uint32_temp_add + pc01_mvg_avg[ai] ;}
      pc01_avg = uint32_temp_add/4;
      pc01_avg_disp = pc01_avg;  
    }           
    
    pc03 = ips_sensor.getPC03(); 
    //if(pc03>0)  && (pc03<100)
    {
      uint32_temp_add = 0;
      for (ai=1; ai<4; ai++) { pc03_mvg_avg[ai] = pc03_mvg_avg[ai+1]; } pc03_mvg_avg[4]=pc03;
      for (ai=1; ai<=4; ai++) { uint32_temp_add = uint32_temp_add + pc03_mvg_avg[ai] ;}
      pc03_avg = uint32_temp_add/4;
    }
    
    pc05 = ips_sensor.getPC05();
    //if(pc05>0)  && (pc05<100)
    {
      uint32_temp_add = 0;
      for (ai=1; ai<4; ai++) { pc05_mvg_avg[ai] = pc05_mvg_avg[ai+1]; } pc05_mvg_avg[4]=pc05;
      for (ai=1; ai<=4; ai++) { uint32_temp_add = uint32_temp_add + pc05_mvg_avg[ai] ;}
      pc05_avg = uint32_temp_add/4;
    }

    pc1 = ips_sensor.getPC10();
    //if(pc1>0)  && (pc1<100)
    {
      uint32_temp_add = 0;
      for (ai=1; ai<4; ai++) { pc1_mvg_avg[ai] = pc1_mvg_avg[ai+1]; } pc1_mvg_avg[4]=pc1;
      for (ai=1; ai<=4; ai++) { uint32_temp_add = uint32_temp_add + pc1_mvg_avg[ai] ;}
      pc1_avg = uint32_temp_add/4;
    }
    
    pc25 = ips_sensor.getPC25();
    //if(pc25>0)  && (pc25<100)
    {
    uint32_temp_add = 0;
    for (ai=1; ai<4; ai++) { pc25_mvg_avg[ai] = pc25_mvg_avg[ai+1]; } pc25_mvg_avg[4]=pc25;
    for (ai=1; ai<=4; ai++) { uint32_temp_add = uint32_temp_add + pc25_mvg_avg[ai] ;}
    pc25_avg = uint32_temp_add/4;
    }
    
    pc5 = ips_sensor.getPC50();
    //if(pc5>0)  && (pc5<100)
    {
    uint32_temp_add = 0;
    for (ai=1; ai<4; ai++) { pc5_mvg_avg[ai] = pc5_mvg_avg[ai+1]; } pc5_mvg_avg[4]=pc5;
    for (ai=1; ai<=4; ai++) { uint32_temp_add = uint32_temp_add + pc5_mvg_avg[ai] ;}
    pc5_avg = uint32_temp_add/4;
    }

    pc10 = ips_sensor.getPC100();
    //if(pc10>0)  && (pc10<100)
    {
    uint32_temp_add = 0;
    for (ai=1; ai<4; ai++) { pc10_mvg_avg[ai] = pc10_mvg_avg[ai+1]; } pc10_mvg_avg[4]=pc10;
    for (ai=1; ai<=4; ai++) { uint32_temp_add = uint32_temp_add + pc10_mvg_avg[ai] ;}
    pc10_avg = uint32_temp_add/4;
    }
          
    pm01 = ips_sensor.getPM01(); 
    //if(pm01>0)  && (pm01<100)
    {
      float_temp_add = 0;
      for (ai=1; ai<4; ai++) { pm01_mvg_avg[ai] = pm01_mvg_avg[ai+1]; } pm01_mvg_avg[4]=pm01;
      for (ai=1; ai<=4; ai++) { float_temp_add = float_temp_add + pm01_mvg_avg[ai] ;}
      pm01_avg = (float)(float_temp_add/4);
    }           
    
    pm03 = ips_sensor.getPM03(); 
    //if(pm03>0)  && (pm03<100)
    {
      float_temp_add = 0;
      for (ai=1; ai<4; ai++) { pm03_mvg_avg[ai] = pm03_mvg_avg[ai+1]; } pm03_mvg_avg[4]=pm03;
      for (ai=1; ai<=4; ai++) { float_temp_add = float_temp_add + pm03_mvg_avg[ai] ;}
      pm03_avg = (float)(float_temp_add/4);
    }
    
    pm05 = ips_sensor.getPM05();
    //if(pm05>0)  && (pm05<100)
    {
      float_temp_add = 0;
      for (ai=1; ai<4; ai++) { pm05_mvg_avg[ai] = pm05_mvg_avg[ai+1]; } pm05_mvg_avg[4]=pm05;
      for (ai=1; ai<=4; ai++) { float_temp_add = float_temp_add + pm05_mvg_avg[ai] ;}
      pm05_avg = (float)(float_temp_add/4);
    }

    pm1 = ips_sensor.getPM10();
    //if(pm1>0)  && (pm1<100)
    {
      float_temp_add = 0;
      for (ai=1; ai<4; ai++) { pm1_mvg_avg[ai] = pm1_mvg_avg[ai+1]; } pm1_mvg_avg[4]=pm1;
      for (ai=1; ai<=4; ai++) { float_temp_add = float_temp_add + pm1_mvg_avg[ai] ;}
      pm1_avg = (float)(float_temp_add/4);
    }
    
    pm25 = ips_sensor.getPM25();
    //if(pm25>0)  && (pm25<100)
    {
      float_temp_add = 0;
      for (ai=1; ai<4; ai++) { pm25_mvg_avg[ai] = pm25_mvg_avg[ai+1]; } pm25_mvg_avg[4]=pm25;
      for (ai=1; ai<=4; ai++) { float_temp_add = float_temp_add + pm25_mvg_avg[ai] ;}
      pm25_avg = (float)(float_temp_add/4);
    }
    
    pm5 = ips_sensor.getPM50();
    //if(pm5>0)  && (pm5<100)
    {
      float_temp_add = 0;
      for (ai=1; ai<4; ai++) { pm5_mvg_avg[ai] = pm5_mvg_avg[ai+1]; } pm5_mvg_avg[4]=pm5;
      for (ai=1; ai<=4; ai++) { float_temp_add = float_temp_add + pm5_mvg_avg[ai] ;}
      pm5_avg = (float)(float_temp_add/4);
    }

    pm10 = ips_sensor.getPM100();
    //if(pm10>0)  && (pm10<100)
    {
      float_temp_add = 0;
      for (ai=1; ai<4; ai++) { pm10_mvg_avg[ai] = pm10_mvg_avg[ai+1]; } pm10_mvg_avg[4]=pm10;
      for (ai=1; ai<=4; ai++) { float_temp_add = float_temp_add + pm10_mvg_avg[ai] ;}
      pm10_avg = (float)(float_temp_add/4);
    }   

    event_status=ips_sensor.getEventStatus();
    if (event_status>3)   {event_status=0;}
    if (event_status!=0)  {  event_status_disp=event_status;  event_status_cld=1;    event_count++;   smoke_vape_indication_base_time=millis(); }
    if((millis() - smoke_vape_indication_base_time) >= SMOKE_VAPE_INDICATION_TIME)   {   event_status_cld=0;   }



    Serial.println("----------------IPS VALUES Particle Count----------------"); Serial.println();
    if(pm_unit==0) { Serial.println("---CURRENT PM UNIT IS ft3----"); } else if(pm_unit==1) { Serial.println("---CURRENT PM UNIT IS m3----"); } Serial.println();
    Serial.print("PC0.1:    ");    Serial.print(pc01);       Serial.print("\t");   Serial.print(pc01_avg);  Serial.print("\t");  Serial.print(int32_t(pc01-pc01_avg));  Serial.println();
    Serial.print("PC0.3:    ");    Serial.print(pc03);       Serial.print("\t");   Serial.print(pc03_avg);  Serial.print("\t");  Serial.print(int32_t(pc03-pc03_avg));  Serial.println(); 
    Serial.print("PC0.5:    ");    Serial.print(pc05);       Serial.print("\t");   Serial.print(pc05_avg);  Serial.print("\t");  Serial.print(int32_t(pc05-pc05_avg));  Serial.println();  
    Serial.print("PC1  :    ");    Serial.print(pc1);        Serial.print("\t");   Serial.print(pc1_avg);   Serial.print("\t");  Serial.print(int32_t(pc1-pc1_avg));    Serial.println();  
    Serial.print("PC2.5:    ");    Serial.print(pc25);       Serial.print("\t");   Serial.print(pc25_avg);  Serial.print("\t");  Serial.print(int32_t(pc25-pc25_avg));  Serial.println();  
    Serial.print("PC5  :    ");    Serial.print(pc5);        Serial.print("\t");   Serial.print(pc5_avg);   Serial.print("\t");  Serial.print(int32_t(pc5-pc5_avg));    Serial.println();  
    Serial.print("PC10 :    ");    Serial.print(pc10);       Serial.print("\t");   Serial.print(pc10_avg);  Serial.print("\t"); Serial.print(int32_t(pc10-pc10_avg)); Serial.println(); 
    Serial.println("----------------IPS VALUES Particle Mass----------------");  
    Serial.print("PM0.1:    ");   Serial.print(pm01,3);     Serial.print("\t");   Serial.print(pm01_avg,3);  Serial.print("\t");  Serial.print(float(pm01-pm01_avg),3);   Serial.println();
    Serial.print("PM0.3:    ");   Serial.print(pm03,3);     Serial.print("\t");   Serial.print(pm03_avg,3);  Serial.print("\t");  Serial.print(float(pm03-pm03_avg),3);   Serial.println();
    Serial.print("PM0.5:    ");   Serial.print(pm05,3);     Serial.print("\t");   Serial.print(pm05_avg,3);  Serial.print("\t");  Serial.print(float(pm05-pm05_avg),3);   Serial.println();
    Serial.print("PM1  :    ");   Serial.print(pm1,3);      Serial.print("\t");   Serial.print(pm1_avg,3);   Serial.print("\t");  Serial.print(float(pm1-pm1_avg),3);     Serial.println();
    Serial.print("PM2.5:    ");   Serial.print(pm25,3);     Serial.print("\t");   Serial.print(pm25_avg,3);  Serial.print("\t");  Serial.print(float(pm25-pm25_avg),3);   Serial.println();
    Serial.print("PM5  :    ");   Serial.print(pm5,3);      Serial.print("\t");   Serial.print(pm5_avg,3);   Serial.print("\t");  Serial.print(float(pm5-pm5_avg),3);     Serial.println();
    Serial.print("PM10 :    ");   Serial.print(pm10,3);     Serial.print("\t");   Serial.print(pm10_avg,3);  Serial.print("\t");  Serial.print(float(pm10-pm10_avg),3);   Serial.println();
    Serial.print("----------------------------------------------------------");
    Serial.println("\n");
    pc01_avg_disp = pc01_avg;
    pc03_avg_disp = pc03_avg;
    pc05_avg_disp = pc05_avg;
    pc1_avg_disp  = pc1_avg;
    pc25_avg_disp = pc25_avg;
    pc5_avg_disp  = pc5_avg;
    pc10_avg_disp  = pc10_avg;
    pm01_avg_cld = pm01_avg;
    pm01_avg_disp=pm01_avg_cld*1000;
    pm03_avg_cld = pm03_avg;
    pm03_avg_disp=pm03_avg_cld*1000;
    pm05_avg_cld = pm05_avg;
    pm05_avg_disp=pm05_avg_cld*1000;
    pm1_avg_cld = pm1_avg;
    pm1_avg_disp=pm1_avg_cld*1000;
    pm25_avg_cld = pm25_avg;
    pm25_avg_disp=pm25_avg_cld*1000;
    pm5_avg_cld = pm5_avg;
    pm5_avg_disp=pm5_avg_cld*1000;
    /*******************************************/
    // pm10_avg_cld pm10_avg_disp both variable get updated after read sen5x sensor.
    //pm10_avg_cld = pm10_avg;
    //pm10_avg_disp=pm10_avg_cld*1000; 
    
    /************************************************/
    

    //ips_aqi_calculation();
  }
  else if(ips_i2c_reconnect_flag==1)
  {
    ips_sensor_init();
    ips_i2c_reconnect_flag=0;
  }
}
/////////////////////////////////////// AQI VALUE GET FROM PM2.5 ///////////////////////////////////////////////////////
void ips_aqi_calculation()
{
  //Example 
  //Take 1st AQI range(0-50) & PM2.5 range(0-12)μg/m³ 
  //AQI =((IHi − ILo)/(PMHi − PMLo))*(pm25_avg - ILo)+ILo 
  //AQI=((50-0)/(12-0))*(6-0)+0
  //AQI =25
        uint8_t i=0; int32_t s=0; int32_t l=0; // uint8_t j=0;
        float pm25_avg_temp=0.0; pm25_avg_aqi=pm25_avg;

        //pm_unit==0 is for cu-ft. Hence cu-mt = 35.314*cu-ft.       
        if (pm_unit==0)       {  pm25_avg_temp =((float)pm25_avg_aqi*(float)35.314); Serial.print("pm25_avg_aqi");Serial.println(pm25_avg_aqi); Serial.print("pm25_avg_temp");Serial.println(pm25_avg_temp);}// feet3  
        else if (pm_unit==1)  {  pm25_avg_temp=pm25_avg_aqi; Serial.print("pm25_avg_aqi");Serial.println(pm25_avg_aqi);Serial.print("pm25_avg_temp");Serial.println(pm25_avg_temp);}                     // meter3
        
         if((pm25_avg_temp>=0)&&(pm25_avg_temp<=12))                {     pm25_actual_aqi=((50-0)/(12-0))*(pm25_avg_temp-0)+0;                        }
        else if((pm25_avg_temp>=12.1)&&(pm25_avg_temp<=35.4))       {     pm25_actual_aqi=((100-51)/(35.4-12.1))*(pm25_avg_temp-12.1)+51;             }
        else if((pm25_avg_temp>=35.4)&&(pm25_avg_temp<=55.4))       {     pm25_actual_aqi=((150-101)/(55.4-35.5))*(pm25_avg_temp-35.5)+101;           }
        else if((pm25_avg_temp>=55.5)&&(pm25_avg_temp<=150.4))      {     pm25_actual_aqi=((200-151)/(150.4-55.5))*(pm25_avg_temp-55.5)+151;          }
        else if((pm25_avg_temp>=150.5)&&(pm25_avg_temp<=250.4))     {     pm25_actual_aqi=((300-201)/(250.4-150.5))*(pm25_avg_temp-150.5)+201;        }
        else if((pm25_avg_temp>=250.5)&&(pm25_avg_temp<=350.4))     {     pm25_actual_aqi=((400-301)/(350.4-250.5))*(pm25_avg_temp-250.5)+301;        }
        else if((pm25_avg_temp>=350.5)&&(pm25_avg_temp<=450.4))     {     pm25_actual_aqi=((500-401)/(450.4-350.5))*(pm25_avg_temp-350.5)+401;        }
        else if((pm25_avg_temp>=450.5))                             {     pm25_actual_aqi= 500;                                                       }        
      
      /*else if((pm25_avg_temp>=450.5)&&(pm25_avg_temp<=550.4))     {     pm25_actual_aqi=((600-501)/(550.4-450.5))*(pm25_avg_temp-450.5)+501;        }
        else if((pm25_avg_temp>=550.5)&&(pm25_avg_temp<=650.4))     {     pm25_actual_aqi=((700-601)/(650.4-550.5))*(pm25_avg_temp-550.5)+601;        }
        else if((pm25_avg_temp>=650.5)&&(pm25_avg_temp<=750.4))     {     pm25_actual_aqi=((800-701)/(750.4-650.5))*(pm25_avg_temp-650.5)+701;        }
        else if((pm25_avg_temp>=750.5)&&(pm25_avg_temp<=850.4))     {     pm25_actual_aqi=((900-801)/(850.4-750.5))*(pm25_avg_temp-750.5)+801;        }
        else if((pm25_avg_temp>=850.5)&&(pm25_avg_temp<=950.4))     {     pm25_actual_aqi=((1000-901)/(950.4-850.5))*(pm25_avg_temp-850.5)+901;       }
        else if((pm25_avg_temp>=950.5)&&(pm25_avg_temp<=1050.4))    {     pm25_actual_aqi=((1100-1001)/(1050.4-950.5))*(pm25_avg_temp-950.5)+1001;    }
        else if((pm25_avg_temp>=1050.5)&&(pm25_avg_temp<=1150.4))   {     pm25_actual_aqi=((1200-1101)/(1150.4-1050.5))*(pm25_avg_temp-1050.5)+1101;  }
        else if((pm25_avg_temp>=1150.5)&&(pm25_avg_temp<=1250.4))   {     pm25_actual_aqi=((1300-1201)/(1250.4-1150.5))*(pm25_avg_temp-1150.5)+1201;  }
        else if((pm25_avg_temp>=1250.5)&&(pm25_avg_temp<=1350.4))   {     pm25_actual_aqi=((1400-1301)/(1350.4-1250.5))*(pm25_avg_temp-1250.5)+1301;  }*/
        
        Serial.print("PM25 ACTUAL AQI  :"); Serial.println(pm25_actual_aqi);   
}

/////////////////////////////////////// AQI VALUE GET FROM PM2.5, PM10, HCHO, VOC, NOX ///////////////////////////////////////////////////////
void aqi_calculation()
{
  float pm25_avg_for_aqi_calc=0.0; float sample_pm25_avg_cld=pm25_avg_cld; 
  float pm10_avg_for_aqi_calc=0.0; float sample_pm10_avg_cld=pm10_avg_cld; 
  float voc_for_aqi_calc=0.0;  
  float nox_for_aqi_calc=0.0; 
  float hcho_for_aqi_calc=0.0; 
  //pm_unit==0 is for cu-ft. Hence cu-mt = 35.314*cu-ft.   
  if (pm_unit==0)       {   pm25_avg_for_aqi_calc=((float)sample_pm25_avg_cld*(float)35.314);  pm10_avg_for_aqi_calc=((float)sample_pm10_avg_cld*(float)35.314);  }// feet3  
  else if (pm_unit==1)  {   pm25_avg_for_aqi_calc=sample_pm25_avg_cld;                         pm10_avg_for_aqi_calc=sample_pm10_avg_cld;   }                     // meter3

  if (voc_cld<=VOC_R1_HIGH) {voc_for_aqi_calc=0;}  else  { voc_for_aqi_calc=float(voc_cld); }
  nox_for_aqi_calc=float(nox_cld); 
  hcho_for_aqi_calc=hcho_cld; 
  
  pm25_actual_aqi=calculate_pm25_aqi(pm25_avg_for_aqi_calc);
  pm10_actual_aqi=calculate_pm10_aqi(pm10_avg_for_aqi_calc);
  voc_actual_aqi=calculate_voc_aqi(voc_for_aqi_calc);
  nox_actual_aqi=calculate_nox_aqi(nox_for_aqi_calc);
  hcho_actual_aqi=calculate_hcho_aqi(hcho_for_aqi_calc);

  Serial.print("PM2.5 AQI: "); Serial.println(pm25_actual_aqi);
  Serial.print("PM10  AQI: "); Serial.println(pm10_actual_aqi);
  Serial.print("VOC   AQI: "); Serial.println(voc_actual_aqi);
  Serial.print("NOx   AQI: "); Serial.println(nox_actual_aqi);
  Serial.print("HCHO  AQI: "); Serial.println(hcho_actual_aqi);

  actual_aqi = MAX_AQI(pm25_actual_aqi, pm10_actual_aqi, voc_actual_aqi, nox_actual_aqi, hcho_actual_aqi);
  Serial.print("ACTUAL  AQI: "); Serial.println(actual_aqi);
}

//////////////////////////////////////////////////////////// AMPHENOL //////////////////////////////////////////////////////////////

void read_amphenol_data()
{
    uint16_t uint16_temp_add=0;
    Wire.beginTransmission(T6793_ADDRESS);
    Wire.write(0x04);    Wire.write(0x13);    Wire.write(0x8B);    Wire.write(0x00);    Wire.write(0x01);    
    Wire.endTransmission();
    delay(20);
    Wire.requestFrom(T6793_ADDRESS, 4); //Request 4 bytes from the sensor
    co2_data[0] = Wire.read();
    co2_data[1] = Wire.read();
    co2_data[2] = Wire.read();
    co2_data[3] = Wire.read();
    co2_ppmValue = (((co2_data[2] & 0x3F ) << 8) | co2_data[3]); 
    
    if ((co2_ppmValue >= 0) && (co2_ppmValue <=5000))    
    {           
      uint16_temp_add = 0;
      for (ai=1; ai<4; ai++) { co2_mavg_arr[ai] = co2_mavg_arr[ai+1]; } co2_mavg_arr[4]=co2_ppmValue;
      for (ai=1; ai<=4; ai++) { uint16_temp_add = uint16_temp_add + co2_mavg_arr[ai] ;}
      co2_disp = uint16_temp_add/4;
      co2_cld = co2_disp;        
    } 
   else { Serial.print("CO2 out of limit for last read."); Serial.println(""); }
   Serial.println("-------------------AMPHENOL CO2 VALUE-------------------");
   Serial.print("CO2 Value      : ");    Serial.print(co2_ppmValue);       Serial.print("\t");   Serial.print(co2_disp);  Serial.print("\t");  Serial.print(int32_t(co2_ppmValue-co2_disp));  Serial.println(" ppm");
   Serial.println("--------------------------------------------------------");

}

////////////////////////////////////////////////////////// SFA 30 HCHO ////////////////////////////////////////////////////////////////

void read_sfa_data()
{
  if(sfa_i2c_reconnect_flag==0)
  {
      uint8_t sfa_data[9], counter;
      // send read data command
      Wire.beginTransmission(SFA_ADDRESS);
      Wire.write(0x03);
      Wire.write(0x27);
      Wire.endTransmission();
    
      //wait time before reading for the values should be more than 2ms
      delay(10);
      
      // read measurement data: 
      // 2 bytes formaldehyde, 1 byte CRC, scale factor 5
      // 2 bytes RH, 1 byte CRC, scale factor 100
      // 2 bytes T, 1 byte CRC, scale factor 200
      // stop reading after 9 bytes (not used)
      Wire.requestFrom(SFA_ADDRESS, 9);
      counter = 0;     
      delay(10);
      i2c_resp_wait_time = millis();
      i2c_read_complete_flag=0;
      while ((millis()<(i2c_resp_wait_time+500)) && (i2c_read_complete_flag==0))
      {
          if (Wire.available()) { sfa_data[counter] = Wire.read(); counter++;}
          else { delay(10); }
          if (counter>=9) { i2c_read_complete_flag=1; counter=0;}
      }
      if(i2c_read_complete_flag==0) { Serial.print("SFA Sensor Last I2C Read has failed."); Serial.println(""); } 
            
      if(i2c_read_complete_flag==1)
      {
              // floating point conversion according to datasheet
          hcho = (float)((int16_t)sfa_data[0] << 8 | sfa_data[1])/5;      

          // convert RH in %
          sfa_humid = (float)((int16_t)sfa_data[3] << 8 | sfa_data[4])/100;

              // convert T in degC
          sfa_temp = (float)((int16_t)sfa_data[6] << 8 | sfa_data[7])/200;

          if ((hcho>=0)&&(hcho<=5000)) 
          { 
            float temp_add = 0;
            for (ai=1; ai<4; ai++) { hcho_mavg_arr[ai] = hcho_mavg_arr[ai+1]; } hcho_mavg_arr[4]=hcho;
            for (ai=1; ai<=4; ai++) { temp_add = temp_add + hcho_mavg_arr[ai] ;}
            hcho_cld = float(temp_add/4);
            hcho_disp=hcho_cld*10;                              
          } 
          else { Serial.print("SFA HCHO Last Read Value is Out of Limit."); Serial.println("");  }

          if ((sfa_humid>=0)&&(sfa_humid<=100)) 
          { 
            float temp_add = 0;
            for (ai=1; ai<4; ai++) { sfa_humid_mavg_arr[ai] = sfa_humid_mavg_arr[ai+1]; } sfa_humid_mavg_arr[4]=sfa_humid;
            for (ai=1; ai<=4; ai++) { temp_add = temp_add + sfa_humid_mavg_arr[ai] ;}
            sfa_humid_cld = float(temp_add/4);
            sfa_humid_disp = sfa_humid_cld;                               
          } 
          else { Serial.print("SFA Humidity Last Read Value is Out of Limit."); Serial.println("");  }

          if ((sfa_temp>=0)&&(sfa_temp<=50))  
          { 
            float temp_add = 0;
            for (ai=1; ai<4; ai++) { sfa_temp_mavg_arr[ai] = sfa_temp_mavg_arr[ai+1]; } sfa_temp_mavg_arr[4]=sfa_temp;
            for (ai=1; ai<=4; ai++) { temp_add = temp_add + sfa_temp_mavg_arr[ai] ;}
            sfa_temp_cld = float(temp_add/4);
            sfa_temp_disp = sfa_temp_cld; // deg Celsius by default                               
          } 
          else { Serial.print("SFA Temperature Last Read Value is Out of Limit."); Serial.println(""); }
          
          Serial.println("-----------------SFA Sensor values-----------------"); 
          Serial.print("HCHO           : ");    Serial.print(hcho);        Serial.print(" \t");  Serial.print(hcho_disp/10);      Serial.print(" \t");  Serial.print(hcho-(hcho_disp/10));           Serial.println(" ppb");
          Serial.print("SFA_HUMID      : ");    Serial.print(sfa_humid);   Serial.print(" \t");  Serial.print(sfa_humid_disp); Serial.print(" \t");  Serial.print(sfa_humid-sfa_humid_disp); Serial.println(" %");      
          Serial.print("SFA_TEMP       : ");    Serial.print(sfa_temp);    Serial.print(" \t");  Serial.print(sfa_temp_disp);  Serial.print(" \t");  Serial.print(sfa_temp-sfa_temp_disp);   Serial.println(" °C");      
          Serial.println("---------------------------------------------------");
          
          if(temp_unit==0) // Franheit
          {   
            sfa_temp_disp = (sfa_temp_disp * 9/5) + 32 ;   
            Serial.print("SFA_TEMP : ");    Serial.print(sfa_temp_disp);  Serial.print(" °F");  Serial.println("");
          }          
      }
  }
  else if(sfa_i2c_reconnect_flag==1)
  {
    sfa_sensor_init();
    sfa_i2c_reconnect_flag=0;
  }
}  
////////////////////////////////////////////////////////-AHT10-///////////////////////////////////////////////////////////
// Function to read AHT10 sensor
void read_AHT10_data() 
{
  if(aht_i2c_reconnect_flag==0)
  {
    Serial.println("-----------------AHT Sensor values-----------------"); 
    /* DEMO - 2, temperature call will read 6-bytes via I2C, humidity will use same 6-bytes */
    //Serial.println();   Serial.println(F("DEMO 2: read 6-byte"));

    aht_temp = aht20.readTemperature(); //read 6-bytes via I2C, takes 80 milliseconds
    Serial.print(F("Temperature: "));
    
    if (aht_temp != AHTXX_ERROR)   {   Serial.print(aht_temp);  Serial.println(F(" +-0.3C")); }   //AHTXX_ERROR = 255, library returns 255 if error occurs
    else   {  printStatus(); } //print temperature command status

    aht_humid = aht20.readHumidity(AHTXX_USE_READ_DATA);  
    Serial.print(F("Humidity...: ")); //use 6-bytes from temperature reading, takes zero milliseconds!!!
    
    if (aht_humid != AHTXX_ERROR)  {   Serial.print(aht_humid); Serial.println(F(" +-2%"));   } //AHTXX_ERROR = 255, library returns 255 if error occurs
    else   {  printStatus();  } //print temperature command status not humidity!!! RH measurement use same 6-bytes from T measurement
  
    AHT2415C_humid_calc(); 
    AHT2415C_temp_calc();
    Serial.print("AHT_HUMID      : ");  Serial.print(aht_humid);  Serial.print("\t");  Serial.print(aht_humid_disp);   Serial.print("\t"); Serial.print(int32_t(aht_humid-aht_humid_disp));   Serial.println();
    Serial.print("AHT_TEMP       : ");  Serial.print(aht_temp);   Serial.print("\t");  Serial.print(aht_temp_disp);    Serial.print("\t"); Serial.print(int32_t(aht_temp-aht_temp_disp));   Serial.println();
    new_temperature_unit=temp_unit;
    if(temp_unit==0) // Franheit
    {   
      aht_temp_disp = (aht_temp_disp * 9/5) + 32 ;  
      aht_temp_cld  = aht_temp_disp; 
      Serial.print("AHT_TEMP       : ");    Serial.print(aht_temp_disp);  Serial.print(" °F");  Serial.println("");
    } 
    Serial.println("---------------------------------------------------");
  }
  else if(aht_i2c_reconnect_flag==1)
  {
    if   (aht20.softReset() == true) Serial.println(F("AHT20 reset success")); //as the last chance to make it alive
    else                             Serial.println(F("AHT20 reset failed"));
    delay(1000);
    aht20.begin();
    aht_i2c_reconnect_flag=0;
  }
}
////////////////////////////////////////////////////////-SEN5X-///////////////////////////////////////////////////////////
void read_sen5x_data()
{  
  if(sen5x_i2c_reconnect_flag==0)
  {
     uint16_t error; char errorMessage[256];
  
     // Read Measurement
     float temp_massConcentrationPm1p0=0;;      float temp_massConcentrationPm2p5=0;
     float temp_massConcentrationPm4p0=0;;      float temp_massConcentrationPm10p0=0;
     float temp_ambientHumidity=0;              float temp_ambientTemperature=0;
     float temp_vocIndex =0;                    float temp_noxIndex=0;
     
     error = sen5x.readMeasuredValues(
          temp_massConcentrationPm1p0, temp_massConcentrationPm2p5, temp_massConcentrationPm4p0,
          temp_massConcentrationPm10p0, temp_ambientHumidity, temp_ambientTemperature, temp_vocIndex,
          temp_noxIndex);

     if (temp_vocIndex >= 95 && temp_vocIndex <= 105) {
        temp_vocIndex = 100;
     }
          
      if (error) 
      {
          Serial.print("Error trying to execute readMeasuredValues(): ");
          errorToString(error, errorMessage, 256);
          Serial.println(errorMessage);
      } 
      else 
      {
           
          //if ((temp_vocIndex >= 1) && (temp_vocIndex <=500)) 
          { vocIndex=temp_vocIndex; }
          //else { Serial.print("SEN5x VOC Last Read Value is Out of Limit."); Serial.println(""); }
          //if ((temp_noxIndex >= 1) && (temp_noxIndex <=500)) 
          { noxIndex=temp_noxIndex; }   
          //if ((temp_ambientTemperature>=0)&&(temp_ambientTemperature<=50))  
          {sen_temp=temp_ambientTemperature;}
          //if ((temp_ambientHumidity>=0)&&(temp_ambientHumidity<=100)) 
          {sen_humid=temp_ambientHumidity; }
           
          Serial.println("----------------SEN5X Sensor values----------------"); 
          //if(temp_massConcentrationPm10p0>0)  && (temp_massConcentrationPm10p0<100)
          {
            float float_temp_add = 0;
            for (ai=1; ai<4; ai++) { sen5x_pm10_mvg_avg[ai] = sen5x_pm10_mvg_avg[ai+1]; } sen5x_pm10_mvg_avg[4]=temp_massConcentrationPm10p0;
            for (ai=1; ai<=4; ai++) { float_temp_add = float_temp_add + sen5x_pm10_mvg_avg[ai] ;}
            sen5x_pm10_avg = (float)(float_temp_add/4);
            Serial.print("\ntemp_massConcentrationPm10p0 : "); Serial.print(temp_massConcentrationPm10p0); Serial.print("\t sen5x_pm10_avg : ");  Serial.print(sen5x_pm10_avg); 
            Serial.println();
          }
          Serial.print("SEN5x Voc Index: "); 
          if (isnan(vocIndex)) { Serial.print("n/a"); } 
          else 
          { 
            SEN5x_voc_calc(); 
            Serial.print(vocIndex); Serial.print("\t");  Serial.print(vocIndex_disp); 
            Serial.print("\t");  Serial.print(int32_t(vocIndex-vocIndex_disp));   Serial.println();
          }
                   
          Serial.print("SEN5x Nox Index: ");
          if (isnan(noxIndex)) { Serial.println("n/a"); } 
          else 
          { 
            SEN5x_nox_calc();
            Serial.print(noxIndex); Serial.print("\t");  Serial.print(noxIndex_disp);
            Serial.print("\t"); Serial.print(int32_t(noxIndex-noxIndex_disp));   Serial.println();
          }
                   
          Serial.print("SEN_Humidity   : ");
          if (isnan(sen_humid)) { Serial.print("n/a"); } 
          else 
          { 
            SEN5x_humid_calc(); 
            Serial.print(sen_humid);  Serial.print("\t");  Serial.print(sen_humid_disp); 
            Serial.print("\t"); Serial.print(int32_t(sen_humid-sen_humid_disp));   Serial.println();
          }
          Serial.print("SEN_Temp       : ");
          if (isnan(sen_temp)) { Serial.print("n/a"); } 
          else 
          { 
            SEN5x_temp_calc();
            Serial.print(sen_temp);  Serial.print("\t");  Serial.print(sen_temp_disp);
            Serial.print("\t"); Serial.print(int32_t(sen_temp-sen_temp_disp));   Serial.println();
            if(temp_unit==0) // Franheit
            {   
              sen_temp_disp = (sen_temp_disp * 9/5) + 32 ;   
              Serial.print("SEN_Temp       : "); Serial.print(sen_temp_disp); Serial.print(" °F");  Serial.println("");
            }          
          }
         Serial.println("---------------------------------------------------");
      }
  }
  else if(sen5x_i2c_reconnect_flag==1)
  {
    sen5x_sensor_init();
    sen5x_i2c_reconnect_flag=0;
  } 
}

///////////////////////////////////////////////////////////////////////////////////////////////////////

void SEN5x_voc_calc()
{
  if ((vocIndex >= 1) && (vocIndex <=500))   
  { 
    int16_t temp_add = 0;
    for (ai=1; ai<4; ai++) { voc_mavg_arr[ai] = voc_mavg_arr[ai+1]; } voc_mavg_arr[4]=vocIndex;
    for (ai=1; ai<=4; ai++) { temp_add = temp_add + voc_mavg_arr[ai] ;}
    voc_cld = float(temp_add/4);
    vocIndex_disp=voc_cld;                              
  } 
  else { Serial.print("SEN5x VOC Last Read Value is Out of Limit."); Serial.println(""); }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
void SEN5x_nox_calc()
{
  if ((noxIndex >= 1) && (noxIndex <=500))   
    { 
      int16_t temp_add = 0;
      for (ai=1; ai<4; ai++) { nox_mavg_arr[ai] = nox_mavg_arr[ai+1]; } nox_mavg_arr[4]=noxIndex;
      for (ai=1; ai<=4; ai++) { temp_add = temp_add + nox_mavg_arr[ai] ;}
      nox_cld = float(temp_add/4);
      noxIndex_disp=nox_cld;                                
    } 
    else { Serial.print("SEN5x NOx Last Read Value is Out of Limit."); Serial.println(""); }  
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
void SEN5x_humid_calc()
{
  if ((sen_humid>=0)&&(sen_humid<=100)) 
    { 
      int16_t temp_add = 0;
      for (ai=1; ai<4; ai++) { sen_humid_mavg_arr[ai] = sen_humid_mavg_arr[ai+1]; } sen_humid_mavg_arr[4]=sen_humid;
      for (ai=1; ai<=4; ai++) { temp_add = temp_add + sen_humid_mavg_arr[ai] ;}
      sen_humid_cld = float(temp_add/4);
      sen_humid_disp = sen_humid_cld;                               
    } 
    else { Serial.print("SEN5x Humidity Last Read Value is Out of Limit."); Serial.println("");  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
void SEN5x_temp_calc()
{
  if ((sen_temp>=0)&&(sen_temp<=50))  
  { 
    int16_t temp_add = 0;
    for (ai=1; ai<4; ai++) { sen_temp_mavg_arr[ai] = sen_temp_mavg_arr[ai+1]; } sen_temp_mavg_arr[4]=sen_temp;
    for (ai=1; ai<=4; ai++) { temp_add = temp_add + sen_temp_mavg_arr[ai] ;}
    sen_temp_cld = float(temp_add/4);
    sen_temp_disp = sen_temp_cld; // deg Celsius by default                               
  } 
  else { Serial.print("SEN5x Temperature Last Read Value is Out of Limit."); Serial.println(""); }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
void AHT2415C_humid_calc()
{
  if ((aht_humid>=0)&&(aht_humid<=100)) 
    { 
      float temp_add = 0;
      for (ai=1; ai<4; ai++) { aht_humid_mavg_arr[ai] = aht_humid_mavg_arr[ai+1]; } aht_humid_mavg_arr[4]=aht_humid;
      for (ai=1; ai<=4; ai++) { temp_add = temp_add + aht_humid_mavg_arr[ai] ;}
      aht_humid_cld = float(temp_add/4);
      // Decrease aht_temp_cld by 0.5
      aht_humid_cld =aht_humid_cld-1.0;
       // If the decimal part is greater than or equal to 0.5, round up
      if (aht_humid_cld - int(aht_humid_cld) >= 0.5) {  aht_humid_cld = int(aht_humid_cld) + 1;  } 
      else {  aht_humid_cld = int(aht_humid_cld);  }

      aht_humid_disp = aht_humid_cld;                               
    } 
    else { Serial.print("AHT2415C Humidity Last Read Value is Out of Limit."); Serial.println("");  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
void AHT2415C_temp_calc()
{
  if ((aht_temp>=0)&&(aht_temp<=50))  
  { 
    float temp_add = 0;
    for (ai=1; ai<4; ai++) { aht_temp_mavg_arr[ai] = aht_temp_mavg_arr[ai+1]; } aht_temp_mavg_arr[4]=aht_temp;
    for (ai=1; ai<=4; ai++) { temp_add = temp_add + aht_temp_mavg_arr[ai] ;}
    aht_temp_cld = float(temp_add/4);
    // Decrease aht_temp_cld by 0.5
    aht_temp_cld = aht_temp_cld-0.5;
    // If the decimal part is greater than or equal to 0.5, round up
    if (aht_temp_cld - int(aht_temp_cld) >= 0.5) {  aht_temp_cld = int(aht_temp_cld) + 1;  } 
    else {  aht_temp_cld = int(aht_temp_cld);  }

    aht_temp_disp = aht_temp_cld; // deg Celsius by default                              
  } 
  else { Serial.print("AHT2415C Temperature Last Read Value is Out of Limit."); Serial.println(""); }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
void check_pm10_value()
{
  float final_pm10_avg=0.0;
  /*****************************************************/
  //a=pm10_avg;  [ips piera sensor]
  //b=sen5x_pm10_avg; [sene5x sensor]
  //result= final_pm10_avg;
  //Formula: result = a + 0.5 * max(0, b - a)
  
  if(pm_unit==1) { sen5x_pm10_avg=sen5x_pm10_avg;        }//µg/m³
  else if(pm_unit==0)      { sen5x_pm10_avg=sen5x_pm10_avg/35.3147; }//µg/ft³
  final_pm10_avg = pm10_avg + (0.5 * MAX(0, sen5x_pm10_avg - pm10_avg));
  Serial.print("pm10_avg:"); Serial.println(pm10_avg); 
  Serial.print("sen5x_pm10_avg:"); Serial.println(sen5x_pm10_avg); 
  Serial.print("final_pm10_avg:"); Serial.println(final_pm10_avg); Serial.println("\n\n"); 

  /****************************************************/
  //pm10_avg_cld = pm10_avg; // for ips sensor value only means unmask this line & mask below one line 
  pm10_avg_cld = final_pm10_avg;
  pm10_avg_disp=pm10_avg_cld*1000; 

}
////////////////////////////////////////////////////////////////////////////////////////////////////////

void sensor_data_upload_to_blynk_or_save_in_fram()
{
  if(previous_minute!=present_minute)
  {
    previous_minute=present_minute;
    minute_change_flag=1;  
  }

  if((currentMillis - cloud_update_base_time) >= CLOUD_UPDATE_TIME) 
  {
    cloud_update_base_time=millis(); 
    if (wifi_connected())           { cloud_update();          /* fram_data_upload_to_blynk(); */ }
    //else if(minute_change_flag==1)  { log_data_save_in_fram();  minute_change_flag=0;         }
  }// blynk update 
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
void cloud_update()
{
  /**************IMPORTTANT TO NOTICE ***************/
  // You can send any value at any time.
  //Please don't send more that 10 values per second.
  /**************************************************/
  if(cloud_update_flag==0)
  {
    
    Blynk.virtualWrite(V14, pc25_avg_disp); 
    Blynk.virtualWrite(V13, pm25_avg_cld); 
     if (pm25_avg_cld < PM25_R2_LOW)       { Blynk.setProperty(V13, "color", "#ACD162"); }// Green
    else if (pm25_avg_cld < PM25_R3_LOW)   { Blynk.setProperty(V13, "color", "#F7D460"); }// Yellow
    else if (pm25_avg_cld < PM25_R4_LOW)   { Blynk.setProperty(V13, "color", "#FD9957"); }// Orange
    else if (pm25_avg_cld < PM25_R5_LOW)   { Blynk.setProperty(V13, "color", "#F5676B"); }// Red
    else if (pm25_avg_cld < PM25_R6_LOW)   { Blynk.setProperty(V13, "color", "#A37DB7"); } // Purple
    else if (pm25_avg_cld >= PM25_R6_LOW)  { Blynk.setProperty(V13, "color", "#9E7684"); } // Dark Purple

    Blynk.virtualWrite(V2, hcho_cld); 
         if (hcho_cld < HCHO_R2_LOW)   { Blynk.setProperty(V2, "color", "#ACD162"); }// Green
    else if (hcho_cld < HCHO_R3_LOW)   { Blynk.setProperty(V2, "color", "#F7D460"); }// Yellow
    else if (hcho_cld < HCHO_R4_LOW)   { Blynk.setProperty(V2, "color", "#FD9957"); }// Orange
    else if (hcho_cld < HCHO_R5_LOW)   { Blynk.setProperty(V2, "color", "#F5676B"); }// Red
    else if (hcho_cld < HCHO_R6_LOW)   { Blynk.setProperty(V2, "color", "#A37DB7"); } // Purple
    else if (hcho_cld >= HCHO_R6_LOW)  { Blynk.setProperty(V2, "color", "#9E7684"); } // Dark Purple


    Blynk.virtualWrite(V3, co2_disp);
         if (co2_disp <  701)         { Blynk.setProperty(V3, "color", "#ACD162"); }// Green 
    else if (co2_disp < 1001)         { Blynk.setProperty(V3, "color", "#F7D460"); }// Yellow
    else if (co2_disp < 1501)         { Blynk.setProperty(V3, "color", "#FD9957"); }// OrangE
    else if (co2_disp < 5001)         { Blynk.setProperty(V3, "color", "#F5676B"); }// Red
    else if (co2_disp >= 5001)        { Blynk.setProperty(V3, "color", "#A37DB7"); } // Purple


    Blynk.virtualWrite(V4, vocIndex_disp); 
         if (vocIndex_disp < VOC_R2_LOW)    { Blynk.setProperty(V4, "color", "#ACD162"); } // Green
    else if (vocIndex_disp < VOC_R3_LOW)    { Blynk.setProperty(V4, "color", "#F7D460"); } // Yellow
    else if (vocIndex_disp < VOC_R4_LOW)    { Blynk.setProperty(V4, "color", "#FD9957"); } // OrangE
    else if (vocIndex_disp < VOC_R5_LOW)    { Blynk.setProperty(V4, "color", "#F5676B"); } // Red
    else if (vocIndex_disp < VOC_R6_LOW)    { Blynk.setProperty(V4, "color", "#A37DB7"); } // Purple
    else if (vocIndex_disp >= VOC_R6_LOW)   { Blynk.setProperty(V4, "color", "#9E7684"); } // Dark Purple

    Blynk.virtualWrite(V17, noxIndex_disp);
         if (noxIndex_disp < NOx_R2_LOW)    { Blynk.setProperty(V17, "color", "#ACD162"); } // Green
    else if (noxIndex_disp < NOx_R3_LOW)    { Blynk.setProperty(V17, "color", "#F7D460"); } // Yellow
    else if (noxIndex_disp < NOx_R4_LOW)    { Blynk.setProperty(V17, "color", "#FD9957"); } // Orange
    else if (noxIndex_disp < NOx_R5_LOW)    { Blynk.setProperty(V17, "color", "#F5676B"); } // Red
    else if (noxIndex_disp < NOx_R6_LOW)    { Blynk.setProperty(V18, "color", "#A37DB7"); } // Purple
    else if (noxIndex_disp >= NOx_R6_LOW)   { Blynk.setProperty(V18, "color", "#9E7684"); } // Dark Purple

    Blynk.virtualWrite(V18, actual_aqi );
         if (actual_aqi < AQI_R2_LOW)     { Blynk.setProperty(V18, "color", "#ACD162"); } // Green
    else if (actual_aqi < AQI_R3_LOW)     { Blynk.setProperty(V18, "color", "#F7D460"); } // Yellow
    else if (actual_aqi < AQI_R4_LOW)     { Blynk.setProperty(V18, "color", "#FD9957"); } // Orange
    else if (actual_aqi < AQI_R5_LOW)     { Blynk.setProperty(V18, "color", "#F5676B"); } // Red
    else if (actual_aqi < AQI_R6_LOW)     { Blynk.setProperty(V18, "color", "#A37DB7"); } // Purple
    else if (actual_aqi >= AQI_R6_LOW)    { Blynk.setProperty(V18, "color", "#9E7684"); } // Dark Purple
  }
  
  if(cloud_update_flag==1)
  {
    // if(pm_unit==0)  { Blynk.virtualWrite(V21, "#/ft³"); Blynk.virtualWrite(V22, "µg/ft³"); }
    // else if(pm_unit==1)  { Blynk.virtualWrite(V21, "#/m³"); Blynk.virtualWrite(V22, "µg/m³"); }

    // if(temp_unit==0) {  Blynk.virtualWrite(V23, "°F");}
    // else if(temp_unit==1) { Blynk.virtualWrite(V23, "°C"); }

    // for blynk 1=ft³; 2=m³;
    uint8_t pm_unit_cld=pm_unit+1;
    Blynk.virtualWrite(V21, pm_unit_cld); // for pm
    Blynk.virtualWrite(V22, pm_unit_cld); // for pc
    Blynk.virtualWrite(V5, pm01_avg_cld); 
    Blynk.virtualWrite(V6, pc01_avg_disp);
    Blynk.virtualWrite(V7, pm03_avg_cld);
    Blynk.virtualWrite(V8, pc03_avg_disp); 
    Blynk.virtualWrite(V9, pm05_avg_cld); 
    Blynk.virtualWrite(V10, pc05_avg_disp); 
    Blynk.virtualWrite(V11, pm1_avg_cld); 
    Blynk.virtualWrite(V12, pc1_avg_disp);    
  }
  if(cloud_update_flag==2)
  {
    Blynk.virtualWrite(V15, pm5_avg_cld); 
    Blynk.virtualWrite(V16, pc5_avg_disp);
    Blynk.virtualWrite(V19, pm10_avg_cld);
    Blynk.virtualWrite(V20, pc10_avg_disp);
    Blynk.virtualWrite(V0, aht_humid_cld); 
    Blynk.virtualWrite(V1, aht_temp_cld); 
    // for blynk 1=°F; 2=°C;
    uint8_t temp_unit_cld=temp_unit+1;
    Blynk.virtualWrite(V23, temp_unit_cld);
    Blynk.virtualWrite(V24, event_status_cld);
  }
  cloud_update_flag++;  
  if(cloud_update_flag==3) { cloud_update_flag=0; }
//  Serial.println("Cloud updated\n"); 
}
//////////////////////////////////////////////////////////////////////////EEPROM RETAIN///////////////////////////////////////////////////////////////
void eep_read()
{
  pm_unit=EEPROM.read(PM_UNIT_EEP_START_ADDR);
  if(pm_unit==1){pm_unit=1;} else {pm_unit=0;}
  prev_pm_unit=pm_unit; new_pm_unit=pm_unit;
  Serial.print("\n pm_unit : ");  Serial.println(pm_unit);

  temp_unit=EEPROM.read(TEMP_UNIT_EEP_START_ADDR);
  if(temp_unit==1){temp_unit=1;} else {temp_unit=0;}
  new_temperature_unit=temp_unit;
  Serial.print("\n Temperature_unit : ");  Serial.println(temp_unit);
  
  char temp_auth[40] ={0};
  for (int i=0; i<40;i++) 
  { 
    temp_auth[i]=EEPROM.read(AUTH_EEP_START_ADDR+i);
    if(temp_auth[i]!='\0'){auth[i]=temp_auth[i];}
    else{i=40;}
  }
  Serial.print("\n AUTH TOKEN : ");  Serial.println(auth);
}
////////////////////////////////////////////////////////////////GET DATE AND TIME FROM BLYNK/////////////////////////////////////////////////////////////////////////////
BLYNK_CONNECTED() {
    // Send requests for different internal data
    // Request what is actually needed for your use-case
    Blynk.sendInternal("utc", "tz_name");   // Name of timezone
    Blynk.sendInternal("utc", "iso");       // ISO-8601 formatted time
    Blynk.sendInternal("utc", "time");      // Unix timestamp (with msecs)
    Blynk.sendInternal("utc", "tz");        // Timezone and DST offsets
    Blynk.sendInternal("utc", "tz_rule");   // POSIX TZ rule
    Blynk.sendInternal("utc", "dst_next");  // Up to 2 next time offset changes (due to DST)
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Receive UTC data
BLYNK_WRITE(InternalPinUTC) {
   // int datetime;
    String cmd = param[0].asStr();
    if (cmd == "time") 
    {
        uint64_t utc_time = param[1].asLongLong();
        Serial.print("Unix time (UTC): "); Serial.println(utc_time);
        
    } 
    else if (cmd == "iso") 
    {
        String iso_time = param[1].asStr();
        Serial.print("ISO-8601 time:   "); Serial.println(iso_time);
        int str_len = iso_time.length()+1; 
      
        // Prepare the character array (the buffer) 
        char char_array[str_len];
        
        // Copy it over 
        iso_time.toCharArray(char_array, str_len);
        Serial.print(" DATE AND TIME :");
        for(int i=0;i<str_len;i++){Serial.print(char_array[i]);}   Serial.println();

        char* temp_array = char_array;
        token1=strtok(temp_array,"-");
        token2 =strtok(NULL,"-");
        token3 =strtok(NULL,"T");
        token4 =strtok(NULL,":");
        token5 =strtok(NULL,":");
        token6 =strtok(NULL,"+");
        temp_year=atoi(token1);
        Serial.print("YEAR :");Serial.println(temp_year);
        temp_month=atoi(token2); 
        Serial.print("MONTH:"); Serial.println(temp_month);
        temp_date=atoi(token3);
        Serial.print("DATE :");Serial.println(temp_date);
        temp_hour=atoi(token4); 
        Serial.print("HOUR:"); Serial.println(temp_hour);
        temp_minute=atoi(token5); 
        Serial.print("MINUTE:"); Serial.println(temp_minute);
        temp_second=atoi(token6); 
        Serial.print("SECOND:"); Serial.println(temp_second);
             
    } 
    else if (cmd == "tz") 
    {
        long tz_offset = param[1].asInt();
        long dst_offset = param[2].asInt();
        Serial.print("TZ offset:       "); Serial.print(tz_offset);  Serial.println(" minutes");
        Serial.print("DST offset:      "); Serial.print(dst_offset); Serial.println(" minutes");
        tz_offset_ms=tz_offset*60*1000;
        Serial.print("tz_offset_ms:      "); Serial.print(tz_offset_ms); Serial.println(" ms");
    } 
    else if (cmd == "tz_name") 
    {
        String tz_name = param[1].asStr();
        Serial.print("Timezone:        "); Serial.println(tz_name);
    
    } 
    else if (cmd == "tz_rule") 
    {
        String tz_rule = param[1].asStr(); 
        Serial.print("POSIX TZ rule:   "); Serial.println(tz_rule);
   
    } 
    else if (cmd == "dst_next") 
    {
        uint32_t next1_ts  = param[1].asLong();
        int next1_off       = param[2].asInt();

        uint32_t next2_ts  = param[3].asLong();
        int next2_off       = param[4].asInt();
        
        Serial.print("Next offset changes: ");
        Serial.print(next1_off); Serial.print("min. on "); Serial.print(next1_ts);
        Serial.print(", ");
        Serial.print(next2_off); Serial.print("min. on "); Serial.print(next2_ts);
        Serial.println();
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
char* split_char(char* token)
{
  int32_t i, len, j;
  i = 0;
  len = strlen(token);
  
  while(i < len)
  {
    if(token[i] =='"')
    {
      j = i;
      while(token[j+1]!='"')
      {
        token[j] = token[j + 1];
        j++;
      }
      token[j]='\0';
      return 0;
    }
    else
    {
      token[i]='\0';
      i++;
    }
  }
  return token;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////
 uint8_t check_i2c_for(uint8_t address)
{
  byte error;
  address=(byte)address;

  Wire.beginTransmission(address);
  error = Wire.endTransmission();
  if (error == 0) 
  { 
    return 1; 
  }
  else if (error == 4) 
  {
    Serial.print("Unknown error at address 0x");  if (address < 16) {Serial.print("0"); } Serial.println(address, HEX);
    return 0;
  }
  else
  { 
    Serial.print("Devices with I2C address \"0x"); if (address < 16) {Serial.print("0"); } Serial.print(address, HEX); Serial.print("\" not found\n");
    return 0;
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
void log_data_save_in_fram()
{
    log_minute=ext_rtc_minute;
    log_hour=ext_rtc_hour;
    log_date=ext_rtc_date;
    log_month=ext_rtc_month;
    log_year=ext_rtc_year;
    log_data_split_to_log_array();
    save_log_array_in_fram();
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
void save_log_array_in_fram()
{
	uint16_t base_address=(fram_address)*LOG_FRAMR_SIZE;
	uint8_t rb_data =0, lcnt=0, wr_status=1;
	Serial.print("log_array write :");
	for (int i=0; i<LOG_FRAMR_SIZE; i++)
	{
		fram.write8((base_address+i), log_array[i]);
		rb_data = 0;
		rb_data = fram.read8((base_address+i));
		if (rb_data != log_array[i]) { lcnt++; i--;} else lcnt=0;
		if (lcnt>=5) {i=LOG_FRAMR_SIZE;wr_status=0;}
    Serial.print(log_array[i]);
	}
  Serial.println("\n");
	
	if (wr_status==1) {increment_fram_pack_size();}
  Serial.print("\nincrement_fram_pack_size : "); Serial.println(fram_pack_size);

}

void fram_data_upload_to_blynk()
{
  if (fram_pack_size>=1) 
	{
    read_fram_log_data_array();
    log_data_merge_from_fram_log_array();
    past_data_upload_to_blynk();
  }
}

void read_fram_log_data_array()
{
  if ((fram_address==0)&&(fram_pack_size!=0)) {fram_address=MAX_FRAM_SIZE;}	
  int base_address=fram_address;
  base_address=(base_address-1)*LOG_FRAMR_SIZE;
  Serial.print("fram_log_array read :");
  for (int i=0; i<LOG_FRAMR_SIZE; i++) { fram_log_array[i]=fram.read8((base_address+i)); Serial.print(fram_log_array[i]); }
  Serial.println("\n");
  decrement_fram_pack_size();
  for (int i=0; i<LOG_FRAMR_SIZE; i++) { fram.write8((base_address+i), 0); }	//CLEAR FRAM DATA AFTER READ DATA
  Serial.print("\ndecrement_fram_pack_size : "); Serial.println(fram_pack_size);
}

void log_data_merge_from_fram_log_array()
{
  /********************************************************************/
  /*
    memcpy is part of the AVR Libc. We can use this function without tagging libraries 
  */
  fram_log_date=fram_log_array[0];
  fram_log_month=fram_log_array[1];
  fram_log_year=fram_log_array[2]|fram_log_array[3]<<8;
  fram_log_hour=fram_log_array[4];
  fram_log_minute=fram_log_array[5];
  fram_sen_temp_cld=fram_log_array[6];
  fram_sen_humid_cld=fram_log_array[7];
  fram_temp_unit=fram_log_array[8];
  fram_pm_unit=fram_log_array[9];

  Serial.print("\nfram_log_date :");Serial.print(fram_log_date);
  Serial.print("\nfram_log_month :");Serial.print(fram_log_month);
  Serial.print("\nfram_log_year :");Serial.print(fram_log_year);
  Serial.print("\nfram_log_hour :");Serial.print(fram_log_hour);
  Serial.print("\nfram_log_minute :");Serial.print(fram_log_minute);

  //pm01_avg_cld=fram_log_array[0]|fram_log_array[0]<<8|fram_log_array[0]<<16|fram_log_array[0]<<24;
  memcpy(&fram_pm01_avg_cld, &fram_log_array[10], sizeof(float)); // Copy bytes into float
  fram_pc01_avg_disp=fram_log_array[14]|fram_log_array[15]<<8|fram_log_array[16]<<16|fram_log_array[17]<<24;

  //pm03_avg_cld=fram_log_array[18]|fram_log_array[19]<<8|fram_log_array[20]<<16|fram_log_array[21]<<24;
  memcpy(&fram_pm03_avg_cld, &fram_log_array[18], sizeof(float)); // Copy bytes into float
  fram_pc03_avg_disp=fram_log_array[22]|fram_log_array[23]<<8|fram_log_array[24]<<16|fram_log_array[25]<<24;

  //pm05_avg_cld=fram_log_array[26]|fram_log_array[27]<<8|fram_log_array[28]<<16|fram_log_array[29]<<24;
  memcpy(&fram_pm05_avg_cld, &fram_log_array[26], sizeof(float)); // Copy bytes into float
  fram_pc05_avg_disp=fram_log_array[30]|fram_log_array[31]<<8|fram_log_array[32]<<16|fram_log_array[33]<<24;

  //pm1_avg_cld=fram_log_array[34]|fram_log_array[35]<<8|fram_log_array[36]<<16|fram_log_array[37]<<24;
  memcpy(&fram_pm1_avg_cld, &fram_log_array[34], sizeof(float)); // Copy bytes into float
  fram_pc1_avg_disp=fram_log_array[38]|fram_log_array[39]<<8|fram_log_array[40]<<16|fram_log_array[41]<<24;

  //pm25_avg_cld=fram_log_array[42]|fram_log_array[43]<<8|fram_log_array[44]<<16|fram_log_array[45]<<24;
  memcpy(&fram_pc1_avg_disp, &fram_log_array[42], sizeof(float)); // Copy bytes into float
  fram_pc25_avg_disp=fram_log_array[46]|fram_log_array[47]<<8|fram_log_array[48]<<16|fram_log_array[49]<<24;

  //pm5_avg_cld=fram_log_array[50]|fram_log_array[51]<<8|fram_log_array[52]<<16|fram_log_array[53]<<24;
  memcpy(&fram_pm5_avg_cld, &fram_log_array[50], sizeof(float)); // Copy bytes into float
  fram_pc5_avg_disp=fram_log_array[54]|fram_log_array[55]<<8|fram_log_array[56]<<16|fram_log_array[57]<<24;

  //pm10_avg_cld=fram_log_array[58]|fram_log_array[59]<<8|fram_log_array[60]<<16|fram_log_array[61]<<24;
  memcpy(&fram_pm10_avg_cld, &fram_log_array[58], sizeof(float)); // Copy bytes into float
  fram_pc10_avg_disp=fram_log_array[62]|fram_log_array[63]<<8|fram_log_array[64]<<16|fram_log_array[65]<<24;

  //hcho_cld=fram_log_array[66]|fram_log_array[67]<<8;
  memcpy(&fram_hcho_cld, &fram_log_array[66], sizeof(float)); // Copy bytes into float

  fram_co2_disp=fram_log_array[70]|fram_log_array[71]<<8;
  fram_vocIndex_disp=fram_log_array[72]|fram_log_array[73]<<8;
  fram_noxIndex_disp=fram_log_array[74]|fram_log_array[75]<<8;
  fram_actual_aqi=fram_log_array[76]|fram_log_array[77]<<8;
  fram_event_status_cld=fram_log_array[78]|fram_log_array[79]<<8;
}

void past_data_upload_to_blynk()
{

  /**************************************************/
  /*
  uint64_t ts = (uint64_t)UTC.now() * 1000 + UTC.ms(LAST_READ);
  Blynk.beginGroup(ts);
  ...
  Blynk.endGroup();
  */
  /**************************************************/
  //uint64_t ts = (uint64_t)UTC.now() * 1000 + UTC.ms(LAST_READ);
  //Serial.print("\nts : ");  Serial.println(ts);
  timestampmillis = (uint64_t)convertToEpoch(fram_log_year,fram_log_month,fram_log_date,fram_log_hour,fram_log_minute);
  Serial.print("\ntimestampmillis : ");  Serial.println(timestampmillis);
  ts=timestampmillis-tz_offset_ms;
  Serial.print("\nts : ");  Serial.println(ts);
  Blynk.beginGroup(ts);
    Blynk.virtualWrite(V0, fram_sen_humid_cld); 
    Blynk.virtualWrite(V1, fram_sen_temp_cld);
    Blynk.virtualWrite(V2, fram_hcho_cld); 
    Blynk.virtualWrite(V3, fram_co2_disp);
    Blynk.virtualWrite(V4, fram_vocIndex_disp); 
    Blynk.virtualWrite(V5, fram_pm01_avg_cld); 
    Blynk.virtualWrite(V6, fram_pc01_avg_disp);
    Blynk.virtualWrite(V7, fram_pm03_avg_cld);
    Blynk.virtualWrite(V8, fram_pc03_avg_disp); 
    Blynk.virtualWrite(V9, fram_pm05_avg_cld); 
    Blynk.virtualWrite(V10, fram_pc05_avg_disp); 
    Blynk.virtualWrite(V11, fram_pm1_avg_cld); 
    Blynk.virtualWrite(V12, fram_pc1_avg_disp); 
    Blynk.virtualWrite(V13, fram_pm25_avg_cld); 
    Blynk.virtualWrite(V14, fram_pc25_avg_disp);
    Blynk.virtualWrite(V15, fram_pm5_avg_cld); 
    Blynk.virtualWrite(V16, fram_pc5_avg_disp);
    Blynk.virtualWrite(V17, fram_noxIndex_disp);
    Blynk.virtualWrite(V18, fram_actual_aqi );
    Blynk.virtualWrite(V19, fram_pm10_avg_cld);
    Blynk.virtualWrite(V20, fram_pc10_avg_disp );
    // if(fram_pm_unit==0)  { Blynk.virtualWrite(V21, "#/ft³"); Blynk.virtualWrite(V22, "µg/ft³"); }
    // else if(fram_pm_unit==1)  { Blynk.virtualWrite(V21, "#/m³"); Blynk.virtualWrite(V22, "µg/m³"); }
    // if(fram_temp_unit==0) {  Blynk.virtualWrite(V23, "°F");}
    // else if(fram_temp_unit==1) { Blynk.virtualWrite(V23, "°C"); }
    Blynk.virtualWrite(V21, fram_pm_unit); 
    Blynk.virtualWrite(V22, fram_pm_unit);
    Blynk.virtualWrite(V23, fram_temp_unit);
    Blynk.virtualWrite(V24, fram_event_status_cld );
  Blynk.endGroup();
}


long long convertToEpoch(uint16_t year, uint8_t month, uint8_t date, uint8_t hour, uint8_t minute)
{
    struct tm timeStruct = {0};
    timeStruct.tm_year = year - 1900;  // years since 1900
    timeStruct.tm_mon = month - 1;     // months range from 0 to 11
    timeStruct.tm_mday = date;
    timeStruct.tm_hour = hour;
    timeStruct.tm_min = minute;
    timeStruct.tm_sec = 1;

    time_t epochTime = mktime(&timeStruct);

    if (epochTime == -1) 
    {
        // Error handling if mktime fails
        perror("Error converting date and time");
        return -1;
    }

    // Convert seconds to milliseconds
    long long milliseconds = (long long)epochTime * 1000;
    Serial.print("\n milliseconds : ");  Serial.println(milliseconds);
    return milliseconds;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////
void log_data_split_to_log_array()
{
  log_array[0]=log_date;      
  log_array[1]=log_month;     
  log_array[2]=log_year;   log_array[3]=(log_year >> 8);     
  log_array[4]=log_hour;    
  log_array[5]=log_minute;   
  log_array[6]=sen_temp_cld;   
  log_array[7]=sen_humid_cld;
  log_array[8]=temp_unit;      
  log_array[9]=pm_unit;

  memcpy(&log_array[10], &pm01_avg_cld, sizeof(float)); // Copy float bytes
  //log_array[10]=pm01_avg_cld;   log_array[11]=(pm01_avg_cld >> 8);   log_array[12]=(pm01_avg_cld >> 16);    log_array[13]=(pm01_avg_cld >> 24);
  log_array[14]=pc01_avg_disp;  log_array[15]=(pc01_avg_disp >> 8);  log_array[16]=(pc01_avg_disp >> 16);   log_array[17]=(pc01_avg_disp >> 24);

  memcpy(&log_array[18], &pm03_avg_cld, sizeof(float)); // Copy float bytes
  //log_array[18]=pm03_avg_cld;   log_array[19]=(pm03_avg_cld >> 8);   log_array[20]=(pm03_avg_cld >> 16);    log_array[21]=(pm03_avg_cld >> 24);
  log_array[22]=pc03_avg_disp;  log_array[23]=(pc03_avg_disp >> 8);  log_array[24]=(pc03_avg_disp >> 16);   log_array[25]=(pc03_avg_disp >> 24);

  memcpy(&log_array[26], &pm05_avg_cld, sizeof(float)); // Copy float bytes
  //log_array[26]=pm05_avg_cld;   log_array[27]=(pm05_avg_cld >> 8);   log_array[28]=(pm05_avg_cld >> 16);    log_array[29]=(pm05_avg_cld >> 24);
  log_array[30]=pc05_avg_disp;  log_array[31]=(pc05_avg_disp >> 8);  log_array[32]=(pc05_avg_disp >> 16);   log_array[33]=(pc05_avg_disp >> 24);

  memcpy(&log_array[34], &pm1_avg_cld, sizeof(float)); // Copy float bytes
  //log_array[34]=pm1_avg_cld;    log_array[35]=(pm1_avg_cld >> 8);    log_array[36]=(pm1_avg_cld >> 16);     log_array[37]=(pm1_avg_cld >> 24);
  log_array[38]=pc1_avg_disp;   log_array[39]=(pc1_avg_disp >> 8);   log_array[40]=(pc1_avg_disp >> 16);    log_array[41]=(pc1_avg_disp >> 24);
  
  memcpy(&log_array[42], &pm25_avg_cld, sizeof(float)); // Copy float bytes
  //log_array[42]=pm25_avg_cld;   log_array[43]=(pm25_avg_cld >> 8);   log_array[44]=(pm25_avg_cld >> 16);    log_array[45]=(pm25_avg_cld >> 24);
  log_array[46]=pc25_avg_disp;  log_array[47]=(pc25_avg_disp >> 8);  log_array[48]=(pc25_avg_disp >> 16);   log_array[49]=(pc25_avg_disp >> 24);

  memcpy(&log_array[50], &pm5_avg_cld, sizeof(float)); // Copy float bytes
  //log_array[50]=pm5_avg_cld;    log_array[51]=(pm5_avg_cld >> 8);    log_array[52]=(pm5_avg_cld >> 16);     log_array[53]=(pm5_avg_cld >> 24);
  log_array[54]=pc5_avg_disp;   log_array[55]=(pc5_avg_disp >> 8);   log_array[56]=(pc5_avg_disp >> 16);    log_array[57]=(pc5_avg_disp >> 24);

  memcpy(&log_array[58], &pm10_avg_cld, sizeof(float)); // Copy float bytes
  //log_array[58]=pm10_avg_cld;   log_array[59]=(pm10_avg_cld >> 8);   log_array[60]=(pm10_avg_cld >> 16);    log_array[61]=(pm10_avg_cld >> 24);
  log_array[62]=pc10_avg_disp;  log_array[63]=(pc10_avg_disp >> 8);  log_array[64]=(pc10_avg_disp >> 16);   log_array[65]=(pc10_avg_disp >> 24);

  memcpy(&log_array[66], &hcho_cld, sizeof(float)); // Copy float bytes
  //log_array[66]=hcho_cld;        log_array[67]=(hcho_cld >> 8);  
  log_array[70]=co2_disp;        log_array[71]=(co2_disp >> 8);
  log_array[72]=vocIndex_disp;   log_array[73]=(vocIndex_disp >> 8);
  log_array[74]=noxIndex_disp;   log_array[75]=noxIndex_disp >> 8;
  log_array[76]=actual_aqi;      log_array[77]=(actual_aqi >> 8);
  log_array[78]=event_status_cld; log_array[79]=(event_status_cld >> 8);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////

void increment_fram_pack_size()
{
	fram_pack_size++;fram_address++;
	if ((fram_pack_size>=MAX_FRAM_SIZE)&&(fram_address>=MAX_FRAM_SIZE)) {fram_pack_size=MAX_FRAM_SIZE;fram_address=0;}
	if (fram_pack_size>MAX_FRAM_SIZE) { fram_pack_size=MAX_FRAM_SIZE; }
	
	fram.write16(FRAM_PACK_SIZE_ADDR,fram_pack_size);
	fram.write16(FRAM_ADDRESS_ADDR,fram_address);
}

void decrement_fram_pack_size()
{
	fram_pack_size--;fram_address--;
	if ((fram_address!=0) && (fram_pack_size==0)) { fram_address=0; }
	
	fram.write16(FRAM_PACK_SIZE_ADDR,fram_pack_size);
	fram.write16(FRAM_ADDRESS_ADDR,fram_address);
}


void fram_pack_clear()
{
  fram.write16(FRAM_PACK_SIZE_ADDR, 0x0000);
  fram.write16(FRAM_ADDRESS_ADDR, 0x0000);
  fram_address=fram.read16(FRAM_ADDRESS_ADDR);
  fram_pack_size=fram.read16(FRAM_PACK_SIZE_ADDR);
  Serial.println("PACK MEMORY ERASED.");
  Serial.print("fram_address   : "); Serial.print(fram_address);
  Serial.print("fram_pack_size : "); Serial.print(fram_pack_size);
  // uint32_t start;  uint32_t stop;

  // start = micros();
  // for (uint32_t addr = 0; addr < LOG_FRAMR_END_ADDR; addr++)
  // {
  //   fram.write8(addr, 0x00);
  // }
  // stop = micros();
  // Serial.print("BYTES 1:\t");
  // Serial.print(stop - start);
  // Serial.print(" ==> \t");
  // Serial.print((stop - start) * 1.0 / 32768.0);
  // Serial.println(" us/byte");
}

void tz_offset_values_update()
{
  if(prev_tz_offset_ms!=tz_offset_ms)
  {
    sam_ip_status=digitalRead(SAM_I2C_READ_IP);
    if (sam_ip_status==LOW)  
    { 
      ESP_I2C_ON; 
      prev_tz_offset_ms=tz_offset_ms;
      uint8_t temp_data_array[4]={0};
      temp_data_array[0]=tz_offset_ms;
      temp_data_array[1]=tz_offset_ms>>8;
      temp_data_array[2]=tz_offset_ms>>16;
      temp_data_array[3]=tz_offset_ms>>24;
      for (int i=0;i<4;i++)  { fram.write8(TZ_OFFSET_MS_ADDR+i,temp_data_array[i]); }
      fram_pack_clear();
      ESP_I2C_OFF; 
    }
  }
}

void read_tz_offset_values()
{
  uint8_t temp_data_array[4]={0};
  for (int i=0;i<4;i++)  { temp_data_array[i]=fram.read8(TZ_OFFSET_MS_ADDR+i); }
  tz_offset_ms=temp_data_array[0]|temp_data_array[1]<<8|temp_data_array[2]<<16|temp_data_array[3]<<24;
  prev_tz_offset_ms=tz_offset_ms;
}

void sam_live_check()
{
  if((currentMillis - sam_live_check_cnt_inc_basetime) >= SAM_LIVE_CHECK_CNT_INCREMENT_INTERVAL_TIME)
  {
    sam_live_check_cnt++;
    if(sam_live_check_cnt>180 ) 
    { 
      sam_ip_status=digitalRead(SAM_I2C_READ_IP);
      if (sam_ip_status==LOW)  
      { 
        ESP_I2C_ON; 
        sam_live_check_cnt=0; sam_reset_cnt++;
        if (sam_reset_cnt>250) {sam_reset_cnt=1;}
        fram.write8(SAM_RST_CNT_ADDR, sam_reset_cnt);
        sam_reset_flag=1;
        ESP_I2C_OFF;
      }      
    }
    if (sam_reset_flag==1)
    {
      delay(2000);
      sam_reset_flag=0; INIT_SAM_RESET_PIN; 
      Serial.println("\n SAM_RESET_INIT"); 
      SAM_RESET_EN; Serial.println("\n SAM_RESET_EN"); 
      delay(150); 
      SAM_RESET_DIS; Serial.println("\n SAM_RESET_DIS");
    }
    sam_live_check_cnt_inc_basetime=millis(); 
  }
}

void reset_sam()
{
    if (data_rx[0]==1) {sam_reset_flag=1;}
    sam.write(SOC);    sam.write(DEFAULT_RESPONSE_LENGTH);    sam.write(recv_func_code);    sam.write(sam_reset_flag);    sam.write(EOC);
    Serial.print(SOC); Serial.print(DEFAULT_RESPONSE_LENGTH); Serial.print(recv_func_code); Serial.print(sam_reset_flag); Serial.print(EOC);
}



void printStatus()
{
  switch (aht20.getStatus())
  {
    case AHTXX_NO_ERROR:
      Serial.println(F("no error"));
      break;

    case AHTXX_BUSY_ERROR:
      Serial.println(F("sensor busy, increase polling time"));
      break;

    case AHTXX_ACK_ERROR:
      Serial.println(F("sensor didn't return ACK, not connected, broken, long wires (reduce speed), bus locked by slave (increase stretch limit)"));
      break;

    case AHTXX_DATA_ERROR:
      Serial.println(F("received data smaller than expected, not connected, broken, long wires (reduce speed), bus locked by slave (increase stretch limit)"));
      break;

    case AHTXX_CRC8_ERROR:
      Serial.println(F("computed CRC8 not match received CRC8, this feature supported only by AHT2x sensors"));
      break;

    default:
      Serial.println(F("unknown status"));    
      break;
  }
}


// ------------------- Formula -------------------
uint16_t calculate_aqi(uint32_t reading, uint32_t aqi_low, uint32_t aqi_high, float bp_low, float bp_high)
{
  //AQI =((IHi − ILo)/(PMHi − PMLo))*(pm25_avg - ILo)+ILo 
  float AQI_INDEX = (uint16_t)(((float)(aqi_high - aqi_low) / (bp_high - bp_low)) * (reading - bp_low) + aqi_low);
  if(AQI_INDEX>500) { AQI_INDEX=500; }
  return (uint16_t)(AQI_INDEX + 0.5);  // round off
}

// ------------------- PM2.5 -------------------
uint16_t calculate_pm25_aqi(float value)
{
       if (value < PM25_R2_LOW)   {  return calculate_aqi(value, AQI_R1_LOW, AQI_R1_HIGH, PM25_R1_LOW, PM25_R1_HIGH); }
  else if (value < PM25_R3_LOW)   {  return calculate_aqi(value, AQI_R2_LOW, AQI_R2_HIGH, PM25_R2_LOW, PM25_R2_HIGH); }
  else if (value < PM25_R4_LOW)   {  return calculate_aqi(value, AQI_R3_LOW, AQI_R3_HIGH, PM25_R3_LOW, PM25_R3_HIGH); }
  else if (value < PM25_R5_LOW)   {  return calculate_aqi(value, AQI_R4_LOW, AQI_R4_HIGH, PM25_R4_LOW, PM25_R4_HIGH); }
  else if (value < PM25_R6_LOW)   {  return calculate_aqi(value, AQI_R5_LOW, AQI_R5_HIGH, PM25_R5_LOW, PM25_R5_HIGH); }
  else if (value >= PM25_R6_LOW)  {  return calculate_aqi(value, AQI_R6_LOW, AQI_R6_HIGH, PM25_R6_LOW, PM25_R6_HIGH); }
}

// ------------------- PM10 -------------------
uint16_t calculate_pm10_aqi(float value)
{
       if (value < PM10_R2_LOW)    { return calculate_aqi(value, AQI_R1_LOW, AQI_R1_HIGH, PM10_R1_LOW, PM10_R1_HIGH);  }
  else if (value < PM10_R3_LOW)    { return calculate_aqi(value, AQI_R2_LOW, AQI_R2_HIGH, PM10_R2_LOW, PM10_R2_HIGH);  }
  else if (value < PM10_R4_LOW)    { return calculate_aqi(value, AQI_R3_LOW, AQI_R3_HIGH, PM10_R3_LOW, PM10_R3_HIGH);  }
  else if (value < PM10_R5_LOW)    { return calculate_aqi(value, AQI_R4_LOW, AQI_R4_HIGH, PM10_R4_LOW, PM10_R4_HIGH);  }
  else if (value < PM10_R6_LOW)    { return calculate_aqi(value, AQI_R5_LOW, AQI_R5_HIGH, PM10_R5_LOW, PM10_R5_HIGH);  }
  else if (value >= PM10_R6_LOW)   { return calculate_aqi(value, AQI_R6_LOW, AQI_R6_HIGH, PM10_R6_LOW, PM10_R6_HIGH);  }
}

// ------------------- HCHO -------------------
uint16_t calculate_hcho_aqi(float value)
{
       if (value < HCHO_R2_LOW)   {  return calculate_aqi(value, AQI_R1_LOW, AQI_R1_HIGH, HCHO_R1_LOW, HCHO_R1_HIGH);  }
  else if (value < HCHO_R3_LOW)   {  return calculate_aqi(value, AQI_R2_LOW, AQI_R2_HIGH, HCHO_R2_LOW, HCHO_R2_HIGH);  }
  else if (value < HCHO_R4_LOW)   {  return calculate_aqi(value, AQI_R3_LOW, AQI_R3_HIGH, HCHO_R3_LOW, HCHO_R3_HIGH);  }
  else if (value < HCHO_R5_LOW)   {  return calculate_aqi(value, AQI_R4_LOW, AQI_R4_HIGH, HCHO_R4_LOW, HCHO_R4_HIGH);  }
  else if (value < HCHO_R6_LOW)   {  return calculate_aqi(value, AQI_R5_LOW, AQI_R5_HIGH, HCHO_R5_LOW, HCHO_R5_HIGH);  }
  else if (value >= HCHO_R6_LOW)  {  return calculate_aqi(value, AQI_R6_LOW, AQI_R6_HIGH, HCHO_R6_LOW, HCHO_R6_HIGH);  }
}

// ------------------- VOC -------------------
uint16_t calculate_voc_aqi(float value)
{
  if (value < VOC_R2_LOW)        {  return calculate_aqi(value, AQI_R1_LOW, AQI_R1_HIGH, VOC_R1_LOW, VOC_R1_HIGH);  }
  else if (value < VOC_R3_LOW)   {  return calculate_aqi(value, AQI_R2_LOW, AQI_R2_HIGH, VOC_R2_LOW, VOC_R2_HIGH);  }
  else if (value < VOC_R4_LOW)   {  return calculate_aqi(value, AQI_R3_LOW, AQI_R3_HIGH, VOC_R3_LOW, VOC_R3_HIGH);  }
  else if (value < VOC_R5_LOW)   {  return calculate_aqi(value, AQI_R4_LOW, AQI_R4_HIGH, VOC_R4_LOW, VOC_R4_HIGH);  }
  else if (value < VOC_R6_LOW)   {  return calculate_aqi(value, AQI_R5_LOW, AQI_R5_HIGH, VOC_R5_LOW, VOC_R5_HIGH);  }
  else if (value >= VOC_R6_LOW)  {  return calculate_aqi(value, AQI_R6_LOW, AQI_R6_HIGH, VOC_R6_LOW, VOC_R6_HIGH);  }
}

// ------------------- NOx -------------------
uint16_t calculate_nox_aqi(float value)
{
  if (value < NOx_R2_LOW)        {  return calculate_aqi(value, AQI_R1_LOW, AQI_R1_HIGH, NOx_R1_LOW, NOx_R1_HIGH);  }
  else if (value < NOx_R3_LOW)   {  return calculate_aqi(value, AQI_R2_LOW, AQI_R2_HIGH, NOx_R2_LOW, NOx_R2_HIGH);  }
  else if (value < NOx_R4_LOW)   {  return calculate_aqi(value, AQI_R3_LOW, AQI_R3_HIGH, NOx_R3_LOW, NOx_R3_HIGH);  }
  else if (value < NOx_R5_LOW)   {  return calculate_aqi(value, AQI_R4_LOW, AQI_R4_HIGH, NOx_R4_LOW, NOx_R4_HIGH);  }
  else if (value < NOx_R6_LOW)   {  return calculate_aqi(value, AQI_R5_LOW, AQI_R5_HIGH, NOx_R5_LOW, NOx_R5_HIGH);  }
  else if (value >= NOx_R6_LOW)  {  return calculate_aqi(value, AQI_R6_LOW, AQI_R6_HIGH, NOx_R6_LOW, NOx_R6_HIGH);  }
}

// Inline function to get maximum AQI among 5 parameters
inline uint16_t MAX_AQI(uint16_t a, uint16_t b, uint16_t c, uint16_t d, uint16_t e) 
{
    uint16_t maxVal = a;
    if (b > maxVal) maxVal = b;
    if (c > maxVal) maxVal = c;
    if (d > maxVal) maxVal = d;
    if (e > maxVal) maxVal = e;
    return maxVal;
}

// ===================== MQTT FUNCTIONS =====================

void initMQTT() {
  // Load HiveMQ Cloud Root CA into TLS client
  espClientSecure.setCACert(hivemq_root_ca);   // Use secure connection
  
  // Initialize MQTT client with larger buffer for consolidated payload
  mqttClient.setBufferSize(MQTT_MAX_PACKET_SIZE);
  mqttClient.setServer(MQTT_BROKER_URL, MQTT_BROKER_PORT);
  mqttClient.setCallback(mqttCallback);
  
  // Initialize NTP time client
  timeClient.begin();
  timeClient.update();
  
  Serial.println("MQTT initialized with consolidated payload support");
  Serial.print("MQTT Broker: "); Serial.print(MQTT_BROKER_URL); 
  Serial.print(":"); Serial.println(MQTT_BROKER_PORT);
  Serial.print("Buffer Size: "); Serial.print(MQTT_MAX_PACKET_SIZE); Serial.println(" bytes");
}


void connectMQTT() {
  if (mqttClient.connected()) return;

  Serial.print("Attempting MQTT connection...");
  String clientId = deviceId;

  if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
    Serial.println("MQTT connected!");
    mqttConnected = true;

    String controlTopic = String(MQTT_TOPIC_PREFIX) + deviceId + "/control";
    mqttClient.subscribe(controlTopic.c_str());
  } else {
    Serial.print("MQTT connection failed, rc=");
    Serial.print(mqttClient.state());
    Serial.println(" - will retry in next loop");
    mqttConnected = false;
  }
}


void handleMQTTConnection() {
  if (WiFi.status() != WL_CONNECTED) return; // skip if no WiFi

  if (!mqttClient.connected()) {
    connectMQTT();
  }

  mqttClient.loop();

  if (millis() - lastMqttPublish >= MQTT_PUBLISH_INTERVAL) {
    publishSensorData();
    lastMqttPublish = millis();
  }
}


void publishSensorData() {
  if (!mqttClient.connected()) return;

  String topic = String(MQTT_TOPIC_PREFIX) + deviceId + MQTT_TOPIC_SUFFIX;

  // -------------------- Consolidated Payload with Timestamp --------------------
  // Get current time from timeClient (NTP)
  timeClient.update();
  unsigned long epochTime = timeClient.getEpochTime();
  
  // Format timestamp as ISO 8601
  char timestamp[25];
  time_t rawtime = epochTime;
  struct tm * ti;
  ti = gmtime(&rawtime);
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", ti);
  
  // Build comprehensive JSON payload
  String payload = "{";
  payload += "\"deviceId\":\"" + deviceId + "\",";
  payload += "\"timestamp\":\"" + String(timestamp) + "\",";
  
  // Environmental sensors
  payload += "\"temperature\":" + String(aht_temp_cld) + ",";
  payload += "\"humidity\":" + String(aht_humid_cld) + ",";
  
  // Particle Matter
  payload += "\"pm01\":" + String(pm01_avg_cld) + ",";
  payload += "\"pm03\":" + String(pm03_avg_cld) + ",";
  payload += "\"pm05\":" + String(pm05_avg_cld) + ",";
  payload += "\"pm1\":" + String(pm1_avg_cld) + ",";
  payload += "\"pm25\":" + String(pm25_avg_cld) + ",";
  payload += "\"pm5\":" + String(pm5_avg_cld) + ",";
  payload += "\"pm10\":" + String(pm10_avg_cld) + ",";
  
  // Particle Counts
  payload += "\"pc01\":" + String(pc01_avg_disp) + ",";
  payload += "\"pc03\":" + String(pc03_avg_disp) + ",";
  payload += "\"pc05\":" + String(pc05_avg_disp) + ",";
  payload += "\"pc1\":" + String(pc1_avg_disp) + ",";
  payload += "\"pc25\":" + String(pc25_avg_disp) + ",";
  payload += "\"pc5\":" + String(pc5_avg_disp) + ",";
  payload += "\"pc10\":" + String(pc10_avg_disp) + ",";
  
  // Gas sensors
  payload += "\"co2\":" + String(co2_disp) + ",";
  payload += "\"voc\":" + String(vocIndex_disp) + ",";
  payload += "\"nox\":" + String(noxIndex_disp) + ",";
  payload += "\"hcho\":" + String(hcho_cld) + ",";
  
  // AQI
  payload += "\"aqi_overall\":" + String(actual_aqi) + ",";
  
  // Determine dominant pollutant
  String dominant = "none";
  int maxAqi = 0;
  if (pm25_actual_aqi > maxAqi) { maxAqi = pm25_actual_aqi; dominant = "pm25"; }
  if (pm10_actual_aqi > maxAqi) { maxAqi = pm10_actual_aqi; dominant = "pm10"; }
  if (voc_actual_aqi > maxAqi) { maxAqi = voc_actual_aqi; dominant = "voc"; }
  if (nox_actual_aqi > maxAqi) { maxAqi = nox_actual_aqi; dominant = "nox"; }
  if (hcho_actual_aqi > maxAqi) { maxAqi = hcho_actual_aqi; dominant = "hcho"; }
  
  payload += "\"dominant_pollutant\":\"" + dominant + "\"";
  payload += "}";
  
  Serial.println("=== Publishing Consolidated MQTT Payload ===");
  Serial.print("Topic: "); Serial.println(topic);
  Serial.print("Payload: "); Serial.println(payload);
  Serial.print("Size: "); Serial.print(payload.length()); Serial.println(" bytes");
  
  if (mqttClient.publish(topic.c_str(), payload.c_str())) {
    Serial.println("✓ Consolidated payload published successfully");
  } else {
    Serial.println("✗ Publish failed");
  }
}



void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  // Convert payload into a String
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("Message: ");
  Serial.println(message);

  // Build the expected control topic
  String expectedControlTopic = String(MQTT_TOPIC_PREFIX) + deviceId + "/control";

  // Check if the received topic matches the control topic
  if (String(topic) == expectedControlTopic) {
    if (message == "restart") {
      Serial.println("Control: Restart command received");
      ESP.restart();
    } else {
      Serial.println("Control: Unknown command");
    }
  }
}
