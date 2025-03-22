import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MyConfigService {
    constructor(private configService: ConfigService) {}

    get frontendHost(): string | undefined {
        return this.configService.get<string>("CORS_FRONTEND_HOST");
    }

    get frontendPort(): number | undefined {
        return this.configService.get<number>("CORS_FRONTEND_PORT");
    }

    get backendHost(): string | undefined {
        return this.configService.get<string>("BACKEND_HOST");
    }

    get backendPort(): number | undefined {
        return this.configService.get<number>("BACKEND_PORT");
    }

    get jwtSecret(): string | undefined {
        return this.configService.get<string>("JWT_SECRET");
    }

    get jwtSecretValidTime(): string | undefined {
        return this.configService.get<string>("JWT_VALID");
    }
}
