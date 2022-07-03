import Container from "typedi";
import Knex from "knex";
import type { CamelCasedPropertiesDeep } from "type-fest";

import { camelizePropertiesDeep, snakeizePropertiesDeep, type User } from "../types";

export namespace UsersQueries {
  type CamelCaseUser = CamelCasedPropertiesDeep<User>;

  const knex = Container.get<typeof Knex>(Knex);

  /**
   * Gets a user that matches the given query from the database.
   * @param search Search query, eg. { id: "123" }
   * @returns The users that match the search query.
   */
  export async function get(search: Partial<CamelCaseUser>): Promise<CamelCaseUser | undefined> {
    const queryBuilder = await knex("users").where(snakeizePropertiesDeep(search)).first();
    return camelizePropertiesDeep(queryBuilder);
  }

  /**
   * Create a new user in the database.
   * @param user User object to insert.
   * @returns The user that was inserted.
   */
  export async function create(user: CamelCaseUser): Promise<CamelCaseUser> {
    const queryBuilder = await knex("users")
      .insert(snakeizePropertiesDeep(user))
      .returning("*")
      .first();

    return camelizePropertiesDeep(queryBuilder);
  }

  /**
   * Updates a user.
   * @param search Search query, eg. { id: "123" }
   * @param update Update query, eg. { locale: "en" }
   * @returns The updated user.
   */
  export async function update(
    search: Partial<CamelCaseUser>,
    update: Partial<CamelCaseUser>
  ): Promise<CamelCaseUser> {
    const queryBuilder = await knex("users")
      .where(search)
      .update(snakeizePropertiesDeep(update))
      .returning("*")
      .first();

    return camelizePropertiesDeep(queryBuilder);
  }

  /**
   * Delete a user that matches the given query.
   * @param search Search query, eg. { id: "123" }
   */
  export async function deleteUser(search: Partial<CamelCaseUser>): Promise<void> {
    await knex("users").where(snakeizePropertiesDeep(search)).del();
  }
}
