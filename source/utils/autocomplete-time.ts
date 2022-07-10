import L from "../locales/i18n-node";
import { getPreferredLocaleFromInteraction } from "./discord-localization";
import type { AutocompleteInteraction } from "discord.js";

export enum Time {
  SECOND = 1000,
  MINUTE = 60 * SECOND,
  HOUR = 60 * MINUTE,
  DAY = 24 * HOUR,
  WEEK = 7 * DAY,
  MONTH = 30 * DAY,
  YEAR = 365 * DAY,
}

export enum MeasurementUnit {
  SECOND = "s",
  MINUTE = "m",
  HOUR = "h",
  DAY = "d",
  WEEK = "w",
  MONTH = "M",
  YEAR = "y",
}

/** All possible types that an autocomplete can return. */
export type AutocompleteTime =
  | `${number}${MeasurementUnit}`
  | "RESET"
  | "EXCEEDED_MAX_LENGTH"
  | "HELP"
  | "EMPTY";

/** @internal */
type Translations = { [key in MeasurementUnit]: string };

/**
 * Autocompletes the time string for the given interaction.
 * @param interaction Interaction to autocomplete the time.
 */
export async function autocompleteTimeString(interaction: AutocompleteInteraction): Promise<void> {
  const LL = L[getPreferredLocaleFromInteraction(interaction)];

  const focused = interaction.options.getFocused(true);

  const translations: Translations = {
    d: LL.COMMON.TIME_d(getNumberFromString(focused.value)),
    h: LL.COMMON.TIME_h(getNumberFromString(focused.value)),
    m: LL.COMMON.TIME_m(getNumberFromString(focused.value)),
    M: LL.COMMON.TIME_M(getNumberFromString(focused.value)),
    s: LL.COMMON.TIME_s(getNumberFromString(focused.value)),
    w: LL.COMMON.TIME_w(getNumberFromString(focused.value)),
    y: LL.COMMON.TIME_y(getNumberFromString(focused.value)),
  };

  if (focused.type !== "STRING") {
    throw new Error("To autocomplete a time string, the focused option must be a string.");
  }

  if (focused.value.length > 6) {
    await interaction.respond([
      {
        name: LL.ERRORS.TIME_EXCEEDS_MAX_LENGTH(focused.value.length, 6),
        value: <AutocompleteTime>"EXCEEDED_MAX_LENGTH",
      },
    ]);
  }

  if (focused.value === "0") {
    await interaction.respond([{ name: LL.COMMON.AUTOCOMPLETE_RESET(), value: "RESET" }]);
  }

  // Check if the focused option is a valid time string, so keep it if it is.
  if (focused.value.match(/\d+[smhdwMy]/)) {
    await interaction.respond([{ name: focused.name, value: focused.value }]);
    return;
  }

  if (focused.value.match(/^\d+$/) && focused.value.length <= 6) {
    await interaction.respond(
      Object.values(MeasurementUnit).map(measurement => {
        return {
          name: `${focused.value}${measurement} (${translations[measurement]})`,
          value: `${focused.value}${measurement}`,
        };
      })
    );

    return;
  }

  // When the string is empty, we can autocomplete with a help message.
  if (focused.value === "") {
    await interaction.respond([
      {
        name: LL.COMMON.AUTOCOMPLETE_TIME_HELP(
          Object.values(MeasurementUnit)
            .map(measurement => translations[measurement])
            .join(", ")
        ),
        value: <AutocompleteTime>"EMPTY",
      },
    ]);

    return;
  }

  await interaction.respond([
    {
      name: LL.COMMON.AUTOCOMPLETE_INVALID_TIME_STRING(),
      value: <AutocompleteTime>"HELP",
    },
  ]);
}

/**
 * Gets the time in milliseconds for the given measurement.
 * @param value The string time to try get the measurement time for.
 * @returns The time in milliseconds or NaN if the string is not a valid time.
 */
export function getMeasurementTime(value: string): number {
  switch (value.replace(/\d/g, "")) {
    case MeasurementUnit.SECOND:
      return Time.SECOND;

    case MeasurementUnit.MINUTE:
      return Time.MINUTE;
    case MeasurementUnit.HOUR:
      return Time.HOUR;

    case MeasurementUnit.DAY:
      return Time.DAY;

    case MeasurementUnit.WEEK:
      return Time.WEEK;

    case MeasurementUnit.MONTH:
      return Time.MONTH;

    case MeasurementUnit.YEAR:
      return Time.YEAR;

    default:
      return NaN;
  }
}

/**
 * Tries to get the time in milliseconds for the given string. Falls back to NaN if the string is not a valid time.
 * @param value The string time to try get the measurement time for.
 */
export function parseMeasurementString(value: AutocompleteTime): number {
  const measurement = getMeasurementTime(value);

  if (isNaN(measurement)) {
    return NaN;
  }

  return Number(value.replace(/\D/g, "")) * measurement;
}

/** @internal */
function getNumberFromString(value: string): number {
  return Number(value.replace(/\D/g, ""));
}
