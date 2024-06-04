export class CartOrderItemDto {
    name: string = '';
    price: string = '';
    quantity: string = '';
  
    constructor(partial: Partial<CartOrderItemDto> = {}) {
      Object.assign(this, partial);
    }
  }