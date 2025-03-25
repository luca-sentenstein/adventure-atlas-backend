import {
    Entity,
    Column,
    ManyToOne,
    OneToMany,
} from "typeorm";
import { BaseEntity } from "../shared/base";
import { Trip } from "./trip.entity";
import { Location } from "./location.entity";
import { IsDate, IsNumber, IsString } from "class-validator";



@Entity()
export class TripStage extends BaseEntity {
    @Column()
    @IsString()
    title: string;

    @Column()
    picture: Buffer;

    @Column({ nullable: true })
    @IsString()
    description?: string;

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

    @OneToMany(() => Location, (location) => location.stage, { cascade: ["insert", "update", "remove", "soft-remove", "recover"],  onDelete: 'CASCADE'  ,eager:true }) // eager resolves locations always (globally), when using get on trip
    locations: Location[];

    // many stages to one trip
    @ManyToOne(() => Trip, (trip) => trip.stages )
    trip: Trip;
}
