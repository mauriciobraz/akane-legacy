import { type Guild, GuildMember } from "discord.js";
import type { APIInteractionGuildMember } from "discord-api-types/v9";

export namespace DiscordApiTypes {
  /**
   * Fetches a guild member if it is not cached.
   */
  export async function fromGuildMember(
    member: GuildMember | APIInteractionGuildMember,
    guild: Guild
  ): Promise<GuildMember> {
    return member instanceof GuildMember ? member : await guild.members.fetch(member.user.id);
  }
}
