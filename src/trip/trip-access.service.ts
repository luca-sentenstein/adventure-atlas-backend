import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TripAccess } from "./trip-access.entity";
import { In, Repository } from "typeorm";
import { Trip } from "./trip.entity";

@Injectable()
export class TripAccessService {
    constructor(
        @InjectRepository(TripAccess)
        private tripAccessRepository: Repository<TripAccess>,
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

    async create(tripAccess: TripAccess): Promise<TripAccess> {
        //return await this.tripAccessRepository.save(tripAccess);
        // Step 1: Check for existing entry
        const existingEntry = await this.tripAccessRepository.findOne({
            where: { user: { id: tripAccess.user.id }, trip: { id: tripAccess.trip.id } },
        });

        if (existingEntry) {
            // Step 2: Update the existing entry
            existingEntry.user = tripAccess.user; // Update fields as necessary
            existingEntry.trip = tripAccess.trip;
            existingEntry.accessLevel = tripAccess.accessLevel;
            // Add any other fields you want to update

            return await this.tripAccessRepository.save(existingEntry);
        } else {
            // Step 3: Create a new entry
            return await this.tripAccessRepository.save(tripAccess);
        }
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
        return this.tripAccessRepository.findOne({ where: { user: { id: userId }, trip: { id: tripId } } });
    }

    async isWriteAccess(userId: number, tripId: number): Promise<boolean> {
        const tripaccess = await this.findByUserAndTrip(userId, tripId)
        if (!tripaccess)
            return false;
        return tripaccess.accessLevel == "write";
    }
}
