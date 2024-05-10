const host = process.env.MYSQL_DATABASE_HOST;
const password = process.env.MYSQL_DATABASE_PASSWORD;
const testhost = process.env.TEST_HOST;
const testpassword = process.env.TEST_PASSWORD;

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