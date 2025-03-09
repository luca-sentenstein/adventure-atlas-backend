import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TripModule } from "./trip/trip.module";
import { UserModule } from "./user/user.module";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: "sqlite",
            database: "db.sqlite",
            entities: [],
            autoLoadEntities: true,
            synchronize: true,
        }),
        TripModule,
        UserModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements OnModuleInit {
    constructor() {}

    async onModuleInit() {}
}
