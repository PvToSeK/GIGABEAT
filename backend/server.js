require('dotenv').config();

const express = require('express');
const cors = require('cors');
const heartRateRouter = require('./routes/heartRate.routers');

const PORT = process.env.PORT || 8080;
const app = express();

app.use(cors());
app.use(express.json());

// LOG richieste
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ROUTE BASE
app.get("/", (req, res) => {
    res.send("GIGABEAT backend online 🚀");
});

// API HEARTBEAT
app.use('/api/heartbeat', heartRateRouter);

app.listen(PORT, '0.0.0.0', () => {
    console.log("GIGABEAT online su porta " + PORT);
});