import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../shared/base';
import { Trip } from './trip.entity';

export class Location {
  @Column()
  x: number;

  @Column()
  y: number;
}

@Entity()
export class TripStage extends BaseEntity {
  @Column()
  title: string;

  @Column()
  picture: Buffer;

  @Column({ nullable: true })
  description?: string;

  @Column()
  displayRoute: boolean;

  @Column()
  cost: number;

  @Column({ nullable: true, type: 'datetime' })
  start?: Date;

  @Column({ nullable: true, type: 'datetime' })
  end?: Date;

  @Column(() => Location)
  route: Location[];

  @ManyToOne(() => Trip, (trip) => trip.stages)
  trip: Trip;
}
