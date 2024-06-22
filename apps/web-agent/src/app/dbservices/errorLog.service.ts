import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorLog } from '../models/errorLog.model';

@Injectable()
export class ErrorLogService {
  constructor(
    @InjectRepository(ErrorLog)
    private errorLogRepository: Repository<ErrorLog>,
  ) {}

  async createOrderTransaction(orderData){
    const newOrderTransaction = this.errorLogRepository.create(orderData);
    return this.errorLogRepository.save(newOrderTransaction);
  }

  async findAll(): Promise<ErrorLog[]> {
    return this.errorLogRepository.find();
  }

  async findOne(id): Promise<ErrorLog> {
    return this.errorLogRepository.findOne({where:id});
  }

  async updateOrderTransaction(order_id, updateData: Partial<ErrorLog>): Promise<void> {
    await this.errorLogRepository.update(order_id, updateData);
  }

  async remove(id: number): Promise<void> {
    await this.errorLogRepository.delete(id);
  }
}
