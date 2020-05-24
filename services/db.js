require("dotenv").config();
const knex = require("knex")({
  client: "mysql2",
  connection: {
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
  },
});

module.exports = knex;
