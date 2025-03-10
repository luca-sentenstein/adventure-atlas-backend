import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { LocalStrategy } from "./local.strategy";
import { UserModule } from "src/user/user.module";
import { JwtStrategy } from "./jwt.strategy";

@Module({
    imports: [
        UserModule,
        PassportModule,
        JwtModule.register({
            secret: 'your_default_secret',
            signOptions: { expiresIn: "60m" },
        }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    controllers: [AuthController],
    exports: [],
})
export class AuthModule {}
