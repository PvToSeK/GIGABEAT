const db = require('../db/database');

const getAllHeartRates = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM Battito");
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getLatestHeartRate = async (req, res) => {
    try {
        const [results] = await db.query(
            "SELECT * FROM Battito ORDER BY timestamp DESC LIMIT 1"
        );
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const addHeartRate = async (req, res) => {
    try {
        const { id_sensore, bpm, timestamp, irregolare } = req.body;

        const [result] = await db.query(
            "INSERT INTO Battito (id_sensore, bpm, timestamp, irregolare) VALUES (?, ?, ?, ?)",
            [id_sensore, bpm, timestamp, irregolare]
        );

        res.status(201).json({
            message: "Battito aggiunto",
            id: result.insertId
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllHeartRates, getLatestHeartRate, addHeartRate };