import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../shared/base';
import { User } from '../user/user.entity';
import { Trip } from './trip.entity';

@Entity()
export class TripAccess extends BaseEntity {
  @ManyToOne(() => Trip)
  trip: Trip;

  @ManyToOne(() => User)
  user: User;

  @Column({
    type: 'text',
    enum: ['read', 'write'],
    default: 'read',
  })
  accessLevel: 'read' | 'write';
}
