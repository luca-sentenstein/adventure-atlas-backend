import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Trip } from "./trip.entity";
import { In, Repository } from "typeorm";
import { TripStage } from "./trip-stage.entity";
import { Waypoint } from "./waypoint.entity";
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { TripAccessService } from './trip-access.service';

@Injectable()
export class TripService {
    constructor(
        @InjectRepository(Trip)
        private tripsRepository: Repository<Trip>,
        @InjectRepository(TripStage)
        private tripStageRepository: Repository<TripStage>,
        private readonly userService: UserService,
        private readonly tripAccessService: TripAccessService
    ) {}

    async createTrip(userId: number, tripData: Partial<Trip>): Promise<void> {
        // Fetch the user from the database
        const partialUser = await this.userService.readOneById(userId);
        if (!partialUser) {
            throw new Error("User not found");
        }

        // Create a new User instance
        const user = new User();
        Object.assign(user, partialUser); // Copy properties from partialUser to user

        console.log(user);
        // Assign the user instance to the trip's owner
        tripData.owner = user;

        // Create the trip
        await this.create(tripData); // Assuming this.create is the method to save the trip
    }

    async insertMultipleLocations(
        tripId: number,
        stageId: number,
        waypoints: Waypoint[],
    ): Promise<void> {
        const stageData = await this.tripStageRepository.findOne({
            where: { id: stageId }, // Assuming 'id' is the primary key of TripStage
            relations: { waypoints: true }, // Ensure locations are loaded
        });

        if (!stageData) {
            throw new Error(`TripStage with ID ${stageId} not found`);
        }

        const trip = await this.readOne(tripId);
        if (!trip) {
            throw new Error("Trip not found");
        }
        console.log("tripId: " + tripId + " stageId: " + stageId);
        console.log(typeof waypoints); // "number"
        console.log(waypoints);

        // add all locations to stage
        stageData.waypoints = waypoints;

        // Save the TripStage
        await this.tripStageRepository.save(stageData);

        // Add the updated TripStage to the Trip
        trip.stages.push(stageData);
        //await this.create(trip);
    }

    async createStage(
        tripId: number,
        stageData: Partial<TripStage>,
    ): Promise<TripStage> {
        const trip = await this.readOne(tripId);
        if (!trip) {
            throw new Error("Trip not found");
        }

        const newStage = this.tripStageRepository.create(stageData);
        trip.stages.push(newStage);
        await this.create(trip);

        return newStage;
    }

    async create(trip: Partial<Trip>): Promise<Trip> {
        return await this.tripsRepository.save(trip);
    }

    async readOne(id: number): Promise<Trip | null> {
        return await this.tripsRepository.findOne({
            where: { id },
            relations: {
                owner: true,
                stages: { waypoints: true },
            },
            select: {
                owner: {
                    id: true, // Only select the owner's id
                },
            },
        });
    }

    // get all public trips
    async readAllPublicTrips(): Promise<Trip[]> {
        return await this.tripsRepository.find({
            where: { public: true },
            relations: {
                owner: true,
                stages: { waypoints: true },
            },
            select: {
                owner: {
                    id: true, // Only select the owner's id
                },
            },
        });
    }




    // get all trips by tripid list
    async readByIds(tripIds: number[]): Promise<Trip[]> {
        return await this.tripsRepository.find({
            where: { id: In(tripIds) },
            relations: {
                owner: true,
                stages: { waypoints: true },
            },
            select: {
                owner: {
                    id: true, // Only select the owner's id
                    userName: true,
                },
            },
        });
    }

    async getTripsByOwner(userId: number): Promise<Trip[]> {
        return await this.tripsRepository.find({
            where: [
                { owner: { id: userId } }, // Trips owned by the user
            ],
            relations: {
                owner: true,
                stages: { waypoints: true },
            },
            select: {
                owner: {
                    id: true, // Only include the owner's id
                },
            },
        });
    }


    async isOwner(userId: number, tripId: number): Promise<boolean> {
        const trip = await this.tripsRepository.findOne({
            where: {id: tripId},
            relations: {owner: true},
        });

        if (!trip || !trip.owner) {
            return false;
        }

        return trip.owner.id === userId;
    }

    async update(id: number, trip: Partial<Trip>) {
        trip.updatedAt = new Date();
        return await this.tripsRepository.update(id, trip);
    }

    async deleteStage(id: number): Promise<void> {



            // Delete the tripStage
            await this.tripStageRepository.delete(id);

    }

    async deleteTrip(id: number): Promise<void> {
        console.log("delete trip with id: " + id);

        // Find and delete all related TripStages for the Trip
        const tripStages = await this.tripStageRepository.find({
            where: {trip: {id}}, // Assuming trip is a relation in TripStage
        });

        if (tripStages?.length) {
            for (const tripStage of tripStages) {
                await this.tripStageRepository.delete(tripStage.id);
            }
        }

        // Finally, delete the Trip itself
        await this.tripsRepository.delete(id);
    }


    doesUserHaveRightsToUpdateAccess(request: Request, tripId): boolean {
        const userId = this.extractUserId(request)
        // Rights to set trip access
            if (!(this.isOwner(userId, tripId)))
                throw new UnauthorizedException()
        return true;
    }

    doesUserHaveRightsToEditTrip(request: Request, tripId): boolean {
        const userId = this.extractUserId(request)
            // User has Access by Tripaccess write
            if(!(this.tripAccessService.isWriteAccess(userId, tripId)))
                throw new UnauthorizedException()
            // User has Access by Tripaccess write
            if (!(this.isOwner(userId, tripId)))
                throw new UnauthorizedException()
        return true;
    }

    extractUserId(request: Request): number {
        const userId = (request as { user?: { id?: number } }).user?.id; // Assuming 'id' is the user ID in the JWT payload
        if (!userId)
            throw new NotFoundException("User ID not found in token");
        return userId;
    }
}
