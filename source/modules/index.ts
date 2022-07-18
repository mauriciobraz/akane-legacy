import Container from "typedi";
import { MessageEmbed } from "discord.js";
import { Discord, On, Once, type ArgsOf } from "discordx";
import { Logger } from "tslog";

import { isDebuggerEnabled } from "..";
import type { MergeClient } from "../types";

@Discord()
export class IndexModule {
  private readonly logger = Container.get(Logger);

  @Once("ready")
  async onceReady(_: ArgsOf<"ready">, client: MergeClient<true>): Promise<void> {
    await client.initApplicationCommands();
    this.logger.info("Successfully connected to Discord API.");
  }

  @On("interactionCreate")
  async onInteractionCreate(
    [interaction]: ArgsOf<"interactionCreate">,
    client: MergeClient<true>
  ): Promise<void> {
    if (isDebuggerEnabled("DiscordJS"))
      this.logger.info(
        interaction.isCommand()
          ? `APPLICATION_COMMAND/${interaction.commandId}/${interaction.commandName}`
          : interaction.type,
        {
          userId: interaction.user.id,
          guildId: interaction.guildId,
          channelId: interaction.channelId,
          interactionId: interaction.id,
          interactionOptions: interaction.isCommand()
            ? interaction.options.data.reduce(
                (acc, curr) => ({ ...acc, [curr.name]: curr.value }),
                {}
              )
            : null,
        }
      );

    try {
      await client.executeInteraction(interaction);
    } catch (error) {
      // If the debugger is enabled, we'll log the error and reply to the user what happened.
      if (isDebuggerEnabled("DiscordJS")) {
        if (error instanceof Error && interaction.isRepliable()) {
          const embed = new MessageEmbed()
            .setTitle(error.name)
            .setDescription(error.message)
            .addFields([
              {
                name: "Stack Trace",
                value: error.stack.split("\n").join("\n\n"),
              },
            ]);

          await interaction.followUp({
            embeds: [embed],
          });
        }

        this.logger.error(error);
      }
    }
  }
}
