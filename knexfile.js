const { resolve } = require("path");

// if (!process.env.DATABASE_URL) {
//   console.error("DATABASE_URL is not set");
//   process.exit(1);
// }

/**
 * @type { import("knex").Knex.Config }
 */
module.exports = {
  client: "postgresql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
    directory: resolve(__dirname, "migrations"),
  },
};
