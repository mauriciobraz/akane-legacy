// TODO: Trait some DiscordJS API errors globally.

import Container from "typedi";
import { Discord, On, Once, type ArgsOf } from "discordx";
import { Logger } from "tslog";
import { MessageEmbed } from "discord.js";

import L from "../locales/i18n-node";
import { getPreferredLocaleFromInteraction } from "../utils/discord-localization";
import type { Client } from "../types";

@Discord()
export class IndexModule {
  private readonly logger = Container.get(Logger);

  @Once("ready")
  async onceReady(_: ArgsOf<"ready">, client: Client<true>): Promise<void> {
    await client.initApplicationCommands();

    this.logger.info(`Logged in as ${client.user.tag}.`);
  }

  @On("interactionCreate")
  async onInteractionCreate([i]: ArgsOf<"interactionCreate">, client: Client<true>): Promise<void> {
    try {
      await client.executeInteraction(i);
    } catch (e) {
      if (e instanceof Error) {
        this.logger.prettyError(e);

        if (i.isRepliable()) {
          const LL = L[getPreferredLocaleFromInteraction(i)];

          if (process.env.NODE_ENV === "development") {
            await i.followUp({
              embeds: [
                new MessageEmbed()
                  .setTitle(e.name)
                  .setDescription(e.message)
                  .addField("Stack Trace", e.stack.split("\n").join("\n\n")),
              ],
            });

            return;
          }

          await i.followUp(LL["errors"].UNKNOWN_ERROR());
        }
      } else this.logger.error(e);
    }
  }
}
