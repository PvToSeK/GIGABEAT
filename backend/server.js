const http = require ('http');
const PORT = 6767;
const HOSTNAME = "localhost";

const heartRates = [ 
    { patient_id: 1, bpm: 72, timestamp: "2026-01-28T10:00:00" },
    { patient_id: 2, bpm: 75, timestamp: "2026-01-28T10:01:00" },
    { patient_id: 3, bpm: 68, timestamp: "2026-01-28T10:00:30" } 
];

const server = http.createServer((req, res) => {
        if(req.url === "/" && req.method === "GET"){
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/plain");
            return res.end("GIGABEAT backend online");
        }
        
})
server.listen(PORT, HOSTNAME, () => {
    console.log("servizio ONLINE " + HOSTNAME + ":" + PORT);
});