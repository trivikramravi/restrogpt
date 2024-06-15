import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class OrderDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  order_id: string;

  @Column({ type: 'text' })
  request: string;

  @Column({ type: 'text',nullable:true })
  response: string;

  @Column({ type: 'varchar', length: 255,nullable:true })
  orderplacedby: string;

  @Column({ type: 'int', default: 0,nullable:true })
  retry_count: number;

  @Column({ type: 'text', nullable: true })
  comments_activity_log: string;

  @Column({ type: 'boolean', default: false,nullable:true })
  isorderplaced: boolean;

  @Column({ type: 'varchar', length: 255,nullable:true })
  orderstatus: string;

  @Column({ type: 'boolean', default: false,nullable:true })
  ispaymentfailed: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionID: string;

  @Column({ type: 'varchar', length: 255 ,nullable:true})
  customer_Email: string;

  @Column({ type: 'varchar', length: 15,nullable:true })
  customer_phone: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  modified_at: Date;

  @Column({ type: 'boolean', default: false,nullable:true})
  iscancelled: boolean;

  @Column({ type: 'boolean', default: false,nullable:true })
  isrefunded: boolean;

  @Column({ type: 'varchar', length: 255,nullable:true })
  amount_paid: string;

  @Column({ type: 'varchar', length: 255,nullable:true })
  meal_time: string;
}
