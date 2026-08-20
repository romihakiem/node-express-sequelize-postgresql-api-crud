const { error } = require("../utils/response");

/**
 * Validator ringan tanpa dependency tambahan (mis. Joi/Zod).
 * PENTING: karena skeleton ini tidak pakai ORM, validasi seperti `required`,
 * `enum`, `min`, dan `minLength` harus dilakukan manual di sini, sebelum
 * query dikirim ke PostgreSQL.
 *
 * rules contoh:
 * {
 *   name: { required: true, type: 'string' },
 *   price: { type: 'number', min: 0 },
 *   status: { type: 'string', enum: ['active', 'inactive'] }
 * }
 */
function validateBody(rules) {
    return (req, res, next) => {
        const errors = [];
        const body = req.body || {};

        for (const [field, rule] of Object.entries(rules)) {
            const value = body[field];

            if (rule.required && (value === undefined || value === null || value === "")) {
                errors.push({ field, message: `${field} is required` });
                continue;
            }

            if (value === undefined || value === null) continue; // field opsional & tidak dikirim, skip sisanya

            if (rule.type) {
                const actualType = typeof value;
                if (rule.type === "number" && actualType !== "number") {
                    errors.push({ field, message: `${field} must be a number` });
                    continue;
                }
                if (rule.type === "string" && actualType !== "string") {
                    errors.push({ field, message: `${field} must be a string` });
                    continue;
                }
            }

            if (rule.minLength && typeof value === "string" && value.length < rule.minLength) {
                errors.push({ field, message: `${field} must be at least ${rule.minLength} characters` });
            }

            if (rule.min !== undefined && typeof value === "number" && value < rule.min) {
                errors.push({ field, message: `${field} must be at least ${rule.min}` });
            }

            if (rule.enum && !rule.enum.includes(value)) {
                errors.push({ field, message: `${field} must be one of: ${rule.enum.join(", ")}` });
            }
        }

        if (errors.length > 0) {
            return error(res, { statusCode: 422, message: "Validation error", errors });
        }

        next();
    };
}

module.exports = { validateBody };
