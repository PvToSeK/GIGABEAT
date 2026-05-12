require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const heartRateRouter = require('./routes/heartRate.routers');
const patientRouter = require('./routes/patient.routers');

const app = express();

// middleware base
app.use(cors());
app.use(express.json());

// LOG richieste
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});


// ======================
// 🔥 FRONTEND STATICO
// ======================
app.use(express.static(path.join(__dirname, '../frontend')));


// ======================
// 🏠 ROOT → index.html
// ======================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});


// ======================
// ❤️ API ROUTES
// ======================
app.use('/api/heartbeat', heartRateRouter);
app.use('/api/patients', patientRouter);


// ======================
// 🩺 HEALTH CHECK
// ======================
app.get("/ping", (req, res) => {
    res.json({ ok: true });
});


// ======================
// 🚀 START SERVER
// ======================
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log("GIGABEAT backend running on port", PORT);
});