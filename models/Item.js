const { getPool } = require("../config/database");

/**
 * Query dasar dengan JOIN ke users untuk "populate" owner secara manual
 * (tidak ada .populate()/include() seperti ORM). Kolom owner_* dipetakan ulang
 * ke bentuk nested object di reshapeItemRow().
 */
const BASE_SELECT = `
  SELECT
    i.id, i.name, i.description, i.category, i.price, i.stock, i.status,
    i.owner_id AS "ownerId", i.created_at AS "createdAt", i.updated_at AS "updatedAt",
    u.id AS owner_id_ref, u.name AS owner_name, u.email AS owner_email
  FROM items i
  INNER JOIN users u ON u.id = i.owner_id
`;

function reshapeItemRow(row) {
    if (!row) return row;
    const { owner_id_ref, owner_name, owner_email, ...item } = row;
    return {
        ...item,
        owner: { id: owner_id_ref, name: owner_name, email: owner_email },
    };
}

/**
 * Bangun klausa WHERE + params secara dinamis berdasarkan filter yang dikirim.
 * Placeholder $1, $2, ... di-generate mengikuti urutan params (khas node-postgres).
 */
function buildWhere({ search, category, status }) {
    const conditions = [];
    const params = [];

    if (search) {
        params.push(`%${search}%`);
        conditions.push(`i.name ILIKE $${params.length}`); // ILIKE = LIKE case-insensitive di Postgres
    }
    if (category) {
        params.push(category);
        conditions.push(`i.category = $${params.length}`);
    }
    if (status) {
        params.push(status);
        conditions.push(`i.status = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return { where, params };
}

async function findAll({ search, category, status, limit, offset }) {
    const pool = getPool();
    const { where, params } = buildWhere({ search, category, status });

    const limitParamIndex = params.length + 1;
    const offsetParamIndex = params.length + 2;

    const { rows } = await pool.query(`${BASE_SELECT} ${where} ORDER BY i.created_at DESC LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`, [...params, limit, offset]);

    const { rows: countRows } = await pool.query(`SELECT COUNT(*)::int AS total FROM items i ${where}`, params);

    return { items: rows.map(reshapeItemRow), total: countRows[0].total };
}

async function findById(id) {
    const pool = getPool();
    const { rows } = await pool.query(`${BASE_SELECT} WHERE i.id = $1 LIMIT 1`, [id]);
    return reshapeItemRow(rows[0]);
}

/**
 * findRawById - ambil row items apa adanya (tanpa JOIN) untuk cek ownership
 * sebelum update/delete. Lebih murah daripada findById yang selalu JOIN users.
 */
async function findRawById(id) {
    const pool = getPool();
    const { rows } = await pool.query("SELECT * FROM items WHERE id = $1 LIMIT 1", [id]);
    return rows[0] || null;
}

async function create({ name, description, category, price, stock, status, ownerId }) {
    const pool = getPool();
    const { rows } = await pool.query(
        `INSERT INTO items (name, description, category, price, stock, status, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
        [name, description ?? "", category ?? "Umum", price ?? 0, stock ?? 0, status ?? "active", ownerId],
    );
    return findById(rows[0].id);
}

/**
 * Update parsial: hanya kolom yang benar-benar dikirim yang masuk ke SET clause.
 */
async function update(id, fields) {
    const pool = getPool();
    const allowed = ["name", "description", "category", "price", "stock", "status"];
    const sets = [];
    const params = [];

    for (const key of allowed) {
        if (fields[key] !== undefined) {
            params.push(fields[key]);
            sets.push(`${key} = $${params.length}`);
        }
    }

    if (sets.length === 0) return findById(id); // tidak ada perubahan

    params.push(id);
    await pool.query(`UPDATE items SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    return findById(id);
}

async function remove(id) {
    const pool = getPool();
    await pool.query("DELETE FROM items WHERE id = $1", [id]);
}

module.exports = { findAll, findById, findRawById, create, update, remove };
