import type { PrismaClient } from "@prisma/client";
import type { Loggable } from "@root/types";
import type { ButtonInteraction, CommandInteraction, GuildTextBasedChannel } from "discord.js";

export interface BaseTicketDriverOptions {
  prisma: PrismaClient;
}

export interface TicketDriverConfigureOptions<T extends boolean = true> {
  interaction: T extends true ? Loggable<CommandInteraction> : CommandInteraction;
  channel: GuildTextBasedChannel;

  title: string;
  description: string;
}

export interface TicketDriver<T extends boolean = true> {
  /**
   * Configure a ticket channel.
   * @param options The options to configure the ticket channel.
   */
  configure(options: TicketDriverConfigureOptions<T>): Promise<void>;

  /**
   * Execute a ticket.
   * @param interaction The interaction that triggered the command.
   */
  execute(
    interaction: T extends true ? Loggable<ButtonInteraction> : CommandInteraction
  ): Promise<void>;
}

/** Use this separator only to separate the ticket type from the ticket id. */
export const Separator = "&";
