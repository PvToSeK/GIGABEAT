/* Commenti generali : 
    Prima versione query del database V1
*/    
    



/*     
Insert esempio INSERT INTO Battito (id_battito, id_sensore, battiti, data_ora, irregolare)
VALUES (1, 1, 78, NOW(), false);

    Richiesta n1 : Ultimo pattito di un paziete
*/ 

SELECT b.battiti, b.data_ora
FROM Battito b
JOIN Sensore s ON b.id_sensore = s.id_sensore
WHERE s.cf_paziente = 1
ORDER BY b.data_ora DESC
LIMIT 1;



/* Richiesta n2: Storico Battiti*/ 

SELECT b.battiti, b.data_ora
FROM Battito b
JOIN Sensore s ON b.id_sensore = s.id_sensore
WHERE s.cf_paziente = 1
ORDER BY b.data_ora;

/* Richiesta n3: media Battiti*/  

SELECT AVG(b.battiti) AS media_battiti
FROM Battito b
JOIN Sensore s ON b.id_sensore = s.id_sensore
WHERE s.cf_paziente = 1;

/* Richiesta n4:  Battiti irregolar */ 

SELECT b.battiti, b.data_ora
FROM Battito b
JOIN Sensore s ON b.id_sensore = s.id_sensore
WHERE s.cf_paziente = 1
AND b.irregolare = true;








