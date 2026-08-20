const { Pool } = require("pg");

/**
 * Tanpa ORM, kita kelola sendiri connection pool node-postgres.
 * Pool dibagi ke seluruh app lewat getPool() - jangan buat pool baru di tempat lain.
 */

let pool;

function createPool() {
    pool = new Pool({
        host: process.env.PG_HOST || "127.0.0.1",
        port: Number(process.env.PG_PORT) || 5432,
        database: process.env.PG_DATABASE,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        max: 10, // connection pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
    });

    // Error pada koneksi idle di pool (mis. DB restart) - jangan sampai crash proses diam-diam
    pool.on("error", (err) => {
        console.error("❌ Unexpected error on idle PostgreSQL client:", err);
    });

    return pool;
}

/**
 * Dipanggil sekali saat server start untuk memastikan kredensial & host valid
 * sebelum aplikasi dianggap "siap" (lihat server.js).
 */
async function connectDB() {
    if (!pool) createPool();
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return pool;
}

function getPool() {
    if (!pool) {
        throw new Error("Database pool has not been initialized. Call connectDB() first.");
    }
    return pool;
}

async function closeDB() {
    if (pool) {
        await pool.end();
    }
}

module.exports = { connectDB, getPool, closeDB };
