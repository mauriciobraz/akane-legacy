import { Discord, Guard } from "discordx";
import {
  CommandInteraction,
  GuildMember,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js";
import type { Logger } from "tslog";

import L from "../../locales/i18n-node";
import { PunishmentType } from "../../database/entities/Punishment";
import {
  GuildsRepository,
  PunishmentRepository,
  UserRepository,
} from "../../database/repositories";
import { GuildGuards } from "../../guards/guild";
import {
  DiscordLocalization,
  SlashCommand,
  SlashCommandOption,
} from "../../utils/discord-localization";

@Discord()
export class ModerationWarn {
  constructor(private readonly logger: Logger) {}

  @SlashCommand({ name: "WARN.NAME", description: "WARN.DESCRIPTION" })
  @Guard(
    GuildGuards.inGuild(),
    GuildGuards.hasPermissions(["MUTE_MEMBERS"]),
    GuildGuards.hasPermissions(["MUTE_MEMBERS"], true)
  )
  async handleWarn(
    @SlashCommandOption({
      name: "WARN.OPTIONS.USER.NAME",
      description: "WARN.OPTIONS.USER.DESCRIPTION",
      type: "USER",
    })
    member: GuildMember,

    @SlashCommandOption({
      name: "WARN.OPTIONS.REASON.NAME",
      description: "WARN.OPTIONS.REASON.DESCRIPTION",
      type: "STRING",
    })
    reason: string,

    @SlashCommandOption({
      name: "WARN.OPTIONS.SILENT.NAME",
      description: "WARN.OPTIONS.SILENT.DESCRIPTION",
      type: "BOOLEAN",
      required: false,
    })
    silent: boolean = false,

    interaction: CommandInteraction<"cached" | "raw">
  ): Promise<void> {
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const LL = L[DiscordLocalization.getPreferredLocale(interaction)];

    const guild = await GuildsRepository.createIfNotExists({
      discordId: interaction.guildId,
    });

    const user = await UserRepository.createIfNotExists({
      discordId: member.id,
      guilds: [guild],
    });

    const punisher = await UserRepository.createIfNotExists({
      discordId: interaction.user.id,
      guilds: [guild],
    });

    await PunishmentRepository.save(
      PunishmentRepository.create({
        type: PunishmentType.WARN,
        guild,
        punisher,
        reason,
        user,
      })
    );

    let DMLocked = false;

    if (!silent) {
      try {
        const embed = new MessageEmbed()
          .setTitle(
            LL.EMBEDS.MODERATION_WARN_TARGET_NOTIFICATION.TITLE({
              guild: interaction.guild.name,
            })
          )
          .setDescription(
            LL.EMBEDS.MODERATION_WARN_TARGET_NOTIFICATION.DESCRIPTION({
              guild: interaction.guild.name,
              moderator: interaction.user.tag,
              reason: reason ?? LL.ERRORS.NO_REASON_PROVIDED(),
            })
          )
          .setFooter({
            text: LL.EMBEDS.COMMON_FOOTER.CONTEST_PUNISHMENT(),
          });

        const contestButton = new MessageButton()
          .setLabel(LL.EMBEDS.COMMON_BUTTONS.CONTEST_PUNISHMENT())
          .setCustomId("contest-punishment")
          .setStyle("SECONDARY")
          .setDisabled(true);

        const actionRow = new MessageActionRow().addComponents(contestButton);

        await member.send({
          components: [actionRow],
          embeds: [embed],
        });
      } catch (_error) {
        DMLocked = true;
      }
    }

    await interaction.editReply(
      silent
        ? LL.COMMON.MODERATION_WARN_SUCCESS_SILENT()
        : DMLocked
        ? LL.COMMON.MODERATION_WARN_SUCCESS_AND_FAIL_SEND_DM()
        : LL.COMMON.MODERATION_WARN_SUCCESS()
    );
  }
}
