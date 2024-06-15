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

  async findOne(id): Promise<OrderDetails> {
    return this.orderTransactionRepository.findOne(id);
  }

  async updateOrderTransaction(order_id: string, updateData: Partial<OrderDetails>): Promise<void> {
    await this.orderTransactionRepository.update({ order_id }, updateData);
  }

  async remove(id: number): Promise<void> {
    await this.orderTransactionRepository.delete(id);
  }
}
