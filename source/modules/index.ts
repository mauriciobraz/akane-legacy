import Container from "typedi";
import { EmbedBuilder, InteractionType } from "discord.js";
import { Discord, On, Once, type ArgsOf } from "discordx";
import { Logger } from "tslog";

import { isDebuggerEnabled } from "@root/index";
import type { MergeClient } from "@root/types";

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
    const __logPrefix = [
      interaction.id,
      interaction.type === InteractionType.ApplicationCommand
        ? `${interaction.type}/${interaction.commandId}/${interaction.commandName}`
        : interaction.type,
    ];

    if (isDebuggerEnabled("DiscordJS")) this.logger.info(...__logPrefix, "created");

    try {
      await client.executeInteraction(interaction);
    } catch (error) {
      // If the debugger is enabled, we'll log the error and reply to the user what happened.
      if (isDebuggerEnabled("DiscordJS")) this.logger.error(...__logPrefix, error);
    } finally {
      if (isDebuggerEnabled("DiscordJS")) this.logger.info(...__logPrefix, "finished");
    }
  }
}
