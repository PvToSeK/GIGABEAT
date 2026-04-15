#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <SoftwareSerial.h>

MAX30105 particleSensor;
SoftwareSerial bluetooth(10, 11);

const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAvg = 0;
byte validReadings = 0; // ← conta quanti battiti validi abbiamo

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

void loop() {
long irValue = particleSensor.getIR();

// Niente dito
if (irValue < 50000) {
// Stampa solo ogni 2 secondi per non intasare
static long lastMsg = 0;
if (millis() - lastMsg > 2000) {
Serial.println("Metti il dito sul sensore");
bluetooth.println("Metti il dito sul sensore");
lastMsg = millis();
}
// Reset quando togli il dito
validReadings = 0;
rateSpot = 0;
beatAvg = 0;
memset(rates, 0, RATE_SIZE);
return;
}

// Rilevazione battito — SENZA delay per non perdere i picchi
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
for (byte i = 0; i < validReadings; i++)
beatAvg += rates[i];
beatAvg /= validReadings;

Serial.print("IR: ");
Serial.print(irValue);
Serial.print(" BPM istantaneo: ");
Serial.print((int)beatsPerMinute);
Serial.print(" Media: ");
Serial.println(beatAvg);

bluetooth.print("BPM: ");
bluetooth.println(beatAvg);
}
}
// Nessun delay qui — lascia girare il loop veloce
}