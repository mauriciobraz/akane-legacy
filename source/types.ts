import { Client as ClientJS } from "discord.js";
import { Client as ClientX } from "discordx";

export type Client<T extends boolean = false> = ClientX & ClientJS<T>;

export type Callback<T, Return> = (args: T) => Return;
