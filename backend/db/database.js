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

const pool = mysql.createPool({
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    uri: process.env.MYSQL_URL
});

pool.getConnection((err, conn) => {
    if (err) {
        console.error('Errore connessione pool:', err);
        process.exit(1);
    }
    console.log('Database pool connesso!');
    conn.release();
});


module.exports = pool.promise();