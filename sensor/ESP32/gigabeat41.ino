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

// === VELOCIZZAZIONE: Invio rapido ogni 2 secondi ===
const unsigned long INTERVALLO_INVIO       = 2000; 
const unsigned long INTERVALLO_NESSUN_DITO = 3000;

// === VELOCIZZAZIONE: Client globali per connessione persistente (Keep-Alive) ===
WiFiClientSecure sslClient;
HTTPClient http;

// ============================================================
void log(const String& msg) {
  Serial.println(msg);
}

// ============================================================
String getTimestamp() {
  time_t now = time(nullptr);
  struct tm* t = localtime(&now);
  char buf[25];
  
  // CORREZIONE: Se l'NTP non è pronto, manda una struttura data valida per evitare l'errore 500 sul server
  if (!orarioSincronizzato || now < 100000) {
    return "2026-01-01 00:00:00"; 
  }
  
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

  unsigned long startTimer = millis();
  log("Invio POST rapida: " + jsonStr);

  // Esegue la POST istantanea riutilizzando il canale SSL aperto
  int httpCode = http.POST(jsonStr);

  if (httpCode > 0) {
    String risposta = http.getString();
    unsigned long fineTimer = millis() - startTimer;
    log("HTTP " + String(httpCode) + " in " + String(fineTimer) + "ms");
    
    if (httpCode == 201 || httpCode == 200) {
      log(">>> INVIATO CON SUCCESSO!");
    } else if (httpCode == 500) {
      log(">>> ERRORE 500: Il server ha ricevuto il JSON ma è andato in crash interno. Controlla i log di Railway.");
    }
  } else {
    log("ERRORE CONNESSIONE: " + http.errorToString(httpCode));
    // Se la connessione Keep-Alive cade, resetta il canale al volo per la prossima richiesta
    http.end();
    http.begin(sslClient, SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Accept", "application/json");
  }
}

// ============================================================
void tentaConnessioneWifi() {
  log("Connessione al WiFi...");

  WiFi.disconnect(true);
  delay(500);
  WiFi.setSleep(false); // Disattiva il risparmio energetico WiFi per ridurre la latenza di rete

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

  // Richiesta dell'orario ai server NTP
  configTime(3600, 3600, "pool.ntp.org", "time.nist.gov");
  log("Sincronizzazione orario (NTP)...");
  int attesa = 0;
  while (time(nullptr) < 100000 && attesa < 20) {
    delay(500);
    Serial.print("*");
    attesa++;
  }
  Serial.println();

  if (time(nullptr) > 100000) {
    orarioSincronizzato = true;
    log("Orario sincronizzato correttamente.");
  } else {
    log("NTP momentaneamente non raggiungibile. Uso timestamp di fallback.");
  }

  // Pre-inizializzazione del canale HTTPS Keep-Alive
  sslClient.setInsecure(); // Salta la verifica della catena del certificato per massima velocità
  
  log("Apertura canale sicuro Keep-Alive...");
  http.begin(sslClient, SERVER_URL);
  http.setTimeout(4000); // Timeout a 4 secondi per non bloccare la lettura del sensore
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Accept", "application/json");
  
  log("Canale HTTPS pronto per invii ultra-rapidi.");
}

// ============================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("=================================");
  Serial.println(" ESP32 Monitor ULTRA FAST (HTTPS)");
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
      
      // Protezione: se l'orario non è ancora arrivato dall'NTP, aspettiamo a mandare dati
      // per evitare di mandare timestamp invalidi al database.
      if (orarioSincronizzato) {
        sendHeartRate(beatAvg, irregolare);
      } else {
        log("Invio saltato: in attesa di sincronizzazione oraria reale...");
      }
    }
  }
}