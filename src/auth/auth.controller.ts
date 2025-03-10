import {
    Body,
    Controller,
    Post,
    Request,
    UnauthorizedException,
    UseGuards,
} from "@nestjs/common";
import { User } from "src/user/user.entity";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./local-auth.guard";
import { UserModule } from "src/user/user.module";
import { UserService } from "src/user/user.service";

@Controller("auth")
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) {}

    @UseGuards(LocalAuthGuard)
    @Post("login")
    async login(@Body() user: User): Promise<string> {
        console.log("login Controller --> Username: " + user.userName);
        const user1 = await this.userService.readOneByUsername(user.userName);
        if (!user1) throw UnauthorizedException;
        return this.authService.login(user1); // Return the generated token
    }
}
