import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ErrorLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  order_id: string;

  @Column({ type: 'varchar' })
  reason: string;

  @Column({ type: 'varchar',nullable:true })
  error_log: string;

  @Column({ type: 'varchar' })
  order_by: string;
}
