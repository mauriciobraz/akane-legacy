// TODO: Warns the user in DM the reason of the punishment (silent mode too).

import { Discord, Guard } from "discordx";
import type { CommandInteraction, GuildMember } from "discord.js";
import type { Logger } from "tslog";

import L from "../../locales/i18n-node";
import { PunishmentType } from "../../database/entities/Punishment";
import { GuildRepository } from "../../database/repositories/Guild";
import { PunishmentRepository } from "../../database/repositories/Punishment";
import { UserRepository } from "../../database/repositories/User";
import { GuildGuards } from "../../guards/guild";
import {
  DiscordLocalization,
  SlashCommand,
  SlashCommandOption,
} from "../../utils/discord-localization";

@Discord()
@Guard(GuildGuards.inGuild())
export class ModerationWarn {
  constructor(private readonly logger: Logger) {}

  @SlashCommand({ name: "WARN.NAME", description: "WARN.DESCRIPTION" })
  @Guard(GuildGuards.hasPermissions(["MUTE_MEMBERS"]))
  async handleWarn(
    @SlashCommandOption({
      name: "WARN.OPTIONS.USER.NAME",
      description: "WARN.OPTIONS.USER.DESCRIPTION",
      type: "USER",
    })
    guildUser: GuildMember,

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
    _silent: boolean = false,

    interaction: CommandInteraction<"cached" | "raw">
  ): Promise<void> {
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const LL = L[DiscordLocalization.getPreferredLocale(interaction)];

    const guild = await GuildRepository.createIfNotExists({
      discordId: interaction.guildId,
    });

    const user = await UserRepository.createIfNotExists({
      discordId: guildUser.id,
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

    await interaction.editReply(
      LL["common"].PUNISHMENT_SUCCESS({
        user: `<@${user.discordId}>`,
      })
    );
  }
}
