#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <SoftwareSerial.h>

MAX30105 particleSensor;

// Bluetooth su pin 10 e 11
SoftwareSerial bluetooth(10, 11);

const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;

float beatsPerMinute;
int beatAvg;

void setup()
{
  Serial.begin(9600);
  bluetooth.begin(9600);

  Serial.println("Avvio sensore...");

  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD))
  {
    Serial.println("MAX30102 non trovato");
    while (1);
  }

  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);
}

void loop()
{
  long irValue = particleSensor.getIR();

  if (checkForBeat(irValue))
  {
    long delta = millis() - lastBeat;
    lastBeat = millis();

    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 255 && beatsPerMinute > 20)
    {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;

      beatAvg = 0;
      for (byte x = 0; x < RATE_SIZE; x++)
        beatAvg += rates[x];

      beatAvg /= RATE_SIZE;

      Serial.print("BPM: ");
      Serial.println(beatAvg);

      bluetooth.print("Battito: ");
      bluetooth.print(beatAvg);
      bluetooth.println(" BPM");
    }
  }
}