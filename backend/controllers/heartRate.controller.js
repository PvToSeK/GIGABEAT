/*const db = require('../db/database');

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

module.exports = { getAllHeartRates, getLatestHeartRate, addHeartRate };*/
const getAllHeartRates = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM Battito");
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

const getLatestHeartRate = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM Battito ORDER BY timestamp DESC LIMIT 1");
        res.json(results[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

const addHeartRate = async (req, res) => {
    try {
        const { id_sensore, bpm, timestamp, irregolare } = req.body;
        const [results] = await db.query(
            "INSERT INTO Battito (id_sensore, bpm, timestamp, irregolare) VALUES (?, ?, ?, ?)",
            [id_sensore, bpm, timestamp, irregolare]
        );
        res.status(201).json({ message: "Battito aggiunto", id: results.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllHeartRates, getLatestHeartRate, addHeartRate };