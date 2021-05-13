import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Banner } from './entities/banner.entity';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepo: Repository<Banner>,
  ) {}

  async create(createBannerDto: CreateBannerDto): Promise<Banner> {
    return await this.bannerRepo.save(this.bannerRepo.create(createBannerDto));
  }

  async findAll(): Promise<Banner[]> {
    return await this.bannerRepo.find({
      order: { order: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Banner> {
    return await this.bannerRepo.findOne(id);
  }

  async update(id: number, updateBannerDto: UpdateBannerDto) {
    return await this.bannerRepo.update(id, updateBannerDto);
  }

  async remove(id: number) {
    return await this.bannerRepo.delete(id);
  }
}
