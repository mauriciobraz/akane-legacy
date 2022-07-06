import type { DeepPartial, Repository } from "typeorm";

import { AkaneDataSource } from "../data-source";
import { Guild } from "../entities/Guild";

export const GuildsRepository = AkaneDataSource.getRepository(Guild).extend({
  async createIfNotExists(this: Repository<Guild>, guild: DeepPartial<Guild>): Promise<Guild> {
    const foundGuild = await this.findOne({ where: { discordId: guild.discordId } });

    if (foundGuild) {
      return foundGuild;
    }

    return this.save(guild);
  },
});
