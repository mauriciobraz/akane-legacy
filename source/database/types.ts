import type { CamelCase, CamelCasedPropertiesDeep, SnakeCasedPropertiesDeep } from "type-fest";

export type UUID = string;
export type Increment = number;
export type DateTime = Date | number;

export type DatesColumns = {
  created_at?: DateTime;
  updated_at?: DateTime;
};

export type Guild = DatesColumns & {
  id: UUID;
  guild_id: string;
};

export type User = DatesColumns & {
  id: UUID;
  user_id: string;
  locale: string;
};

export type UserGuild = DatesColumns & {
  id: Increment;
  user_id: UUID;
  guild_id: UUID;
};

export type GuildWithUsers = Guild & {
  users: User[];
};

export type UserGuildWithGuilds = UserGuild & {
  guilds: Guild[];
};

/**
 * Transforms a string to a camel case string. It works too at "-" and "_" separators.
 * @param string The string to camelize.
 * @returns The camelized string.
 */
function camelize<T extends string>(string: T): string {
  return string.replace(/[-_](\w)/g, (_, c) => c.toUpperCase()) as CamelCase<T>;
}

/**
 * Camelize all properties keys of an object.
 * @param obj The object to camelize the properties of.
 */
export function camelizePropertiesDeep<T>(obj: T): CamelCasedPropertiesDeep<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[camelize(key)] = typeof value === "object" ? camelizePropertiesDeep(value) : value;
    return acc;
  }, {} as Record<string, unknown>) as CamelCasedPropertiesDeep<T>;
}

/**
 * Snakeize a string.
 * @param string The string to snakeize.
 * @returns The snakeized string.
 */
export function snakeize(string: string): string {
  return string.replace(/([A-Z])/g, "_$1").toLowerCase();
}

/**
 * Snakeize all properties keys of an object.
 * @param obj The object to snakeize the properties of.
 * @returns The snakeized object.
 */
export function snakeizePropertiesDeep<T>(obj: T): SnakeCasedPropertiesDeep<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[snakeize(key)] = typeof value === "object" ? snakeizePropertiesDeep(value) : value;
    return acc;
  }, {} as Record<string, unknown>) as SnakeCasedPropertiesDeep<T>;
}
