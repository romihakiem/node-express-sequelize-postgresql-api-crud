module.exports = {
    HOST: "localhost",
    USERNAME: "postgres",
    PASSWORD: "psgrs",
    DATABASE: "test",
    DIALECT: "postgres",
    POOL: {
        MAX: 5,
        MIN: 0,
        ACQUIRE: 30000,
        IDLE: 10000
    }
};