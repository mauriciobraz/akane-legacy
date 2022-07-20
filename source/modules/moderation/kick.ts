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
import { isTrustedMediaURL } from "../../utils/url";

@Discord()
export class ModerationKick {
  private readonly prisma = Container.get(PrismaClient);

  @SlashCommand("KICK.NAME", "KICK.DESCRIPTION")
  @Guard(
    GuildGuards.inGuild(),
    GuildGuards.hasPermissions(["KICK_MEMBERS"]),
    GuildGuards.hasPermissions(["KICK_MEMBERS"], true)
  )
  async handleKick(
    @SlashCommandOption("KICK.OPTIONS.USER.NAME", "KICK.OPTIONS.USER.DESCRIPTION", {
      type: "USER",
    })
    member: GuildMember,

    @SlashCommandOption("KICK.OPTIONS.REASON.NAME", "KICK.OPTIONS.REASON.DESCRIPTION", {
      type: "STRING",
      required: false,
    })
    reason: string | null = null,

    @SlashCommandOption("KICK.OPTIONS.PROOFS.NAME", "KICK.OPTIONS.PROOFS.DESCRIPTION", {
      type: "STRING",
      required: false,
    })
    proofs: string | undefined,

    @SlashCommandOption("KICK.OPTIONS.SILENT.NAME", "KICK.OPTIONS.SILENT.DESCRIPTION", {
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

    const authorMember = await DiscordApiTypes.fromGuildMember(
      interaction.member as GuildMember,
      guild
    );

    const guildMe =
      guild.me ||
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

    // FIXME: This reason field.
    await this.prisma.punishment.create({
      data: {
        userId: userFromDatabase.id,
        punisherId: userPunisherFromDatabase.id,
        guildId: guildFromDatabase.id,
        type: "KICK",
        reason: reason || "undefined",
      },
    });

    let DMLocked = false;

    if (!silent) {
      try {
        const warnEmbed = new MessageEmbed()
          .setTitle(
            LL.EMBEDS.MODERATION_KICK_TARGET_NOTIFICATION.TITLE({
              guild: guild.name,
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

        await member.send({
          components: [actionRow],
          embeds: [warnEmbed],
        });
      } catch (_error) {
        console.error(_error);
        DMLocked = true;
      }
    }

    await member.kick(reason ?? LL.ERRORS.NO_REASON_PROVIDED());

    await interaction.editReply(
      silent
        ? LL.COMMON.MODERATION_KICK_SUCCESS_SILENT()
        : DMLocked
        ? LL.COMMON.MODERATION_KICK_SUCCESS_AND_FAIL_SEND_DM()
        : LL.COMMON.MODERATION_KICK_SUCCESS()
    );
  }
}
