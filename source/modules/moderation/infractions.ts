import { Pagination, PaginationType } from "@discordx/pagination";
import { MessageEmbed, type CommandInteraction, type GuildMember } from "discord.js";
import { Discord, Guard } from "discordx";
import { chunk } from "lodash";
import { Logger } from "tslog";

import L from "../../locales/i18n-node";
import { Punishment, PunishmentType } from "../../database/entities/Punishment";
import { PunishmentRepository } from "../../database/repositories";
import { UserRepository } from "../../database/repositories/User";
import { GuildGuards } from "../../guards/guild";
import {
  DiscordLocalization,
  SlashCommand,
  SlashCommandOption,
} from "../../utils/discord-localization";
import type { TranslationFunctions } from "../../locales/i18n-types";

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
  BAN: "🔨",
  MUTE: "🔇",
  WARN: "📰",
};

@Discord()
export class ModerationInfractions {
  constructor(private readonly logger: Logger) {}

  @SlashCommand({ name: "INFRACTIONS.NAME", description: "INFRACTIONS.DESCRIPTION" })
  @Guard(
    GuildGuards.inGuild(),
    GuildGuards.hasPermissions(["MODERATE_MEMBERS"]),
    GuildGuards.hasPermissions(["MODERATE_MEMBERS"], true)
  )
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

    const userPunishments = await PunishmentRepository.find({
      where: {
        user: {
          discordId: user.id,
        },
      },
      order: {
        createdAt: "DESC",
      },
    });

    if (userPunishments.length === 0) {
      await interaction.editReply(LL.COMMON.USER_HAS_NO_INFRACTIONS());
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

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const last24HoursInfractions = options.punishments.filter(punishment => {
      return punishment.createdAt.getTime() > last24Hours.getTime();
    });

    const last7DaysInfractions = options.punishments.filter(punishment => {
      return punishment.createdAt.getTime() > last7Days.getTime();
    });

    const idPadSize = options.punishments.length.toString().length;

    for (const punishmentsChunk of punishmentsChunks) {
      const punishmentsDescriptionArray = punishmentsChunk.map(punishment => {
        const id = `[#${punishment.id.toString().padStart(idPadSize, "0")}](https://google.com)`;

        const timestamp = punishment.createdAt.toLocaleDateString(
          DiscordLocalization.getPreferredLocale(options.interaction)
        );

        let reason: string =
          !!punishment.reason && punishment.reason.length > 52
            ? `${punishment.reason.substring(0, 52)}...`
            : punishment.reason ?? options.translationFunctions.ERRORS.NO_REASON_PROVIDED();

        return `${PunishmentEmojis[punishment.type]} ${id} \`\`${timestamp}\`\` ${reason}`;
      });

      const embed = new MessageEmbed()
        .setDescription(punishmentsDescriptionArray.join("\n") + "\n\u200b")
        .setColor(0x141414)
        .setAuthor({
          name: options.translationFunctions.COMMON.INFRACTIONS_OF({ user: user.user.tag }),
          iconURL: user.user.avatarURL(),
        })
        .addFields([
          {
            name: options.translationFunctions.COMMON.LAST_24_HOURS(),
            value: options.translationFunctions.COMMON.X_INFRACTIONS({
              count: last24HoursInfractions.length,
            }),
            inline: true,
          },
          {
            name: options.translationFunctions.COMMON.LAST_7_DAYS(),
            value: options.translationFunctions.COMMON.X_INFRACTIONS({
              count: last7DaysInfractions.length,
            }),
            inline: true,
          },
          {
            name: options.translationFunctions.COMMON.TOTAL(),
            value: options.translationFunctions.COMMON.X_INFRACTIONS({
              count: options.punishments.length,
            }),
            inline: true,
          },
        ]);

      pages.push(embed);
    }

    return pages;
  }
}
