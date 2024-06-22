import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderLineItems } from '../models/orderLineItems.model';

@Injectable()
export class OrderLineItemsService {
  constructor(
    @InjectRepository(OrderLineItems)
    private orderLineItemRepository: Repository<OrderLineItems>,
  ) {}

  async createOrderTransaction(orderData){
    const newOrderTransaction = this.orderLineItemRepository.create(orderData);
    return this.orderLineItemRepository.save(newOrderTransaction);
  }

  async findAll(): Promise<OrderLineItems[]> {
    return this.orderLineItemRepository.find();
  }

  async findOne(id): Promise<OrderLineItems> {
    return this.orderLineItemRepository.findOne({where:id});
  }

  async updateOrderTransaction(order_id, updateData: Partial<OrderLineItems>): Promise<void> {
    await this.orderLineItemRepository.update(order_id, updateData);
  }

  async remove(id: number): Promise<void> {
    await this.orderLineItemRepository.delete(id);
  }
}
