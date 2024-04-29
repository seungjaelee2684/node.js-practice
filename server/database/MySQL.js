const dbConfig = require('../config/config');
const mysql = require('mysql2');

const connection = mysql.createConnection(dbConfig);
console.log('Connected to MySQL!');

module.exports = connection;