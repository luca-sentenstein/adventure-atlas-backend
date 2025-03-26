import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
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
    constructor(private readonly userService: UserService,) {}

    extractUserId(request: Request): number {
        const userId = (request as { user?: { id?: number } }).user?.id; // Assuming 'id' is the user ID in the JWT payload
        if (!userId)
            throw new NotFoundException("User ID not found in token");
        return userId;
    }

    // User did register
    // create a whole user
    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    async createUser(@Body() user: User): Promise<any | null | undefined> {
        // Create the user
        return await this.userService.create(user);
    }

    // User changes his data (everything changeable except the id)
    @UseGuards(JwtAuthGuard)
    @Patch()
    async updateUser(
        @Req() request: Request,
        @Body() user: User,
    ): Promise<UpdateResult | null | undefined> {
        const userId = this.extractUserId(request);
        // Update the user
        return await this.userService.update(userId, user);
    }

    // After successful login
    // get all user data
    @UseGuards(JwtAuthGuard)
    @Get()
    async getUserById(@Req() request: Request): Promise<Partial<User> | null | undefined> {
        const userId = this.extractUserId(request);
        const user = await this.userService.readOneById(userId);
        if (user) return user;
        else throw new NotFoundException();
    }

    @UseGuards(JwtAuthGuard)
    @Delete()
    async deleteUser(@Req() request: Request): Promise<void> {
        const userId = this.extractUserId(request);
        await this.userService.delete(userId);
    }


}
