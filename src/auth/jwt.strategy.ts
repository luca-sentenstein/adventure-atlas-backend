import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: "your_default_secret",
        });
        console.log("JWT Strategy initialized"); // Log to confirm initialization
    }

    async validate(payload: any) {
        // Here you can add additional validation logic if needed
        console.log("JWT Payload:", JSON.stringify(payload, null, 2)); // Log the payload as a JSON string
        return { id: payload.id }; // Ensure this returns the user object correctly
    }
}
