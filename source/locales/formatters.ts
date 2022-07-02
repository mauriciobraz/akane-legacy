import type { FormattersInitializer } from "typesafe-i18n";
import type { Locales, Formatters } from "./i18n-types";

export const initFormatters: FormattersInitializer<Locales, Formatters> = (locale: Locales) => {
  return {
    // Formatters functions, see: https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/formatters
  };
};
