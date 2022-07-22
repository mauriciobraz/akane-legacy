import type {
  CacheType,
  Client,
  CommandInteraction,
  Interaction,
  InteractionResponseFields,
} from "discord.js";
import type { Client as ClientX } from "discordx";
import type { Logger } from "tslog";

type CleanLogger = Omit<
  Logger,
  | "attachTransport"
  | "getChildLogger"
  | "settings"
  | "setSettings"
  | "prettyError"
  | "printPrettyLog"
>;

export type RepliableInteraction<Cached extends CacheType = CacheType> = Interaction<Cached> &
  InteractionResponseFields<Cached>;

export type Loggable<T extends object> = T & { readonly logger?: CleanLogger };

/** Merge of the Discord.js and DiscordX client types. */
export type MergeClient<T extends boolean = false> = ClientX & Client<T>;

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
