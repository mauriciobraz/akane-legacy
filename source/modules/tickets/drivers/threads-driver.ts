import {
  ActionRowBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  SelectMenuBuilder,
  SelectMenuOptionBuilder,
  time,
} from "discord.js";

import { Loggable, RepliableInteraction } from "@root/types";
import { Context, Inquirer } from "@utils/inquirer";
import { BaseTicketDriverOptions, TicketDriver, TicketDriverConfigureOptions } from "./interface";

interface TicketItem {
  name: string;
  description: string;
  emoji: string;
}

export class TicketThreadsDriver implements TicketDriver {
  constructor(public options: BaseTicketDriverOptions) {}

  async configure(options: TicketDriverConfigureOptions): Promise<void> {
    let preferredContext = await Inquirer.askUsingButtons(
      options.interaction as RepliableInteraction,
      {
        context: Context.Guild,
        choices: [
          { id: Context.Guild, style: ButtonStyle.Primary, label: "Servidor", emoji: "🏢" },
          { id: Context.DM, style: ButtonStyle.Secondary, label: "Privado", emoji: "🕵️" },
        ],
        messageOptions: {
          content: "Onde você quer que seja feita as perguntas?",
        },
      }
    );

    let isDMOpen = false;

    if (preferredContext === Context.DM) {
      isDMOpen = await options.interaction.user
        .send("As perguntas a partir de agora serão feitas aqui, fique atento.")
        .then(() => true)
        .catch(() => false);

      // Try to send a DM message to the user and if it fails, ask again only one time.
      if (!isDMOpen) {
        const timeout = 1000 * 20;
        const timeoutDate = new Date(Date.now() + timeout);

        await options.interaction.editReply({
          components: [],
          embeds: [],
          content: `Seu privado está fechado, não consigo enviar mensagens. Tentando novamente em ${time(
            timeoutDate,
            "R"
          )}.`,
        });

        const newPreferredContext = await Inquirer.askUsingButtons(
          options.interaction as RepliableInteraction,
          {
            timeout,
            context: Context.Guild,
            choices: [
              { id: Context.Guild, style: ButtonStyle.Primary, label: "Servidor", emoji: "🏢" },
            ],
            messageOptions: {
              content: `Seu privado está fechado, não consigo enviar mensagens. Tentando novamente em ${time(
                timeoutDate,
                "R"
              )}.`,
            },
          }
        ).catch((error: Error) => error);

        // Ask again if the user didn't open the DM in the time or throw the error.
        if (newPreferredContext instanceof Error) {
          options.interaction.logger?.info(newPreferredContext.name, newPreferredContext.message);

          if (
            newPreferredContext.name === "Error [InteractionCollectorError]" &&
            newPreferredContext.message.endsWith("time")
          ) {
            isDMOpen = await options.interaction.user
              .send("As perguntas a partir de agora serão feitas aqui, fique atento.")
              .then(() => true)
              .catch(() => false);

            if (!isDMOpen) {
              await options.interaction.editReply({
                components: [],
                embeds: [],
                content:
                  'Você não abriu o privado ainda, use o modo "Servidor" para prosseguir ou abra o privado para continuar.',
              });

              return;
            }
          } else throw newPreferredContext;
        } else preferredContext = newPreferredContext;
      }
    }

    let isFinished = false;
    let retrievedTopics = [];

    while (!isFinished) {
      retrievedTopics.push(await this._askTicketItem(options.interaction, preferredContext));

      isFinished = await Inquirer.askUsingButtons(options.interaction as RepliableInteraction, {
        context: preferredContext,
        choices: [
          { id: false, style: ButtonStyle.Success, label: "Sim", emoji: "✅" },
          { id: true, style: ButtonStyle.Danger, label: "Não", emoji: "❌" },
        ],
        messageOptions: {
          content: "Deseja adicionar mais um tópico?",
        },
      });
    }

    await options.interaction.editReply({
      components: [],
      embeds: [],
      content: `Configuração finalizada com ${retrievedTopics.length} seções de ticket.`,
    });

    const selectMenuBuilder = new SelectMenuBuilder()
      .setPlaceholder("Selecionar tópico")
      .setOptions(
        retrievedTopics.map(ticketOption =>
          new SelectMenuOptionBuilder()
            .setLabel(ticketOption.name)
            .setDescription(ticketOption.description)
            .setEmoji(ticketOption.emoji)
        )
      );

    const selectMenuActionRowBuilder = new ActionRowBuilder<SelectMenuBuilder>();
    selectMenuActionRowBuilder.addComponents(selectMenuBuilder);

    await options.channel.send({
      components: [selectMenuActionRowBuilder],
      content: "Abra o menu para selecionar uma seção de ticket.",
    });
  }

  async execute(interaction: Loggable<ButtonInteraction>): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private async _askTicketItem(
    interaction: CommandInteraction,
    context: Inquirer.Context
  ): Promise<TicketItem> {
    const chosenName = await Inquirer.askMessages(interaction as RepliableInteraction, {
      context,
      deleteRetrievedMessages: context === Context.Guild,
      messageOptions: {
        components: [],
        embeds: [],
        content: "Digite o nome deste tópico (ex. denúncias).",
      },
      maxMessages: 1,
    });

    const chosenDescription = await Inquirer.askMessages(interaction as RepliableInteraction, {
      context,
      deleteRetrievedMessages: context === Context.Guild,
      messageOptions: {
        components: [],
        embeds: [],
        content:
          "Digite a descrição deste tópico (ex. denuncie membros que infrinjam as regras...).",
      },
      maxMessages: 1,
    });

    const chosenEmoji = await Inquirer.askMessages(interaction as RepliableInteraction, {
      context,
      deleteRetrievedMessages: context === Context.Guild,
      messageOptions: {
        components: [],
        embeds: [],
        content: "Escolha um emoji para identificar este tópico (ex. 📝).",
      },
      maxMessages: 1,
    });

    return {
      name: chosenName.first()!.content,
      description: chosenDescription.first()!.content,
      emoji: chosenEmoji.first()!.content,
    };
  }
}
