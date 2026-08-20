const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

app.get("/", (req, res) => {
    res.json({ success: true, message: "Express + PostgreSQL (pg, no ORM) REST API Skeleton is running" });
});

// 404 + error handler (harus paling akhir)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
