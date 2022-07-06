import {
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  type CommandInteraction,
  type GuildMember,
} from "discord.js";
import { Discord, Guard } from "discordx";
import type { Logger } from "tslog";

import L from "../../locales/i18n-node";
import { PunishmentType } from "../../database/entities/Punishment";
import {
  GuildsRepository,
  PunishmentRepository,
  UserRepository,
} from "../../database/repositories";
import { GuildGuards } from "../../guards/guild";
import { DiscordApiTypes } from "../../utils/discord-api-types";
import {
  DiscordLocalization,
  SlashCommand,
  SlashCommandOption,
} from "../../utils/discord-localization";

@Discord()
export class ModerationKick {
  constructor(private readonly logger: Logger) {}

  @SlashCommand({
    name: "KICK.NAME",
    description: "KICK.DESCRIPTION",
  })
  @Guard(
    GuildGuards.inGuild(),
    GuildGuards.hasPermissions(["KICK_MEMBERS"]),
    GuildGuards.hasPermissions(["KICK_MEMBERS"], true)
  )
  async handleKick(
    @SlashCommandOption({
      name: "KICK.OPTIONS.USER.NAME",
      description: "KICK.OPTIONS.USER.DESCRIPTION",
      type: "USER",
    })
    member: GuildMember,

    @SlashCommandOption({
      name: "KICK.OPTIONS.REASON.NAME",
      description: "KICK.OPTIONS.REASON.DESCRIPTION",
      type: "STRING",
      required: false,
    })
    reason: string | null = null,

    @SlashCommandOption({
      name: "KICK.OPTIONS.SILENT.NAME",
      description: "KICK.OPTIONS.SILENT.DESCRIPTION",
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

    const authorMember = await DiscordApiTypes.fromGuildMember(
      interaction.member as GuildMember,
      interaction.guild
    );

    if (!(await GuildGuards.hasHigherRole(interaction.guild.me, member, false, interaction))) {
      return;
    }

    if (!(await GuildGuards.hasHigherRole(authorMember, member, false, interaction))) {
      return;
    }

    const guild = await GuildsRepository.createIfNotExists({
      discordId: interaction.guild.id,
      punishments: [],
      users: [],
    });

    const user = await UserRepository.createIfNotExists({
      discordId: interaction.user.id,
      givenPunishments: [],
      punishments: [],
      guilds: [guild],
    });

    const targetUser = await UserRepository.createIfNotExists({
      discordId: member.id,
      guilds: [guild],
    });

    await PunishmentRepository.save(
      PunishmentRepository.create({
        type: PunishmentType.KICK,
        punisher: user,
        user: targetUser,
        reason,
      })
    );

    await PunishmentRepository.save(
      PunishmentRepository.create({
        type: PunishmentType.KICK,
        punisher: user,
        user: targetUser,
        reason,
      })
    );

    await UserRepository.update(targetUser, {
      givenPunishments: targetUser.givenPunishments,
    });

    await member.kick(reason ?? LL.ERRORS.NO_REASON_PROVIDED());

    let DMLocked = false;

    if (!silent) {
      try {
        const warnEmbed = new MessageEmbed()
          .setTitle(
            LL.EMBEDS.MODERATION_KICK_TARGET_NOTIFICATION.TITLE({
              guild: interaction.guild.name,
            })
          )
          .setDescription(
            LL.EMBEDS.MODERATION_KICK_TARGET_NOTIFICATION.DESCRIPTION({
              moderator: authorMember.user.tag,
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

        await authorMember.send({
          components: [actionRow],
          embeds: [warnEmbed],
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
