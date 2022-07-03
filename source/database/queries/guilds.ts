import Container from "typedi";
import Knex from "knex";
import type { CamelCasedPropertiesDeep } from "type-fest";

import { camelizePropertiesDeep, DatesColumns, snakeizePropertiesDeep, type Guild } from "../types";

export namespace GuildsQueries {
  type CamelCaseGuild = CamelCasedPropertiesDeep<Guild>;

  type CreateGuild = Omit<CamelCaseGuild, "id" | keyof DatesColumns>;

  const knex = Container.get<typeof Knex>(Knex);

  /**
   * Gets a guild that matches the given query from the database.
   * @param search Search query, eg. { id: "123" }
   * @returns The guilds that match the search query.
   */
  export async function get(search: Partial<CamelCaseGuild>): Promise<CamelCaseGuild | undefined> {
    const queryBuilder = knex("guilds").where(snakeizePropertiesDeep(search)).first();
    return camelizePropertiesDeep(queryBuilder);
  }

  /**
   * Create a new guild in the database.
   * @param guild Guild object to insert.
   */
  export async function create(guild: CreateGuild): Promise<void> {
    await knex("guilds").insert(snakeizePropertiesDeep(guild));
  }

  /**
   * Update a guild that matches the given query.
   * @param search Search query, eg. { id: "123" }
   * @param update Update query, eg. { locale: "en" }
   * @returns The updated guild.
   */
  export async function update(
    search: Partial<CamelCaseGuild>,
    update: Partial<CamelCaseGuild>
  ): Promise<CamelCaseGuild> {
    const queryBuilder = await knex("guilds")
      .where(search)
      .update(snakeizePropertiesDeep(update))
      .returning("*")
      .first();

    return camelizePropertiesDeep(queryBuilder);
  }

  /**
   * Delete a guild that matches the given query.
   * @param search Search query, eg. { id: "123" }
   */
  export async function deleteGuild(search: Partial<CamelCaseGuild>): Promise<void> {
    await knex("guilds").where(snakeizePropertiesDeep(search)).del();
  }
}
