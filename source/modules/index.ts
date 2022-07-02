import { type ArgsOf, Discord, Once, On } from "discordx";

import { Client } from "../types";

@Discord()
export class IndexModule {
  @Once("ready")
  async onceReady(_: ArgsOf<"ready">, client: Client<true>): Promise<void> {
    await client.initApplicationCommands();

    console.log(`Connected as ${client.user.tag} (${client.user.id}).`);
  }

  @On("interactionCreate")
  async onInteractionCreate([i]: ArgsOf<"interactionCreate">, client: Client<true>): Promise<void> {
    await client.executeInteraction(i);
  }
}
