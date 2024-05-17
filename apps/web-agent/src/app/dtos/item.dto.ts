export class ItemDto {
    name: string = '';
    quantity: number = 1;
    toppings: string[] = [];
    toppings_quantities: { [key: string]: number } = {};
  
    constructor(partial: Partial<ItemDto> = {}) {
      Object.assign(this, partial);
    }
  }