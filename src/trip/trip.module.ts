import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripAccess } from './trip-access.entity';
import { TripAccessService } from './trip-access.service';
import { TripStage } from './trip-stage.entity';
import { TripController } from './trip.controller';
import { Trip } from './trip.entity';
import { TripService } from './trip.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, TripStage, TripAccess])],
  controllers: [TripController],
  providers: [TripService, TripAccessService],
  exports: [TripService, TripAccessService],
})
export class TripModule {}
