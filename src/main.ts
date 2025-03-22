import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MyConfigService } from "./config/config.service";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Access the ConfigService
    const configService = app.get(MyConfigService);

    app.enableCors({
        origin: "http://" + configService.frontendHost + ":" + configService.frontendPort,
        methods: "GET, PATCH, POST, DELETE",
        allowedHeaders: ["Content-Type", "Authorization"]
    })

    await app.listen(configService.backendPort ?? 3000);
}

bootstrap();
