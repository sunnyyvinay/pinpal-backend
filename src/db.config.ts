import { Pool } from "pg";

const pool = new Pool({
    user: "me",
    host: "localhost",
    database: "pinpal",
    password: "password",
    port: 5432
});

export default pool;