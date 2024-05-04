import { AddressDto } from './address.dto';

export class CustomerDetailsDto {
  constructor(
    public firstName: string = "",
    public lastName: string = "",
    public Address: AddressDto = new AddressDto(),
    public phoneNo: string = "",
    public email: string = "",
  ) {}
}
