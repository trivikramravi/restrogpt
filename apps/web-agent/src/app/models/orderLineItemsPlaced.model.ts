import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class OrderLineItemsPlaced {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  order_id: string;

  @Column({ type: 'varchar' })
  item: string;

  @Column({ type: 'text',nullable:true})
  topping: string;

  @Column({ type: 'varchar' })
  quantity: string;

  @Column({ type: 'varchar' })
  price: string;
}