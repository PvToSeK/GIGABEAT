require('dotenv').config();

const express = require('express');
const cors = require('cors');

const heartRateRouter = require('./routes/heartRate.routers');
const patientRouter = require('./routes/patient.routers');

const app = express();

app.use(cors());
app.use(express.json());

// LOG richieste
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ROOT (solo test API)
app.get("/", (req, res) => {
    res.send("GIGABEAT backend online 🚀");
});

// HEALTH CHECK
app.get("/ping", (req, res) => {
    res.json({ ok: true });
});

// API
app.use('/api/heartbeat', heartRateRouter);
app.use('/api/patients', patientRouter);

// START
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log("Server running on", PORT);
});