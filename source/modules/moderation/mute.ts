import { Discord, Guard } from "discordx";
import { ApplicationCommandOptionType, CommandInteraction, GuildMember } from "discord.js";

import L from "../../locales/i18n-node";
import { GuildGuards } from "../../guards/guild";
import { handleAutocompleteTime, type AutocompleteTime } from "../../utils/autocomplete-time";
import {
  getPreferredLocaleFromInteraction,
  SlashCommand,
  SlashCommandOption,
} from "../../utils/localization";
import { isTrustedMediaURL } from "../../utils/url";
import { Loggable } from "@root/types";

@Discord()
export class Mute {
  @SlashCommand("MUTE.NAME", "MUTE.DESCRIPTION")
  @Guard(
    GuildGuards.inGuild(),
    GuildGuards.hasPermissions(["MuteMembers"]),
    GuildGuards.hasPermissions(["MuteMembers"], true)
  )
  async mute(
    @SlashCommandOption("MUTE.OPTIONS.USER.NAME", "MUTE.OPTIONS.USER.DESCRIPTION", {
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember,

    @SlashCommandOption("MUTE.OPTIONS.REASON.NAME", "MUTE.OPTIONS.REASON.DESCRIPTION", {
      type: ApplicationCommandOptionType.String,
      required: false,
    })
    reason: string | undefined,

    @SlashCommandOption("MUTE.OPTIONS.PROOFS.NAME", "MUTE.OPTIONS.PROOFS.DESCRIPTION", {
      type: ApplicationCommandOptionType.String,
      required: false,
    })
    proofs: string | undefined,

    @SlashCommandOption("MUTE.OPTIONS.TIME.NAME", "MUTE.OPTIONS.TIME.DESCRIPTION", {
      type: ApplicationCommandOptionType.String,
      required: false,
      autocomplete: handleAutocompleteTime,
    })
    time: AutocompleteTime,

    interaction: Loggable<CommandInteraction>
  ): Promise<void> {
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const LL = L[getPreferredLocaleFromInteraction(interaction)];

    const proofsArray: string[] = [];

    if (proofs) {
      interaction.logger?.debug("Parsing proofs");

      proofsArray.push(...proofs.split(","));

      if (proofsArray.some(proof => !isTrustedMediaURL(proof))) {
        interaction.logger?.debug("Invalid proof URL");

        await interaction.editReply(LL.ERRORS.NOT_TRUSTED_URL());
        return;
      }

      interaction.logger?.debug("Proofs parsed");
    }

    await interaction.editReply({
      content: LL.ERRORS.NOT_IMPLEMENTED(),
    });
  }

  @SlashCommand("UNMUTE.NAME", "UNMUTE.DESCRIPTION")
  async unmute(
    @SlashCommandOption("UNMUTE.OPTIONS.USER.NAME", "UNMUTE.OPTIONS.USER.DESCRIPTION", {
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember,

    @SlashCommandOption("UNMUTE.OPTIONS.REASON.NAME", "UNMUTE.OPTIONS.REASON.DESCRIPTION", {
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    reason: string | undefined,

    interaction: CommandInteraction
  ): Promise<void> {
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const LL = L[getPreferredLocaleFromInteraction(interaction)];

    await interaction.editReply({
      content: LL.ERRORS.NOT_IMPLEMENTED(),
    });
  }
}
