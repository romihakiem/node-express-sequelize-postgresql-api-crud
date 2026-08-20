const { getPool } = require("../config/database");

/**
 * Tanpa ORM, tidak ada Model class - "model" di sini adalah kumpulan fungsi
 * yang menjalankan raw SQL (parameterized query dengan $1, $2, ... - aman
 * dari SQL injection) terhadap tabel `users`, plus helper kecil (buang password).
 */

const SAFE_COLUMNS = 'id, name, email, role, created_at AS "createdAt", updated_at AS "updatedAt"';

async function findByEmail(email) {
    const pool = getPool();
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    return rows[0] || null;
}

async function findById(id) {
    const pool = getPool();
    const { rows } = await pool.query(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1 LIMIT 1`, [id]);
    return rows[0] || null;
}

async function create({ name, email, password, role }) {
    const pool = getPool();
    const { rows } = await pool.query(
        `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${SAFE_COLUMNS}`,
        [name, email, password, role === "admin" ? "user" : role || "user"],
    );
    return rows[0];
}

/**
 * Buang field password dari row user sebelum dikirim ke client.
 * @param {object} user
 */
function toSafeUser(user) {
    if (!user) return user;
    const { password, ...safeUser } = user;
    return safeUser;
}

module.exports = { findByEmail, findById, create, toSafeUser };
