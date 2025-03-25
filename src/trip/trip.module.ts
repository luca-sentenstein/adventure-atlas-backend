import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Waypoint } from './waypoint.entity';
import { TripAccess } from './trip-access.entity';
import { TripAccessService } from './trip-access.service';
import { TripStage } from './trip-stage.entity';
import { TripController } from './trip.controller';
import { Trip } from './trip.entity';
import { TripService } from './trip.service';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';


@Module({
    imports: [TypeOrmModule.forFeature([Trip, TripStage, Waypoint,User,TripAccess])],
    controllers: [TripController],
    providers: [TripService, TripAccessService,UserService],
    exports: [TripService, TripAccessService,UserService],
})
export class TripModule {
}
