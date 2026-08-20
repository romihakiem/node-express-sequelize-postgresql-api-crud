const { error } = require("../utils/response");

/**
 * 404 handler - dipasang setelah semua route terdaftar.
 */
function notFound(req, res, next) {
    error(res, { statusCode: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/**
 * Central error handler.
 * Tanpa ORM, tidak ada ValidationError otomatis - validasi input sudah
 * dilakukan manual di middleware/validate.js. Di sini kita tangani kode
 * error PostgreSQL (SQLSTATE, via node-postgres `err.code`) yang paling umum
 * muncul dari raw query. Referensi lengkap: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
function errorHandler(err, req, res, next) {
    // eslint-disable-line no-unused-vars
    console.error(err);

    switch (err.code) {
        case "23505": // unique_violation, mis. email sudah terdaftar
            return error(res, {
                statusCode: 409,
                message: `Duplicate value for unique field${err.detail ? `: ${err.detail}` : ""}`,
            });

        case "23503": // foreign_key_violation, mis. owner_id tidak ada di tabel users
            return error(res, { statusCode: 400, message: "Invalid reference (foreign key constraint)" });

        case "23514": // check_violation, mis. price/stock < 0
            return error(res, { statusCode: 422, message: "One of the fields violates a check constraint" });

        case "22001": // string_data_right_truncation, mis. VARCHAR(191) kelebihan karakter
            return error(res, { statusCode: 422, message: "One of the fields exceeds the allowed length" });

        case "22P02": // invalid_text_representation, mis. nilai enum tidak valid atau :id bukan integer
            return error(res, { statusCode: 422, message: "One of the fields has an invalid value or format" });

        default:
            break;
    }

    const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
    return error(res, {
        statusCode,
        message: err.message || "Internal Server Error",
        errors: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
}

module.exports = { notFound, errorHandler };
