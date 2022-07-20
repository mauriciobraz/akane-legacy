import "reflect-metadata";
import "dotenv/config";

import Container from "typedi";
import { PrismaClient } from "@prisma/client";
import { Logger } from "tslog";
import { DIService } from "discordx";

import { akaneConnect } from "./akane";
import { initFormatters } from "./locales/formatters";
import { locales, namespaces } from "./locales/i18n-util";
import { loadNamespaceAsync } from "./locales/i18n-util.async";
import { Debugger } from "./types";

export const EnabledDebuggers: Debugger[] = process.env.DEBUG?.split(":") || [];

/**
 * Utility function to check if a debugger is enabled or not.
 * @param name The debugger to check if it is enabled.
 * @returns Whether the debugger is enabled. (true if "*" is enabled)
 */
export function isDebuggerEnabled(name: Debugger): boolean {
  return EnabledDebuggers.includes("*") || EnabledDebuggers.includes(name);
}

/** @internal */
async function main(): Promise<void> {
  await Promise.all(
    locales.map(async locale => {
      initFormatters(locale);

      await Promise.all(
        namespaces.map(async namespace => await loadNamespaceAsync(locale, namespace))
      );
    })
  );

  const logger = new Logger({
    displayFilePath: "hidden",
  });

  const prisma = new PrismaClient({
    log: isDebuggerEnabled("PrismaClient") ? ["query", "info", "warn", "error"] : [],
  });

  Container.set(Logger, logger);
  Container.set(PrismaClient, prisma);

  DIService.container = Container;

  await prisma.$connect();
  await akaneConnect();
}

if (require.main === module) {
  main();
}
