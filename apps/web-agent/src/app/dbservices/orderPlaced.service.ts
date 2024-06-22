import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderLineItemsPlaced } from '../models/orderLineItemsPlaced.model';

@Injectable()
export class OrderPlacedLineItemsService {
  constructor(
    @InjectRepository(OrderLineItemsPlaced)
    private OrderLineItemsPlacedRepository: Repository<OrderLineItemsPlaced>,
  ) {}

  async createOrderTransaction(orderData){
    const newOrderTransaction = this.OrderLineItemsPlacedRepository.create(orderData);
    return this.OrderLineItemsPlacedRepository.save(newOrderTransaction);
  }

  async findAll(condition): Promise<OrderLineItemsPlaced[]> {
    return this.OrderLineItemsPlacedRepository.find({where:condition});
  }

  async findOne(id): Promise<OrderLineItemsPlaced> {
    return this.OrderLineItemsPlacedRepository.findOne({where:id});
  }

  async updateOrderTransaction(order_id, updateData: Partial<OrderLineItemsPlaced>): Promise<void> {
    await this.OrderLineItemsPlacedRepository.update(order_id, updateData);
  }

  async remove(id: number): Promise<void> {
    await this.OrderLineItemsPlacedRepository.delete(id);
  }
}
