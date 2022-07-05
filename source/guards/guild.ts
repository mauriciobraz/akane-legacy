import { GuardFunction } from "discordx";
import type { GuildMember, Interaction, PermissionString } from "discord.js";

import L from "../locales/i18n-node";
import { DiscordApiTypes } from "../utils/discord-api-types";
import { DiscordLocalization } from "../utils/discord-localization";

export namespace GuildGuards {
  /**
   * Checks if the command is being used in a guild.
   * @param silent Warns the user if the command is not in a guild.
   * @returns A guard function that checks if the command is in a guild.
   */
  export function inGuild(silent?: boolean): GuardFunction<Interaction> {
    return async (interaction, _client, next) => {
      if (interaction.inGuild()) {
        await next();
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
    silent?: boolean
  ): GuardFunction<Interaction> {
    return async (interaction, _client, next) => {
      if (interaction.inGuild()) {
        const member = DiscordApiTypes.fromGuildMember(
          interaction.member as GuildMember,
          interaction.guild || (await interaction.client.guilds.fetch(interaction.guildId))
        );

        if ((await member).permissions.has(permissions)) {
          return await next();
        }
      }
    };
  }
}
