/**
 * Standard response helper agar semua endpoint konsisten formatnya.
 */

function success(res, { statusCode = 200, message = "Success", data = null, meta = null } = {}) {
    const body = { success: true, message };
    if (data !== null) body.data = data;
    if (meta !== null) body.meta = meta;
    return res.status(statusCode).json(body);
}

function error(res, { statusCode = 500, message = "Internal Server Error", errors = null } = {}) {
    const body = { success: false, message };
    if (errors !== null) body.errors = errors;
    return res.status(statusCode).json(body);
}

module.exports = { success, error };
