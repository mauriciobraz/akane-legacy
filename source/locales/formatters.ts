import type { FormattersInitializer } from "typesafe-i18n";
import type { Locales, Formatters } from "./i18n-types";

export const initFormatters: FormattersInitializer<Locales, Formatters> = (locale: Locales) => {
  return {
    // Formatters functions, see: https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/formatters
    joinArray: value => {
      if (Array.isArray(value)) {
        return value
          .map((v, i) => {
            if (i === 0) return v;
            if (i === value.length - 1) return ` & ${v}`;
            return `, ${v}`;
          })
          .join();
      }

      return value;
    },
  };
};
