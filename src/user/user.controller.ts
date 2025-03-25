import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { User } from "./user.entity";
import { UpdateResult } from "typeorm";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

// format validation: User object must have the correct members (No malformed json)
@Controller("user")
export class UserController {
    constructor(private readonly userService: UserService) {}

    // User did register
    // create a whole user
    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    async createUser(@Body() user: User): Promise<any | null | undefined> {
        // Create the user
        return await this.userService.create(user);

    }

    @UseGuards(JwtAuthGuard)
    @Delete()
    async deleteUser(@Req() request: Request): Promise<void> {
        const userId = (request as any).user?.id; // Assuming 'sub' is the user ID in the JWT payload

        if (!userId) {
            throw new NotFoundException('User ID not found in token');
        }
        await this.userService.delete(userId);
    }

    // After successful login
    // get all user data
    //@UseGuards(JwtAuthGuard, new UserIdGuard('id'))// Apply the JWT guard
    @UseGuards(JwtAuthGuard)
    @Get()
    async getUserById(@Req() request: Request): Promise<Partial<User> | null | undefined> {
        const userId = (request as any).user?.id; // Assuming 'sub' is the user ID in the JWT payload

        if (!userId) {
            throw new NotFoundException('User ID not found in token');
        }
        const user = await this.userService.readOneById(userId);
        if (user) return user;
        else throw new NotFoundException();

    }

    // User changes his data (everything changeable except the id)
    @Patch(":id")
    async updateUser(
        @Param("id", ParseIntPipe) id: number,
        @Body() user: User,
    ): Promise<UpdateResult | null | undefined> {
            // Update the user
            return await this.userService.update(id, user);
    }


}
