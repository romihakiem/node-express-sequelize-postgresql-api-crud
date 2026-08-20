const express = require("express");
const router = express.Router();

const { register, login, me } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { validateBody } = require("../middleware/validate");

router.post(
    "/register",
    validateBody({
        name: { required: true, type: "string" },
        email: { required: true, type: "string" },
        password: { required: true, type: "string", minLength: 6 },
    }),
    register,
);

router.post(
    "/login",
    validateBody({
        email: { required: true, type: "string" },
        password: { required: true, type: "string" },
    }),
    login,
);

router.get("/me", protect, me);

module.exports = router;
