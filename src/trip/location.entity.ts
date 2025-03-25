import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "../shared/base";
import { IsNumber, IsString } from "class-validator";
import { Expose, Type } from "class-transformer";
import { TripStage } from "./trip-stage.entity";

@Entity()
export class Location extends BaseEntity {
    @Column({ nullable: true })
    @IsString()
    name: string;

    @Column({ type: 'float', nullable: false })
    @IsNumber()
    Lat: number;

    @Column({ type: 'float', nullable: false })
    @IsNumber()
    Lng: number;

    // many locations to one stage
    @ManyToOne(() => TripStage, (stage) => stage.locations ,{ onDelete: 'CASCADE' })
    @Type(() => TripStage)
    stage: TripStage;
}
