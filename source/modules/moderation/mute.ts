import { Discord, Guard } from "discordx";
import type { CommandInteraction, GuildMember } from "discord.js";

import L from "../../locales/i18n-node";
import { GuildGuards } from "../../guards/guild";
import { handleAutocompleteTime, type AutocompleteTime } from "../../utils/autocomplete-time";
import {
  getPreferredLocaleFromInteraction,
  SlashCommand,
  SlashCommandOption,
} from "../../utils/localization";
import { isTrustedMediaURL } from "../../utils/url";

@Discord()
export class Mute {
  @SlashCommand("MUTE.NAME", "MUTE.DESCRIPTION")
  @Guard(
    GuildGuards.inGuild(),
    GuildGuards.hasPermissions(["MUTE_MEMBERS"]),
    GuildGuards.hasPermissions(["MUTE_MEMBERS"], true)
  )
  async mute(
    @SlashCommandOption("MUTE.OPTIONS.USER.NAME", "MUTE.OPTIONS.USER.DESCRIPTION", {
      type: "USER",
    })
    member: GuildMember,

    @SlashCommandOption("MUTE.OPTIONS.REASON.NAME", "MUTE.OPTIONS.REASON.DESCRIPTION", {
      required: false,
      type: "STRING",
    })
    reason: string | undefined,

    @SlashCommandOption("MUTE.OPTIONS.PROOFS.NAME", "MUTE.OPTIONS.PROOFS.DESCRIPTION", {
      type: "STRING",
      required: false,
    })
    proofs: string | undefined,

    @SlashCommandOption("MUTE.OPTIONS.TIME.NAME", "MUTE.OPTIONS.TIME.DESCRIPTION", {
      autocomplete: handleAutocompleteTime,
      required: false,
      type: "STRING",
    })
    time: AutocompleteTime,

    interaction: CommandInteraction
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

    await interaction.editReply({
      content: LL.ERRORS.NOT_IMPLEMENTED(),
    });
  }

  @SlashCommand("UNMUTE.NAME", "UNMUTE.DESCRIPTION")
  async unmute(
    @SlashCommandOption("UNMUTE.OPTIONS.USER.NAME", "UNMUTE.OPTIONS.USER.DESCRIPTION", {
      type: "USER",
    })
    member: GuildMember,

    @SlashCommandOption("UNMUTE.OPTIONS.REASON.NAME", "UNMUTE.OPTIONS.REASON.DESCRIPTION", {
      required: false,
      type: "STRING",
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
