import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MyConfigService } from "./config/config.service";
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
        .setTitle('AdventureAtlas-Backend')
        .setDescription('This is a overview of the backend API-Endpoints for the AdventureAtlas application')
        .setVersion('1.0')
        .addTag('api-doc')
        .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);

    // Access the ConfigService
    const configService = app.get(MyConfigService);

    app.enableCors({
        origin: "http://" + configService.frontendHost + ":" + configService.frontendPort,
        methods: "GET, PATCH, POST, DELETE",
        allowedHeaders: ["Content-Type", "Authorization"]
    });

    app.use(bodyParser.json({ limit: '50mb' })); // Adjust the limit as needed
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    await app.listen(configService.backendPort ?? 3000);
}

bootstrap();
