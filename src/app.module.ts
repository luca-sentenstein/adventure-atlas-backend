import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { inspect } from 'node:util';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TripAccess } from './trip/trip-access.entity';
import { TripStage } from './trip/trip-stage.entity';
import { Trip } from './trip/trip.entity';
import { User } from './user/user.entity';
import { TripAccessService } from './trip/trip-access.service';
import { TripModule } from './trip/trip.module';
import { TripService } from './trip/trip.service';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
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
  constructor(
    private tripService: TripService,
    private userService: UserService,
    private tripAccessService: TripAccessService,
  ) {}

  async onModuleInit() {
    // Example program run. Use command "rm -f db.sqlite && npm run start" to run with a clean database
    const user = new User();
    user.firstName = 'Max';
    user.lastName = 'Mustermann';
    user.userName = 'm-m';
    user.email = 'm@m.de';
    user.passwordHash =
      '$2y$10$dcIRlr4MY7NQhDXzZf6snuXyIjQB3VgJzPnJG/wAwq7HksEEaMlD2'; // "password"
    const { id: userId } = await this.userService.create(user);

    const stage = new TripStage();
    stage.title = 'stage1';
    stage.picture = Buffer.from([]);
    stage.displayRoute = false;
    stage.cost = 100;
    stage.route = [{ x: 12, y: 22 }];

    const trip = new Trip();
    trip.title = 'example trip';
    trip.description = 'example description';
    trip.owner = user;
    trip.stages = [stage];

    const { id: tripId } = await this.tripService.create(trip);

    const access = new TripAccess();
    access.trip = trip;
    access.user = user;
    access.accessLevel = 'write';
    const { id: tripAccessId } = await this.tripAccessService.create(access);

    const userRead = await this.userService.readOne(userId);
    console.log(inspect(userRead, true, 10, true));

    const tripRead = await this.tripService.readOne(tripId);
    console.log(inspect(tripRead, true, 10, true));

    const tripAccessRead = await this.tripAccessService.readOne(tripAccessId);
    console.log(inspect(tripAccessRead, true, 10, true));
  }
}
