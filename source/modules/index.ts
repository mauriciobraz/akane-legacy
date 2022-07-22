import Container from "typedi";
import { EmbedBuilder, Interaction, InteractionType } from "discord.js";
import { Discord, On, Once, type ArgsOf } from "discordx";
import { Logger } from "tslog";

import { isDebuggerEnabled } from "@root/index";
import type { Loggable, MergeClient } from "@root/types";

@Discord()
export class IndexModule {
  constructor(private readonly logger: Logger) {}

  @Once("ready")
  async onceReady(_: ArgsOf<"ready">, client: MergeClient<true>): Promise<void> {
    await client.initApplicationCommands();

    if (isDebuggerEnabled("DiscordJS")) this.logger.info("Successfully connected to Discord API.");
  }

  @On("interactionCreate")
  async onInteractionCreate(
    [interaction]: [Loggable<Interaction>],
    client: MergeClient<true>
  ): Promise<void> {
    if (isDebuggerEnabled("DiscordJS")) {
      // const __logPrefix = [
      //   interaction.id,
      //   ...(interaction.type === InteractionType.ApplicationCommand
      //     ? ["/", interaction.commandId, `(${interaction.commandName})`]
      //     : [interaction.type]),
      // ];

      const __logPrefix = [interaction.type, interaction.id];

      if (interaction.type === InteractionType.ApplicationCommand) {
        __logPrefix.push("/", interaction.commandId, `(${interaction.commandName})`);
      }

      // @ts-ignore
      (interaction as Loggable).logger = {
        debug: (...args: unknown[]) => this.logger.debug(...__logPrefix, ...args),
        error: (...args: unknown[]) => this.logger.error(...__logPrefix, ...args),
        fatal: (...args: unknown[]) => this.logger.fatal(...__logPrefix, ...args),
        info: (...args: unknown[]) => this.logger.info(...__logPrefix, ...args),
        trace: (...args: unknown[]) => this.logger.trace(...__logPrefix, ...args),
        warn: (...args: unknown[]) => this.logger.warn(...__logPrefix, ...args),
      };
    }

    if (isDebuggerEnabled("DiscordJS")) interaction.logger?.debug("Created");

    try {
      await client.executeInteraction(interaction);
    } catch (error) {
      if (isDebuggerEnabled("DiscordJS")) interaction.logger?.error(error);
    } finally {
      if (isDebuggerEnabled("DiscordJS")) interaction.logger?.debug("Finished");
    }
  }
}
