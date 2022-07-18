import Container from "typedi";
import { PrismaClient } from "@prisma/client";
import {
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  type CommandInteraction,
  type GuildMember,
} from "discord.js";
import { Discord, Guard } from "discordx";

import L from "../../locales/i18n-node";
import { GuildGuards } from "../../guards/guild";
import { DiscordApiTypes } from "../../utils/discord-api-types";
import {
  getPreferredLocaleFromInteraction,
  SlashCommand,
  SlashCommandOption,
} from "../../utils/localization";

@Discord()
export class ModerationBan {
  private readonly prisma = Container.get(PrismaClient);

  @SlashCommand("BAN.NAME", "BAN.DESCRIPTION")
  @Guard(
    GuildGuards.inGuild(),
    GuildGuards.hasPermissions(["BAN_MEMBERS"]),
    GuildGuards.hasPermissions(["BAN_MEMBERS"], true)
  )
  async handleBan(
    @SlashCommandOption("BAN.OPTIONS.USER.NAME", "BAN.OPTIONS.USER.DESCRIPTION", {
      type: "USER",
    })
    member: GuildMember,

    // @SlashCommandOption({
    //   name: "BAN.OPTIONS.REASON.NAME",
    //   description: "BAN.OPTIONS.REASON.DESCRIPTION",
    //   type: "STRING",
    //   required: false,
    // })
    @SlashCommandOption("BAN.OPTIONS.REASON.NAME", "BAN.OPTIONS.REASON.DESCRIPTION", {
      type: "STRING",
      required: false,
    })
    reason: string | null = null,

    // @SlashCommandOption({
    //   name: "BAN.OPTIONS.SILENT.NAME",
    //   description: "BAN.OPTIONS.SILENT.DESCRIPTION",
    //   type: "BOOLEAN",
    //   required: false,
    // })
    @SlashCommandOption("BAN.OPTIONS.SILENT.NAME", "BAN.OPTIONS.SILENT.DESCRIPTION", {
      type: "BOOLEAN",
      required: false,
    })
    silent: boolean = false,

    // @SlashCommandOption({
    //   name: "BAN.OPTIONS.TIME.NAME",
    //   description: "BAN.OPTIONS.TIME.DESCRIPTION",
    //   type: "NUMBER",
    //   required: false,
    //   minValue: 1,
    // })
    @SlashCommandOption("BAN.OPTIONS.TIME.NAME", "BAN.OPTIONS.TIME.DESCRIPTION", {
      type: "NUMBER",
      required: false,
    })
    time: number | undefined,

    interaction: CommandInteraction<"cached" | "raw">
  ): Promise<void> {
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const LL = L[getPreferredLocaleFromInteraction(interaction)];

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
        type: "BAN",
        reason,
      },
    });

    let DMLocked = false;

    if (!silent) {
      try {
        const banEmbed = new MessageEmbed()
          .setTitle(
            LL.EMBEDS.MODERATION_BAN_TARGET_NOTIFICATION.TITLE({
              guild: interaction.guild.name,
            })
          )
          .setDescription(
            LL.EMBEDS.MODERATION_BAN_TARGET_NOTIFICATION.DESCRIPTION({
              guild: interaction.guild.name,
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

        await member.send({
          components: [actionRow],
          embeds: [banEmbed],
        });
      } catch (_error) {
        DMLocked = true;
      }
    }

    await member.ban({
      reason: reason ?? LL.ERRORS.NO_REASON_PROVIDED(),
      days: time,
    });

    await interaction.editReply(
      silent
        ? LL.COMMON.MODERATION_BAN_SUCCESS_SILENT({ user: member.user.tag })
        : DMLocked
        ? LL.COMMON.MODERATION_BAN_SUCCESS_AND_FAIL_SEND_DM({ user: member.user.tag })
        : LL.COMMON.MODERATION_BAN_SUCCESS({ user: member.user.tag })
    );
  }
}
