import fs from "fs/promises";
import { Intents } from "discord.js";
import { Client as ClientX, ClientOptions as ClientXOptions } from "discordx";
import { Option } from "oxide.ts";
import { resolve } from "path";

async function main(): Promise<void> {
  await startDiscordClient();
}

const DISCORD_MODULES_FOLDER = resolve(__dirname, "modules", "**", "*.{ts,js}");

const DISCORD_INTENTS: number[] = [
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_MESSAGES,
];

async function startDiscordClient(): Promise<void> {
  const client = new ClientX({
    intents: DISCORD_INTENTS,
  });

  if (process.env.NODE_ENV === "development") {
    (<ClientXOptions>client.options).botGuilds = [
      async client => {
        const guilds = await client.guilds.fetch();
        return guilds.map(guild => guild.id);
      },
    ];
  }

  await importFolderFilesRecursvily(DISCORD_MODULES_FOLDER);
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
async function importFolderFilesRecursvily(path: string): Promise<unknown[]> {
  const entries = await fs.readdir(path, {
    withFileTypes: true,
  });

  return await Promise.all(
    entries.map(async entry => {
      if (entry.isBlockDevice()) {
        return await importFolderFilesRecursvily(resolve(path, entry.name));
      } else {
        return await import(resolve(path, entry.name));
      }
    })
  );
}

if (require.main === module) {
  main();
}
