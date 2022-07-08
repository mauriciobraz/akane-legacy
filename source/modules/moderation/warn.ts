import Container from "typedi";
import {
  CommandInteraction,
  GuildMember,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js";
import { Discord, Guard } from "discordx";
import { PrismaClient } from "@prisma/client";

import L from "../../locales/i18n-node";
import { GuildGuards } from "../../guards/guild";
import {
  DiscordLocalization,
  SlashCommand,
  SlashCommandOption,
} from "../../utils/discord-localization";

@Discord()
export class ModerationWarn {
  private readonly prisma = Container.get(PrismaClient);

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

    const guild = await this.prisma.guild.upsert({
      where: { guildId: interaction.guildId },
      create: { guildId: interaction.guildId },
      update: {},
    });

    const user = await this.prisma.user.upsert({
      where: { userId: member.id },
      create: {
        userId: member.id,
        Guilds: { connect: { guildId: interaction.guildId } },
      },
      update: {},
    });

    const userPunisher = await this.prisma.user.upsert({
      where: { userId: interaction.user.id },
      create: {
        userId: interaction.user.id,
        Guilds: { connect: { guildId: interaction.guildId } },
      },
      update: {},
    });

    await this.prisma.punishment.create({
      data: {
        userId: user.id,
        punisherId: userPunisher.id,
        guildId: guild.id,
        type: "WARN",
        reason,
      },
    });

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
