import { type ArgsOf, Discord, Once, On } from "discordx";
import { Logger } from "tslog";

import { Client } from "../types";

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
      if (e instanceof Error) this.logger.prettyError(e);
      else this.logger.error(e);
    }
  }
}
