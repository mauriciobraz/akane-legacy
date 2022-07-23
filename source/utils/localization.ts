import {
  Slash,
  SlashGroup,
  SlashOption,
  type ClassDecoratorEx,
  type MethodDecoratorEx,
  type ParameterDecoratorEx,
  type SlashOptionOptions,
} from "discordx";
import type { LocalizationMap } from "discord-api-types/v10";
import type { CommandInteraction, Interaction } from "discord.js";
import type { Join } from "type-fest";
import type { LocalizedString } from "typesafe-i18n";

import L from "@locales/i18n-node";
import { baseLocale, loadedLocales } from "@locales/i18n-util";
import type { Locales, TranslationFunctions } from "@locales/i18n-types";
import type { DeepReplace, PathArray } from "@root/types";

export const LOCALIZATION_SLASH_COMMANDS_NAMESPACE = "SLASHES";

export const LOCALIZATION_KEY_PATH_SEPARATOR = ".";

/** Raw localization path, as array of it's keys. */
export type RawLocalizationKeyPath = PathArray<
  DeepReplace<TranslationFunctions[typeof LOCALIZATION_SLASH_COMMANDS_NAMESPACE], string>
>;

/**
 * String path to a localization key.
 * @example "EXAMPLE.NAME" or "EXAMPLE.DESCRIPTION";
 */
export type LocalizationKeyPath = Join<
  RawLocalizationKeyPath,
  typeof LOCALIZATION_KEY_PATH_SEPARATOR
>;

/** Extra options for a slash command group. */
export type SlashCommandGroupOptions = {
  root?: string;
  assignAllMethods?: boolean;
};

/** @internal */
type SharedNameAndDescription = {
  description: string;
  nameLocalizations: LocalizationMap;
  descriptionLocalizations: LocalizationMap;
};

/** @internal */
type SlashOptionOptionsWithoutNamingFields = Omit<
  SlashOptionOptions,
  "description" | "descriptionLocalizations" | "name" | "nameLocalizations"
>;

let defaultLocale: Locales = baseLocale;

export function getDefaultLocale(): Locales {
  return defaultLocale;
}

/**
 * Changes the locale used as default for slash commands-related localization.
 * @param locale New default locale.
 */
export function setDefaultLocale(locale: Locales): void {
  defaultLocale = locale;
}

/**
 * Executes a localization function and returns the localized string.
 * @param path Path to a valid localization key.
 * @param locale Locale to use. If not provided, the default locale is used.
 * @throws If the path is pointing to an invalid localization key.
 * @throws If the locale is not a function or have more than 0 arguments.
 */
export function executeLocalizationPath(
  path: LocalizationKeyPath,
  locale: Locales = defaultLocale
): LocalizedString {
  const localizedStringParts: unknown = path
    .split(LOCALIZATION_KEY_PATH_SEPARATOR)
    // @ts-ignore
    .reduce((prev, curr) => prev[curr], L[locale][LOCALIZATION_SLASH_COMMANDS_NAMESPACE]);

  if (typeof localizedStringParts === "undefined") {
    throw new Error(`Localization key not found: ${path}`);
  }

  if (typeof localizedStringParts !== "function") {
    throw new Error(`Localization key is not a function: ${path}`);
  }

  if (localizedStringParts.length > 0) {
    throw new Error(`Localization key is a function with more than one argument: ${path}`);
  }

  return localizedStringParts();
}

/**
 * Gets the localization map for a given localization key.
 * @param path Path to a valid localization key.
 * @returns A discord.js localization map for the given path.
 * @throws If there are no localizations for the given path (probably because all are nullish).
 */
export function getDiscordLocalizationMap(path: LocalizationKeyPath): LocalizationMap {
  const localizationMap: LocalizationMap = {};

  for (const locale of Object.keys(loadedLocales)) {
    localizationMap[locale as Locales] = executeLocalizationPath(path, locale as Locales);
  }

  for (const localization of Object.keys(localizationMap)) {
    if (isNullish(localization)) {
      delete localizationMap[localization as Locales];
    }
  }

  if (Object.keys(localizationMap).length === 0) {
    throw new Error(`All locales are nullish at: ${path}`);
  }

  return localizationMap;
}

/**
 * Gets the preferred locale for a given interaction. Falls back to the default locale.
 * @param interaction The interaction to get the preferred locale from.
 * @returns The preferred locale of the interaction.
 */
export function getPreferredLocaleFromInteraction(
  interaction: Interaction | CommandInteraction
): Locales {
  if (Object.keys(loadedLocales).includes(interaction.locale)) {
    return interaction.locale as Locales;
  }

  if (interaction.inGuild() && Object.keys(loadedLocales).includes(interaction.guildLocale)) {
    return interaction.guildLocale as Locales;
  }

  return defaultLocale;
}

/**
 * Creates a slash command with localization support.
 * @param name Path to the name localization key.
 * @param description Path to the description localization key.
 * @returns A decorator extending `discordx/Slash`.
 */
export function SlashCommand(
  name: LocalizationKeyPath,
  description: LocalizationKeyPath
): MethodDecoratorEx {
  return (target, key, descriptor) => {
    Slash(executeLocalizationPath(name), getSharedNameAndDescription(name, description))(
      target,
      key,
      descriptor
    );
  };
}

/**
 * Adds a option for a slash command.
 * @param name Path to the name localization key.
 * @param description Path to the description localization key.
 * @param options Extra options for the slash command option.
 * @returns A decorator extending `discordx/SlashOption`.
 */
export function SlashCommandOption(
  name: LocalizationKeyPath,
  description: LocalizationKeyPath,
  options?: SlashOptionOptionsWithoutNamingFields
): ParameterDecoratorEx {
  return (target, key, descriptor) => {
    SlashOption(executeLocalizationPath(name), {
      ...(options as SlashOptionOptions),
      ...getSharedNameAndDescription(name, description),
    })(target, key, descriptor);
  };
}

/**
 * Creates a slash command group with localization support and some extra options.
 * @param name Path to the name localization key.
 * @param description Path to the description localization key.
 * @param options Extra options for the slash command group.
 * @returns A decorator extending `discordx/SlashGroup`.
 */
export function SlashCommandGroup(
  name: LocalizationKeyPath,
  description: LocalizationKeyPath,
  options?: SlashCommandGroupOptions
): ClassDecoratorEx {
  return (target, key, descriptor) => {
    SlashGroup({
      root: options?.root,
      name: executeLocalizationPath(name),
      ...getSharedNameAndDescription(name, description),
    })(target, key, descriptor);

    if (options?.assignAllMethods) {
      SlashGroup(executeLocalizationPath(name))(target, key, descriptor);
    }
  };
}

/** @internal */
function isNullish<T>(value: T | undefined | null | ""): boolean {
  return value === undefined || value === null || value === "";
}

/** @internal */
function getSharedNameAndDescription(
  name: LocalizationKeyPath,
  description: LocalizationKeyPath
): SharedNameAndDescription {
  return {
    description: executeLocalizationPath(description),
    nameLocalizations: getDiscordLocalizationMap(name),
    descriptionLocalizations: getDiscordLocalizationMap(description),
  };
}
