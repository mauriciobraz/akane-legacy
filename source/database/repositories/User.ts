import type { DeepPartial, Repository } from "typeorm";

import { AkaneDataSource } from "../data-source";
import { User } from "../entities/User";

export const UserRepository = AkaneDataSource.getRepository(User).extend({
  async createIfNotExists(this: Repository<User>, user: DeepPartial<User>): Promise<User> {
    const foundUser = await this.findOne({ where: { discordId: user.discordId } });

    if (foundUser) {
      return foundUser;
    }

    return this.save(user);
  },
});
