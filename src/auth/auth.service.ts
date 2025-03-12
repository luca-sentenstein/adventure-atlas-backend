import { Injectable, Post, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/user/user.entity";
import { UserService } from "src/user/user.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
    ) {}

    
    async validateUser(username: string, password: string): Promise<any> {
        const user = await this.userService.readOneByUsername(username);

        console.log("Username: " + username); // Log the found user
        if (user && (await bcrypt.compare(password, user.password))) {
            const { password, ...result } = user; // Exclude password from the result
            return result; // Return user data if validation is successful
        }
        return null;
    }

    async login(user: User) {
        const payload = { username: user.userName, id: user.id };      
        return this.jwtService.sign(payload)
    }
}
