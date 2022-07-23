import { PrismaClient } from "@prisma/client";
import {
  ApplicationCommandOptionType,
  ChannelType,
  type CommandInteraction,
  type GuildTextBasedChannel,
} from "discord.js";
import { Discord, Guard, SlashChoice, SlashChoiceType } from "discordx";
import type { Logger } from "tslog";

import L from "@locales/i18n-node";
import { GuildGuards } from "@guards/guild";
import type { Loggable } from "@root/types";
import {
  getDefaultLocale,
  getPreferredLocaleFromInteraction,
  SlashCommand,
  SlashCommandGroup,
  SlashCommandOption,
} from "@utils/localization";
import { TicketThreadsDriver } from "./drivers/threads-driver";
import { TicketDriver } from "./drivers/interface";

enum TicketType {
  Channel = "Channel",
  Thread = "Thread",
  Voice = "Voice",
}

type TicketsDriversMap = {
  [key in keyof typeof TicketType]?: TicketDriver<boolean>;
};

const SupportedChannelsTypes = [
  ChannelType.GuildPublicThread,
  ChannelType.GuildText,
  ChannelType.GuildVoice,
];

function getTicketTypesTranslated(): SlashChoiceType[] {
  return Object.values(TicketType).map(type => ({
    name: L[getDefaultLocale()].COMMON.TICKETS_TYPE[
      type === TicketType.Channel ? "CHANNEL" : type === TicketType.Thread ? "THREAD" : "VOICE"
    ](),
    value: type,
  }));
}

@Discord()
@Guard(GuildGuards.inGuild())
@SlashCommandGroup("TICKETS.GROUP_NAME", "TICKETS.GROUP_DESCRIPTION", {
  assignAllMethods: true,
})
export class Tickets {
  private drivers: TicketsDriversMap = {
    Thread: new TicketThreadsDriver({
      prisma: this.prisma,
    }),
  };

  constructor(private readonly logger: Logger, private readonly prisma: PrismaClient) {}

  @SlashCommand("TICKETS.SETUP.NAME", "TICKETS.SETUP.DESCRIPTION")
  async configure(
    @SlashCommandOption(
      "TICKETS.SETUP.OPTIONS.CHANNEL.NAME",
      "TICKETS.SETUP.OPTIONS.CHANNEL.DESCRIPTION",
      { type: ApplicationCommandOptionType.Channel, channelTypes: SupportedChannelsTypes }
    )
    channel: GuildTextBasedChannel,

    @SlashCommandOption(
      "TICKETS.SETUP.OPTIONS.TICKET_TYPE.NAME",
      "TICKETS.SETUP.OPTIONS.TICKET_TYPE.DESCRIPTION"
    )
    @SlashChoice(...getTicketTypesTranslated())
    type: TicketType,

    interaction: Loggable<CommandInteraction>
  ): Promise<void> {
    if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

    const LL = L[getPreferredLocaleFromInteraction(interaction)];

    const driver = this.drivers[type];

    if (!driver) {
      await interaction.editReply(
        "Este modelo de ticket não é suportado no momento. Por favor, tente outro."
      );

      return;
    }

    await driver.configure({
      interaction,
      channel,
      title: "Denúncias",
      description: "Aqui você pode denunciar algo ao nosso staff.",
    });
  }
}
