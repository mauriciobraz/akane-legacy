import { MessageEmbed } from "discord.js";
import { type ArgsOf, Discord, Once, On } from "discordx";
import { Logger } from "tslog";
import L from "../locales/i18n-node";

import { Client } from "../types";
import { DiscordLocalization } from "../utils/discord-localization";

@Discord()
export class IndexModule {
  constructor(private readonly logger: Logger) {}

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
          const LL = L[DiscordLocalization.getPreferredLocale(i)];

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
