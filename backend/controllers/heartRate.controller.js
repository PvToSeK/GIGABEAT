const db = require('../db/database');

const getAllHeartRates = (req, res) => {
    db.query("SELECT * FROM Battito", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

const getLatestHeartRate = (req, res) => {
    db.query("SELECT * FROM Battito ORDER BY timestamp DESC LIMIT 1", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
};

const addHeartRate = (req, res) => {
    const { id_sensore, bpm, timestamp, irregolare } = req.body;
    db.query(
        "INSERT INTO Battito (id_sensore, bpm, timestamp, irregolare) VALUES (?, ?, ?, ?)",
        [id_sensore, bpm, timestamp, irregolare],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Battito aggiunto", id: results.insertId });
        }
    );
};

module.exports = { getAllHeartRates, getLatestHeartRate, addHeartRate };