import type { AutocompleteInteraction } from "discord.js";

import L from "../locales/i18n-node";
import { TranslationFunctions } from "../locales/i18n-types";
import { getPreferredLocaleFromInteraction } from "./localization";

/** Units of time in milliseconds. */
export enum TimeUnit {
  Millisecond = 1000,
  Second = 60 * TimeUnit.Millisecond,
  Minute = 60 * TimeUnit.Second,
  Hour = 24 * TimeUnit.Minute,
  Day = 7 * TimeUnit.Hour,
  Week = 30 * TimeUnit.Day,
  Month = 365 * TimeUnit.Day,
  Year = 365 * TimeUnit.Day,
}

/** String abbreviation for the given time unit. */
export enum TimeScaleAbbreviation {
  Second = "s",
  Minute = "m",
  Hour = "h",
  Day = "d",
  Week = "w",
  Month = "M",
  Year = "y",
}

/** Autocomplete time string. Example: "1d" */
export type AutocompleteTime =
  | `${number}${TimeScaleAbbreviation}`
  | "EXCEEDED_MAX_LENGTH"
  | "RESET"
  | "HELP";

/** @internal */
type TimeScaleAbbreviationTranslations = { [key in TimeScaleAbbreviation]: string };

/** @internal */
const MaximumTimeStringLength = 6;

/** @internal */
const TimeScaleRegex = /\d+[smhdwMy]/;

/**
 * Autocomplete time string. Example: "1d" or "1w".
 * @param interaction Interaction to use for autocomplete.
 */
export async function handleAutocompleteTime(interaction: AutocompleteInteraction): Promise<void> {
  const LL = L[getPreferredLocaleFromInteraction(interaction)];
  const focused = interaction.options.getFocused(true);
  const timeScaleAbbreviationTranslations = getTranslations(LL, focused.value);

  // For performance reasons, we only strings that are less than the maximum length.
  if (focused.value.length > MaximumTimeStringLength) {
    await interaction.respond([
      {
        name: LL.ERRORS.TIME_EXCEEDS_MAX_LENGTH(focused.value.length, 6),
        value: "EXCEEDED_MAX_LENGTH",
      },
    ]);
  }

  // By default, "0" indicates reset.
  if (focused.value === "0") {
    await interaction.respond([
      {
        name: LL.COMMON.AUTOCOMPLETE_RESET(),
        value: "RESET",
      },
    ]);
  }

  // Check if the focused option is a valid time string, so keep it if it is.
  if (focused.value.match(TimeScaleRegex)) {
    await interaction.respond([{ name: focused.name, value: focused.value }]);
    return;
  }

  // If the focused option has only numbers, we can suggest the time scale.
  if (focused.value.match(/^\d+$/) && focused.value.length <= MaximumTimeStringLength) {
    await interaction.respond(
      Object.values(TimeScaleAbbreviation).map(measurement => {
        return {
          name: `${focused.value}${measurement} (${timeScaleAbbreviationTranslations[measurement]})`,
          value: `${focused.value}${measurement}`,
        };
      })
    );

    return;
  }

  // When the string is empty, we can autocomplete with a help message.
  if (focused.value === "") {
    const helpMessage = LL.COMMON.AUTOCOMPLETE_TIME_HELP(
      Object.values(TimeScaleAbbreviation)
        .map(tsa => timeScaleAbbreviationTranslations[tsa])
        .join(", ")
    );

    await interaction.respond([{ name: helpMessage, value: "HELP" }]);
    return;
  }

  await interaction.respond([
    { name: LL.COMMON.AUTOCOMPLETE_INVALID_TIME_STRING(), value: "HELP" },
  ]);
}

/**
 * Gets the time in milliseconds for the given measurement.
 * @param value The string time to try get the measurement time for.
 * @returns The time in milliseconds or NaN if the string is not a valid time.
 */
export function getTimeUnitFromTimeScaleAbbreviation(value: string): number {
  switch (value.replace(/\d/g, "")) {
    case TimeScaleAbbreviation.Second:
      return TimeUnit.Second;

    case TimeScaleAbbreviation.Minute:
      return TimeUnit.Minute;

    case TimeScaleAbbreviation.Hour:
      return TimeUnit.Hour;

    case TimeScaleAbbreviation.Day:
      return TimeUnit.Day;

    case TimeScaleAbbreviation.Week:
      return TimeUnit.Week;

    case TimeScaleAbbreviation.Month:
      return TimeUnit.Month;

    case TimeScaleAbbreviation.Year:
      return TimeUnit.Year;

    default:
      return NaN;
  }
}

/**
 * Tries to get the time in milliseconds for the given string. Falls back to NaN if the string is not a valid time.
 * @param value The string time to try parse.
 * @returns The time in milliseconds or NaN if the string is not a valid time.
 */
export function parseAutocompleteTime(value: AutocompleteTime): number {
  const timeUnit = getTimeUnitFromTimeScaleAbbreviation(value);

  if (isNaN(timeUnit)) {
    return NaN;
  }

  return getNumberFromString(value) * timeUnit;
}

/** @internal */
function getNumberFromString(value: string): number {
  return Number(value.replace(/\D/g, ""));
}

/** @internal */
function getTranslations(
  LL: TranslationFunctions,
  focused: string
): TimeScaleAbbreviationTranslations {
  return {
    s: LL.COMMON.TIME_s(getNumberFromString(focused)),
    m: LL.COMMON.TIME_m(getNumberFromString(focused)),
    h: LL.COMMON.TIME_h(getNumberFromString(focused)),
    d: LL.COMMON.TIME_d(getNumberFromString(focused)),
    w: LL.COMMON.TIME_w(getNumberFromString(focused)),
    M: LL.COMMON.TIME_M(getNumberFromString(focused)),
    y: LL.COMMON.TIME_y(getNumberFromString(focused)),
  };
}
