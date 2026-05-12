#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include "BluetoothSerial.h"
#include <WiFiClientSecure.h>

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth non abilitato!
#endif

// ============================================================
//   MODIFICA QUESTE RIGHE CON I TUOI DATI
// ============================================================
const char* ssid       = "TIM-72962354";
const char* password   = "Y3YCKPQ6T3sFedTGCts5z3GF";
const char* serverUrl = "https://gigabeat-production.up.railway.app/api/heartbeat/";
const int   ID_SENSORE = 1;
// ============================================================

BluetoothSerial SerialBT;
MAX30105 particleSensor;

const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot  = 0;
long lastBeat  = 0;
float beatsPerMinute = 0;
int beatAvg    = 0;

bool wifiConnesso        = false;
bool orarioSincronizzato = false;
bool btConnesso          = false;

// ────────────────────────────────────────────
// Stampa su Serial E su Bluetooth insieme
// ────────────────────────────────────────────
void log(String msg) {
  Serial.println(msg);
  if (SerialBT.hasClient()) {
    SerialBT.println(msg);
  }
}

// ────────────────────────────────────────────
// Callback Bluetooth — dice quando il telefono
// si connette o disconnette
// ────────────────────────────────────────────
void btCallback(esp_spp_cb_event_t event, esp_spp_cb_param_t* param) {
  if (event == ESP_SPP_SRV_OPEN_EVT) {
    btConnesso = true;
    Serial.println(">>> Telefono connesso via Bluetooth!");
    SerialBT.println("Connesso! Metti il dito sul sensore per misurare il battito ❤");
  }
  if (event == ESP_SPP_CLOSE_EVT) {
    btConnesso = false;
    Serial.println(">>> Telefono disconnesso.");
  }
}

// ────────────────────────────────────────────
// WiFi
// ────────────────────────────────────────────
void tentaConnessioneWifi() {
  log("Connessione al WiFi...");
  WiFi.begin(ssid, password);
  int tentativi = 0;
  while (WiFi.status() != WL_CONNECTED && tentativi < 20) {
    delay(500);
    Serial.print(".");
    tentativi++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnesso = true;
    log("WiFi connesso! IP: " + WiFi.localIP().toString());

    configTime(3600, 3600, "pool.ntp.org");
    int attesa = 0;
    while (time(nullptr) < 100000 && attesa < 20) {
      delay(500);
      attesa++;
    }
    if (time(nullptr) > 100000) {
      orarioSincronizzato = true;
      log("Orario sincronizzato!");
    }
  } else {
    wifiConnesso = false;
    log("WiFi non disponibile. Solo Bluetooth attivo.");
  }
}

// ────────────────────────────────────────────
// Timestamp
// ────────────────────────────────────────────
String getTimestamp() {
  if (!orarioSincronizzato) {
    // Se non c'e' WiFi usa i millisecondi come fallback
    return String(millis() / 1000);
  }
  time_t now = time(nullptr);
  struct tm* t = localtime(&now);
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", t);
  return String(buf);
}

// ────────────────────────────────────────────
// Invio al server
// ────────────────────────────────────────────
void sendHeartRate(int bpm, bool irregolare) {
  if (WiFi.status() != WL_CONNECTED) {
    log("WiFi assente — invio al server saltato.");
    return;
  }

  // Usa WiFiClientSecure per HTTPS
  WiFiClientSecure client;
  client.setInsecure(); // <- disabilita verifica certificato SSL (ok per progetti personali)
  
  HTTPClient http;
  http.begin(client, "https://gigabeat-production.up.railway.app/api/heartbeat/");
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["id_sensore"] = ID_SENSORE;
  doc["bpm"]        = bpm;
  doc["timestamp"]  = getTimestamp();
  doc["irregolare"] = irregolare;

  String jsonStr;
  serializeJson(doc, jsonStr);

  log("Invio al server: " + jsonStr);

  int httpCode = http.POST(jsonStr);

  if (httpCode == 201) {
    log("Server: dati ricevuti con successo!");
  } else if (httpCode > 0) {
    log("Errore HTTP " + String(httpCode) + ": " + http.getString());
  } else {
    log("Errore connessione al server: " + String(httpCode));
  }

  http.end();
}

// ────────────────────────────────────────────
// SETUP
// ────────────────────────────────────────────
void setup() {
  // IMPORTANTE: deve essere 115200 anche nel Serial Monitor!
  Serial.begin(115200);
  delay(1000); // aspetta che la porta seriale sia pronta

  Serial.println("=================================");
  Serial.println("     ESP32 Monitor Battito       ");
  Serial.println("=================================");

  // Bluetooth
  SerialBT.register_callback(btCallback);
  SerialBT.begin("ESP32_Cuore");
  Serial.println("Bluetooth avviato!");
  Serial.println("Cerca 'ESP32_Cuore' sul telefono e abbinalo.");
  Serial.println("Password pairing: 1234");

  // WiFi (opzionale, va avanti anche senza)
  tentaConnessioneWifi();

  // Sensore
  Serial.println("Avvio sensore...");
  Wire.begin(21, 22); // SDA=D21, SCL=D22
  
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("ERRORE: Sensore MAX3010x non trovato!");
    Serial.println("Controlla i cavi SDA(D21) e SCL(D22).");
    // Lampeggia per segnalare l'errore
    while (1) {
      delay(1000);
      Serial.println("Sensore non trovato - riavvia e controlla i cavi!");
    }
  }

  Serial.println("Sensore trovato e pronto!");
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);

  Serial.println("=================================");
  Serial.println("Tutto pronto! Metti il dito.");
  Serial.println("=================================");
}

// ────────────────────────────────────────────
// LOOP
// ────────────────────────────────────────────
unsigned long ultimoInvio    = 0;
unsigned long ultimoMessaggio = 0;
const unsigned long INTERVALLO_INVIO    = 10000; // 10 secondi
const unsigned long INTERVALLO_NESSUN_DITO = 3000; // messaggio ogni 3 sec

void loop() {
  long irValue = particleSensor.getIR();

  // Nessun dito
  if (irValue < 50000) {
    if (millis() - ultimoMessaggio >= INTERVALLO_NESSUN_DITO) {
      ultimoMessaggio = millis();
      log("Nessun dito rilevato... (IR: " + String(irValue) + ")");
    }
    return;
  }

  // Calcolo BPM
  if (checkForBeat(irValue)) {
    long delta = millis() - lastBeat;
    lastBeat = millis();
    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;

      beatAvg = 0;
      for (byte x = 0; x < RATE_SIZE; x++) beatAvg += rates[x];
      beatAvg /= RATE_SIZE;

      bool irregolare = abs((int)beatsPerMinute - beatAvg) > 15;

      // Mostra in tempo reale
      String stato = irregolare ? " ⚠ IRREGOLARE" : " OK";
      log("BPM: " + String(beatAvg) + stato);

      // Invia al server ogni 10 secondi
      if (millis() - ultimoInvio >= INTERVALLO_INVIO) {
        ultimoInvio = millis();
        sendHeartRate(beatAvg, irregolare);
      }
    }
  }
}