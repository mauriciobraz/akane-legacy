import { DeepPartial, Repository } from "typeorm";
import { AkaneDataSource } from "../data-source";
import { Punishment } from "../entities/Punishment";

export const PunishmentRepository = AkaneDataSource.getRepository(Punishment).extend({
  async createIfNotExists(
    this: Repository<Punishment>,
    punishment: DeepPartial<Punishment>
  ): Promise<Punishment> {
    const foundPunishment = await this.findOne({
      where: {
        user: {
          discordId: punishment.user.discordId,
        },
      },
    });

    if (foundPunishment) {
      return foundPunishment;
    }

    return this.save(foundPunishment);
  },
});
