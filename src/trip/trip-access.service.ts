import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TripAccess } from './trip-access.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TripAccessService {
  constructor(
    @InjectRepository(TripAccess)
    private tripAccessRepository: Repository<TripAccess>,
  ) {}

  async create(tripAccess: TripAccess): Promise<TripAccess> {
    return await this.tripAccessRepository.save(tripAccess);
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
}
