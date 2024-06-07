const conn = require("../models/connection");
const Tutorial = conn.tutorials;
const Op = conn.Sequelize.Op;

// Display all resources from storage.
exports.findAll = (req, res) => {
    let { page, size, title } = req.query;

    page = parseInt(page ?? 0);
    size = parseInt(size ?? 0);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(size) || size < 1) size = 5;

    const offset = ((page - 1) * size);
    const condition = title ? { title: { [Op.like]: `%${title}%` } } : null;

    Tutorial.findAndCountAll({ where: condition, limit: size, offset: offset }).then(data => {
        res.send({
            pages: size,
            current: page,
            data: data.rows,
            total: data.count
        });
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Error retrieving data."
        });
    });
};

// Display the specified resource.
exports.findOne = (req, res) => {
    Tutorial.findByPk(req.params.id).then(data => {
        if (data) {
            res.send(data);
        } else {
            res.status(404).send({
                message: `Data not found with id ${req.params.id}.`
            });
        }
    }).catch(err => {
        res.status(500).send({
            message: `Error retrieving data with id ${req.params.id}.`
        });
    });
};

// Display all published resources.
exports.findPublished = (req, res) => {
    Tutorial.findAll({ where: { published: true } }).then(data => {
        res.send(data);
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Error retrieving data."
        });
    });
};

// Store a newly created resource in storage.
exports.create = (req, res) => {
    if (!req.body.title) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    const val = {
        title: req.body.title,
        description: req.body.description,
        published: req.body.published || false
    };

    Tutorial.create(val).then(data => {
        res.send({ message: "Successfully created.", data: data });
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Error creating data."
        });
    });
};

// Update the specified resource in storage.
exports.update = (req, res) => {
    if (!req.body.title) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    Tutorial.update(req.body, { where: { id: req.params.id } }).then(num => {
        if (num == 1) {
            res.send({ message: "Successfully updated.", data: req.body });
        } else {
            res.status(404).send({
                message: `Data not updated with id ${req.params.id}.`
            });
        }
    }).catch(err => {
        res.status(500).send({
            message: `Error updating data with id ${req.params.id}.`
        });
    });
};

// Remove the specified resource from storage.
exports.delete = (req, res) => {
    Tutorial.destroy({ where: { id: req.params.id } }).then(num => {
        if (num == 1) {
            res.send({ message: "Successfully deleted." });
        } else {
            res.status(404).send({
                message: `Data not deleted with id ${req.params.id}.`
            });
        }
    }).catch(err => {
        res.status(500).send({
            message: `Error deleting data with id ${req.params.id}.`
        });
    });
};

// Remove all resources from storage.
exports.deleteAll = (req, res) => {
    Tutorial.destroy({ where: {}, truncate: false }).then(num => {
        res.send({ message: "Successfully deleted." });
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Error deleting data."
        });
    });
};