import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "../shared/base";
import { TripAccess } from "../trip/trip-access.entity";
import { IsEmail, IsString } from "class-validator";

@Entity()
export class User extends BaseEntity {
    @Column()  
    @IsString()  
    firstName: string;

    @Column()
    @IsString() 
    lastName: string;

    @Column()
    @IsString() 
    userName: string;

    @Column()
    @IsEmail()
    email: string;

    @Column()
    @IsString() 
    passwordHash: string;

    @OneToMany(() => TripAccess, (tripAccess) => tripAccess.user)
    tripsWithAccess: TripAccess;

    // @Column()
    // role: 'user' | 'admin';
}
