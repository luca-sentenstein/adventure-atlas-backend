import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TripAccess, TripAccessDto } from "./trip-access.entity";
import { In, Repository } from "typeorm";
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

    // get all tripids that a user has access to (all table entries with userid)
    async readAllByUserId(id: number): Promise<TripAccess[]> {
        return await this.tripAccessRepository.find({
            where: {
                user: {id},
            },
            relations: {
                trip: true,
                user: true,
            },
        });
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
        });
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

        console.log("userName:" + tripAccessDto.userName);
        //return await this.tripAccessRepository.save(tripAccess);
        const user = await this.userService.readOneByUsername(tripAccessDto.userName);
        if (!user) {
            throw new NotFoundException()
        }

        const trip = await this.tripService.readOne(tripAccessDto.trip);
        if (!trip) {
            throw new NotFoundException()
        }
        // Step 1: Check for existing entry
        const existingEntry = await this.tripAccessRepository.findOne({
            where: {user: {id: user.id}, trip: {id: tripAccessDto.trip}},
        });



        console.log(existingEntry);
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

    // (!) Attention: If you use this api in production, implement a "where" filter
    async readAll(): Promise<TripAccess[]> {
        return await this.tripAccessRepository.find({
            relations: {
                trip: true,
                user: true,
            },
        });
    }

    async readOne(id: number): Promise<TripAccess | null> {
        const result = await this.tripAccessRepository.find({
            where: { id },
            relations: {
                trip: true,
                user: true,
            },
        });
        return result ? result[0] : null;
    }

    async update(id: number, data: Partial<TripAccess>) {
        return await this.tripAccessRepository.update(id, data);
    }

    async delete(id: number): Promise<void> {
        await this.tripAccessRepository.delete(id);
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
            },// Lade die zugehörige User-Entität
        });
    }

    async isWriteAccess(userId: number, tripId: number): Promise<boolean> {
        const tripaccess = await this.findByUserAndTrip(userId, tripId)
        if (!tripaccess)
            return false;
        return tripaccess.accessLevel == "write";
    }

    doesUserHaveRightsToEditTrip(request: Request, tripId): boolean {
        const userId = this.tripService.extractUserId(request)
        // User has Access by Tripaccess write
        if(!(this.isWriteAccess(userId, tripId)))
            // throw new UnauthorizedException()
            // User has Access by Tripaccess write
            if (!(this.tripService.isOwner(userId, tripId)))
                throw new UnauthorizedException()
        return true;
    }



}
