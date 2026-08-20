require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

if (!JWT_SECRET) {
    // Fail fast di startup kalau secret belum diset, daripada error tersembunyi nanti.
    throw new Error("JWT_SECRET is not defined in environment variables");
}

/**
 * Generate JWT token dari payload user.
 * @param {{ id: number, email: string, role: string }} payload
 */
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify token, throw kalau invalid/expired.
 * @param {string} token
 */
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
