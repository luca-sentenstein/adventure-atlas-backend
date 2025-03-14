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
        console.log(locations); // "number"

        // add all locations to stage
        stageData.locations = locations;

        // Save the TripStage
        const newStage = await this.tripStageRepository.save(stageData);

        // Add the updated TripStage to the Trip
        //trip.stages.push(stageData);
        //await this.create(trip);
    }

    async createStage(
        tripId: number,
        stageData: Omit<TripStage, "locations"> & Partial<TripStage>,
    ): Promise<TripStage> {
        const trip = await this.readOne(tripId);
        if (!trip) {
            throw new Error("Trip not found");
        }

        //const newStage = this.tripStageRepository.create(stageData);
        trip.stages.push({ locations: [], ...stageData });
        const updatedTrip = await this.create(trip);
        return updatedTrip.stages[updatedTrip.stages.length - 1];
    }

    async create(trip: Partial<Trip>): Promise<Trip> {
        return await this.tripsRepository.save(trip);
    }

    async readOne(id: number): Promise<Trip | null> {
        const trip = await this.tripsRepository.findOne({
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
        return trip;
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

    async update(id: number, data: Partial<Trip>) {
        return await this.tripsRepository.update(id, data);
    }

    async delete(id: number): Promise<void> {
        await this.tripsRepository.delete(id);
    }
}
