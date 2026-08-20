require("dotenv").config();
const app = require("./app");
const { connectDB, closeDB } = require("./config/database");

const PORT = process.env.PORT || 3000;

let server;

async function start() {
    try {
        // Pastikan pool bisa konek & kredensial valid sebelum server dianggap siap.
        // Skema tabel dikelola lewat `npm run db:migrate` (sql/migrate.js), bukan otomatis di sini.
        await connectDB();
        console.log("✅ Database connected successfully (PostgreSQL / pg pool).");

        server = app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV || "development"}]`);
        });
    } catch (err) {
        console.error("❌ Failed to start server:", err);
        process.exit(1);
    }
}

/**
 * Graceful shutdown:
 * - Stop menerima koneksi baru (server.close)
 * - Tunggu request yang sedang berjalan selesai
 * - Tutup connection pool pg (menunggu koneksi aktif selesai, lalu menutup semuanya)
 * - Baru exit process
 */
function gracefulShutdown(signal) {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    if (!server) {
        process.exit(0);
        return;
    }

    // Paksa keluar kalau shutdown macet lebih dari 10 detik
    const forceExitTimeout = setTimeout(() => {
        console.error("⚠️  Forcing shutdown after timeout.");
        process.exit(1);
    }, 10000);

    server.close(async (err) => {
        if (err) {
            console.error("❌ Error while closing HTTP server:", err);
        } else {
            console.log("✅ HTTP server closed. No longer accepting new connections.");
        }

        try {
            await closeDB();
            console.log("✅ Database connection pool closed.");
            clearTimeout(forceExitTimeout);
            process.exit(err ? 1 : 0);
        } catch (dbErr) {
            console.error("❌ Error while closing database connection:", dbErr);
            clearTimeout(forceExitTimeout);
            process.exit(1);
        }
    });
}

// Sinyal terminasi umum (Docker, Kubernetes, Ctrl+C, dsb)
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Safety net untuk error yang tidak tertangkap
process.on("unhandledRejection", (reason) => {
    console.error("❌ Unhandled Rejection:", reason);
    gracefulShutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
    gracefulShutdown("uncaughtException");
});

start();
