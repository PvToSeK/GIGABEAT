const db = require('../db/database');

// GET ALL PATIENTS
const getAllPatients = async (req, res) => {
    try {
        const [results] = await db.query(
            "SELECT * FROM Paziente"
        );

        res.json(results);

    } catch (err) {
        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
};

// GET PATIENT BY CF
const getPatientByCF = async (req, res) => {
    try {
        const { cf } = req.params;

        const [results] = await db.query(
            "SELECT * FROM Paziente WHERE cf_paziente = ?",
            [cf]
        );

        if (!results.length) {
            return res.status(404).json({
                error: "Paziente non trovato"
            });
        }

        res.json(results[0]);

    } catch (err) {
        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
};

// ADD PATIENT
const addPatient = async (req, res) => {
    try {
        const {
            cf_paziente,
            nome,
            cognome,
            citta,
            data_nascita,
            telefono,
            contatto_emergenza
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO Paziente
            (cf_paziente, nome, cognome, citta, data_nascita, telefono, contatto_emergenza)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                cf_paziente,
                nome,
                cognome,
                citta,
                data_nascita,
                telefono,
                contatto_emergenza
            ]
        );

        res.status(201).json({
            message: "Paziente aggiunto",
            id: result.insertId
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
};

module.exports = {
    getAllPatients,
    getPatientByCF,
    addPatient
};