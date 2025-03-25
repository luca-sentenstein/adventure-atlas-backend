import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { TripService } from "./trip.service";
import { Trip } from "./trip.entity";
import { TripStage } from "./trip-stage.entity";
import { Waypoint } from "./waypoint.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TripAccessService } from "./trip-access.service";
import { TripAccess, TripAccessDto } from "./trip-access.entity";

@Controller("trip")
export class TripController {
    constructor(
        private readonly tripService: TripService,
        private readonly tripAccessService: TripAccessService
    ) {
    }

    // set access of user for trip
    @UseGuards(JwtAuthGuard)
    @Post("access")
    async createTripAccess(
        @Req() request: Request,
        @Body() tripAccess: TripAccessDto,
    ): Promise<TripAccess | undefined | null> {
        this.tripAccessService.doesUserHaveRightsToEditTrip(request, tripAccess.trip);
        // find id of user in tripAccess by username
        // find out if user has write access on trip, else throw unauthorized
        // only owner can set read write
        return await this.tripAccessService.create(tripAccess);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(":tripId")
    async updateTrip(
        @Req() request: Request,
        @Param("tripId", ParseIntPipe) tripId: number,
        @Body() trip: Partial<Trip>,
    ): Promise<void> {
        this.tripAccessService.doesUserHaveRightsToEditTrip(request, tripId);
        await this.tripService.update(tripId, trip);
    }

    // set access of user for trip
    @UseGuards(JwtAuthGuard)
    @Delete("access/:tripAccessId")
    async deleteTripAccess(
        @Req() request: Request,
        @Param("tripAccessId", ParseIntPipe) tripAccessId: number,
        @Body() tripAccess: TripAccess,
    ): Promise<void> {
        this.tripAccessService.doesUserHaveRightsToUpdateAccess(request, tripAccessId);
        await this.tripAccessService.removeTripAccess(request, tripAccessId);
    }


    // get all public trips
    @Get("discover")
    async getAllPublicTrips(): Promise<Trip[] | null | undefined> {
        return await this.tripService.readAllPublicTrips();
    }

    // get all trips by user id
    @UseGuards(JwtAuthGuard)
    @Get()
    async getTripsByAccess(
        @Req() request: Request,
    ): Promise<Trip[] | null | undefined> {
        return await this.tripAccessService.readTripsByAccess(request);
    }


    // User starts creating trip, create base trip first
    // create a whole trip
    @UseGuards(JwtAuthGuard)
    @Post()
    @UsePipes(new ValidationPipe({transform: true}))
    async createTrip(@Req() request: Request, @Body() trip: Partial<Trip>): Promise<Trip> {
        const userId = this.tripAccessService.extractUserId(request);
        return await this.tripService.createTrip(userId, trip);
    }

    // delete trip
    @UseGuards(JwtAuthGuard)
    @Delete(":id")
    async deleteTrip(@Req() request: Request,
                     @Param("id", ParseIntPipe) tripId: number,): Promise<void> {
        this.tripAccessService.doesUserHaveRightsToEditTrip(request, tripId);
        // delete trip
        await this.tripService.deleteTrip(tripId);
    }

    // delete trip
    @UseGuards(JwtAuthGuard)
    @Delete(":tripId/stages/:stageId")
    async deleteStage(@Req() request: Request,
                      @Param("tripId", ParseIntPipe) tripId: number,
                      @Param("stageId", ParseIntPipe) stageId: number,): Promise<void> {
        this.tripAccessService.doesUserHaveRightsToEditTrip(request, tripId);
        // delete stage
        await this.tripService.deleteStage(stageId);
    }


    // create a stage without the route
    @Post(":tripId/newStage")
    @UsePipes(new ValidationPipe({transform: true}))
    async createStage(
        @Req() request: Request,
        @Param("tripId", ParseIntPipe) tripId: number,
        @Body() tripStage: Partial<TripStage>,
    ): Promise<void> {
        this.tripAccessService.doesUserHaveRightsToEditTrip(request, tripId);
        await this.tripService.createStage(tripId, tripStage);
    }

    // create locations of a stage
    @UseGuards(JwtAuthGuard)
    @Post(":tripId/stages/:stageId/locations")
    @UsePipes(new ValidationPipe({transform: true}))
    async createLocations(
        @Req() request: Request,
        @Param("tripId", ParseIntPipe) tripId: number,
        @Param("stageId", ParseIntPipe) stageId: number,
        @Body() waypoints: Waypoint[],
    ): Promise<void> {
        this.tripAccessService.doesUserHaveRightsToEditTrip(request, tripId);
        // Create the locations inside the stage and save stage so relations in db are correct
        await this.tripService.insertMultipleLocations(
            tripId,
            stageId,
            waypoints,
        );
    }

    // update a stage without the locations, just basic information like description etc.
    @UseGuards(JwtAuthGuard)
    @Patch(":tripId/newStage")
    @UsePipes(new ValidationPipe({transform: true}))
    async updateStage(
        @Req() request: Request,
        @Param("tripId", ParseIntPipe) tripId: number,
        @Body() tripStage: Partial<TripStage>,
    ): Promise<void> {
        this.tripAccessService.doesUserHaveRightsToEditTrip(request, tripId)
        // Create the stage
        await this.tripService.createStage(tripId, tripStage);
    }
}
