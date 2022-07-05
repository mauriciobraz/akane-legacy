import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Guild } from "./Guild";
import { Punishment } from "./Punishment";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  discordId: string;

  @OneToMany(() => Punishment, punishment => punishment.guild)
  punishments: Punishment[];

  @OneToMany(() => Punishment, punishment => punishment.punisher)
  givenPunishments: Punishment[];

  @ManyToMany(() => Guild, guild => guild.users)
  @JoinTable()
  guilds: Guild[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
