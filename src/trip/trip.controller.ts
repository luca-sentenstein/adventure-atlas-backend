import {
    Body,
    Controller,
    Delete,
    Get,
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
        return await this.tripService.readAllPublicTrips();
    }

    // get all trips by user id
    @UseGuards(JwtAuthGuard)
    @Get()
    async getTripsByAccess(
        @Req() request: Request,
    ): Promise<Trip[] | null | undefined> {
        const userId = this.tripService.extractUserId(request)
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
        }


    // User starts creating trip, create base trip first
    // create a whole trip
    @UseGuards(JwtAuthGuard)
    @Post()
    @UsePipes(new ValidationPipe({transform: true}))
    async createTrip(@Req() request: Request, @Body() trip: Partial<Trip>): Promise<void> {
        const userId = this.tripService.extractUserId(request);
        await this.tripService.createTrip(userId, trip);
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
        await this.tripService.createStage(id, tripStage);

    }

    // create locations of a stage
    @Post(":tripId/stages/:stageId/locations")
    @UsePipes(new ValidationPipe({transform: true}))
    async createLocations(
        @Param("tripId", ParseIntPipe) tripId: number,
        @Param("stageId", ParseIntPipe) stageId: number,
        @Body() waypoints: Waypoint[],
    ): Promise<void> {
            // Create the locations inside the stage and save stage so relations in db are correct
            await this.tripService.insertMultipleLocations(
                tripId,
                stageId,
                waypoints,
            );
    }

    // create a stage without the locations, just basic information like description etc.
    @Patch(":id/newStage")
    @UsePipes(new ValidationPipe({transform: true}))
    async updateStage(
        @Param("id", ParseIntPipe) id: number,
        @Body() tripStage: Partial<TripStage>,
    ): Promise<void> {
            // Create the trip
            await this.tripService.createStage(id, tripStage);

    }

    // get data of trip (when opening trips)
    @Get(":id")
    async getTrip(
        @Param("id", ParseIntPipe) id: number,
    ): Promise<Trip | null | undefined> {

            const trip = await this.tripService.readOne(id);
            if (trip) {
                return trip;
            } else throw new NotFoundException();
    }
}
