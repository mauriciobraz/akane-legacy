import { CommandInteraction } from "discord.js";
import { Discord } from "discordx";
import { SlashCommand } from "../utils/discord-localization";

@Discord()
export class Example {
  @SlashCommand({ name: ["EXAMPLE_NAME"], description: ["EXAMPLE_DESCRIPTION"] })
  async handleExample(interaction: CommandInteraction): Promise<void> {
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    await interaction.editReply("Não implementado ainda.");
  }
}
