import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

// exist validation: username, id and email can only exist once
@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) {}



    private async hashPassword(password: string): Promise<string> {
        const saltRounds = 10; // You can adjust the number of salt rounds
        return bcrypt.hash(password, saltRounds);
    }

    async create(user: User): Promise<any> {
        // Check if the username already exists
        if (await this.doesUsernameExist(user.userName))
            throw new ConflictException("Username");

        // Hash the password, the parameter is the plain text password
        user.password = await this.hashPassword(user.password);
        console.log(`Hashed Password: ${user.password}`); // Log the hashed password
        const savedUser = await this.usersRepository.save(user);
        return savedUser.id;
    }

    // only used to check if a user with username is there (username already in use?)
    async readOneByUsername(username: string): Promise<User | null> {
        return await this.usersRepository.findOne({
            where: { userName: username },
        });
    }

    // only used to check if a user with email is there (email already in use?)
    async readOneByEmail(email: string): Promise<User | null> {
        return await this.usersRepository.findOne({
            where: { email: email },
        });
    }

    async doesUsernameExist(username: string): Promise<boolean> {
        const user = await this.readOneByUsername(username);
        return user !== null;
    }

    async doesEmailExist(email: string): Promise<boolean> {
        const user = await this.readOneByEmail(email);
        return user !== null;
    }

    async readOneById(id: number): Promise<Partial<User> | null> {
        const result = await this.usersRepository.find({
            where: { id },
            relations: {
                tripsWithAccess: { trip: true },
            },
        });
        return result.length > 0
        ? {
            // no password and username(already known is returned)
              id: result[0].id,
              firstName: result[0].firstName,
              lastName: result[0].lastName,
              email: result[0].email
          }
        : null;
    }

    async update(id: number, data: Partial<User>) {
        // Check if the username already exists only if userName is present in the data
        if (data.userName && (await this.doesUsernameExist(data.userName)))
            throw new ConflictException("Username");

        // Check if the username already exists only if userName is present in the data
        if (data.email && (await this.doesEmailExist(data.email)))
            throw new ConflictException("Email");

        return await this.usersRepository.update(id, data); // try catch needs await, because try catch cannot catch asyncronous exceptions
    }

    async delete(id: number): Promise<void> {
        await this.usersRepository.delete(id);
    }
}
