import type { GuardFunction } from "discordx";
import type { GuildMember, Interaction, PermissionString } from "discord.js";

import L from "@locales/i18n-node";
import { DiscordApiTypes } from "@utils/discord-api-types";
import { getPreferredLocaleFromInteraction } from "@utils/localization";

export namespace GuildGuards {
  /**
   * Checks if the command is being used in a guild.
   * @param silent Warns the user if the command is not in a guild.
   * @returns A guard function that checks if the command is in a guild.
   */
  export function inGuild(silent?: boolean): GuardFunction<Interaction> {
    return async (interaction, _client, next) => {
      if (interaction.guild && interaction.member) {
        return await next();
      }

      if (!silent && interaction.isRepliable()) {
        const LL = L[getPreferredLocaleFromInteraction(interaction)].ERRORS;

        if (!interaction.deferred) {
          await interaction.deferReply({ ephemeral: true });
        }

        await interaction.followUp({
          content: LL.NOT_IN_GUILD(),
          ephemeral: true,
        });
      }
    };
  }

  /**
   * Checks if the user has the required permissions.
   * @param permissions Permissions to check for.
   * @param silent Warns the user if they do not have the required permissions or if they are not in a guild.
   * @returns A guard that checks if the user has the given permissions.
   */
  export function hasPermissions(
    permissions: PermissionString[],
    bot?: boolean,
    silent?: boolean
  ): GuardFunction<Interaction> {
    return async (interaction, _client, next) => {
      if (interaction.guild && interaction.member) {
        if (bot) {
          if (interaction.guild.me?.permissions.has(permissions)) {
            await next();
            return;
          }
        }

        if (!interaction.guildId) {
          return;
        }

        const member = await DiscordApiTypes.fromGuildMember(
          interaction.member as GuildMember,
          interaction.guild || (await interaction.client.guilds.fetch(interaction.guildId))
        );

        if (member.permissions.has(permissions)) {
          await next();
          return;
        }

        if (!silent && interaction.isRepliable()) {
          const LL = L[getPreferredLocaleFromInteraction(interaction)].ERRORS;

          if (!interaction.deferred) {
            await interaction.deferReply({ ephemeral: true });
          }

          await interaction.followUp({
            content: LL.USER_MISSING_PERMISSIONS({ permissions }),
            ephemeral: true,
          });
        }

        return;
      }

      if (!silent && interaction.isRepliable()) {
        const LL = L[getPreferredLocaleFromInteraction(interaction)].ERRORS;

        if (!interaction.deferred) {
          await interaction.deferReply({ ephemeral: true });
        }

        await interaction.followUp({
          content: LL.NOT_IN_GUILD(),
          ephemeral: true,
        });
      }
    };
  }

  /**
   * Checks if a member has a higher role than the target. Handles the notifications for the user when they have inferior roles.
   * @param member The member to check.
   * @param target The target member to check if role is higher than the target member.
   * @param silent Warns the user that the member has a higher role than the target.
   * @param interaction The interaction to use.
   */
  export async function hasHigherRole(
    member: GuildMember,
    target: GuildMember,
    silent: boolean,
    interaction: Interaction
  ): Promise<boolean> {
    if (member.user.id === target.user.id) {
      if (!silent && interaction.isRepliable()) {
        const LL = L[getPreferredLocaleFromInteraction(interaction)].ERRORS;

        if (!interaction.deferred) {
          await interaction.deferReply({ ephemeral: true });
        }

        await interaction.followUp(LL.USER_TRYING_TO_PUNISH_HIMSELF());
      }

      return false;
    }

    const comparedPosition = member.roles.highest.comparePositionTo(target.roles.highest);

    if (comparedPosition <= 0) {
      if (!silent && interaction.isRepliable()) {
        const LL = L[getPreferredLocaleFromInteraction(interaction)].ERRORS;

        if (!interaction.deferred) {
          await interaction.deferReply({ ephemeral: true });
        }

        await interaction.followUp({
          content:
            member.user.id === interaction.client.user?.id
              ? LL.BOT_ROLE_INFERIOR_THAN_TARGET()
              : LL.TARGET_ROLE_HIGHER(),
        });
      }

      return false;
    }

    return true;
  }
}
