const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const itemRoutes = require("./itemRoutes");

router.get("/health", (req, res) => {
    res.status(200).json({ success: true, message: "API is healthy", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/items", itemRoutes);

module.exports = router;
