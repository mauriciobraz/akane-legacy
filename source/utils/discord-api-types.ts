import { GuildMember, type Guild } from "discord.js";
import type { APIInteractionGuildMember } from "discord-api-types/v10";

/** Removes API-specific properties from a discord.js related objects. */
export namespace DiscordApiTypes {
  export async function fromGuildMember(
    member: GuildMember | APIInteractionGuildMember,
    guild: Guild
  ): Promise<GuildMember> {
    return member instanceof GuildMember ? member : await guild.members.fetch(member.user.id);
  }
}
