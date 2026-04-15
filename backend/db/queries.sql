/* Commenti generali : 
    Prima versione query del database V1
*/    
    
/* Insert esempio */
INSERT INTO Battito (id_battito, id_sensore, bpm, timestamp, irregolare)
VALUES (1, 1, 78, NOW(), false);

/* Richiesta n1 : Ultimo battito di un paziente */
SELECT b.bpm, b.timestamp
FROM Battito b
JOIN Sensore s ON b.id_sensore = s.id_sensore
WHERE s.cf_paziente = 'CF_PAZIENTE'
ORDER BY b.timestamp DESC
LIMIT 1;

/* Richiesta n2: Storico Battiti */
SELECT b.bpm, b.timestamp
FROM Battito b
JOIN Sensore s ON b.id_sensore = s.id_sensore
WHERE s.cf_paziente = 'CF_PAZIENTE'
ORDER BY b.timestamp;

/* Richiesta n3: Media Battiti */
SELECT AVG(b.bpm) AS media_battiti
FROM Battito b
JOIN Sensore s ON b.id_sensore = s.id_sensore
WHERE s.cf_paziente = 'CF_PAZIENTE';

/* Richiesta n4: Battiti irregolari */
SELECT b.bpm, b.timestamp
FROM Battito b
JOIN Sensore s ON b.id_sensore = s.id_sensore
WHERE s.cf_paziente = 'CF_PAZIENTE'
AND b.irregolare = true;

