import "reflect-metadata";
import "dotenv/config";

import Container from "typedi";
import * as fs from "fs/promises";
import { PrismaClient } from "@prisma/client";
import { Intents } from "discord.js";
import { Client as ClientX, ClientOptions as ClientXOptions, DIService } from "discordx";
import { Option } from "oxide.ts";
import { resolve } from "path";
import { Logger } from "tslog";

import { initFormatters } from "./locales/formatters";
import { locales, namespaces } from "./locales/i18n-util";
import { loadNamespaceAsync } from "./locales/i18n-util.async";
import type { Callback } from "./types";

async function main(): Promise<void> {
  const logger = new Logger({
    displayFilePath: "hidden",
  });
  Container.set(Logger, logger);

  await Promise.all(
    locales.map(async locale => {
      initFormatters(locale);

      await Promise.all(
        namespaces.map(async namespace => await loadNamespaceAsync(locale, namespace))
      );
    })
  );

  const prisma = new PrismaClient();
  await prisma.$connect();
  Container.set(PrismaClient, prisma);

  await startDiscordClient();
}

const DISCORD_MODULES_FOLDER = resolve(__dirname, "modules");

const DISCORD_INTENTS: number[] = [
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_MESSAGES,
];

async function startDiscordClient(): Promise<void> {
  DIService.container = Container;

  const logger = Container.get(Logger);

  const client = new ClientX({
    intents: DISCORD_INTENTS,
  });

  if (process.env.NODE_ENV === "development") {
    logger.info("Starting Discord client in development mode.");

    (<ClientXOptions>client.options).botGuilds = [
      async client => {
        const guilds = await client.guilds.fetch();
        return guilds.map(guild => guild.id);
      },
    ];
  }

  await importFolderRecursive(DISCORD_MODULES_FOLDER, fileName => {
    const ext = fileName.split(".").pop();
    return ext === "ts" || ext === "js";
  });

  await client.login(
    Option(process.env.DISCORDJS_TOKEN).expect(
      "Missing the environment variable `DISCORDJS_TOKEN`."
    )
  );
}

/**
 * Import all files in the given folder and its subfolders.
 * @param path Path to the folder to import.
 * @returns All the files found in the folder.
 */
async function importFolderRecursive(
  path: string,
  fileNameFilter: Callback<string, boolean>
): Promise<unknown[]> {
  const entries = await fs.readdir(path, {
    withFileTypes: true,
  });

  const files = entries
    .filter(file => !file.isDirectory())
    .filter(file => fileNameFilter(file.name))
    .map(file => ({ ...file, path: resolve(path, file.name) }));

  const folders = entries.filter(folder => folder.isDirectory());

  for await (const folder of folders) {
    await importFolderRecursive(resolve(path, folder.name), fileNameFilter);
  }

  return await Promise.all(files.map(async file => await import(file.path)));
}

if (require.main === module) {
  main();
}
