import Container from "typedi";
import { PrismaClient } from "@prisma/client";
import {
  CommandInteraction,
  GuildMember,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
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
    GuildGuards.hasPermissions(["MUTE_MEMBERS"]),
    GuildGuards.hasPermissions(["MUTE_MEMBERS"], true)
  )
  async handleWarn(
    @SlashCommandOption("WARN.OPTIONS.USER.NAME", "WARN.OPTIONS.USER.DESCRIPTION", {
      type: "USER",
    })
    member: GuildMember,

    @SlashCommandOption("WARN.OPTIONS.REASON.NAME", "WARN.OPTIONS.REASON.DESCRIPTION", {
      type: "STRING",
    })
    reason: string,

    @SlashCommandOption("WARN.OPTIONS.PROOFS.NAME", "WARN.OPTIONS.PROOFS.DESCRIPTION", {
      type: "STRING",
      required: false,
    })
    proofs: string | undefined,

    @SlashCommandOption("WARN.OPTIONS.SILENT.NAME", "WARN.OPTIONS.SILENT.DESCRIPTION", {
      type: "BOOLEAN",
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
        const embed = new MessageEmbed()
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
