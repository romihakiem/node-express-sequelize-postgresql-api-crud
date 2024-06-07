const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({
    origin: "http://localhost:8081"
}));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// base path
app.get("/", (req, res) => {
    res.json({ message: "Hello World!" });
});

require("./app/routes/tutorial")(app);

// sync database
const conn = require("./app/models/connection");
conn.sequelize.sync().then(() => {
    console.log("Synced db.");
}).catch((err) => {
    console.log(`Failed to sync db: ${err}`);
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});