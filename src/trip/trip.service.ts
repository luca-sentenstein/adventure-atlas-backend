import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Trip } from "./trip.entity";
import { Repository } from "typeorm";
import { TripStage } from "./trip-stage.entity";
import { Location } from "./location.entity";

@Injectable()
export class TripService {
    constructor(
        @InjectRepository(Trip)
        private tripsRepository: Repository<Trip>,
        @InjectRepository(TripStage)
        private tripStageRepository: Repository<TripStage>,
    ) {}

    async insertMultipleLocations(
        tripId: number,
        stageId: number,
        locations: Location[],
    ): Promise<void> {
        const stageData = await this.tripStageRepository.findOne({
            where: { id: stageId }, // Assuming 'id' is the primary key of TripStage
            relations: { locations: true }, // Ensure locations are loaded
        });

        if (!stageData) {
            throw new Error(`TripStage with ID ${stageId} not found`);
        }

        const trip = await this.readOne(tripId);
        if (!trip) {
            throw new Error("Trip not found");
        }
        console.log("tripId: " + tripId + " stageId: " + stageId);
        console.log(typeof locations); // "number"
        console.log(locations);

        // add all locations to stage
        stageData.locations = locations;

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
                stages: { locations: true },
            },
            select: {
                owner: {
                    id: true, // Only select the owner's id
                },
            },
        });
    }

    // get all public trips
    async readAll(): Promise<Trip[]> {
        return await this.tripsRepository.find({
            where: { public: true },
            relations: {
                owner: true,
                stages: { locations: true },
            },
            select: {
                owner: {
                    id: true, // Only select the owner's id
                },
            },
        });
    }

    async getTripsByUserAccess(userId: number): Promise<Trip[]> {
        return await this.tripsRepository.find({
            where: [
                { owner: { id: userId } }, // Trips owned by the user
                { public: true }, // Public trips
            ],
            relations: {
                owner: true,
                stages: { locations: true },
            },
            select: {
                owner: {
                    id: true, // Only include the owner's id
                },
            },
        });
    }

    async update(id: number, data: Partial<Trip>) {
        return await this.tripsRepository.update(id, data);
    }

    async delete(id: number): Promise<void> {
        await this.tripsRepository.delete(id);
    }
}
