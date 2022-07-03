// TODO: Add a way to send, edit messages/interactions with a localization directly.
// Eg. `interaction.editReplyL(["LOCALIZATION_KEY", ...params], { ... })`

// FIXME: Add support for chained localizations. Eg. "EXAMPLE.NAME" instead of "EXAMPLE_NAME".
// Maybe pass this as an array (["EXAMPLE", "NAME"]) and throws never when the localization has
// parameters? It's not supposed to be used in this way.

import { LocalizationMap } from "discord-api-types/v10";
import { Interaction } from "discord.js";
import {
  ClassDecoratorEx,
  MethodDecoratorEx,
  ParameterDecoratorEx,
  Slash,
  SlashGroup,
  SlashOption,
  SlashOptionOptions,
} from "discordx";
import { LocalizedString } from "typesafe-i18n";

import L from "../locales/i18n-node";
import { baseLocale, loadedLocales } from "../locales/i18n-util";
import type { Locales, TranslationFunctions } from "../locales/i18n-types";

export namespace DiscordUtils {
  interface SharedNameAndDescription {
    name: LocalizationInput;
    description: LocalizationInput;
  }

  interface SharedNameAndDescriptionLocalized {
    description: string;
    nameLocalizations: LocalizationMap;
    descriptionLocalizations: LocalizationMap;
  }

  type CommandTranslationFunctions = TranslationFunctions["slashes"];
  type CommandTranslation = keyof CommandTranslationFunctions;

  // NOTE: If you want to remove mirroring of `...Parameters`, you need to modify
  // `executeLocalizationFn` to not spread the parameters.
  type LocalizationInput<T extends CommandTranslation = CommandTranslation> = [
    T,
    ...Parameters<CommandTranslationFunctions[T]>
  ];

  type SlashOptionOptionsWithoutNamingFields = Omit<
    SlashOptionOptions,
    "description" | "descriptionLocalizations" | "name" | "nameLocalizations"
  >;

  const SLASH_TRANSLATIONS_NAMESPACE = "slashes";

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

  type SlashCommandGroupOptions = SharedNameAndDescription & {
    root?: string;
    markAllAsThisGroup?: boolean;
  };

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
   * Executes the L function from the given input. (Useful for not repeating @ts-ignore everywhere.)
   * @todo Remove the unecessary `@ts-ignore`.
   */
  function executeLocalizationFn(input: LocalizationInput): LocalizedString {
    const LL = L[baseLocale][SLASH_TRANSLATIONS_NAMESPACE][input[0]];
    // @ts-ignore
    return LL(...input.slice(1));
  }

  interface GetLocalizationMapOptions {
    input: LocalizationInput;
  }

  /** Gets the Discord's v10 localization map for the given input & namespace. */
  export function getLocalizationMap(options: GetLocalizationMapOptions): LocalizationMap {
    const result: LocalizationMap = {};

    if (!Object.keys(loadedLocales).includes(SLASH_TRANSLATIONS_NAMESPACE)) {
      for (const locale of Object.keys(loadedLocales) as Locales[]) {
        // @ts-ignore
        result[locale] = L[locale][SLASH_TRANSLATIONS_NAMESPACE][options.input[0]](
          // @ts-ignore
          ...options.input.slice(1)
        );
      }

      return result;
    }

    throw new Error(
      `The namespace ${SLASH_TRANSLATIONS_NAMESPACE} is not loaded. Please load it before using it.`
    );
  }

  /**
   * Returns the preferred locale for an interaction. The order of preference is: user, guild,
   * default.
   */
  export function getPreferredLocale(interaction: Interaction): Locales {
    if (Object.keys(loadedLocales).includes(interaction.locale)) {
      return interaction.locale as Locales;
    }

    if (interaction.inGuild() && Object.keys(loadedLocales).includes(interaction.guildLocale)) {
      return interaction.guildLocale as Locales;
    }

    return baseLocale;
  }
}

/** Extended decorator for the `discordx/Slash`. Adds localization support. */
export const SlashCommand = DiscordUtils.SlashCommand;

/** Extended decorator for the `discordx/SlashOption`. Adds localization support. */
export const SlashCommandOption = DiscordUtils.SlashCommandOption;

/** Extended decorator for the `discordx/SlashGroup`. Adds localization support. */
export const SlashCommandGroup = DiscordUtils.SlashCommandGroup;
