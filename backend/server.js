const express = require('express');
const PORT = 6767;
const cors = require('cors');
const app = express();
const heartRates = [
    { patient_id: 1, bpm: 72, timestamp: "2026-01-28T10:00:00" },
    { patient_id: 2, bpm: 75, timestamp: "2026-01-28T10:01:00" },
    { patient_id: 3, bpm: 68, timestamp: "2026-01-28T10:00:30" }
];
app.use(cors());
app.use(express.json());

app.use((req,res,next)=>{
    console.log(`${req.method} ${req.url} `)
    next();
})




app.get("/api/heartbeat/all",(req,res) => {
    res.json(heartRates); 
})
app.get("/api/heartbeat/latest",(req,res) => {
    res.json(heartRates[heartRates.length - 1]); 
})

app.post("/api/heartbeat", (req,res)=>{

    const heartRate = req.body;
    heartRates.push(heartRate);
    return res.status(201).json({ message: "Battito aggiunto", data: heartRate });
})








app.listen(PORT,() =>{
    console.log("GIGABEAT online su http://localhost:" + PORT);
})