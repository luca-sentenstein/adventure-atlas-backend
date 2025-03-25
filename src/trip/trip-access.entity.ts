import { Column, Entity, ManyToOne } from "typeorm";
import { BaseEntity } from "../shared/base";
import { User } from "../user/user.entity";
import { Trip } from "./trip.entity";

export class TripAccessDto {
    userName: string;
    trip: number;
    accessLevel: string;
}

@Entity()
export class TripAccess extends BaseEntity {
    // many users with access on one trip
    @ManyToOne(() => Trip, { cascade: true , onDelete: "CASCADE" })
    trip: Trip;

    // one user can have many accesses to different trips
    @ManyToOne(() => User, { cascade: true })
    user: User;

    @Column({
        type: "text",
        enum: ["read", "write"],
        default: "read",
    })
    accessLevel: "read" | "write";
}
