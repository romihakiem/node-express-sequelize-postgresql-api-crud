const { User } = require("../models");
const { hashPassword, checkPassword } = require("../utils/password");
const { generateToken } = require("../utils/jwt");
const { success, error } = require("../utils/response");

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return error(res, { statusCode: 422, message: "name, email, and password are required" });
        }

        if (password.length < 6) {
            return error(res, { statusCode: 422, message: "password must be at least 6 characters" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const existing = await User.findByEmail(normalizedEmail);
        if (existing) {
            return error(res, { statusCode: 409, message: "Email is already registered" });
        }

        const hashedPassword = await hashPassword(password);

        // role hanya bisa diset ke 'admin' lewat proses terpisah/seed, bukan dari body publik
        const user = await User.create({
            name: String(name).trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: role === "admin" ? "user" : role,
        });

        const token = generateToken({ id: user.id, email: user.email, role: user.role });

        return success(res, {
            statusCode: 201,
            message: "Registration successful",
            data: { user, token }, // User.create sudah RETURNING kolom tanpa password
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return error(res, { statusCode: 422, message: "email and password are required" });
        }

        // findByEmail select * (termasuk password) karena harus dicocokkan
        const user = await User.findByEmail(String(email).trim().toLowerCase());

        if (!user) {
            return error(res, { statusCode: 401, message: "Invalid email or password" });
        }

        const isMatch = await checkPassword(password, user.password);
        if (!isMatch) {
            return error(res, { statusCode: 401, message: "Invalid email or password" });
        }

        const token = generateToken({ id: user.id, email: user.email, role: user.role });

        return success(res, {
            message: "Login successful",
            data: { user: User.toSafeUser(user), token },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/auth/me
 * Butuh middleware `protect` sebelumnya, sehingga req.user sudah tersedia (tanpa password).
 */
async function me(req, res, next) {
    try {
        return success(res, {
            message: "Current user fetched successfully",
            data: { user: req.user },
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { register, login, me };
