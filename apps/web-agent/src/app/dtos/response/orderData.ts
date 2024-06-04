import { CartOrderItemDto } from "./cartData";

export class OrderDataDto {
    cart_order_items: CartOrderItemDto[] = [];
    discounts: string = '';
    order_id: string = '';
    order_total: string = '';
    receipt_email: string = '';
    roma_order_datetime: string = '';
    subtotal: string = '';
  
    constructor(partial: Partial<OrderDataDto> = {}) {
      Object.assign(this, partial);
    }
  }