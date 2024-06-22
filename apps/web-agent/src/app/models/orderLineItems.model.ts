import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class OrderLineItems {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  order_id: string;

  @Column({ type: 'varchar' })
  item: string;

  @Column({ type: 'text' })
  topping: string;

  @Column({ type: 'varchar' })
  quantity: string;
}