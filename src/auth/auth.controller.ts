import {
    Body,
    Controller,
    Post,
    UnauthorizedException,
    UseGuards,
} from "@nestjs/common";
import { User } from "src/user/user.entity";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./local-auth.guard";
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
        const userObject = await this.userService.readOneByUsername(user.userName);
        if (!userObject) throw UnauthorizedException;
        return this.authService.login(userObject); // Return the generated token
    }
}
