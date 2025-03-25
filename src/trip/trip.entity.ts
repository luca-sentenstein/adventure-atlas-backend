import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { BaseEntity } from "../shared/base";
import { User } from "../user/user.entity";
import { TripStage } from "./trip-stage.entity";
import { IsArray, IsBoolean, IsDate, IsInt, IsString } from "class-validator";
import { Expose, Type } from "class-transformer";

@Entity()
export class Trip extends BaseEntity {
    // Many trips one user
    @ManyToOne(() => User)
    @IsInt()
    owner: User;

    @Column()
    @IsString()
    title: string;

    @Column()
    @IsString()
    subtitle: string;

    @Column()
    @IsString()
    description: string;

    @Column({ nullable: true })
    image?: Buffer;

    @Column({ default: false })
    @IsBoolean()
    public: boolean;

    // cascade: true automatically inserts the stages, when a trip gets saved
    // one trip many tripstages
    @OneToMany(() => TripStage, (stage) => stage.trip, { cascade: true })
    @IsArray()
    @Type(() => TripStage)
    stages: TripStage[];
}
