const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

/**
 * Hash plain password.
 * @param {string} plainPassword
 * @returns {Promise<string>}
 */
async function hashPassword(plainPassword) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(plainPassword, salt);
}

/**
 * Compare plain password dengan hash yang tersimpan di DB.
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
async function checkPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = { hashPassword, checkPassword };
