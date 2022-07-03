import { Client as ClientJS } from "discord.js";
import { Client as ClientX } from "discordx";
import { Object } from "ts-toolbelt";

export type Client<T extends boolean = false> = ClientX & ClientJS<T>;

export type Callback<T, Return> = (args: T) => Return;

/**
 * Changes all the types from an object to another type.
 */
export type DeepReplace<Obj, Type> = {
  [K in keyof Obj]: Obj[K][keyof Obj[K]] extends Type
    ? Type
    : Obj[K][keyof Obj[K]] extends object
    ? DeepReplace<Obj[K], Type>
    : Obj[K];
};

/**
 * Transform a object keys into arrays of their keys indicating it's path in the object.
 * @example
 * ```typescript
 * // $ExpectType ["a"] | ["b", "c"] | ["b", "d", "e"]
 * type MyObject = ObjectKeysToStringPath<{
 *   a: string;
 *   b: { c: string; d: { e: string } }
 * }>;
 * ```
 */
export type ObjectKeysToStringPath<T> = T extends object
  ? {
      [K in keyof T]: [K, ...ObjectKeysToStringPath<T[K]>];
    }[keyof T]
  : [];
