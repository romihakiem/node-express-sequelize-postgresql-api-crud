const Sequelize = require("sequelize");
const db = require("../configs/db");

const sequelize = new Sequelize(db.DATABASE, db.USERNAME, db.PASSWORD, {
    host: db.HOST,
    dialect: db.DIALECT,
    pool: {
        max: db.POOL.MAX,
        min: db.POOL.MIN,
        acquire: db.POOL.ACQUIRE,
        idle: db.POOL.IDLE
    }
});

const connect = {};

connect.Sequelize = Sequelize;
connect.sequelize = sequelize;
connect.tutorials = require("./tutorial")(sequelize, Sequelize);

module.exports = connect;