import { AkaneDataSource } from "../data-source";
import { Punishment } from "../entities/Punishment";

export const PunishmentRepository = AkaneDataSource.getRepository(Punishment);
