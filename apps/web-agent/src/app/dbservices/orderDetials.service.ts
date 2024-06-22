import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderDetails } from '../models/orderDetails.model';

@Injectable()
export class OrderTransactionService {
  constructor(
    @InjectRepository(OrderDetails)
    private orderTransactionRepository: Repository<OrderDetails>,
  ) {}

  async createOrderTransaction(orderData){
    const newOrderTransaction = this.orderTransactionRepository.create(orderData);
    return this.orderTransactionRepository.save(newOrderTransaction);
  }

  async findAll(): Promise<OrderDetails[]> {
    return this.orderTransactionRepository.find();
  }

  async findOne(condition): Promise<OrderDetails> {
    return this.orderTransactionRepository.findOne({where:condition});
  }

  async updateOrderTransaction(order_id, updateData: Partial<OrderDetails>): Promise<void> {
    await this.orderTransactionRepository.update(order_id, updateData);
  }

  async remove(condition): Promise<void> {
    await this.orderTransactionRepository.delete(condition);
  }
}
