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
        UserModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements OnModuleInit {
    constructor() {}

    async onModuleInit() {
        // Check if the first user does not exist
        //if (!(await this.userService.readOne(1)))
        //   await this.exampleDataGeneration(); // fill database with example date when there is none
    }

    /*
    async exampleDataGeneration() {
        const user = new User();
        user.firstName = "Max";
        user.lastName = "Mustermann";
        user.userName = "m-m";
        user.email = "m@m.de";
        user.passwordHash =
            "$2y$10$dcIRlr4MY7NQhDXzZf6snuXyIjQB3VgJzPnJG/wAwq7HksEEaMlD2"; // "password"
        const  userid = await this.userService.create(user);

        const user1 = new User();
        user1.firstName = "Alice";
        user1.lastName = "Johnson";
        user1.userName = "alice_j";
        user1.email = "alice.johnson@example.com";
        user1.passwordHash =
            "$2y$10$dcIRlr4MY7NQhDXzZf6snuXyIjQB3VgJzPnJG/wAwq7HksEEaMlD2"; // "password"
        const user2id = await this.userService.create(user1);

        const user2 = new User();
        user2.firstName = "Bob";
        user2.lastName = "Smith";
        user2.userName = "bob_s";
        user2.email = "bob.smith@example.com";
        user2.passwordHash =
            "$2y$10$dcIRlr4MY7NQhDXzZf6snuXyIjQB3VgJzPnJG/wAwq7HksEEaMlD2"; // "password"
        const { id: userId2 } = await this.userService.create(user2);

        const user3 = new User();
        user3.firstName = "Charlie";
        user3.lastName = "Brown";
        user3.userName = "charlie_b";
        user3.email = "charlie.brown@example.com";
        user3.passwordHash =
            "$2y$10$dcIRlr4MY7NQhDXzZf6snuXyIjQB3VgJzPnJG/wAwq7HksEEaMlD2"; // "password"
        const user3id = await this.userService.create(user3);

        const user4 = new User();
        user4.firstName = "Diana";
        user4.lastName = "Wilson";
        user4.userName = "diana_w";
        user4.email = "diana.wilson@example.com";
        user4.passwordHash =
            "$2y$10$dcIRlr4MY7NQhDXzZf6snuXyIjQB3VgJzPnJG/wAwq7HksEEaMlD2"; // "password"
        const { id: userId4 } = await this.userService.create(user4);

        // trip stages
        const stage1 = new TripStage();
        stage1.title = "Stage 1: New York to Washington D.C.";
        stage1.picture = Buffer.from([]);
        stage1.displayRoute = true;
        stage1.cost = 200;
        stage1.route = [
            { x: -74.006, y: 40.7128 }, // New York City
            { x: -77.0364, y: 38.8951 }, // Washington D.C.
        ];

        const stage2 = new TripStage();
        stage2.title = "Stage 2: Washington D.C. to Philadelphia";
        stage2.picture = Buffer.from([]);
        stage2.displayRoute = true;
        stage2.cost = 150;
        stage2.route = [
            { x: -77.0364, y: 38.8951 }, // Washington D.C.
            { x: -75.1652, y: 39.9526 }, // Philadelphia
        ];

        const stage3 = new TripStage();
        stage3.title = "Stage 3: Philadelphia to Boston";
        stage3.picture = Buffer.from([]);
        stage3.displayRoute = true;
        stage3.cost = 250;
        stage3.route = [
            { x: -75.1652, y: 39.9526 }, // Philadelphia
            { x: -71.0589, y: 42.3601 }, // Boston
        ];

        const stage4 = new TripStage();
        stage4.title = "Stage 4: Boston to New York City";
        stage4.picture = Buffer.from([]);
        stage4.displayRoute = true;
        stage4.cost = 200;
        stage4.route = [
            { x: -71.0589, y: 42.3601 }, // Boston
            { x: -74.006, y: 40.7128 }, // New York City
        ];

        const trip = new Trip();
        trip.title = "Big city tour";
        trip.description = "example description";
        trip.owner = user;
        trip.stages = [stage1, stage2, stage3, stage4];

        const { id: tripId } = await this.tripService.create(trip);

        const access = new TripAccess();
        access.trip = trip;
        access.user = user;
        access.accessLevel = "write";
        const { id: tripAccessId } =
            await this.tripAccessService.create(access);

        const access2 = new TripAccess();
        access2.trip = trip;
        access2.user = user1;
        access2.accessLevel = "read";
        const { id: tripAccessId1 } =
            await this.tripAccessService.create(access2);

        const access3 = new TripAccess();
        access3.trip = trip;
        access3.user = user2;
        access3.accessLevel = "read";
        const { id: tripAccessId2 } =
            await this.tripAccessService.create(access2);

        const userRead = await this.userService.readOne(userId);
        console.log(inspect(userRead, true, 10, true));

        const tripRead = await this.tripService.readOne(tripId);
        console.log(inspect(tripRead, true, 10, true));

        const tripAccessRead =
            await this.tripAccessService.readOne(tripAccessId);
        console.log(inspect(tripAccessRead, true, 10, true));
    }
 } */
}
