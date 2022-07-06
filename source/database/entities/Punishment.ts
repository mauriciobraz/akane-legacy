import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Guild } from "./Guild";
import { User } from "./User";

export enum PunishmentType {
  MUTE = "MUTE",
  KICK = "KICK",
  WARN = "WARN",
  BAN = "BAN",
  REVERT_MUTE = "REVERT_MUTE",
  REVERT_KICK = "REVERT_KICK",
  REVERT_WARN = "REVERT_WARN",
  REVERT_BAN = "REVERT_BAN",
}

@Entity()
export class Punishment {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @ManyToOne(() => User, user => user.punishments)
  user: User;

  @ManyToOne(() => User, user => user.givenPunishments)
  punisher: User;

  @ManyToOne(() => Guild, guild => guild.punishments)
  guild: Guild;

  @Column()
  type: PunishmentType;

  @Column({ nullable: true })
  reason: string | null;

  @CreateDateColumn({ type: "timestamp", precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 3 })
  updatedAt: Date;
}
