CREATE DATABASE IF NOT EXISTS railway;
USE railway;

-- TABLE: Paziente
CREATE TABLE Paziente (
    cf_paziente VARCHAR(16) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    citta VARCHAR(100) NOT NULL,
    data_nascita DATE NOT NULL,
    telefono VARCHAR(20),
    contatto_emergenza VARCHAR(20)
);

-- TABLE: Sensore
CREATE TABLE Sensore (
    id_sensore INT PRIMARY KEY,
    cf_paziente VARCHAR(16) NOT NULL,
    FOREIGN KEY (cf_paziente) REFERENCES Paziente(cf_paziente)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- TABLE: Battito
CREATE TABLE Battito (
    id_battito INT AUTO_INCREMENT PRIMARY KEY,
    id_sensore INT NOT NULL,
    bpm INT NOT NULL,
    `timestamp` DATETIME NOT NULL,
    irregolare BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (id_sensore) REFERENCES Sensore(id_sensore)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- TABLE: Posizione
CREATE TABLE Posizione (
    id_posizione INT AUTO_INCREMENT PRIMARY KEY,
    cf_paziente VARCHAR(16) NOT NULL,
    latitudine DECIMAL(9,6) NOT NULL,
    longitudine DECIMAL(9,6) NOT NULL,
    data_ora DATETIME NOT NULL,

    FOREIGN KEY (cf_paziente) REFERENCES Paziente(cf_paziente)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- TABLE: Emergenze
CREATE TABLE Emergenze (
    id_emergenza INT AUTO_INCREMENT PRIMARY KEY,
    cf_paziente VARCHAR(16) NOT NULL,
    data_ora DATETIME NOT NULL,
    id_battito INT NOT NULL,

    FOREIGN KEY (cf_paziente) REFERENCES Paziente(cf_paziente)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (id_battito) REFERENCES Battito(id_battito)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
-- Inserimento Pazienti
INSERT INTO Paziente (cf_paziente, nome, cognome, citta, data_nascita, telefono, contatto_emergenza) VALUES
('RSSMRA80A01F205X', 'Mario', 'Rossi', 'Milano', '1980-01-01', '3201234567', '3207654321'),
('BNCGLC90B02G224Y', 'Giulia', 'Bianchi', 'Roma', '1990-02-02', '3311234567', '3317654321'),
('VRDLCA75C03H501Z', 'Luca', 'Verdi', 'Napoli', '1975-03-03', '3401234567', '3407654321'),
('GLLSRA85D04L219W', 'Sara', 'Gallo', 'Torino', '1985-04-04', '3481234567', '3487654321'),
('MRNGNN95E05F839V', 'Giovanni', 'Marini', 'Firenze', '1995-05-05', '3331234567', '3337654321'),
('CSTFNC88F06G273U', 'Francesca', 'Costa', 'Bologna', '1988-06-06', '3391234567', '3397654321'),
('FNTELX70G07H612T', 'Alessandro', 'Fontana', 'Venezia', '1970-07-07', '3351234567', '3357654321'),
('CNTMRA92H08L840S', 'Maria', 'Conti', 'Palermo', '1992-08-08', '3421234567', '3427654321'),
('ESPSTN83I09F205R', 'Stefano', 'Esposito', 'Genova', '1983-09-09', '3461234567', '3467654321'),
('RCCNDR78J10G224Q', 'Andrea', 'Ricci', 'Bari', '1978-10-10', '3491234567', '3497654321');

-- Inserimento Sensori
INSERT INTO Sensore (id_sensore, cf_paziente) VALUES
(1, 'RSSMRA80A01F205X'),
(2, 'BNCGLC90B02G224Y'),
(3, 'VRDLCA75C03H501Z'),
(4, 'GLLSRA85D04L219W'),
(5, 'MRNGNN95E05F839V'),
(6, 'CSTFNC88F06G273U'),
(7, 'FNTELX70G07H612T'),
(8, 'CNTMRA92H08L840S'),
(9, 'ESPSTN83I09F205R'),
(10, 'RCCNDR78J10G224Q');

-- Inserimento Battiti
INSERT INTO Battito (id_battito, id_sensore, bpm, timestamp, irregolare) VALUES
(1, 1, 72, '2026-04-01 08:00:00', false),
(2, 2, 85, '2026-04-01 08:01:00', false),
(3, 3, 91, '2026-04-01 08:02:00', true),
(4, 4, 68, '2026-04-01 08:03:00', false),
(5, 5, 77, '2026-04-01 08:04:00', false),
(6, 6, 102, '2026-04-01 08:05:00', true),
(7, 7, 65, '2026-04-01 08:06:00', false),
(8, 8, 88, '2026-04-01 08:07:00', false),
(9, 9, 74, '2026-04-01 08:08:00', false),
(10, 10, 95, '2026-04-01 08:09:00', true);
