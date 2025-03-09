import {
    BadRequestException,
    Body,
    ConflictException,
    Controller,
    Get,
    InternalServerErrorException,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { TripService } from "./trip.service";
import { Trip } from "./trip.entity";
import { EntityPropertyNotFoundError } from "typeorm";
import { TripStage } from "./trip-stage.entity";
import { Location } from "./location.entity";

@Controller("trip")
export class TripController {
    constructor(private readonly tripService: TripService) {}

    // User starts creating trip, create base trip first
    // create a whole trip
    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    async createTrip(
        @Body() trip: Partial<Trip>,
    ): Promise<any | null | undefined> {
        try {
            // Create the trip
            return await this.tripService.create(trip);
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    // create a stage without the route
    @Post(":id/newStage")
    @UsePipes(new ValidationPipe({ transform: true }))
    async createStage(
        @Param("id", ParseIntPipe) id1: number,
        @Body() tripStage: Partial<TripStage>,
    ): Promise<any | null | undefined> {
        try {
            // Create the trip
            return await this.tripService.createStage(id1, tripStage);
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    // create a stage without the route
    @Post(":tripId/stages/:stageId/locations")
    @UsePipes(new ValidationPipe({ transform: true }))
    async createLocations(
        @Param("tripId", ParseIntPipe) tripId: number,
        @Param("stageId", ParseIntPipe) stageId: number,
        @Body() locations: Location[],
    ): Promise<void> {
        try {
            // Create the trip
            await this.tripService.insertMultipleLocations(tripId, stageId, locations);
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    // create a stage without the route
    @Patch(":id/newStage")
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateStage(
        @Param("id", ParseIntPipe) id1: number,
        @Body() tripStage: Partial<TripStage>,
    ): Promise<any | null | undefined> {
        try {
            // Create the trip
            return await this.tripService.createStage(id1, tripStage);
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }


    // get all trip data (open trip site)
    @Get(":id")
    async getTrip(
        @Param("id", ParseIntPipe) id: number,
    ): Promise<Trip | null | undefined> {
        try {
            let trip = await this.tripService.readOne(id);
            if (trip) {
                return trip;
            } else throw new NotFoundException();
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    exceptionHandler(ex: any) {
        // no break needed because exception (The adequate HTTP error is returned)
        switch (true) {
            case ex instanceof EntityPropertyNotFoundError:
                throw new BadRequestException(
                    "The JSON data format is invalid. " + ex.message,
                );
            case ex instanceof ConflictException:
                throw new ConflictException(
                    "The " + ex.message + " already exists.",
                );
            case ex instanceof NotFoundException:
                throw new NotFoundException("The Trip does not exist.");
            default:
                // Handle other types of errors, someone can crash the server otherwise!
                throw new InternalServerErrorException(
                    "An unexpected error occurred: " + ex.message,
                );
        }
    }
}
