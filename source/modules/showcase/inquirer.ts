import { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { Context, Inquirer } from "../../utils/inquirer";

@Discord()
@SlashGroup("showcase")
@SlashGroup({ name: "showcase" })
export class Showcase {
  @Slash("ask-button", {
    description: "Pergunta a um usuário sobre um assunto e mostra um botão para ele escolher.",
  })
  async askButton(
    @SlashOption("dm", { description: "Pergunta ao usuário via DM.", type: "BOOLEAN" })
    dm: boolean = false,

    interaction: CommandInteraction
  ): Promise<void> {
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const selected = await Inquirer.askUsingButtons(interaction, {
      question: "What is Lorem Ipsum?",
      postAnswerMessage:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      choices: [
        { id: "danger", label: "Danger", style: "DANGER", emoji: "💥" },
        { id: "primary", label: "Primary", style: "PRIMARY" },
        { id: "secondary", label: "Secondary", style: "SECONDARY" },
        { id: "success", label: "Success", style: "SUCCESS" },
      ],
      context: dm ? Context.DM : Context.Guild,
    });

    await interaction.followUp({
      content: `You selected: ${selected}`,
      ephemeral: true,
    });
  }
}
