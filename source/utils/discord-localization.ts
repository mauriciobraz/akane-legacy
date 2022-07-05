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
import type { Interaction } from "discord.js";
import type { Join } from "type-fest";
import type { LocalizedString } from "typesafe-i18n";

import L from "../locales/i18n-node";
import { baseLocale, loadedLocales } from "../locales/i18n-util";
import type { Locales, TranslationFunctions } from "../locales/i18n-types";
import type { DeepReplace, ObjectKeysToStringPath } from "../types";

export namespace DiscordLocalization {
  interface SharedNameAndDescription {
    name: LocalizationKeyPath;
    description: LocalizationKeyPath;
  }

  interface SharedNameAndDescriptionLocalized {
    description: string;
    nameLocalizations: LocalizationMap;
    descriptionLocalizations: LocalizationMap;
  }

  interface GetLocalizationMapOptions {
    input: LocalizationKeyPath;
    // name: LocalizationKeyPath;
    // description: LocalizationKeyPath;
  }

  type SlashCommandGroupOptions = SharedNameAndDescription & {
    root?: string;
    markAllAsThisGroup?: boolean;
  };

  const SEPARATOR = ".";

  type LocalizationKeyPath = Join<
    ObjectKeysToStringPath<DeepReplace<TranslationFunctions["slashes"], string>>,
    typeof SEPARATOR
  >;

  type SlashOptionOptionsWithoutNamingFields = Omit<
    SlashOptionOptions,
    "description" | "descriptionLocalizations" | "name" | "nameLocalizations"
  >;

  const SLASH_TRANSLATIONS_NAMESPACE = "slashes";

  let BASE_LOCALE: Locales = baseLocale;

  /** Changes the base locale used for localization in this module. */
  export function setBaseLocale(locale: Locales): void {
    BASE_LOCALE = locale;
  }

  /** Executes the L function from the given input. */
  export function executeLocalizationFn(
    input: LocalizationKeyPath,
    locale: Locales = BASE_LOCALE
  ): LocalizedString {
    const localizedString = input.split(SEPARATOR).reduce((prev, curr) => {
      // @ts-ignore
      return prev[curr];
    }, L[locale][SLASH_TRANSLATIONS_NAMESPACE]);

    if (typeof localizedString !== "function") {
      throw new Error(
        "This localization key is not a function. Are you sure you have the right key?"
      );
    }

    return (localizedString as Function)();
  }

  /** Gets the Discord's v10 localization map for the given input & namespace. */
  export function getLocalizationMap(options: GetLocalizationMapOptions): LocalizationMap {
    const result: LocalizationMap = {};

    if (!Object.keys(loadedLocales).includes(SLASH_TRANSLATIONS_NAMESPACE)) {
      for (const locale of Object.keys(loadedLocales) as Locales[]) {
        result[locale] = executeLocalizationFn(options.input, locale);
      }

      for (const locale of Object.keys(result) as Locales[]) {
        if (!result[locale] || result[locale] === null || result[locale] === "") {
          delete result[locale];
        }
      }

      return result;
    }

    throw new Error(
      `The namespace ${SLASH_TRANSLATIONS_NAMESPACE} is not loaded. Please load it before using it.`
    );
  }

  /**
   * Returns the resolved shared localizations options for the given input. The default namespace is
   * the constant `TRANSLATION_NAMESPACE`.
   */
  function resolveSharedNameAndDescription(
    options: SharedNameAndDescription
  ): SharedNameAndDescriptionLocalized {
    return {
      description: executeLocalizationFn(options.description),
      nameLocalizations: getLocalizationMap({ input: options.name }),
      descriptionLocalizations: getLocalizationMap({ input: options.description }),
    };
  }

  /**
   * Returns the preferred locale of the user in the given interaction. Falls back to the default
   * locale if the user doesn't have a preferred locale.
   */
  export function getPreferredLocale(interaction: Interaction): Locales {
    if (Object.keys(loadedLocales).includes(interaction.locale)) {
      return interaction.locale as Locales;
    }

    if (interaction.inGuild() && Object.keys(loadedLocales).includes(interaction.guildLocale)) {
      return interaction.guildLocale as Locales;
    }

    return BASE_LOCALE;
  }

  export function SlashCommand(input: SharedNameAndDescription): MethodDecoratorEx {
    return (target, key, descriptor) => {
      Slash(
        executeLocalizationFn(input.name).toString(),
        resolveSharedNameAndDescription({ name: input.name, description: input.description })
      )(target, key, descriptor);
    };
  }

  export function SlashCommandOption(
    options: SlashOptionOptionsWithoutNamingFields & SharedNameAndDescription
  ): ParameterDecoratorEx {
    return (target, key, descriptor) => {
      // @ts-ignore
      SlashOption(executeLocalizationFn(options.name).toString(), {
        ...options,
        ...resolveSharedNameAndDescription({
          name: options.name,
          description: options.description,
        }),
      })(target, key, descriptor);
    };
  }

  export function SlashCommandGroup(options: SlashCommandGroupOptions): ClassDecoratorEx {
    return (target, key, descriptor) => {
      SlashGroup({
        root: options.root,
        name: executeLocalizationFn(options.name).toString(),
        ...resolveSharedNameAndDescription({
          name: options.name,
          description: options.description,
        }),
      })(target, key, descriptor);

      if (options.markAllAsThisGroup) {
        SlashGroup(executeLocalizationFn(options.name).toString())(target, key, descriptor);
      }
    };
  }
}

/** Extended decorator for the `discordx/Slash`. Adds localization support. */
export const SlashCommand = DiscordLocalization.SlashCommand;

/** Extended decorator for the `discordx/SlashOption`. Adds localization support. */
export const SlashCommandOption = DiscordLocalization.SlashCommandOption;

/** Extended decorator for the `discordx/SlashGroup`. Adds localization support. */
export const SlashCommandGroup = DiscordLocalization.SlashCommandGroup;
