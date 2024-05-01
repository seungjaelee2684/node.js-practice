const host = process.env.MYSQL_DATABASE_HOST;
const password = process.env.MYSQL_DATABASE_PASSWORD

module.exports = {
    host: host,
    port: '3306',
    user: 'sean2684',
    password: password,
    database: 'aria',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};