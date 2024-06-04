import { OrderDataDto } from "./orderData";

export class OrderResponseDto {
    data: OrderDataDto = new OrderDataDto();
    message: string = '';
    resto_id: string = '';
    status: string = '';
    toast_id: string = '';
  
    constructor(partial: Partial<OrderResponseDto> = {}) {
      Object.assign(this, partial);
    }
  }