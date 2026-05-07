require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("GIGABEAT backend online 🚀");
});

app.get("/ping", (req, res) => {
    res.json({ ok: true });
});

const PORT = process.env.PORT;

app.listen(PORT, '0.0.0.0', () => {
    console.log("Server running on", PORT);
});