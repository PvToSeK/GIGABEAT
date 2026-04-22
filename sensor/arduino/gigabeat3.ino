#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <SoftwareSerial.h>

MAX30105 particleSensor;
SoftwareSerial bluetooth(10, 11); // RX, TX per HC-06

const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAvg = 0;
byte validReadings = 0;

const int ID_SENSORE = 1;
long lastSentBPM = 0;

void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600);
  Serial.println("Avvio sensore...");

  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println("MAX30102 non trovato!");
    while (1);
  }

  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x1F);
  particleSensor.setPulseAmplitudeGreen(0);
  Serial.println("Sensore pronto. Metti il dito...");
}

bool isIrregular(long bpm, long lastBpm) {
  if (bpm < 40 || bpm > 180) return true;
  if (lastBpm == 0) return false;
  long diff = bpm > lastBpm ? bpm - lastBpm : lastBpm - bpm;
  if (diff > 20) return true;
  return false;
}

void loop() {
  long irValue = particleSensor.getIR();

  // Niente dito
  if (irValue < 50000) {
    static long lastMsg = 0;
    if (millis() - lastMsg > 2000) {
      Serial.println("Metti il dito sul sensore");
      bluetooth.println("Metti il dito sul sensore");
      lastMsg = millis();
    }
    validReadings = 0;
    rateSpot = 0;
    beatAvg = 0;
    memset(rates, 0, RATE_SIZE);
    return;
  }

  // Rilevazione battito
  if (checkForBeat(irValue)) {
    long delta = millis() - lastBeat;
    lastBeat = millis();
    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute > 20 && beatsPerMinute < 255) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;

      if (validReadings < RATE_SIZE) validReadings++;

      // Calcola la media solo sui valori validi raccolti finora
      beatAvg = 0;
      for (byte i = 0; i < validReadings; i++) beatAvg += rates[i];
      beatAvg /= validReadings;

      Serial.print("IR: ");
      Serial.print(irValue);
      Serial.print(" BPM istantaneo: ");
      Serial.print((int)beatsPerMinute);
      Serial.print(" Media: ");
      Serial.println(beatAvg);

      // Prepara dati da inviare
      long bpmToSend = beatAvg; // invia la media; cambiare se preferisci istantaneo
      bool irreg = isIrregular(bpmToSend, lastSentBPM);
      unsigned long ts = millis(); // timestamp numerico (ms dall'avvio)

      // Costruisci JSON: id_sensore numeric, bpm numeric, timestamp numeric, irregolare booleano
      // Esempio: {"id_sensore":1,"bpm":72,"timestamp":1234567,"irregolare":false}
      bluetooth.print("{\"id_sensore\":");
      bluetooth.print(ID_SENSORE);
      bluetooth.print(",\"bpm\":");
      bluetooth.print(bpmToSend);
      bluetooth.print(",\"timestamp\":");
      bluetooth.print(ts);
      bluetooth.print(",\"irregolare\":");
      bluetooth.print(irreg ? "true" : "false");
      bluetooth.println("}"); // aggiunge '\n' per separare righe

      lastSentBPM = bpmToSend;
    }
  }
}
