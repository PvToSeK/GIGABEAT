#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <time.h>

// ============================================================
const char* ssid       = "osdb_ breda";
const char* password   = "jmhz9976 se sei un vero figo";
const int   ID_SENSORE = 1;
const char* SERVER_URL = "https://gigabeat-production.up.railway.app/api/heartbeat/";
// ============================================================

MAX30105 particleSensor;

const byte RATE_SIZE   = 4;
byte  rates[RATE_SIZE] = {0};
byte  rateSpot         = 0;
byte  validReadings    = 0;
long  lastBeat         = 0;
float beatsPerMinute   = 0;
int   beatAvg          = 0;

bool orarioSincronizzato = false;

unsigned long ultimoInvio     = 0;
unsigned long ultimoMessaggio = 0;
const unsigned long INTERVALLO_INVIO       = 10000;
const unsigned long INTERVALLO_NESSUN_DITO =  3000;

// ============================================================
void log(const String& msg) {
  Serial.println(msg);
}

// ============================================================
String getTimestamp() {
  if (!orarioSincronizzato) return String(millis() / 1000);
  time_t now = time(nullptr);
  struct tm* t = localtime(&now);
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", t);
  return String(buf);
}

// ============================================================
void sendHeartRate(int bpm, bool irregolare) {
  if (WiFi.status() != WL_CONNECTED) {
    log("WiFi assente — invio saltato.");
    return;
  }

  StaticJsonDocument<200> doc;
  doc["id_sensore"] = ID_SENSORE;
  doc["bpm"]        = bpm;
  doc["timestamp"]  = getTimestamp();
  doc["irregolare"] = irregolare;
  String jsonStr;
  serializeJson(doc, jsonStr);

  log("Invio POST: " + jsonStr);

  // Senza il Bluetooth, qui avremo tantissima RAM libera per l'HTTPS (TLS)
  WiFiClientSecure* sslClient = new WiFiClientSecure();
  sslClient->setInsecure();

  HTTPClient http;
  http.begin(*sslClient, SERVER_URL);
  http.setTimeout(15000); 
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Accept", "application/json");

  int httpCode = http.POST(jsonStr);

  if (httpCode > 0) {
    String risposta = http.getString();
    log("HTTP " + String(httpCode) + " — " + risposta.substring(0, 100));
    if (httpCode == 201 || httpCode == 200) {
      log(">>> SUCCESSORATO! Dati scritti sul server.");
    } else {
      log("Risposta server inattesa: " + String(httpCode));
    }
  } else {
    log("ERRORE CRITICO INVIO: " + http.errorToString(httpCode));
  }

  http.end();
  delete sslClient;
}

// ============================================================
void tentaConnessioneWifi() {
  log("Connessione al WiFi...");

  WiFi.disconnect(true);
  delay(500);

  WiFi.begin(ssid, password);

  int tentativi = 0;
  while (WiFi.status() != WL_CONNECTED && tentativi < 40) {
    delay(500);
    Serial.print(".");
    tentativi++;
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    log("WiFi non disponibile.");
    return;
  }

  log("WiFi connesso! IP: " + WiFi.localIP().toString());
  delay(1000);

  configTime(3600, 3600, "pool.ntp.org");
  int attesa = 0;
  while (time(nullptr) < 100000 && attesa < 20) {
    delay(500);
    attesa++;
  }
  if (time(nullptr) > 100000) {
    orarioSincronizzato = true;
    log("Orario sincronizzato: " + getTimestamp());
  } else {
    log("NTP non disponibile — uso secondi relativi.");
  }

  // Verifica immediata della raggiungibilità (Ping)
  WiFiClientSecure* c = new WiFiClientSecure();
  c->setInsecure();
  HTTPClient http;
  http.begin(*c, "https://gigabeat-production.up.railway.app/ping");
  http.setTimeout(10000);
  int code = http.GET();
  if (code == 200) log("Server Railway raggiungibile con HTTPS!");
  else             log("Ping server fallito: HTTP " + String(code));
  http.end();
  delete c;
}

// ============================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("=================================");
  Serial.println(" ESP32 Monitor SOLO WIFI (HTTPS) ");
  Serial.println("=================================");

  tentaConnessioneWifi();

  log("Avvio sensore MAX30102...");
  Wire.begin(21, 22);

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    log("ERRORE: sensore non trovato! Controlla SDA(21) e SCL(22).");
    while (1) { delay(1000); }
  }

  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x1F);
  particleSensor.setPulseAmplitudeGreen(0);

  Serial.println("=================================");
  Serial.println("Tutto pronto! Metti il dito.");
  Serial.println("=================================");
}

// ============================================================
void loop() {
  long irValue = particleSensor.getIR();

  if (irValue < 50000) {
    if (millis() - ultimoMessaggio >= INTERVALLO_NESSUN_DITO) {
      ultimoMessaggio = millis();
      log("Nessun dito (IR=" + String(irValue) + ")");
    }
    memset(rates, 0, RATE_SIZE);
    rateSpot = validReadings = beatAvg = 0;
    return;
  }

  if (checkForBeat(irValue)) {
    long delta     = millis() - lastBeat;
    lastBeat       = millis();
    beatsPerMinute = 60.0f / (delta / 1000.0f);

    if (beatsPerMinute < 20 || beatsPerMinute > 255) return;

    rates[rateSpot++] = (byte)beatsPerMinute;
    rateSpot %= RATE_SIZE;
    if (validReadings < RATE_SIZE) validReadings++;

    beatAvg = 0;
    for (byte i = 0; i < validReadings; i++) beatAvg += rates[i];
    beatAvg /= validReadings;

    bool irregolare = abs((int)beatsPerMinute - beatAvg) > 15;
    log("BPM: " + String(beatAvg) + " (ist: " + String((int)beatsPerMinute) + ")" + (irregolare ? " IRREGOLARE" : " OK"));

    if (millis() - ultimoInvio >= INTERVALLO_INVIO) {
      ultimoInvio = millis();
      sendHeartRate(beatAvg, irregolare);
    }
  }
}