// TODO: Update to discord.js v14.

import { Intents } from "discord.js";
import { Client, type ClientOptions } from "discordx";
import { readdir } from "fs/promises";
import { resolve } from "path";
import { Logger } from "tslog";

import { isDebuggerEnabled } from ".";

const logger = new Logger({
  displayFilePath: "hidden",
  name: "Akane",
});

/** Prepares the Akane client and connects it to the Discord API. */
export async function akaneConnect(): Promise<void> {
  if (!process.env.DISCORDJS_TOKEN) {
    throw new Error("DISCORDJS_TOKEN is not set");
  }

  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS],
  });

  if (isDebuggerEnabled("DiscordJS")) {
    (client.options as ClientOptions).logger = {
      error: logger.error,
      info: logger.info,
      log: logger.info,
      warn: logger.warn,
    };
  }

  if (process.env.NODE_ENV === "development") {
    logger.info("Starting Discord client in development mode.");

    (client.options as ClientOptions).botGuilds = [
      async client => (await client.guilds.fetch()).map(guild => guild.id),
    ];
  }

  await importFolderRecursively(resolve(__dirname, "modules"));
  await client.login(process.env.DISCORDJS_TOKEN);
}

/**
 * Utility function to load all modules in the modules folder.
 * @param path Path where the modules are located.
 * @returns All the files found in the folder.
 */
async function importFolderRecursively(path: string): Promise<unknown[]> {
  const entries = await readdir(path, {
    withFileTypes: true,
  });

  const files = entries
    .filter(file => !file.isDirectory())
    .map(file => ({ ...file, path: resolve(path, file.name) }));

  for await (const folder of entries.filter(folder => folder.isDirectory())) {
    await importFolderRecursively(resolve(path, folder.name));
  }

  return await Promise.all(files.map(async file => await import(file.path)));
}
