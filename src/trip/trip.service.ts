import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Trip } from './trip.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
  ) {}

  async create(trip: Trip): Promise<Trip> {
    return await this.tripsRepository.save(trip);
  }

  // (!) Attention: If you use this api in production, implement a "where" filter
  async readAll(): Promise<Trip[]> {
    return await this.tripsRepository.find({
      relations: {
        owner: true,
        stages: true,
      },
    });
  }

  async readOne(id: number): Promise<Trip | null> {
    const result = await this.tripsRepository.find({
      where: { id },
      relations: {
        owner: true,
        stages: true,
      },
    });
    return result ? result[0] : null;
  }

  async update(id: number, data: Partial<Trip>) {
    return await this.tripsRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.tripsRepository.delete(id);
  }
}
