# ❤️ GIGABEAT

## Sistema di monitoraggio cardiaco remoto basato su ESP32 e sensore MAX30102

GIGABEAT è un progetto sviluppato con l’obiettivo di realizzare un sistema di monitoraggio cardiaco remoto capace di acquisire, trasmettere, salvare e visualizzare dati biometrici in tempo reale tramite una piattaforma web.

Il sistema utilizza un sensore ottico **MAX30102** collegato a una scheda **ESP32**, che rileva il battito cardiaco dell’utente attraverso il contatto con il dito.

I dati raccolti vengono elaborati dal microcontrollore e inviati tramite connessione **Wi-Fi** a un backend remoto sviluppato con **Node.js** ed **Express.js**.

Il backend si occupa della gestione delle API REST, della validazione dei dati ricevuti e della comunicazione con un database **MySQL**, nel quale vengono salvati:

- battiti cardiaci
- pazienti
- sensori
- emergenze
- posizioni GPS

Le informazioni memorizzate vengono poi rese disponibili a un frontend web sviluppato con **HTML, CSS e JavaScript**, accessibile direttamente da browser tramite dashboard interattiva.

La piattaforma consente di:

- monitorare il battito cardiaco in tempo reale
- visualizzare lo storico dei rilevamenti
- consultare i dati dei pazienti
- identificare eventuali anomalie cardiache
- simulare scenari di telemonitoraggio sanitario

---

# 👥 Gruppo di lavoro

- De Palo
- Li Destri
- Marinsek
- Sala
- Salvò

---

# 🏗️ Architettura del sistema

```text
Sensore MAX30102
        ↓
ESP32
        ↓
Backend Node.js + Express (Railway)
        ↓
Database MySQL
        ↓
Dashboard Web (Vercel)
```

---

# ⚙️ Tecnologie utilizzate

## Embedded

- ESP32
- MAX30102
- C++

## Backend

- Node.js
- Express.js
- REST API

## Database

- MySQL

## Frontend

- HTML
- CSS
- JavaScript

## Deploy & Versioning

- Railway
- Vercel
- GitHub

---

# 🚀 Funzionalità principali

- acquisizione BPM tramite sensore ottico
- invio dati tramite HTTPS
- API REST per gestione dati
- salvataggio persistente su database SQL
- dashboard web realtime
- gestione pazienti
- storico battiti cardiaci
- rilevamento valori irregolari

---

# 🎯 Obiettivo del progetto

L’obiettivo del progetto è realizzare una piattaforma semplice, accessibile e scalabile per il monitoraggio cardiaco remoto.

GIGABEAT rappresenta inoltre un’integrazione pratica tra:

- sistemi embedded
- networking
- sviluppo backend
- database relazionali
- sviluppo frontend
- comunicazione client-server
- telemetria realtime