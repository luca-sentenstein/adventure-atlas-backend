import {
    Entity,
    Column,
    ManyToOne,
    OneToMany,
} from "typeorm";
import { BaseEntity } from "../shared/base";
import { Trip } from "./trip.entity";
import { Waypoint } from "./waypoint.entity";
import { IsDate, IsNumber, IsString } from "class-validator";



@Entity()
export class TripStage extends BaseEntity {
    @Column()
    @IsString()
    index: number;

    @Column()
    @IsString()
    title: string;

    @Column({ nullable: true })
    @IsString()
    description: string;

    @Column()
    displayRoute: boolean;

    @Column()
    @IsNumber()
    cost: number;

    @Column({ nullable: true, type: "datetime" })
    @IsDate()
    start?: Date;

    @Column({ nullable: true, type: "datetime" })
    @IsDate()
    end?: Date;

    @Column()
    @IsNumber()
    day: number;

    @OneToMany(() => Waypoint, (waypoint) => waypoint.stage, { cascade: ["insert", "update", "remove", "soft-remove", "recover"],  onDelete: 'CASCADE'  ,eager:true }) // eager resolves locations always (globally), when using get on trip
    waypoints: Waypoint[];

    // many stages to one trip
    @ManyToOne(() => Trip, (trip) => trip.stages )
    trip: Trip;
}
