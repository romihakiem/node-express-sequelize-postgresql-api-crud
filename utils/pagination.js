/**
 * Helper pagination untuk endpoint list (GET all), pakai `LIMIT`/`OFFSET`
 * pada raw SQL query PostgreSQL. Query params yang didukung: ?page=1&limit=10
 */

function getPagination(query) {
    let page = parseInt(query.page, 10);
    let limit = parseInt(query.limit, 10);

    if (!Number.isInteger(page) || page < 1) page = 1;
    if (!Number.isInteger(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100; // safety cap

    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

function buildMeta({ page, limit, total }) {
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}

module.exports = { getPagination, buildMeta };
