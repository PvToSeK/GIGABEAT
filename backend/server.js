const http = require('http');

const PORT = 6767;
const HOSTNAME = "localhost";

const heartRates = [
    { patient_id: 1, bpm: 72, timestamp: "2026-01-28T10:00:00" },
    { patient_id: 2, bpm: 75, timestamp: "2026-01-28T10:01:00" },
    { patient_id: 3, bpm: 68, timestamp: "2026-01-28T10:00:30" }
];

const server = http.createServer((req, res) => {

    if (req.url === "/" && req.method === "GET") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        return res.end("GIGABEAT backend online");
    }

    if (req.url === "/api/heartbeat/latest" && req.method === "GET") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify(heartRates[heartRates.length - 1]));
    }

    if (req.url === "/api/heartbeat" && req.method === "POST") {
        let body = '';

        req.on("data", (chunk) => {
            body += chunk;
        });

        req.on("end", () => {
            let nuovo_battito = JSON.parse(body);
            heartRates.push(nuovo_battito);

            res.statusCode = 201;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify(heartRates));
        });
    }

});

server.listen(PORT, HOSTNAME, () => {
    console.log("servizio ONLINE " + HOSTNAME + ":" + PORT);
});
