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
const char* ssid       = "osdb_ breda";
const char* password   = "jmhz9976 se sei un vero figo";
const int   ID_SENSORE = 1;
// ============================================================

BluetoothSerial SerialBT;
MAX30105 particleSensor;

const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot        = 0;
long lastBeat        = 0;
float beatsPerMinute = 0;
int beatAvg          = 0;

bool orarioSincronizzato = false;
bool btConnesso          = false;

void log(String msg) {
  Serial.println(msg);
  if (SerialBT.hasClient()) {
    SerialBT.println(msg);
  }
}

void btCallback(esp_spp_cb_event_t event, esp_spp_cb_param_t* param) {
  if (event == ESP_SPP_SRV_OPEN_EVT) {
    btConnesso = true;
    Serial.println(">>> Telefono connesso via Bluetooth!");
    SerialBT.println("Connesso! Metti il dito sul sensore ❤");
  }
  if (event == ESP_SPP_CLOSE_EVT) {
    btConnesso = false;
    Serial.println(">>> Telefono disconnesso.");
  }
}

// ────────────────────────────────────────────
// Test connessione al server con GET /ping
// ────────────────────────────────────────────
void testServer() {
  log("--- TEST SERVER ---");

  // Step 1: verifica DNS
  IPAddress serverIP;
  log("Risoluzione DNS...");
  if (!WiFi.hostByName("gigabeat-production.up.railway.app", serverIP)) {
    log("ERRORE DNS: impossibile risolvere il dominio!");
    log("--- FINE TEST ---");
  //  return;
  }else{
    log("DNS OK! IP server: " + serverIP.toString());
    
    
    // Step 2: connessione TCP diretta con IP
    WiFiClientSecure client;
    client.setInsecure();
    client.setTimeout(15);

    log("Connessione TCP a " + serverIP.toString() + ":443...");
    if (!client.connect(serverIP, 443)) {
      log("ERRORE: connessione TCP fallita!");
      log("--- FINE TEST ---");
      //return;
    }else{
      log("Connessione TCP riuscita!");

      // Step 3: richiesta HTTP manuale
      client.println("GET /ping HTTP/1.1");
      client.println("Host: gigabeat-production.up.railway.app");
      client.println("Connection: close");
      client.println();

      delay(2000);
      String risposta = "";
      while (client.available()) {
        risposta += (char)client.read();
      }
      log("Risposta raw: " + risposta.substring(0, 200));
      client.stop();

      log("--- FINE TEST ---");
    }
  }
}

// ────────────────────────────────────────────
// WiFi
// ────────────────────────────────────────────
void tentaConnessioneWifi() {
  log("Connessione al WiFi...");

  // Imposta DNS Google PRIMA di connettersi
  WiFi.disconnect(true);
  delay(500);

  WiFi.config(INADDR_NONE, INADDR_NONE, INADDR_NONE,
              IPAddress(8,8,8,8),
              IPAddress(8,8,4,4));

  WiFi.begin(ssid, password);

  int tentativi = 0;
  while (WiFi.status() != WL_CONNECTED && tentativi < 40) {
    delay(500);
    Serial.print(".");
    tentativi++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    log("WiFi connesso! IP:  " + WiFi.localIP().toString());
    log("Gateway:            " + WiFi.gatewayIP().toString());
    log("DNS:                " + WiFi.dnsIP().toString());

    delay(1000); // lascia stabilizzare la connessione

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

    testServer();

  } else {
    log("WiFi non disponibile. Solo Bluetooth attivo.");
  }
}

// ────────────────────────────────────────────
// Timestamp
// ────────────────────────────────────────────
String getTimestamp() {
  if (!orarioSincronizzato) return String(millis() / 1000);
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
    log("WiFi assente — invio saltato.");
    return;
  }

  // Costruisce il JSON
  StaticJsonDocument<200> doc;
  doc["id_sensore"] = ID_SENSORE;
  doc["bpm"]        = bpm;
  doc["timestamp"]  = getTimestamp();
  doc["irregolare"] = irregolare;
  String jsonStr;
  serializeJson(doc, jsonStr);

  log("Invio: " + jsonStr);

  // Risolvi il DNS
  IPAddress serverIP;
  if (!WiFi.hostByName("gigabeat-production.up.railway.app", serverIP)) {
    log("ERRORE DNS!");
    return;
  }

  // Connessione TCP manuale con SSL
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(15);

  if (!client.connect(serverIP, 443)) {
    log("ERRORE: connessione TCP fallita!");
    return;
  }

  // Richiesta HTTP manuale
  String request = "POST /api/heartbeat/ HTTP/1.1\r\n";
  request += "Host: gigabeat-production.up.railway.app\r\n";
  request += "Content-Type: application/json\r\n";
  request += "Accept: application/json\r\n";
  request += "Content-Length: " + String(jsonStr.length()) + "\r\n";
  request += "Connection: close\r\n";
  request += "\r\n";
  request += jsonStr;

  client.print(request);

  // Leggi risposta
  delay(3000);
  String risposta = "";
  while (client.available()) {
    risposta += (char)client.read();
  }
  client.stop();

  log("Risposta server: " + risposta.substring(0, 300));

  // Controlla se è 201
  if (risposta.indexOf("201") >= 0) {
    log("Successo! Dati salvati.");
  } else if (risposta.indexOf("200") >= 0) {
    log("Server risponde 200 OK");
  } else {
    log("Risposta inattesa — controlla sopra");
  }
}

// ────────────────────────────────────────────
// SETUP
// ────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("=================================");
  Serial.println("     ESP32 Monitor Battito       ");
  Serial.println("=================================");

  SerialBT.register_callback(btCallback);
  SerialBT.begin("ESP32_Cuore");
  Serial.println("Bluetooth avviato! Cerca 'ESP32_Cuore'");

  tentaConnessioneWifi();

  Serial.println("Avvio sensore...");
  Wire.begin(21, 22);

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("ERRORE: Sensore non trovato! Controlla SDA(D21) e SCL(D22).");
    while (1) { delay(1000); Serial.println("Sensore non trovato!"); }
  }

  Serial.println("Sensore trovato!");
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
unsigned long ultimoInvio     = 0;
unsigned long ultimoMessaggio = 0;
const unsigned long INTERVALLO_INVIO      = 10000;
const unsigned long INTERVALLO_NESSUN_DITO = 3000;

void loop() {
  long irValue = particleSensor.getIR();

  if (irValue < 50000) {
    if (millis() - ultimoMessaggio >= INTERVALLO_NESSUN_DITO) {
      ultimoMessaggio = millis();
      log("Nessun dito rilevato... (IR: " + String(irValue) + ")");
    }
    return;
  }

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

      String stato = irregolare ? " ⚠ IRREGOLARE" : " OK";
      log("BPM: " + String(beatAvg) + stato);

      if (millis() - ultimoInvio >= INTERVALLO_INVIO) {
        ultimoInvio = millis();
        sendHeartRate(beatAvg, irregolare);
      }
    }
  }
}