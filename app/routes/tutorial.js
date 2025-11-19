module.exports = (app) => {
    const tutorial = require("../controllers/tutorial");
    const router = require("express").Router();

    router.get("/", tutorial.findAll);
    router.get("/published", tutorial.findPublished);
    router.get("/:id", tutorial.findOne);
    router.post("/", tutorial.create);
    router.put("/:id", tutorial.update);
    router.delete("/", tutorial.deleteAll);
    router.delete("/:id", tutorial.delete);

    app.use("/api/tutorial", router);
};
