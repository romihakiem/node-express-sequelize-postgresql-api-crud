const express = require("express");
const router = express.Router();

const itemController = require("../controllers/itemController");
const { protect } = require("../middleware/authMiddleware");
const { validateBody } = require("../middleware/validate");

// Semua endpoint item butuh login
router.use(protect);

router.get("/", itemController.index);
router.get("/:id", itemController.show);

router.post(
    "/",
    validateBody({
        name: { required: true, type: "string" },
        price: { type: "number", min: 0 },
        stock: { type: "number", min: 0 },
        status: { type: "string", enum: ["active", "inactive"] },
    }),
    itemController.store,
);

router.put(
    "/:id",
    validateBody({
        price: { type: "number", min: 0 },
        stock: { type: "number", min: 0 },
        status: { type: "string", enum: ["active", "inactive"] },
    }),
    itemController.update,
);

router.delete("/:id", itemController.destroy);

module.exports = router;
