import { type CommandInteraction } from "discord.js";
import { Discord } from "discordx";

import { DiscordLocalization, SlashCommand } from "../utils/discord-localization";

@Discord()
export class Example {
  @SlashCommand({ name: "EXAMPLE.NAME", description: "EXAMPLE.DESCRIPTION" })
  async handleExample(interaction: CommandInteraction): Promise<void> {
    const LL = DiscordLocalization.getPreferredLocale(interaction);

    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    await interaction.editReply(LL.COMMAND_NOT_IMPLEMENTED());
  }
}
