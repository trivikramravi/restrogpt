import { ItemDetailsDto } from './item-details.dto';
import { CustomerDetailsDto } from './customer-details.dto';

export class OrderRequestDto {
  constructor(
    public itemDetails: ItemDetailsDto[] = [],
    public customerDetails: CustomerDetailsDto = new CustomerDetailsDto(),
    public tip: string = "no tip"
  ) {}
}
