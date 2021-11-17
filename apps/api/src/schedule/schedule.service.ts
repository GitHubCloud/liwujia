import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { GroupOrderService } from '../group-order/group-order.service';

@Injectable()
export class ScheduleService {
  constructor(private readonly groupOrderService: GroupOrderService) {}

  @Interval(60000)
  async checkGroupOrderStatus() {
    this.groupOrderService.updateOvertimeStatus();
  }
}
