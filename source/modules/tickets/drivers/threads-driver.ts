import {
  ActionRowBuilder,
  ButtonBuilder,
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

const UniqueId = "threads-driver";

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
          content:
            "Aonde você quer que as perguntas sejam feitas? Aqui neste canal ou no seu privado?",
        },
      }
    );

    let isDMOpen = false;

    if (preferredContext === Context.DM) {
      isDMOpen = await options.interaction.user
        .send("As perguntas a partir de agora serão feitas aqui, fique atento e não feche a MD.")
        .then(() => true)
        .catch(() => false);

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
              {
                id: Context.Guild,
                style: ButtonStyle.Primary,
                label: "Servidor",
                emoji: "🏢",
              },
            ],
            messageOptions: {
              content: `Seu privado está fechado, não consigo enviar mensagens. Tentando novamente em ${time(
                timeoutDate,
                "R"
              )}.`,
            },
          }
        ).catch((error: Error) => error);

        if (newPreferredContext instanceof Error) {
          options.interaction.logger?.info(newPreferredContext.name, newPreferredContext.message);

          if (
            newPreferredContext.name === "Error [InteractionCollectorError]" &&
            newPreferredContext.message.endsWith("time")
          ) {
            isDMOpen = await options.interaction.user
              .send(
                "As perguntas a partir de agora serão feitas aqui, fique atento e não feche a MD."
              )
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

    let ticketOptions = [];
    let finished = false;

    while (!finished) {
      ticketOptions.push(await this._askTicketOptions(options.interaction, preferredContext));

      const continueOrFinish = await Inquirer.askUsingButtons(
        options.interaction as RepliableInteraction,
        {
          context: preferredContext,
          choices: [
            {
              id: "Continue" as const,
              style: ButtonStyle.Primary,
              label: "Adicionar mais",
              emoji: "➕",
            },
            {
              id: "Finish" as const,
              style: ButtonStyle.Secondary,
              label: "Finalizar",
              emoji: "🏁",
            },
          ],
          messageOptions: {},
        }
      );

      finished = continueOrFinish === "Finish";
    }

    await options.interaction.editReply({
      components: [],
      embeds: [],
      content: `Configuração finalizada com ${ticketOptions.length} seções de ticket.`,
    });

    const selectMenuBuilder = new SelectMenuBuilder()
      .setPlaceholder("Selecione uma seção de ticket")
      .setOptions(
        ticketOptions.map(ticketOption =>
          new SelectMenuOptionBuilder()
            .setLabel(ticketOption.name.content)
            .setDescription(ticketOption.description.content)
            .setEmoji(ticketOption.emoji.content)
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

  private async _askTicketOptions(interaction: CommandInteraction, context: Inquirer.Context) {
    const chosenName = await Inquirer.askMessages(interaction as RepliableInteraction, {
      context,
      deleteRetrievedMessages: context === Context.Guild,
      messageOptions: {
        components: [],
        embeds: [],
        content: "Qual é o nome desta seção de ticket?",
      },
      maxMessages: 1,
    });

    const chosenDescription = await Inquirer.askMessages(interaction as RepliableInteraction, {
      context,
      deleteRetrievedMessages: context === Context.Guild,
      messageOptions: {
        components: [],
        embeds: [],
        content: "Descreva brevemente para que serve esta seção de ticket.",
      },
      maxMessages: 1,
    });

    const chosenEmoji = await Inquirer.askMessages(interaction as RepliableInteraction, {
      context,
      deleteRetrievedMessages: context === Context.Guild,
      messageOptions: {
        components: [],
        embeds: [],
        content: "Escolha um emoji para identificar esta seção de ticket.",
      },
      maxMessages: 1,
    });

    return {
      name: chosenName.first()!,
      description: chosenDescription.first()!,
      emoji: chosenEmoji.first()!,
    };
  }
}
