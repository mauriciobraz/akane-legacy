import { Discord, Guard } from "discordx";
import { CommandInteraction, GuildMember, MessageEmbed, MessageOptions } from "discord.js";

import L from "../../locales/i18n-node";
import { GuildGuards } from "../../guards/guild";
import {
  DiscordLocalization,
  SlashCommand,
  SlashCommandOption,
} from "../../utils/discord-localization";
import { PunishmentRepository } from "../../database/repositories/Punishment";
import { Punishment, PunishmentType } from "../../database/entities/Punishment";
import { chunk } from "lodash";
import { TranslationFunctions } from "../../locales/i18n-types";
import { Pagination, PaginationType } from "@discordx/pagination";
import { Logger } from "tslog";
import { UserRepository } from "../../database/repositories/User";

interface GeneratePunishmentsPagesOptions {
  interaction: CommandInteraction<"cached" | "raw">;
  translationFunctions: TranslationFunctions;
  punishments: Punishment[];
  userId: string;
  chunkSize?: number;
}

const PunishmentEmojis: { [key in PunishmentType]: string } = {
  REVERT_BAN: "🔙",
  REVERT_MUTE: "🔙",
  REVERT_KICK: "🔙",
  REVERT_WARN: "🔙",
  KICK: "🚪",
  BAN: "️",
  MUTE: "🔇",
  WARN: "📰",
};

@Discord()
@Guard(GuildGuards.inGuild())
export class ModerationInfractions {
  constructor(private readonly logger: Logger) {}

  @SlashCommand({ name: "INFRACTIONS.NAME", description: "INFRACTIONS.DESCRIPTION" })
  async handleInfractions(
    @SlashCommandOption({
      name: "INFRACTIONS.OPTIONS.USER.NAME",
      description: "INFRACTIONS.OPTIONS.USER.DESCRIPTION",
      type: "USER",
    })
    user: GuildMember,

    interaction: CommandInteraction<"cached" | "raw">
  ): Promise<void> {
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const LL = L[DiscordLocalization.getPreferredLocale(interaction)];

    const userSaved = await UserRepository.createIfNotExists({
      discordId: user.id,
    });

    const userPunishments = await PunishmentRepository.findBy({
      user: {
        discordId: userSaved.discordId,
      },
    });

    if (userPunishments.length === 0) {
      await interaction.editReply(LL["common"].NO_PUNISHMENTS());
      return;
    }

    const pages = await this._generatePagesForInfractions({
      interaction,
      punishments: userPunishments,
      translationFunctions: LL,
      chunkSize: 5,
      userId: userSaved.discordId,
    });

    // TODO: Stop using this pagination library and use a custom one.
    await new Pagination(interaction, pages, {
      type: PaginationType.Button,
      ephemeral: true,
    }).send();
  }

  /**
   * Generates a paginated message for the infractions of a user.
   * @param punishments Punishments to paginate.
   * @param chunkSize How many punishments to display per page.
   */
  private async _generatePagesForInfractions(options: GeneratePunishmentsPagesOptions) {
    const punishmentsChunks = chunk(options.punishments, options.chunkSize || 5);
    const pages: MessageEmbed[] = [];

    const user = await options.interaction.guild.members.fetch(options.userId);

    for (const punishmentsChunk of punishmentsChunks) {
      const punishmentsDescriptionArray = punishmentsChunk.map(punishment => {
        const id = `[#${punishment.id}](https://google.com)`;

        // FIXME: The timestamp came in the future, i don't know why.
        const timestamp = `<t:${Math.floor(punishment.createdAt.getTime() / 1000)}:R>`;

        const reason =
          punishment.reason.length > 52
            ? punishment.reason.substring(0, 52) + "..."
            : punishment.reason;

        return `${PunishmentEmojis[punishment.type]} ${id} ${timestamp} ${reason}`;
      });

      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const last24HoursInfractions = punishmentsChunk.filter(punishment => {
        return punishment.createdAt.getTime() > last24Hours.getTime();
      });

      const last7DaysInfractions = punishmentsChunk.filter(punishment => {
        return punishment.createdAt.getTime() > last7Days.getTime();
      });

      console.log(
        options.translationFunctions["common"].X_INFRACTIONS({
          count: last24HoursInfractions.length,
        })
      );

      const embed = new MessageEmbed()
        .setAuthor({
          name: options.translationFunctions["common"].INFRACTIONS_OF({ user: user.user.tag }),
          iconURL: user.user.avatarURL(),
        })
        .setDescription(punishmentsDescriptionArray.join("\n") + "\n\u200b")
        .setColor(0x141414)
        .addFields([
          {
            name: options.translationFunctions["common"].LAST_24_HOURS(),
            value: options.translationFunctions["common"].X_INFRACTIONS({
              count: last24HoursInfractions.length,
            }),
            inline: true,
          },
          {
            name: options.translationFunctions["common"].LAST_7_DAYS(),
            value: options.translationFunctions["common"].X_INFRACTIONS({
              count: last7DaysInfractions.length,
            }),
            inline: true,
          },
          {
            name: options.translationFunctions["common"].TOTAL(),
            value: options.translationFunctions["common"].X_INFRACTIONS({
              count: punishmentsChunk.length,
            }),
            inline: true,
          },
        ]);

      this.logger.debug(`Generated infractions page for user ${user.user.tag}`);
      this.logger.debug(embed);

      pages.push(embed);
    }

    return pages;
  }
}
