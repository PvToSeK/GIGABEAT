DROP DATABASE if exists GIGABEAT;

CREATE DATABASE if not exists GIGABEAT;
USE GIGABEAT;

CREATE TABLE Paziente(
	cf_paziente varchar(16) PRIMARY KEY,
    nome varchar(100) NOT NULL,
    cognome varchar(100) NOT NULL,
    citta varchar(100) NOT NULL,
    data_nascita date NOT NULL,
    telefono int CHECK(telefono = 10),
    contatto_emergenza int CHECK(telefono = 10)
);

CREATE TABLE Sensore(
	id_sensore int PRIMARY KEY,
    cf_paziente varchar(16) NOT NULL,
    
    FOREIGN KEY (cf_paziente) REFERENCES Paziente(cf_paziente)
);

CREATE TABLE Battito(
	id_battito int PRIMARY KEY,
    id_sensore int NOT NULL,
    battiti int NOT NULL,
    data_ora datetime NOT NULL,
    irregolare boolean,
    
    FOREIGN KEY (id_sensore) REFERENCES Sensore(id_sensore)
);

CREATE TABLE Posizione(
	id_posizione int PRIMARY KEY,
    cf_paziente varchar(16) NOT NULL,
    latitudine decimal(9, 6) NOT NULL,
    longitudine decimal(9, 6) NOT NULL,
    data_ora datetime NOT NULL,
    
    FOREIGN KEY (cf_paziente) REFERENCES Paziente(cf_paziente)
);


CREATE TABLE Emergenze(
	id_emergenza int PRIMARY KEY,
    cf_paziente varchar(16) NOT NULL,
    id_misurazione int NOT NULL,
    data_ora datetime,
    id_battito int NOT NULL,
    
    FOREIGN KEY (cf_paziente) REFERENCES Paziente(cf_paziente),
    FOREIGN KEY (id_battito) REFERENCES Battito(id_battito)
);