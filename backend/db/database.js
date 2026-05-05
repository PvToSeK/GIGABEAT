/*
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

connection.connect((err) => {
    if (err) {
        console.error('Errore connessione database:', err);
        return;
    }
    console.log('Database connesso!');
});

module.exports = connection;
*/
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0
});

module.exports = pool;

/*const db = require('../db/database');

const getAllHeartRates = async (req, res) => {
    try {
        console.log('📥 GET /all richiesto');
        const [results] = await db.query("SELECT * FROM Battito ORDER BY timestamp DESC");
        console.log('✅ Query OK - Trovati ' + results.length + ' battiti');
        res.json(results);
    } catch (err) {
        console.error('❌ Errore query:', err.message);
        res.status(500).json({ error: err.message });
    }
};

const getLatestHeartRate = async (req, res) => {
    try {
        const [results] = await db.query(
            "SELECT * FROM Battito ORDER BY timestamp DESC LIMIT 1"
        );
        if (results.length === 0) {
            return res.status(404).json({ error: "Nessun battito trovato" });
        }
        res.json(results[0]);
    } catch (err) {
        console.error('❌ Errore:', err.message);
        res.status(500).json({ error: err.message });
    }
};

const addHeartRate = async (req, res) => {
    try {
        const { id_sensore, bpm, timestamp, irregolare } = req.body;
        
        if (!id_sensore || !bpm) {
            return res.status(400).json({ error: "Campi obbligatori mancanti" });
        }

        const [results] = await db.query(
            "INSERT INTO Battito (id_sensore, bpm, timestamp, irregolare) VALUES (?, ?, ?, ?)",
            [id_sensore, bpm, timestamp || new Date(), irregolare || false]
        );
        
        res.status(201).json({ 
            message: "Battito aggiunto", 
            id: results.insertId 
        });
    } catch (err) {
        console.error('❌ Errore INSERT:', err.message);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllHeartRates, getLatestHeartRate, addHeartRate };*/