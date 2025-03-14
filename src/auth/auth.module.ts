import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { LocalStrategy } from "./local.strategy";
import { UserModule } from "src/user/user.module";
import { JwtStrategy } from "./jwt.strategy";
import { MyConfigService } from "src/config/config.service";
import { AppConfigModule } from "src/config/config.module";

@Module({
    imports: [
        UserModule,
        PassportModule,
        JwtModule.registerAsync({
          imports: [AppConfigModule],
          useFactory: async (configService: MyConfigService) => ({
            secret: configService.jwtSecret,
            signOptions: { expiresIn: configService.jwtSecretValidTime },
          }),
          inject: [MyConfigService],
        }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    controllers: [AuthController],
    exports: [],
})
export class AuthModule {}
