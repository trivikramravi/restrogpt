import { ItemDto } from './item.dto';

export class OrderDto {
  resto_id: string = '';
  order_date: string = '';
  order_time: string = '';
  items: ItemDto[] = [];
  order_type: string = '';
  user_pickup_comment: string = '';
  is_vehicle: boolean = false;
  car_number: string = '';
  car_color: string = '';
  promo: boolean = false;
  promo_code: string = '';
  user_phone: string = '';
  user_email: string = '';
  user_first_name: string = '';
  user_last_name: string = '';

  constructor(partial: Partial<OrderDto> = {}) {
    if (partial.items) {
      this.items = partial.items.map(item => new ItemDto(item));
    }
    Object.assign(this, partial);
  }
}