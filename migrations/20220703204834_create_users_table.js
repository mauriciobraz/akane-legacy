/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("users_guilds", table => {
    table.increments("id").primary();

    table.uuid("user_id").references("id").inTable("users").onDelete("CASCADE");
    table.uuid("guild_id").references("id").inTable("guilds").onDelete("CASCADE");

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("users", table => {
    table.uuid("id").unique().primary();

    table.string("user_id").checkLength(">=", 17).unique().notNullable();
    table.string("locale").defaultTo("pt-BR");

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable("users_guilds");
  await knex.schema.dropTable("users");
};
