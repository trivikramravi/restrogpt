import { ToppingsAddonDto } from "./toppings-addon"

export class AddonDto {
    constructor(
      public toppings: string[] = [],
      public toppingsAddons: ToppingsAddonDto[] = []
    ) {}
  }
  