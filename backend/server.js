require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const heartRateRouter = require('./routes/heartRate.routers');
const patientRouter = require('./routes/patient.routers');

const app = express();

app.use(cors());
app.use(express.json());

// FILE STATICI FRONTEND
app.use(express.static(path.join(__dirname, '../frontend')));

// LOG
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ROOT FRONTEND
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// HEALTH CHECK
app.get("/ping", (req, res) => {
    res.json({ ok: true });
});

// API
app.use('/api/heartbeat', heartRateRouter);
app.use('/api/patients', patientRouter);

const PORT = process.env.PORT;

app.listen(PORT, '0.0.0.0', () => {
    console.log("Server running on", PORT);
});