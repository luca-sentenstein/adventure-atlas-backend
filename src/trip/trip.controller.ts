import {
    BadRequestException,
    Body,
    ConflictException,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UnauthorizedException,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { TripService } from "./trip.service";
import { Trip } from "./trip.entity";
import { EntityPropertyNotFoundError } from "typeorm";
import { TripStage } from "./trip-stage.entity";
import { Waypoint } from "./waypoint.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TripAccessService } from "./trip-access.service";
import { TripAccess, TripAccessDto } from "./trip-access.entity";

@Controller("trip")
export class TripController {
    constructor(
        private readonly tripService: TripService,
        private readonly tripAccessService: TripAccessService,
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
        // find id of user in tripaccess by username
        // find out if user has write access on trip, else throw unauthorized
        // only owner can set read write
        try {
            return await this.tripAccessService.create(tripAccess);
        } catch (ex) {
            this.exceptionHandler(ex);
        }

    }

    @UseGuards(JwtAuthGuard)
    @Patch(":tripId")
    async updateTrip(
        @Req() request: Request,
        @Param("tripId", ParseIntPipe) tripId: number,
        @Body() trip: Partial<Trip>,
    ): Promise<void> {
        this.tripAccessService.doesUserHaveRightsToEditTrip(request, tripId);
        try {
            await this.tripService.update(tripId, trip);
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    // set access of user for trip
    @UseGuards(JwtAuthGuard)
    @Delete("access/:tripAccessId")
    async deleteTripAccess(
        @Req() request: Request,
        @Param("tripAccessId", ParseIntPipe) tripAccessId: number,
        @Body() tripAccess: TripAccess,
    ): Promise<void> {
        await this.removeTripAccess(request, tripAccessId);
    }

    async removeTripAccess(request: Request, tripAccessId: number) {
        // find out if user has write access on trip, else throw unauthorized
        // only owner can set read write
        if (!(this.tripService.doesUserHaveRightsToUpdateAccess(request, tripAccessId))) {
            throw new UnauthorizedException()
        }
        const tripAccess = await this.tripAccessService.readOne(tripAccessId);
        // Step 1: Find the tripAccess entry
        if (tripAccess) {
            await this.tripAccessService.delete(tripAccessId);
        } else throw new NotFoundException();
    }

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
        const userId = this.tripService.extractUserId(request)
        try {
            const userTripAccesses =
                await this.tripAccessService.readAllByUserId(userId);

            // append all trips where user is owner to the trips with access
            const ownerTrips = await this.tripService.getTripsByOwner(userId);
            const ownerTripAccesses = ownerTrips.map((trip) => ({
                trip: trip,
                user: {id: userId},
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
    @UseGuards(JwtAuthGuard)
    @Post()
    @UsePipes(new ValidationPipe({transform: true}))
    async createTrip(@Req() request: Request, @Body() trip: Partial<Trip>): Promise<void> {
        try {
            const userId = this.tripService.extractUserId(request);
            await this.tripService.createTrip(userId, trip);
        } catch (ex) {
            this.exceptionHandler(ex);
        }
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
        this.tripService.doesUserHaveRightsToUpdateAccess(request, tripId);
        // delete stage
        await this.tripService.deleteStage(stageId);
    }


    // create a stage without the route
    @Post(":id/newStage")
    @UsePipes(new ValidationPipe({transform: true}))
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
    @UsePipes(new ValidationPipe({transform: true}))
    async createLocations(
        @Param("tripId", ParseIntPipe) tripId: number,
        @Param("stageId", ParseIntPipe) stageId: number,
        @Body() waypoints: Waypoint[],
    ): Promise<void> {
        try {
            // Create the locations inside the stage and save stage so relations in db are correct
            await this.tripService.insertMultipleLocations(
                tripId,
                stageId,
                waypoints,
            );
        } catch (ex) {
            this.exceptionHandler(ex);
        }
    }

    // create a stage without the locations, just basic information like description etc.
    @Patch(":id/newStage")
    @UsePipes(new ValidationPipe({transform: true}))
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
        console.log(ex);
        console.log(ex instanceof NotFoundException);
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
