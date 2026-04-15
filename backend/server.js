const express = require('express');
const db = require('./db/database');
const PORT = process.env.PORT || 6767;
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.use((req,res,next)=>{
    console.log(`${req.method} ${req.url} `)
    next();
})




app.get("/api/heartbeat/all",(req,res) => {
db.query("SELECT * FROM Battito", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
});
})
app.get("/api/heartbeat/latest", (req, res) => {
    db.query("SELECT * FROM Battito ORDER BY timestamp DESC LIMIT 1", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

app.post("/api/heartbeat", (req, res) => {
    const { id_sensore, bpm, timestamp, irregolare } = req.body;
    db.query(
        "INSERT INTO Battito (id_sensore, bpm, timestamp, irregolare) VALUES (?, ?, ?, ?)",
        [id_sensore, bpm, timestamp, irregolare],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Battito aggiunto", id: results.insertId });
        }
    );
});



app.listen(PORT,() =>{
    console.log("GIGABEAT online su http://localhost:" + PORT);
})