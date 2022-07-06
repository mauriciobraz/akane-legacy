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
  @JoinTable()
  punishments: Punishment[];

  @OneToMany(() => Punishment, punishment => punishment.punisher)
  @JoinTable()
  givenPunishments: Punishment[];

  @ManyToMany(() => Guild, guild => guild.users)
  @JoinTable()
  guilds: Guild[];

  @CreateDateColumn({ type: "timestamp", precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 3 })
  updatedAt: Date;
}
