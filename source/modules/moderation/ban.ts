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
import { DiscordApiTypes } from "../../utils/discord-api-types";
import {
  getPreferredLocaleFromInteraction,
  SlashCommand,
  SlashCommandOption,
} from "../../utils/localization";
import { isTrustedMediaURL } from "../../utils/url";

@Discord()
export class ModerationBan {
  private readonly prisma = Container.get(PrismaClient);

  @SlashCommand("BAN.NAME", "BAN.DESCRIPTION")
  @Guard(
    GuildGuards.inGuild(),
    GuildGuards.hasPermissions(["BanMembers"]),
    GuildGuards.hasPermissions(["BanMembers"], true)
  )
  async handleBan(
    @SlashCommandOption("BAN.OPTIONS.USER.NAME", "BAN.OPTIONS.USER.DESCRIPTION", {
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember,

    @SlashCommandOption("BAN.OPTIONS.REASON.NAME", "BAN.OPTIONS.REASON.DESCRIPTION", {
      type: ApplicationCommandOptionType.String,
      required: false,
    })
    reason: string | undefined,

    @SlashCommandOption("KICK.OPTIONS.PROOFS.NAME", "KICK.OPTIONS.PROOFS.DESCRIPTION", {
      type: ApplicationCommandOptionType.String,
      required: false,
    })
    proofs: string | undefined,

    @SlashCommandOption("BAN.OPTIONS.SILENT.NAME", "BAN.OPTIONS.SILENT.DESCRIPTION", {
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    })
    silent: boolean = false,

    @SlashCommandOption("BAN.OPTIONS.TIME.NAME", "BAN.OPTIONS.TIME.DESCRIPTION", {
      type: ApplicationCommandOptionType.Number,
      required: false,
    })
    time: number | undefined,

    interaction: CommandInteraction<"cached" | "raw">
  ): Promise<void> {
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const LL = L[getPreferredLocaleFromInteraction(interaction)];

    const proofsArray: string[] = [];

    if (proofs) {
      proofsArray.push(...proofs.split(","));

      if (proofsArray.some(proof => !isTrustedMediaURL(proof))) {
        await interaction.editReply(LL.ERRORS.NOT_TRUSTED_URL());
        return;
      }
    }

    const guild = interaction.guild || (await interaction.client.guilds.fetch(interaction.guildId));

    const authorMember = await DiscordApiTypes.fromGuildMember(
      interaction.member as GuildMember,
      guild
    );

    const guildMe =
      guild.members.me ||
      (interaction.client.user && (await guild.members.fetch(interaction.client.user.id)));

    if (!guildMe) {
      throw new Error("Guild me not found");
    }

    if (!(await GuildGuards.hasHigherRole(guildMe, member, false, interaction))) {
      return;
    }

    if (!(await GuildGuards.hasHigherRole(authorMember, member, false, interaction))) {
      return;
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

    // TODO: Fix this reason || 'undefined'
    await this.prisma.punishment.create({
      data: {
        userId: userFromDatabase.id,
        punisherId: userPunisherFromDatabase.id,
        guildId: guildFromDatabase.id,
        type: "BAN",
        reason: reason || "undefined",
      },
    });

    let DMLocked = false;

    if (!silent) {
      try {
        const banEmbed = new EmbedBuilder()
          .setTitle(
            LL.EMBEDS.MODERATION_BAN_TARGET_NOTIFICATION.TITLE({
              guild: guild.name,
            })
          )
          .setDescription(
            LL.EMBEDS.MODERATION_BAN_TARGET_NOTIFICATION.DESCRIPTION({
              guild: guild.name,
              moderator: authorMember.user.tag,
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
          embeds: [banEmbed],
        });
      } catch (_error) {
        DMLocked = true;
      }
    }

    await member.ban({
      reason: reason ?? LL.ERRORS.NO_REASON_PROVIDED(),
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
