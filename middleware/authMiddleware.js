const { verifyToken } = require("../utils/jwt");
const { error } = require("../utils/response");
const { User } = require("../models");

/**
 * Memastikan request punya Bearer token yang valid.
 * Attach `req.user` (row plain, tanpa password) untuk dipakai controller berikutnya.
 */
async function protect(req, res, next) {
    try {
        const authHeader = req.headers.authorization || "";
        const [scheme, token] = authHeader.split(" ");

        if (scheme !== "Bearer" || !token) {
            return error(res, { statusCode: 401, message: "Not authorized, no token provided" });
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            const message = err.name === "TokenExpiredError" ? "Token has expired" : "Invalid token";
            return error(res, { statusCode: 401, message });
        }

        // User.findById sudah tidak menyertakan kolom password (lihat SAFE_COLUMNS)
        const user = await User.findById(decoded.id);
        if (!user) {
            return error(res, { statusCode: 401, message: "User belonging to this token no longer exists" });
        }

        req.user = user;
        next();
    } catch (err) {
        return error(res, { statusCode: 500, message: "Authentication error", errors: err.message });
    }
}

/**
 * Middleware factory untuk restrict akses berdasarkan role.
 * Contoh pakai: router.delete('/:id', protect, authorize('admin'), controller.destroy)
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return error(res, { statusCode: 403, message: "Forbidden: insufficient role" });
        }
        next();
    };
}

module.exports = { protect, authorize };
