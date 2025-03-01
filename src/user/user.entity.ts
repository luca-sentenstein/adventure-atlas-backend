import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../shared/base';
import { TripAccess } from '../trip/trip-access.entity';

@Entity()
export class User extends BaseEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  userName: string;

  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @OneToMany(() => TripAccess, (tripAccess) => tripAccess.user)
  tripsWithAccess: TripAccess;

  // @Column()
  // role: 'user' | 'admin';
}
