import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class OrderDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  order_id: string;

  @Column({ type: 'text' })
  request: string;

  @Column({ type: 'text' })
  response: string;

  @Column({ type: 'varchar', length: 255 })
  orderplacedby: string;

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @Column({ type: 'text', nullable: true })
  comments_activity_log: string;

  @Column({ type: 'boolean', default: false })
  isorderplaced: boolean;

  @Column({ type: 'varchar', length: 255 })
  orderstatus: string;

  @Column({ type: 'boolean', default: false })
  ispaymentfailed: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionID: string;

  @Column({ type: 'varchar', length: 255 })
  customer_Email: string;

  @Column({ type: 'varchar', length: 15 })
  customer_phone: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  modified_at: Date;

  @Column({ type: 'boolean', default: false })
  iscancelled: boolean;

  @Column({ type: 'boolean', default: false })
  isrefunded: boolean;

  @Column({ type: 'varchar', length: 255 })
  amount_paid: string;

  @Column({ type: 'varchar', length: 255 })
  meal_time: string;
}
