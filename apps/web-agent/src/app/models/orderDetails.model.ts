import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class OrderDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  order_id: string;

  @Column({ type: 'text' })
  request: string;

  @Column({ type: 'text',nullable:true })
  response: string;

  @Column({ type: 'varchar', length: 255 })
  orderplacedby: string;

  @Column({ type: 'int', default: 0,nullable:true })
  retry_count: number;

  @Column({ type: 'boolean', default: false,nullable:true })
  isorderplaced: boolean;

  @Column({ type: 'varchar', length: 255 })
  orderstatus: string;

  @Column({ type: 'boolean', default: false })
  ispaymentfailed: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transaction_id: string;

  @Column({ type: 'varchar', length: 255 ,nullable:true})
  customer_email: string;

  @Column({ type: 'varchar', length: 255 ,nullable:true})
  customer_first_name: string;

  @Column({ type: 'varchar', length: 255 ,nullable:true})
  customer_Last_name: string;

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

  @Column({ type: 'varchar', length: 255,nullable:true })
  pickup_date: string;

  @Column({ type: 'varchar', length: 255,nullable:true })
  pickup_time: string;

  @Column({ type: 'varchar', length: 255,nullable:true })
  subtotal: string;

  @Column({ type: 'varchar', length: 255,nullable:true })
  discount: string;

  @Column({ type: 'varchar', length: 255,nullable:true })
  order_placed_at: string;

  

}
