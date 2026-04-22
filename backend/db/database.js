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
const mysql = require('mysql2');

const connection = mysql.createConnection(process.env.MYSQL_URL);

connection.connect((err) => {
    if (err) {
        console.error('Errore connessione database:', err);
        process.exit(1);
    }
    console.log('Database connesso!');
});

connection.on('error', (err) => {
    console.error('❌ Errore database:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Riconnessione in corso...');
        connection.connect();
    }
});

module.exports = connection;