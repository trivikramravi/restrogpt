import { AddonDto } from './addon.dto';

export class ItemDetailsDto {
  constructor(
    public name: string = "",
    public qty: number = 0,
    public Addons: AddonDto = new AddonDto,
  ) {}
}