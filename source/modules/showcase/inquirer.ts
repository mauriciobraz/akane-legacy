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
    @SlashOption("dm", {
      description: "Pergunta ao usuário via DM.",
      type: "BOOLEAN",
      required: false,
    })
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
  }

  @Slash("ask-select-menu", {
    description: "Pergunta a um usuário sobre um assunto e mostra um menu para ele escolher.",
  })
  async askSelectMenu(
    @SlashOption("dm", {
      description: "Pergunta ao usuário via DM.",
      type: "BOOLEAN",
      required: false,
    })
    dm: boolean = false,

    interaction: CommandInteraction
  ): Promise<void> {
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const selected = await Inquirer.askUsingSelectMenu(interaction, {
      question: "O que é Lorem Ipsum?",
      postAnswerMessage:
        '*"Não há ninguém que ame a dor por si só, que a busque e queira tê-la, simplesmente por ser dor..."*',
      placeholder: "📗 Escolha uma opção",
      choices: [
        {
          id: 1,
          emoji: "📘",
          label: "De onde ele vem?",
          description:
            "Ao contrário do que se acredita, Lorem Ipsum não é simplesmente um texto randômico.",
        },
        {
          id: 2,
          emoji: "📚",
          label: "Porque nós o usamos?",
          description:
            "É um fato conhecido de todos que um leitor se distrairá com o conteúdo de texto legível...",
        },
        {
          id: 3,
          emoji: "📝",
          label: "Onde posso conseguí-lo?",
          description:
            "Existem muitas variações disponíveis de passagens de Lorem Ipsum, mas a maioria sofreu...",
        },
      ],
      context: dm ? Context.DM : Context.Guild,
      setDisabledWhenDone: true,
    });
  }
}
