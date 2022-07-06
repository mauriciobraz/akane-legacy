import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Punishment } from "./Punishment";
import { User } from "./User";

@Entity()
export class Guild {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  discordId: string;

  @ManyToMany(() => User, user => user.guilds)
  users: User[];

  @OneToMany(() => Punishment, punishment => punishment.guild)
  punishments: Punishment[];

  @CreateDateColumn({ type: "timestamp", precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 3 })
  updatedAt: Date;
}
