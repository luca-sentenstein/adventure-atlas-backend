import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MyConfigService } from "./config/config.service";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Access the ConfigService
    //const configService = app.get(MyConfigService);

    console.log(process.env.JWT_SECRET);
    console.log(process.env.JWT_VALID);
    /*
    console.log(configService.databaseHost);
    console.log(configService.databasePort);
    console.log(configService.jwtSecret);
    */

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
