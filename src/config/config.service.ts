import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MyConfigService {
    constructor(private configService: ConfigService) {}

    get databaseHost(): string | undefined {
        return this.configService.get<string>("DATABASE_HOST");
    }

    get databasePort(): number | undefined {
        return this.configService.get<number>("DATABASE_PORT");
    }

    get jwtSecret(): string | undefined {
        return this.configService.get<string>("JWT_SECRET");
    }

    get jwtSecretValidTime(): string | undefined {
        return this.configService.get<string>("JWT_VALID");
    }
}
