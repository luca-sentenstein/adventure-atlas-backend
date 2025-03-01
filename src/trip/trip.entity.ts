import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../shared/base';
import { User } from '../user/user.entity';
import { TripStage } from './trip-stage.entity';

@Entity()
export class Trip extends BaseEntity {
  @ManyToOne(() => User)
  owner: User;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  image?: Buffer;

  @Column({ default: false })
  public: boolean;

  // cascade: true automatically inserts the stages, when a trip gets saved
  @OneToMany(() => TripStage, (stage) => stage.trip, { cascade: true })
  stages: TripStage[];
}
