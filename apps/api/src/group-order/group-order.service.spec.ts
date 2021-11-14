import { Test, TestingModule } from '@nestjs/testing';
import { GroupOrderService } from './group-order.service';

describe('GroupOrderService', () => {
  let service: GroupOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupOrderService],
    }).compile();

    service = module.get<GroupOrderService>(GroupOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
