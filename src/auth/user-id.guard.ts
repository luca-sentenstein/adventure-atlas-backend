import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Injectable()
export class UserIdGuard extends JwtAuthGuard implements CanActivate {
    private readonly paramName: string;

    constructor(paramName: string) {
        super();
        this.paramName = paramName; // Store the parameter name to check against
    }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest(); // Get the request object
        const user = request.user; // This should be populated by the JWT strategy
        const userIdFromParam = request.params[this.paramName]; // Get the user ID from the specified parameter

        // Check if the user object is defined and if the user ID from the JWT matches the user ID in the URL
        if (!user || user.id !== userIdFromParam) {
            throw new ForbiddenException(
                "You do not have permission to access this resource",
            );
        }
        return true; // Allow access if the IDs match
    }
}
