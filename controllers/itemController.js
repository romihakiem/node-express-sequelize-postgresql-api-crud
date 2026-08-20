const { Item } = require("../models");
const { success, error } = require("../utils/response");
const { getPagination, buildMeta } = require("../utils/pagination");

/**
 * GET /api/items
 * Query params: page, limit, search, category, status
 */
async function index(req, res, next) {
    try {
        const { page, limit, offset } = getPagination(req.query);
        const { search, category, status } = req.query;

        const { items, total } = await Item.findAll({ search, category, status, limit, offset });

        return success(res, {
            message: "Items fetched successfully",
            data: items,
            meta: buildMeta({ page, limit, total }),
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/items/:id
 */
async function show(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return error(res, { statusCode: 400, message: "Invalid item id" });
        }

        const item = await Item.findById(id);
        if (!item) {
            return error(res, { statusCode: 404, message: "Item not found" });
        }
        return success(res, { message: "Item fetched successfully", data: item });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/items
 */
async function store(req, res, next) {
    try {
        const { name, description, category, price, stock, status } = req.body;

        if (!name) {
            return error(res, { statusCode: 422, message: "name is required" });
        }

        const item = await Item.create({
            name,
            description,
            category,
            price,
            stock,
            status,
            ownerId: req.user.id, // owner selalu diambil dari user yang login
        });

        return success(res, { statusCode: 201, message: "Item created successfully", data: item });
    } catch (err) {
        next(err);
    }
}

/**
 * PUT /api/items/:id
 */
async function update(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return error(res, { statusCode: 400, message: "Invalid item id" });
        }

        const existing = await Item.findRawById(id);
        if (!existing) {
            return error(res, { statusCode: 404, message: "Item not found" });
        }

        // hanya owner atau admin yang boleh update
        if (existing.owner_id !== req.user.id && req.user.role !== "admin") {
            return error(res, { statusCode: 403, message: "Forbidden: not the owner of this item" });
        }

        const { name, description, category, price, stock, status } = req.body;
        const updated = await Item.update(id, { name, description, category, price, stock, status });

        return success(res, { message: "Item updated successfully", data: updated });
    } catch (err) {
        next(err);
    }
}

/**
 * DELETE /api/items/:id
 */
async function destroy(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return error(res, { statusCode: 400, message: "Invalid item id" });
        }

        const existing = await Item.findRawById(id);
        if (!existing) {
            return error(res, { statusCode: 404, message: "Item not found" });
        }

        if (existing.owner_id !== req.user.id && req.user.role !== "admin") {
            return error(res, { statusCode: 403, message: "Forbidden: not the owner of this item" });
        }

        await Item.remove(id);

        return success(res, { message: "Item deleted successfully" });
    } catch (err) {
        next(err);
    }
}

module.exports = { index, show, store, update, destroy };
