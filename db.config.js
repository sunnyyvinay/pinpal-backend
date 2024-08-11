const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres", // or "me"
    host: "localhost",
    database: "pinpal",
    password: "password",
    port: 5432
});

module.exports = pool;