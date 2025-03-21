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
    Req,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { TripService } from "./trip.service";
import { Trip } from "./trip.entity";
import { EntityPropertyNotFoundError } from "typeorm";
import { TripStage } from "./trip-stage.entity";
import { Location } from "./location.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TripAccessService } from "./trip-access.service";
import { TripAccess } from "./trip-access.entity";

@Controller("trip")
export class TripController {
    constructor(
        private readonly tripService: TripService,
        private readonly tripAccessService: TripAccessService,
    ) {}

    // get all public trips
    @Get("discover")
    async getAllPublicTrips(): Promise<Trip[] | null | undefined> {
        try {
            return await this.tripService.readAllPublicTrips();
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    // get all trips by user id
    @UseGuards(JwtAuthGuard)
    @Get()
    async getTripsByAccess(
        @Req() request: Request,
    ): Promise<Trip[] | null | undefined> {
        const userId = (request as { user?: { id?: number } }).user?.id; // Assuming 'id' is the user ID in the JWT payload

        if (!userId) {
            throw new NotFoundException("User ID not found in token");
        }
        try {
            const userTripAccesses =
                await this.tripAccessService.readAllByUserId(userId);

            // append all trips where user is owner to the trips with access
            const ownerTrips = await this.tripService.getTripsByOwner(userId);
            const ownerTripAccesses = ownerTrips.map((trip) => ({
                trip: trip,
                user: { id: userId },
            }));

            // Combine both TripAccess lists
            const combinedTripAccesses = [
                ...userTripAccesses,
                ...ownerTripAccesses,
            ];

            // Remove duplicates by filtering out unique trip IDs, there could be duplicates when owner and read or write access are the same.
            const uniqueTripAccesses = combinedTripAccesses.filter(
                (access, index, self) =>
                    index ===
                    self.findIndex((a) => a.trip.id === access.trip.id),
            );

            // fetch trips to tripIds
            // Fetch all the trips related to the trip accesses
            const tripIds = uniqueTripAccesses.map((access) => access.trip.id);
            console.log(tripIds);
            let trips = await this.tripService.readByIds(
                tripIds.map((id) => id),
            );

            trips =
                await this.tripAccessService.attachTripAccessesToTrips(trips);

            if (trips.length == 0) {
                throw new NotFoundException(
                    "No trips found for the given trip accesses",
                );
            }
            if (trips) {
                return trips;
            } else throw new NotFoundException();
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    // User starts creating trip, create base trip first
    // create a whole trip
    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    async createTrip(@Body() trip: Partial<Trip>): Promise<void> {
        try {
            // Create the trip
            await this.tripService.create(trip);
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    // set access of user for trip
    @UseGuards(JwtAuthGuard)
    @Post("access")
    async createTripAccess(
        @Req() request: Request,
        @Body() tripAccess: TripAccess,
    ): Promise<void> {
        const userId = (request as { user?: { id?: number } }).user?.id; // Assuming 'id' is the user ID in the JWT payload

        if (!userId) {
            throw new NotFoundException("User ID not found in token");
        }
        // find out if user has write access on trip, else throw unauthorized
        // only owner can set read write
        try {
            // Create the trip
            await this.tripAccessService.create(tripAccess);
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    // create a stage without the route
    @Post(":id/newStage")
    @UsePipes(new ValidationPipe({ transform: true }))
    async createStage(
        @Param("id", ParseIntPipe) id: number,
        @Body() tripStage: Partial<TripStage>,
    ): Promise<void> {
        try {
            // Create the trip
            await this.tripService.createStage(id, tripStage);
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    // create locations of a stage
    @Post(":tripId/stages/:stageId/locations")
    @UsePipes(new ValidationPipe({ transform: true }))
    async createLocations(
        @Param("tripId", ParseIntPipe) tripId: number,
        @Param("stageId", ParseIntPipe) stageId: number,
        @Body() locations: Location[],
    ): Promise<void> {
        try {
            // Create the locations inside the stage and save stage so relations in db are correct
            await this.tripService.insertMultipleLocations(
                tripId,
                stageId,
                locations,
            );
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    // create a stage without the locations, just basic information like description etc.
    @Patch(":id/newStage")
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateStage(
        @Param("id", ParseIntPipe) id: number,
        @Body() tripStage: Partial<TripStage>,
    ): Promise<void> {
        try {
            // Create the trip
            await this.tripService.createStage(id, tripStage);
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    // get data of trip (when opening trips)
    @Get(":id")
    async getTrip(
        @Param("id", ParseIntPipe) id: number,
    ): Promise<Trip | null | undefined> {
        try {
            const trip = await this.tripService.readOne(id);
            if (trip) {
                return trip;
            } else throw new NotFoundException();
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    exceptionHandler(ex: unknown) {
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
                throw new NotFoundException(ex.message);
            //throw new NotFoundException("The Trip does not exist.");
            default:
                // Handle other types of errors, someone can crash the server otherwise!
                throw new InternalServerErrorException(
                    "An unexpected error occurred: " +
                        (ex instanceof Error ? ex.message : String(ex)),
                );
        }
    }
}
