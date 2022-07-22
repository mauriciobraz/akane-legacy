import Container from "typedi";
import { PrismaClient } from "@prisma/client";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type CommandInteraction,
  type GuildMember,
} from "discord.js";
import { Discord, Guard } from "discordx";

import L from "../../locales/i18n-node";
import { GuildGuards } from "../../guards/guild";
import {
  getPreferredLocaleFromInteraction,
  SlashCommand,
  SlashCommandOption,
} from "../../utils/localization";
import { isTrustedMediaURL } from "../../utils/url";

@Discord()
export class ModerationWarn {
  private readonly prisma = Container.get(PrismaClient);

  @SlashCommand("WARN.NAME", "WARN.DESCRIPTION")
  @Guard(
    GuildGuards.inGuild(),
    GuildGuards.hasPermissions(["MuteMembers"]),
    GuildGuards.hasPermissions(["MuteMembers"], true)
  )
  async handleWarn(
    @SlashCommandOption("WARN.OPTIONS.USER.NAME", "WARN.OPTIONS.USER.DESCRIPTION", {
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember,

    @SlashCommandOption("WARN.OPTIONS.REASON.NAME", "WARN.OPTIONS.REASON.DESCRIPTION", {
      type: ApplicationCommandOptionType.String,
    })
    reason: string,

    @SlashCommandOption("WARN.OPTIONS.PROOFS.NAME", "WARN.OPTIONS.PROOFS.DESCRIPTION", {
      type: ApplicationCommandOptionType.String,
      required: false,
    })
    proofs: string | undefined,

    @SlashCommandOption("WARN.OPTIONS.SILENT.NAME", "WARN.OPTIONS.SILENT.DESCRIPTION", {
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    })
    silent: boolean = false,

    interaction: CommandInteraction<"cached" | "raw">
  ): Promise<void> {
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const LL = L[getPreferredLocaleFromInteraction(interaction)];

    const guild = interaction.guild || (await interaction.client.guilds.fetch(interaction.guildId));

    const proofsArray: string[] = [];

    if (proofs) {
      proofsArray.push(...proofs.split(","));

      if (proofsArray.some(proof => !isTrustedMediaURL(proof))) {
        await interaction.editReply(LL.ERRORS.NOT_TRUSTED_URL());
        return;
      }
    }

    const guildFromDatabase = await this.prisma.guild.upsert({
      where: { guildId: interaction.guildId },
      create: { guildId: interaction.guildId },
      update: {},
    });

    const userFromDatabase = await this.prisma.user.upsert({
      where: { userId: member.id },
      create: {
        userId: member.id,
        Guilds: { connect: { guildId: interaction.guildId } },
      },
      update: {},
    });

    const userPunisherFromDatabase = await this.prisma.user.upsert({
      where: { userId: interaction.user.id },
      create: {
        userId: interaction.user.id,
        Guilds: { connect: { guildId: interaction.guildId } },
      },
      update: {},
    });

    await this.prisma.punishment.create({
      data: {
        userId: userFromDatabase.id,
        punisherId: userPunisherFromDatabase.id,
        guildId: guildFromDatabase.id,
        type: "WARN",
        reason,
        proofs: proofsArray,
      },
    });

    let DMLocked = false;

    if (!silent) {
      try {
        const embed = new EmbedBuilder()
          .setTitle(
            LL.EMBEDS.MODERATION_WARN_TARGET_NOTIFICATION.TITLE({
              guild: guild.name,
            })
          )
          .setDescription(
            LL.EMBEDS.MODERATION_WARN_TARGET_NOTIFICATION.DESCRIPTION({
              guild: guild.name,
              moderator: interaction.user.tag,
              reason: reason ?? LL.ERRORS.NO_REASON_PROVIDED(),
            })
          )
          .setFooter({
            text: LL.EMBEDS.COMMON_FOOTER.CONTEST_PUNISHMENT(),
          });

        const contestButton = new ButtonBuilder()
          .setLabel(LL.EMBEDS.COMMON_BUTTONS.CONTEST_PUNISHMENT())
          .setCustomId("contest-punishment")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true);

        const actionRow = new ActionRowBuilder<ButtonBuilder>();
        actionRow.addComponents(contestButton);

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
