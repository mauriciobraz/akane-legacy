import type {
  CacheType,
  Client as ClientJS,
  Interaction,
  InteractionResponseFields,
} from "discord.js";
import type { Client as ClientX } from "discordx";

export type RepliableInteraction<Type extends CacheType | undefined = undefined> =
  Interaction<Type> & InteractionResponseFields<Type>;

/** Merge of the Discord.js and DiscordX client types. */
export type MergeClient<T extends boolean = false> = ClientX & ClientJS<T>;

/** Loose autocomplete for a string type. Useful for typed generics. */
export type LooseAutocomplete<T extends string> = T | Omit<string, T>;

/** All debuggers that Akane can use. */
export type Debugger = LooseAutocomplete<"*" | "DiscordJS" | "PrismaClient">;

/** Changes all the types from an object to another type. */
export type DeepReplace<Obj, Type> = {
  [K in keyof Obj]: Obj[K][keyof Obj[K]] extends Type
    ? Type
    : Obj[K][keyof Obj[K]] extends object
    ? DeepReplace<Obj[K], Type>
    : Obj[K];
};

/** Transform a object keys into arrays of their keys indicating it's path in the object. */
export type PathArray<T> = T extends object
  ? {
      [K in keyof T]: [K, ...PathArray<T[K]>];
    }[keyof T]
  : [];
