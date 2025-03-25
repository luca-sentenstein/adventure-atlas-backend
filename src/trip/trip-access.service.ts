import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TripAccess, TripAccessDto } from "./trip-access.entity";
import { FindOneOptions, In, Repository } from "typeorm";
import { Trip } from "./trip.entity";
import { UserService } from '../user/user.service';
import { TripService } from './trip.service';


@Injectable()
export class TripAccessService {
    constructor(
        @InjectRepository(TripAccess)
        private tripAccessRepository: Repository<TripAccess>,
        private readonly userService: UserService,
        private readonly tripService: TripService,
    ) {}


    extractUserId(request: Request): number {
        const userId = (request as { user?: { id?: number } }).user?.id; // Assuming 'id' is the user ID in the JWT payload
        if (!userId)
            throw new NotFoundException("User ID not found in token");
        return userId;
    }

    async readTripsByAccess(request: Request): Promise<Trip[]> {
        const userId = this.extractUserId(request)
        const userTripAccesses =
            await this.readAllByUserId(userId);

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
            await this.attachTripAccessesToTrips(trips);

        if (trips.length == 0) {
            throw new NotFoundException(
                "No trips found for the given trip accesses",
            );
        }
        if (trips) {
            return trips;
        } else throw new NotFoundException();
    }

    // get all tripIds that a user has access to (all table entries with userid)
    async readAllByUserId(id: number): Promise<TripAccess[]> {
        return await this.tripAccessRepository.find({
            where: {
                user: {id},
            },
            relations: {
                trip: true,
                user: true,
            },
        } as FindOneOptions<TripAccess>);
    }

    // get all the access of users on many trips
    async readAllAccessByTripIds(tripIds: number[]): Promise<TripAccess[]> {
        return await this.tripAccessRepository.find({
            where: {
                trip: { id: In(tripIds) },
            },
            relations: {
                trip: true,
                user: true,
            },
            select: {
                user: {
                    id: true,
                    userName: true,
                },
                trip: {
                    id: true,
                },
            },
        } as FindOneOptions<TripAccess>);
    }

    async attachTripAccessesToTrips(trips: Trip[]): Promise<Trip[]> {
        const tripIds = trips.map((trip) => trip.id);

        // Fetch all trip accesses for given trip IDs
        const tripAccesses = await this.readAllAccessByTripIds(tripIds);

        // Create a map of trip accesses by trip ID for quick lookup
        const tripAccessMap = tripAccesses.reduce(
            (acc: Record<number, TripAccess[]>, access: TripAccess) => {
                const tripId = access.trip.id;
                if (!acc[tripId]) {
                    acc[tripId] = [];
                }
                acc[tripId].push(access);
                return acc;
            },
            {},
        );

        // Attach trip accesses to each trip
        trips.forEach((trip) => {
            (trip as any).tripAccesses = tripAccessMap[trip.id] || [];
        });
        return trips;
    }


    async create(tripAccessDto: TripAccessDto): Promise<TripAccess | null> {
        // Dto is needed here, because Frontend has username and not userId
        const user = await this.userService.readOneByUsername(tripAccessDto.userName);
        if (!user)
            throw new NotFoundException()


        const trip = await this.tripService.readOne(tripAccessDto.trip);
        if (!trip)
            throw new NotFoundException()

        // Step 1: Check for existing entry
        const existingEntry = await this.tripAccessRepository.findOne({
            where: {user: {id: user.id}, trip: {id: tripAccessDto.trip}},
        } as FindOneOptions<TripAccess>);

        // This is the entity and not the Dto
        const tripAccess = new TripAccess();
        if (existingEntry) {
            // Step 2: Update the existing entry
            existingEntry.user = user; // Update fields as necessary
            existingEntry.trip = trip;
            existingEntry.accessLevel = tripAccessDto.accessLevel as "read" | "write";
            // Add any other fields you want to update

            await this.tripAccessRepository.save(existingEntry);

        } else {
            tripAccess.user = user; // Update fields as necessary
            tripAccess.trip = trip;
            tripAccess.accessLevel = tripAccessDto.accessLevel as "read" | "write";
            // Step 3: Create a new entry
            await this.tripAccessRepository.save(tripAccess);
        }
        return this.findByUserAndTrip(user.id, tripAccessDto.trip);
    }


    async readOne(id: number): Promise<TripAccess | null> {
        const result = await this.tripAccessRepository.find({
            where: { id },
            relations: {
                trip: true,
                user: true,
            },
        } as FindOneOptions<TripAccess>);
        return result ? result[0] : null;
    }

    async delete(id: number): Promise<void> {
        await this.tripAccessRepository.delete(id);
    }

    async removeTripAccess(request: Request, tripAccessId: number) {
        // find out if user has write access on trip, else throw unauthorized
        // only owner can set read write
        this.doesUserHaveRightsToUpdateAccess(request, tripAccessId);
        const tripAccess = await this.readOne(tripAccessId);
        // Find the tripAccess entry
        if (tripAccess) {
            await this.delete(tripAccessId);
        } else throw new NotFoundException();
    }

    async findByUserAndTrip(userId: number, tripId: number): Promise<TripAccess | null> {
        return this.tripAccessRepository.findOne({
            where: {user: {id: userId}, trip: {id: tripId}},
            relations: {
                trip: true,
                user: true,
            },
            select: {
                user: {
                    id: true,
                    userName: true// Only include the owner's id
                },
                trip: {
                    id: true, // Only include the owner's id
                },
            },
        } as FindOneOptions<TripAccess>);
    }

    async isWriteAccess(userId: number, tripId: number): Promise<boolean> {
        const tripAccess = await this.findByUserAndTrip(userId, tripId)
        if (!tripAccess)
            return false;
        return tripAccess.accessLevel == "write";
    }

    async isReadAccess(userId: number, tripId: number): Promise<boolean> {
        const tripAccess = await this.findByUserAndTrip(userId, tripId)
        if (!tripAccess)
            return false;
        return tripAccess.accessLevel == "read";
    }

    doesUserHaveRightsToEditTrip(request: Request, tripId): boolean {
        const userId = this.extractUserId(request)
        // User has Access by TripAccess write or right because he is the owner
        if(!(this.isWriteAccess(userId, tripId)))
            if (!(this.tripService.isOwner(userId, tripId)))
                throw new UnauthorizedException()
        return true;
    }

    doesUserHaveRightsToUpdateAccess(request: Request, tripId): boolean {
        const userId = this.extractUserId(request)
        // Rights to set trip access
        if (!(this.tripService.isOwner(userId, tripId)))
            throw new UnauthorizedException()
        return true;
    }
}
