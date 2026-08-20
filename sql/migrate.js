require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

/**
 * Migration runner sederhana tanpa ORM/CLI tambahan.
 * 1. Connect ke database default ("postgres") untuk membuat database target kalau belum ada
 *    (PostgreSQL tidak bisa CREATE DATABASE sambil connect ke database itu sendiri).
 * 2. Connect ke database target, lalu jalankan sql/schema.sql apa adanya.
 * Untuk proyek production yang butuh versioning migration bertahap,
 * pertimbangkan tool seperti node-pg-migrate atau Flyway - ini cukup untuk skeleton.
 */
async function migrate() {
    const baseConfig = {
        host: process.env.PG_HOST || "127.0.0.1",
        port: Number(process.env.PG_PORT) || 5432,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
    };
    const dbName = process.env.PG_DATABASE;

    // Step 1: pastikan database target ada
    const adminClient = new Client({ ...baseConfig, database: "postgres" });
    await adminClient.connect();
    try {
        const { rows } = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
        if (rows.length === 0) {
            await adminClient.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✅ Database "${dbName}" created.`);
        }
    } finally {
        await adminClient.end();
    }

    // Step 2: jalankan schema.sql terhadap database target
    const client = new Client({ ...baseConfig, database: dbName });
    await client.connect();
    try {
        const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
        await client.query(schemaSql);
        console.log(`✅ Migration completed. Database "${dbName}" is up to date.`);
    } finally {
        await client.end();
    }
}

migrate().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
