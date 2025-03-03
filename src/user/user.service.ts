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
        //user.passwordHash = await this.hashPassword(user.passwordHash);
        // Generate JWT token
        //const token = await this.authService.generateToken(user);

        const savedUser = await this.usersRepository.save(user);
        return savedUser.id;
    }

    async readOneByUsername(username: string): Promise<User | null> {
        return await this.usersRepository.findOne({
            where: { userName: username },
        });
    }

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

    async readOneById(id: number): Promise<User | null> {
        const result = await this.usersRepository.find({
            where: { id },
            relations: {
                tripsWithAccess: { trip: true },
            },
        });
        return result ? result[0] : null;
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
