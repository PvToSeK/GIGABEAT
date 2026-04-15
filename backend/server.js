const express = require('express');
const cors = require('cors');
const heartRateRouter = require('./routes/heartRate.routers');

const PORT = process.env.PORT || 6767;
const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.get("/", (req, res) => {
    res.send("GIGABEAT backend online");
});

app.use('/api/heartbeat', heartRateRouter);

app.listen(PORT, () => {
    console.log("GIGABEAT online su http://localhost:" + PORT);
});